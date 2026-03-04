const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { getAdminClient } = require('../lib/supabase');

// Use built-in crypto for TOTP instead of heavy dependency
// TOTP implementation based on RFC 6238

function generateBase32Secret() {
  const bytes = crypto.randomBytes(20);
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < bytes.length; i++) {
    secret += base32Chars[bytes[i] % 32];
  }
  return secret;
}

function base32Decode(encoded) {
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const char of encoded.toUpperCase()) {
    const val = base32Chars.indexOf(char);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function generateTOTP(secret, timeStep = 30, digits = 6) {
  const time = Math.floor(Date.now() / 1000 / timeStep);
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeUInt32BE(0, 0);
  timeBuffer.writeUInt32BE(time, 4);

  const key = base32Decode(secret);
  const hmac = crypto.createHmac('sha1', key).update(timeBuffer).digest();

  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  ) % Math.pow(10, digits);

  return code.toString().padStart(digits, '0');
}

function verifyTOTP(secret, token, window = 1) {
  for (let i = -window; i <= window; i++) {
    const time = Math.floor(Date.now() / 1000 / 30) + i;
    const timeBuffer = Buffer.alloc(8);
    timeBuffer.writeUInt32BE(0, 0);
    timeBuffer.writeUInt32BE(time, 4);

    const key = base32Decode(secret);
    const hmac = crypto.createHmac('sha1', key).update(timeBuffer).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code = (
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)
    ) % 1000000;

    if (code.toString().padStart(6, '0') === token) {
      return true;
    }
  }
  return false;
}

function generateRecoveryCodes(count = 8) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

// POST /api/2fa/setup - Generate TOTP secret and QR code URI
router.post('/setup', async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Check if already enabled
    const supabase = getAdminClient();
    const { data: existing } = await supabase
      .from('user_2fa')
      .select('id, is_enabled')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing?.is_enabled) {
      return res.status(400).json({ error: '2FA is already enabled. Disable it first to reconfigure.' });
    }

    const secret = generateBase32Secret();

    // Generate otpauth URI for QR code scanning
    const issuer = 'Dup-Detect';
    const otpauthUri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(userEmail)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

    // Store the secret (not yet enabled)
    if (existing) {
      await supabase
        .from('user_2fa')
        .update({ totp_secret: secret, is_enabled: false, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase.from('user_2fa').insert({
        user_id: userId,
        totp_secret: secret,
        is_enabled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    res.json({
      secret,
      otpauthUri,
      message: 'Scan this QR code with your authenticator app, then verify with a code.',
    });
  } catch (error) {
    console.error('[2FA] Setup error:', error);
    res.status(500).json({ error: 'Failed to setup 2FA' });
  }
});

// POST /api/2fa/verify-setup - Verify TOTP code and enable 2FA
router.post('/verify-setup', async (req, res) => {
  try {
    const userId = req.user.id;
    const { code } = req.body;

    if (!code || code.length !== 6) {
      return res.status(400).json({ error: 'A 6-digit verification code is required' });
    }

    const supabase = getAdminClient();
    const { data: twoFa } = await supabase
      .from('user_2fa')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!twoFa || !twoFa.totp_secret) {
      return res.status(400).json({ error: 'No 2FA setup found. Please start setup first.' });
    }

    if (twoFa.is_enabled) {
      return res.status(400).json({ error: '2FA is already enabled.' });
    }

    const isValid = verifyTOTP(twoFa.totp_secret, code);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid verification code. Please try again.' });
    }

    // Generate recovery codes
    const recoveryCodes = generateRecoveryCodes();
    const hashedCodes = recoveryCodes.map(c => crypto.createHash('sha256').update(c).digest('hex'));

    // Enable 2FA
    await supabase
      .from('user_2fa')
      .update({
        is_enabled: true,
        recovery_codes: hashedCodes,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    // Mark user as 2FA enabled
    await supabase
      .from('users')
      .update({ two_factor_enabled: true })
      .eq('id', userId);

    res.json({
      message: '2FA enabled successfully',
      recoveryCodes,
      warning: 'Save these recovery codes in a safe place. They cannot be shown again.',
    });
  } catch (error) {
    console.error('[2FA] Verify setup error:', error);
    res.status(500).json({ error: 'Failed to verify 2FA setup' });
  }
});

// POST /api/2fa/disable - Disable 2FA
router.post('/disable', async (req, res) => {
  try {
    const userId = req.user.id;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Verification code is required to disable 2FA' });
    }

    const supabase = getAdminClient();
    const { data: twoFa } = await supabase
      .from('user_2fa')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!twoFa || !twoFa.is_enabled) {
      return res.status(400).json({ error: '2FA is not enabled.' });
    }

    const isValid = verifyTOTP(twoFa.totp_secret, code);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid code. Cannot disable 2FA.' });
    }

    await supabase
      .from('user_2fa')
      .update({ is_enabled: false, totp_secret: null, recovery_codes: null, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    await supabase
      .from('users')
      .update({ two_factor_enabled: false })
      .eq('id', userId);

    res.json({ message: '2FA disabled successfully.' });
  } catch (error) {
    console.error('[2FA] Disable error:', error);
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
});

// POST /api/2fa/status - Check 2FA status
router.get('/status', async (req, res) => {
  try {
    const userId = req.user.id;
    const supabase = getAdminClient();

    const { data: twoFa } = await supabase
      .from('user_2fa')
      .select('is_enabled, created_at')
      .eq('user_id', userId)
      .maybeSingle();

    res.json({
      isEnabled: twoFa?.is_enabled || false,
      enabledSince: twoFa?.is_enabled ? twoFa.created_at : null,
    });
  } catch (error) {
    console.error('[2FA] Status error:', error);
    res.status(500).json({ error: 'Failed to check 2FA status' });
  }
});

// Export TOTP verification for use in login flow
module.exports = router;
module.exports.verifyTOTP = verifyTOTP;
