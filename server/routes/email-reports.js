const express = require('express');
const router = express.Router();
const { getAdminClient } = require('../lib/supabase');
const { getResendClient } = require('../lib/resend');

// POST /api/reports/settings - Save email report settings
router.post('/settings', async (req, res) => {
  try {
    const userId = req.user.id;
    const { recipients, frequency } = req.body;

    if (!recipients || !frequency) {
      return res.status(400).json({ error: 'Recipients and frequency are required' });
    }

    // Validate emails
    const emailList = recipients.split(',').map(e => e.trim()).filter(Boolean);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of emailList) {
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: `Invalid email address: ${email}` });
      }
    }

    if (!['daily', 'weekly', 'monthly'].includes(frequency)) {
      return res.status(400).json({ error: 'Frequency must be daily, weekly, or monthly' });
    }

    const supabase = getAdminClient();

    // Upsert report settings
    const { data: existing } = await supabase
      .from('email_report_settings')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    const settings = {
      user_id: userId,
      recipients: emailList,
      frequency,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      await supabase.from('email_report_settings').update(settings).eq('id', existing.id);
    } else {
      settings.created_at = new Date().toISOString();
      await supabase.from('email_report_settings').insert(settings);
    }

    res.json({ message: 'Report settings saved', recipients: emailList, frequency });
  } catch (error) {
    console.error('[Reports] Settings error:', error);
    res.status(500).json({ error: 'Failed to save report settings' });
  }
});

// GET /api/reports/settings - Get current report settings
router.get('/settings', async (req, res) => {
  try {
    const userId = req.user.id;
    const supabase = getAdminClient();

    const { data } = await supabase
      .from('email_report_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    res.json({
      settings: data ? {
        recipients: (data.recipients || []).join(', '),
        frequency: data.frequency,
        isActive: data.is_active,
        lastSentAt: data.last_sent_at,
      } : null,
    });
  } catch (error) {
    console.error('[Reports] Get settings error:', error);
    res.status(500).json({ error: 'Failed to get report settings' });
  }
});

// POST /api/reports/send-now - Send a report immediately (manual trigger)
router.post('/send-now', async (req, res) => {
  try {
    const userId = req.user.id;
    const userName = req.user.name;

    const supabase = getAdminClient();
    const { data: settings } = await supabase
      .from('email_report_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!settings || !settings.recipients?.length) {
      return res.status(400).json({ error: 'No report settings configured. Set up recipients first.' });
    }

    // Gather scan data for report
    const reportData = await gatherReportData(supabase, userId);

    // Send email
    const result = await sendReportEmail(settings.recipients, userName, reportData);

    // Update last sent
    await supabase
      .from('email_report_settings')
      .update({ last_sent_at: new Date().toISOString() })
      .eq('id', settings.id);

    res.json({ message: 'Report sent successfully', sentTo: settings.recipients, ...result });
  } catch (error) {
    console.error('[Reports] Send error:', error);
    res.status(500).json({ error: 'Failed to send report' });
  }
});

// POST /api/reports/disable - Disable email reports
router.post('/disable', async (req, res) => {
  try {
    const userId = req.user.id;
    const supabase = getAdminClient();

    await supabase
      .from('email_report_settings')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    res.json({ message: 'Email reports disabled' });
  } catch (error) {
    console.error('[Reports] Disable error:', error);
    res.status(500).json({ error: 'Failed to disable reports' });
  }
});

// --- Helper: Gather report data ---
async function gatherReportData(supabase, userId) {
  // Get recent scan activity
  const { data: recentScans } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('user_id', userId)
    .in('action', ['scan_completed', 'Scan Completed'])
    .order('created_at', { ascending: false })
    .limit(10);

  // Get notification summary
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });

  const totalDuplicates = (recentScans || []).reduce((sum, scan) => {
    const match = (scan.details || '').match(/Found (\d+)/);
    return sum + (match ? parseInt(match[1]) : 0);
  }, 0);

  return {
    totalScans: (recentScans || []).length,
    totalDuplicates,
    estimatedSavings: totalDuplicates * 150,
    recentActivity: (notifications || []).slice(0, 5),
    generatedAt: new Date().toISOString(),
  };
}

// --- Helper: Send report email ---
async function sendReportEmail(recipients, userName, data) {
  const resend = getResendClient();
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f8fafc;">
      <div style="background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Dup-Detect Report</h1>
          <p style="color: #bfdbfe; margin: 4px 0 0; font-size: 14px;">Duplicate Transaction Summary</p>
        </div>
        <div style="padding: 24px;">
          <p style="color: #64748b; font-size: 14px;">Hello,</p>
          <p style="color: #334155; font-size: 14px;">Here is the latest duplicate detection summary from <strong>${userName || 'your team'}</strong>:</p>

          <div style="display: flex; gap: 12px; margin: 20px 0;">
            <div style="flex: 1; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px; text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #0369a1;">${data.totalScans}</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Scans Run</div>
            </div>
            <div style="flex: 1; background: #fefce8; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #a16207;">${data.totalDuplicates}</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Duplicates Found</div>
            </div>
            <div style="flex: 1; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #15803d;">$${data.estimatedSavings.toLocaleString()}</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Est. Savings</div>
            </div>
          </div>

          ${data.recentActivity?.length > 0 ? `
          <h3 style="color: #1e293b; font-size: 14px; margin: 24px 0 12px;">Recent Activity</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            ${data.recentActivity.map(n => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; color: #64748b;">${new Date(n.created_at).toLocaleDateString()}</td>
                <td style="padding: 8px 0; color: #334155;">${n.title || n.message || ''}</td>
              </tr>
            `).join('')}
          </table>` : ''}

          <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; text-align: center;">
            Generated on ${new Date(data.generatedAt).toLocaleString()} | <a href="https://dup-detect.com" style="color: #3b82f6;">Open Dup-Detect</a>
          </p>
        </div>
      </div>
    </div>
  `;

  if (!resend) {
    console.log(`[Reports] Mock email sent to ${recipients.join(', ')}`);
    return { mock: true };
  }

  try {
    const { data: emailData, error } = await resend.emails.send({
      from: `Dup-Detect Reports <${fromEmail}>`,
      to: recipients,
      subject: `Dup-Detect Report: ${data.totalDuplicates} duplicates found`,
      html,
    });

    if (error) {
      console.error('[Reports] Resend error:', error);
      return { error: error.message };
    }

    return { emailId: emailData?.id };
  } catch (err) {
    console.error('[Reports] Send exception:', err.message);
    return { error: err.message };
  }
}

// Export for cron usage
module.exports = router;
module.exports.gatherReportData = gatherReportData;
module.exports.sendReportEmail = sendReportEmail;
