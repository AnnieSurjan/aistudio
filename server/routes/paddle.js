const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { getAdminClient } = require('../lib/supabase');
const { requireAuth } = require('../middleware/auth');

// Plan mapping: Paddle price ID -> plan name
const PRICE_TO_PLAN = {
  [process.env.PADDLE_STARTER_PRICE_ID]: 'Starter',
  [process.env.PADDLE_PROFESSIONAL_PRICE_ID]: 'Professional',
  [process.env.PADDLE_ENTERPRISE_PRICE_ID]: 'Enterprise',
};

// Reverse mapping: plan name -> price ID
const PLAN_TO_PRICE = {
  'Starter': process.env.PADDLE_STARTER_PRICE_ID,
  'Professional': process.env.PADDLE_PROFESSIONAL_PRICE_ID,
  'Enterprise': process.env.PADDLE_ENTERPRISE_PRICE_ID,
};

// ============================================================
// GET /api/paddle/config - Return client-side Paddle config
// (public, no auth needed - but only returns non-sensitive data)
// ============================================================
router.get('/config', (req, res) => {
  res.json({
    clientToken: process.env.PADDLE_CLIENT_TOKEN,
    environment: process.env.PADDLE_ENVIRONMENT || 'sandbox',
    prices: {
      Starter: process.env.PADDLE_STARTER_PRICE_ID,
      Professional: process.env.PADDLE_PROFESSIONAL_PRICE_ID,
      Enterprise: process.env.PADDLE_ENTERPRISE_PRICE_ID,
    },
  });
});

