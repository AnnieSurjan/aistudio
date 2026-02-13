const { Resend } = require('resend');

let resendClient = null;

function getResendClient() {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('[Resend] RESEND_API_KEY not set - emails will be logged to console only');
      return null;
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

/**
 * Send a 6-digit verification code email
 */
async function sendVerificationEmail(toEmail, code) {
  const resend = getResendClient();

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const fromAddress = `Dup-Detect <${fromEmail}>`;

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #1e293b; font-size: 24px; margin: 0;">Dup-Detect</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Duplicate Transaction Detection</p>
      </div>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; text-align: center;">
        <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 8px 0;">Verify your email address</h2>
        <p style="color: #64748b; font-size: 14px; margin: 0 0 24px 0;">
          Enter this code to complete your registration:
        </p>
        <div style="background: #1e293b; color: #ffffff; font-size: 32px; font-family: monospace; letter-spacing: 8px; padding: 16px 24px; border-radius: 8px; display: inline-block;">
          ${code}
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
          This code expires in 10 minutes.<br/>
          If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    </div>
  `;

  if (!resend) {
    // Fallback: log to console for development
    console.log(`[Resend-Mock] Verification email to ${toEmail}: code = ${code}`);
    return { success: true, mock: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [toEmail],
      subject: 'Your Dup-Detect Verification Code',
      html: htmlContent,
    });

    if (error) {
      console.error('[Resend] Failed to send email:', JSON.stringify(error));
      console.error('[Resend] From:', fromAddress, '| To:', toEmail);
      return { success: false, error: error.message };
    }

    console.log('[Resend] Verification email sent to', toEmail, '- ID:', data?.id);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error('[Resend] Exception sending email:', err.message);
    console.error('[Resend] API Key set:', !!process.env.RESEND_API_KEY);
    console.error('[Resend] From:', fromAddress, '| To:', toEmail);
    return { success: false, error: err.message };
  }
}

module.exports = { sendVerificationEmail, getResendClient };
