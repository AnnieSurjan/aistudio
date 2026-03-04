const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { getAdminClient } = require('../lib/supabase');
const { sendVerificationEmail } = require('../lib/resend');
const { generateToken, verifyToken, setAuthCookie, clearAuthCookie } = require('../middleware/auth');

// In-memory verification code store
// Key: email, Value: { code, hashedPassword, name, companyName, createdAt }
const pendingVerifications = new Map();

// Clean up expired codes every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of pendingVerifications) {
    if (now - data.createdAt > 10 * 60 * 1000) {
      pendingVerifications.delete(email);
    }
  }
}, 5 * 60 * 1000);

// POST /auth/register - Start registration, send verification email
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, companyName } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists in Supabase
    try {
      const supabase = getAdminClient();
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (existingUser) {
        return res.status(409).json({ error: 'An account with this email already exists' });
      }
    } catch (dbErr) {
      // If users table doesn't exist yet, continue anyway
      console.warn('[Registration] DB check skipped:', dbErr.message);
    }

    // Generate 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Store pending verification
    pendingVerifications.set(email.toLowerCase(), {
      code,
      hashedPassword,
      name,
      companyName: companyName || '',
      createdAt: Date.now(),
    });

    // Send verification email via Resend
    const emailResult = await sendVerificationEmail(email, code);

    if (!emailResult.success && !emailResult.mock) {
      return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
    }

    console.log(`[Registration] Verification code sent to ${email}`);
    res.json({ message: 'Verification code sent', email });
  } catch (error) {
    console.error('[Registration] Error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /auth/verify-email - Verify code and create user
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    const pending = pendingVerifications.get(email.toLowerCase());

    if (!pending) {
      return res.status(400).json({ error: 'No pending verification found. Please register again.' });
    }

    // Check expiry (10 minutes)
    if (Date.now() - pending.createdAt > 10 * 60 * 1000) {
      pendingVerifications.delete(email.toLowerCase());
      return res.status(400).json({ error: 'Verification code expired. Please register again.' });
    }

    // Check code
    if (pending.code !== code.trim()) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Code is valid - create user in Supabase
    let userId = crypto.randomUUID();

    try {
      const supabase = getAdminClient();
      const { data, error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email.toLowerCase(),
          password_hash: pending.hashedPassword,
          name: pending.name,
          company_name: pending.companyName,
          email_verified: true,
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('[Registration] User insert failed:', insertError);
        // If table doesn't exist, we still confirm - user can use the app in demo mode
      } else if (data) {
        userId = data.id;
      }
    } catch (dbErr) {
      console.warn('[Registration] DB insert skipped:', dbErr.message);
    }

    // Clean up pending verification
    pendingVerifications.delete(email.toLowerCase());

    const verifiedUser = {
      id: userId,
      email: email.toLowerCase(),
      name: pending.name,
      companyName: pending.companyName,
    };
    const token = generateToken(verifiedUser);
    setAuthCookie(res, token);

    console.log(`[Registration] User verified: ${email}, ID: ${userId}`);

    res.json({
      message: 'Email verified successfully',
      user: verifiedUser,
    });
  } catch (error) {
    console.error('[Registration] Verify error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// POST /auth/resend-code - Resend verification code
router.post('/resend-code', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const pending = pendingVerifications.get(email.toLowerCase());

    if (!pending) {
      return res.status(400).json({ error: 'No pending verification found. Please register again.' });
    }

    // Generate new code
    const newCode = crypto.randomInt(100000, 999999).toString();
    pending.code = newCode;
    pending.createdAt = Date.now();

    // Send new code
    const emailResult = await sendVerificationEmail(email, newCode);

    if (!emailResult.success && !emailResult.mock) {
      return res.status(500).json({ error: 'Failed to resend verification email' });
    }

    console.log(`[Registration] New code sent to ${email}`);
    res.json({ message: 'New verification code sent' });
  } catch (error) {
    console.error('[Registration] Resend error:', error);
    res.status(500).json({ error: 'Failed to resend code' });
  }
});

// POST /auth/login - Login with email/password
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    let user = null;

    try {
      const supabase = getAdminClient();
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (error) {
        console.error('[Login] Supabase query error:', error.message, error.code);
        return res.status(500).json({ error: 'Login service temporarily unavailable. Please try again later.' });
      }

      if (!data) {
        console.warn(`[Login] No user found for email: ${email.toLowerCase()}`);
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      if (!data.email_verified) {
        return res.status(403).json({ error: 'Email not verified. Please check your inbox.' });
      }

      if (!data.password_hash) {
        console.error(`[Login] User ${email} has no password_hash stored`);
        return res.status(500).json({ error: 'Account error. Please contact support.' });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, data.password_hash);
      if (!isValid) {
        console.warn(`[Login] Invalid password attempt for: ${email.toLowerCase()}`);
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      user = {
        id: data.id,
        email: data.email,
        name: data.name,
        companyName: data.company_name,
      };
    } catch (dbErr) {
      console.error('[Login] DB connection failed:', dbErr.message);
      return res.status(500).json({ error: 'Login service unavailable. Please try again later.' });
    }

    const token = generateToken(user);
    setAuthCookie(res, token);

    console.log(`[Login] Successful login: ${email}`);
    res.json({ message: 'Login successful', user });
  } catch (error) {
    console.error('[Login] Error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /auth/me - Restore session from JWT token
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies?.auth_token
      || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const userId = decoded.userId;
    let user = { id: userId, email: decoded.email, name: decoded.name, companyName: '' };

    // Try to get full user data from DB
    try {
      const supabase = getAdminClient();
      const { data: dbUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (dbUser) {
        user.name = dbUser.name || user.name;
        user.companyName = dbUser.company_name || '';
        user.email = dbUser.email || user.email;
      }

      // Check QuickBooks connection (only check existence, don't return internal IDs)
      const { data: qbToken } = await supabase
        .from('qb_tokens')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      // Check Xero connection (only check existence, don't return internal IDs)
      const { data: xeroToken } = await supabase
        .from('xero_tokens')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      user.isQuickBooksConnected = !!qbToken;
      user.isXeroConnected = !!xeroToken;
    } catch (dbErr) {
      console.warn('[Auth/me] DB query failed, returning JWT data only:', dbErr.message);
    }

    res.json({ user });
  } catch (error) {
    console.error('[Auth/me] Error:', error);
    res.status(500).json({ error: 'Failed to restore session' });
  }
});

// POST /auth/logout - Clear auth cookie
router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