// ============================================================
// GET /api/paddle/subscription - Get current user's subscription
// ============================================================
router.get('/subscription', requireAuth, async (req, res) => {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', req.user.id)
      .in('status', ['active', 'trialing', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found, that's ok
      throw error;
    }

    res.json({
      subscription: data || null,
      plan: data?.plan || 'Starter',
    });
  } catch (error) {
    console.error('[Paddle] Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// ============================================================
// POST /api/paddle/webhook - Paddle webhook handler
// This endpoint must NOT use requireAuth (Paddle calls it directly)
// ============================================================
router.post('/webhook', async (req, res) => {
  const signature = req.headers['paddle-signature'];
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;

  // Verify webhook signature
  if (webhookSecret && signature) {
    const isValid = verifyPaddleWebhook(req.body, signature, webhookSecret);
    if (!isValid) {
      console.error('[Paddle Webhook] Invalid signature');
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }
  }

  let event;
  try {
    event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (err) {
    console.error('[Paddle Webhook] Invalid JSON:', err);
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const eventId = event.event_id;
  const eventType = event.event_type;

  console.log(`[Paddle Webhook] Received: ${eventType} (${eventId})`);

  const supabase = getAdminClient();

  try {
    // Idempotency check - skip if already processed
    const { data: existing } = await supabase
      .from('paddle_events')
      .select('id')
      .eq('event_id', eventId)
      .single();

    if (existing) {
      console.log(`[Paddle Webhook] Event ${eventId} already processed, skipping`);
      return res.json({ received: true });
    }

    // Store event for audit trail
    await supabase.from('paddle_events').insert({
      event_id: eventId,
      event_type: eventType,
      payload: event,
      processed: false,
    });

    // Process event
    switch (eventType) {
      case 'subscription.created':
      case 'subscription.activated':
        await handleSubscriptionCreated(supabase, event.data);
        break;

      case 'subscription.updated':
        await handleSubscriptionUpdated(supabase, event.data);
        break;

      case 'subscription.canceled':
        await handleSubscriptionCanceled(supabase, event.data);
        break;

      case 'subscription.paused':
        await handleSubscriptionPaused(supabase, event.data);
        break;

      case 'subscription.resumed':
        await handleSubscriptionResumed(supabase, event.data);
        break;

      case 'transaction.completed':
        await handleTransactionCompleted(supabase, event.data);
        break;

      default:
        console.log(`[Paddle Webhook] Unhandled event type: ${eventType}`);
    }

    // Mark as processed
    await supabase
      .from('paddle_events')
      .update({ processed: true })
      .eq('event_id', eventId);

    res.json({ received: true });
  } catch (error) {
    console.error(`[Paddle Webhook] Error processing ${eventType}:`, error);

    // Store error but still return 200 to prevent Paddle retries for app-level errors
    await supabase
      .from('paddle_events')
      .update({ error_message: error.message })
      .eq('event_id', eventId);

    res.json({ received: true, error: error.message });
  }
});

// ============================================================
// Webhook event handlers
// ============================================================

async function handleSubscriptionCreated(supabase, data) {
  const subscriptionId = data.id;
  const customerId = data.customer_id;
  const status = data.status;
  const priceId = data.items?.[0]?.price?.id;
  const plan = PRICE_TO_PLAN[priceId] || 'Starter';
  const customData = data.custom_data || {};
  const userId = customData.user_id;

  if (!userId) {
    // Try to find user by customer email
    const customerEmail = data.customer?.email;
    if (customerEmail) {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('email', customerEmail)
        .single();

      if (user) {
        await createOrUpdateSubscription(supabase, user.id, {
          subscriptionId, customerId, status, priceId, plan, data,
        });
        return;
      }
    }
    console.error('[Paddle] subscription.created: No user_id in custom_data and no matching email');
    return;
  }

  await createOrUpdateSubscription(supabase, userId, {
    subscriptionId, customerId, status, priceId, plan, data,
  });
}

async function handleSubscriptionUpdated(supabase, data) {
  const subscriptionId = data.id;
  const priceId = data.items?.[0]?.price?.id;
  const plan = PRICE_TO_PLAN[priceId] || 'Starter';

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: data.status,
      paddle_price_id: priceId,
      plan,
      current_period_start: data.current_billing_period?.starts_at,
      current_period_end: data.current_billing_period?.ends_at,
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', subscriptionId);

  if (error) throw error;

  // Also update user plan
  await updateUserPlan(supabase, subscriptionId, plan);
}

async function handleSubscriptionCanceled(supabase, data) {
  const subscriptionId = data.id;

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: data.canceled_at || new Date().toISOString(),
      cancel_effective_date: data.scheduled_change?.effective_at,
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', subscriptionId);

  if (error) throw error;

  // Downgrade user to Starter when cancellation takes effect
  if (!data.scheduled_change) {
    await updateUserPlan(supabase, subscriptionId, 'Starter');
  }
}

async function handleSubscriptionPaused(supabase, data) {
  const subscriptionId = data.id;

  await supabase
    .from('subscriptions')
    .update({
      status: 'paused',
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', subscriptionId);
}

async function handleSubscriptionResumed(supabase, data) {
  const subscriptionId = data.id;
  const priceId = data.items?.[0]?.price?.id;
  const plan = PRICE_TO_PLAN[priceId] || 'Starter';

  await supabase
    .from('subscriptions')
    .update({
      status: data.status || 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', subscriptionId);

  await updateUserPlan(supabase, subscriptionId, plan);
}

async function handleTransactionCompleted(supabase, data) {
  // Transaction completed - payment was successful
  // This can be used to send receipts or update payment status
  console.log(`[Paddle] Transaction completed: ${data.id}`);
}

// ============================================================
// Helper functions
// ============================================================

async function createOrUpdateSubscription(supabase, userId, params) {
  const { subscriptionId, customerId, status, priceId, plan, data } = params;

  const subscriptionData = {
    user_id: userId,
    paddle_subscription_id: subscriptionId,
    paddle_customer_id: customerId,
    plan,
    status: status || 'active',
    paddle_price_id: priceId,
    current_period_start: data.current_billing_period?.starts_at,
    current_period_end: data.current_billing_period?.ends_at,
    update_url: data.management_urls?.update_payment_method,
    cancel_url: data.management_urls?.cancel,
    updated_at: new Date().toISOString(),
  };

  // Upsert: create or update
  const { error } = await supabase
    .from('subscriptions')
    .upsert(subscriptionData, {
      onConflict: 'paddle_subscription_id',
    });

  if (error) throw error;

  // Update user record
  await supabase
    .from('users')
    .update({
      plan,
      paddle_customer_id: customerId,
    })
    .eq('id', userId);
}

async function updateUserPlan(supabase, subscriptionId, plan) {
  // Find user by subscription
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('paddle_subscription_id', subscriptionId)
    .single();

  if (sub) {
    await supabase
      .from('users')
      .update({ plan })
      .eq('id', sub.user_id);
  }
}

// Paddle webhook signature verification (Paddle Billing v2)
function verifyPaddleWebhook(payload, signature, secret) {
  try {
    // Paddle signature format: ts=timestamp;h1=hash
    const parts = {};
    signature.split(';').forEach(part => {
      const [key, value] = part.split('=');
      parts[key] = value;
    });

    const ts = parts['ts'];
    const h1 = parts['h1'];

    if (!ts || !h1) return false;

    const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const signedPayload = `${ts}:${payloadStr}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(h1),
      Buffer.from(expectedSignature)
    );
  } catch (err) {
    console.error('[Paddle] Signature verification error:', err);
    return false;
  }
}

module.exports = router;
