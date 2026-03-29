import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@gov-intelligence.system';
const APP_NAME = '.GOV Intelligence System';

function isEmailEnabled(): boolean {
  return !!resend && !!process.env.RESEND_API_KEY;
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!isEmailEnabled()) {
    console.log(`📧 Email disabled (no RESEND_API_KEY). Would have sent to: ${to} | Subject: ${subject}`);
    return false;
  }
  if (!to || !to.includes('@')) {
    return false;
  }
  try {
    const { error } = await resend!.emails.send({ from: FROM_EMAIL, to, subject, html });
    if (error) {
      console.error('❌ Email send error:', error);
      return false;
    }
    console.log(`✅ Email sent to ${to}: ${subject}`);
    return true;
  } catch (err) {
    console.error('❌ Email exception:', err);
    return false;
  }
}

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { margin:0; padding:0; background:#000508; font-family:'Courier New',monospace; color:#00f5ff; }
  .wrapper { max-width:600px; margin:0 auto; padding:40px 20px; }
  .header { text-align:center; border-bottom:1px solid rgba(0,245,255,0.2); padding-bottom:24px; margin-bottom:32px; }
  .logo { font-size:28px; font-weight:900; letter-spacing:0.3em; color:#00f5ff; text-shadow:0 0 20px rgba(0,245,255,0.7); }
  .badge { display:inline-block; font-size:10px; letter-spacing:0.3em; color:rgba(0,255,159,0.7); border:1px solid rgba(0,255,159,0.3); padding:3px 10px; margin-top:8px; }
  .card { background:rgba(0,8,20,0.95); border:1px solid rgba(0,245,255,0.25); padding:32px; margin-bottom:24px; position:relative; }
  .card::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,#00f5ff,transparent); }
  .title { font-size:18px; font-weight:700; letter-spacing:0.15em; color:#00f5ff; margin:0 0 16px 0; text-transform:uppercase; }
  .body { font-size:14px; line-height:1.8; color:rgba(0,245,255,0.8); }
  .key-box { background:rgba(0,245,255,0.06); border:1px solid rgba(0,245,255,0.3); border-left:3px solid #00f5ff; padding:16px 20px; margin:20px 0; font-size:16px; letter-spacing:0.15em; color:#00ff9f; word-break:break-all; }
  .warn-box { background:rgba(255,50,50,0.06); border:1px solid rgba(255,50,50,0.3); border-left:3px solid #ff3232; padding:16px 20px; margin:20px 0; font-size:13px; color:rgba(255,100,100,0.9); }
  .info-row { display:flex; justify-content:space-between; border-bottom:1px solid rgba(0,245,255,0.08); padding:8px 0; font-size:13px; }
  .info-label { color:rgba(0,245,255,0.5); }
  .info-value { color:#00f5ff; }
  .footer { text-align:center; font-size:11px; color:rgba(0,245,255,0.3); margin-top:32px; letter-spacing:0.15em; }
  .divider { border:none; border-top:1px solid rgba(0,245,255,0.1); margin:24px 0; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="logo">.GOV</div>
    <div class="badge">IP INTELLIGENCE SYSTEM // V8 BETA</div>
  </div>
  ${content}
  <div class="footer">
    <p>This is an automated message from ${APP_NAME}.<br>Do not reply to this email.</p>
    <p style="margin-top:12px;color:rgba(0,245,255,0.15);">// ENCRYPTED // CLASSIFIED //</p>
  </div>
</div>
</body>
</html>`;
}

export async function sendWelcomeEmail(to: string, username: string, recoveryKey: string): Promise<boolean> {
  const html = baseTemplate(`
    <div class="card">
      <div class="title">// Account Initialized</div>
      <div class="body">
        <p>Operator <strong style="color:#00ff9f">${username}</strong>, your account has been successfully created in the .GOV Intelligence System.</p>
        <p>Your recovery key is displayed below. <strong style="color:#ff6b6b">Store it securely — it will not be shown again.</strong> This key can be used to recover access to your account if you forget your password.</p>
      </div>
      <div class="key-box">RECOVERY KEY: ${recoveryKey}</div>
      <div class="warn-box">
        ⚠ SECURITY WARNING: Never share your recovery key with anyone. Store it offline in a secure location.
      </div>
      <hr class="divider">
      <div class="info-row"><span class="info-label">USERNAME</span><span class="info-value">${username}</span></div>
      <div class="info-row"><span class="info-label">SYSTEM</span><span class="info-value">.GOV V8 BETA</span></div>
      <div class="info-row"><span class="info-label">ACCESS LEVEL</span><span class="info-value">USER</span></div>
    </div>
  `);
  return sendEmail(to, `[.GOV] Account Created — Save Your Recovery Key`, html);
}

export async function sendLoginAlertEmail(to: string, username: string, ip: string, location: string, userAgent: string, timestamp: string): Promise<boolean> {
  const html = baseTemplate(`
    <div class="card">
      <div class="title">// New Login Detected</div>
      <div class="body">
        <p>A new login was detected on your .GOV account. If this was you, no action is needed.</p>
        <p>If you did not authorize this login, change your password immediately.</p>
      </div>
      <hr class="divider">
      <div class="info-row"><span class="info-label">OPERATOR</span><span class="info-value">${username}</span></div>
      <div class="info-row"><span class="info-label">TIMESTAMP</span><span class="info-value">${timestamp}</span></div>
      <div class="info-row"><span class="info-label">IP ADDRESS</span><span class="info-value">${ip}</span></div>
      <div class="info-row"><span class="info-label">LOCATION</span><span class="info-value">${location || 'Unknown'}</span></div>
      <div class="info-row"><span class="info-label">USER AGENT</span><span class="info-value" style="font-size:11px;word-break:break-all">${(userAgent || '').slice(0, 80)}</span></div>
    </div>
    <div class="warn-box">If this was not you, use your recovery key immediately to regain control of your account.</div>
  `);
  return sendEmail(to, `[.GOV] New Login Alert — ${timestamp}`, html);
}

export async function sendPasswordResetEmail(to: string, username: string, resetToken: string, resetUrl: string): Promise<boolean> {
  const html = baseTemplate(`
    <div class="card">
      <div class="title">// Password Reset Request</div>
      <div class="body">
        <p>Operator <strong style="color:#00ff9f">${username}</strong>, a password reset was requested for your account.</p>
        <p>Click the link below or use your reset token to create a new password. This token expires in <strong style="color:#ff9f00">1 hour</strong>.</p>
      </div>
      <div class="key-box">RESET TOKEN: ${resetToken}</div>
      <div style="text-align:center;margin:24px 0">
        <a href="${resetUrl}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,rgba(0,245,255,0.12),rgba(59,130,246,0.12));border:1px solid rgba(0,245,255,0.5);color:#00f5ff;text-decoration:none;letter-spacing:0.2em;font-size:13px;font-weight:700;text-transform:uppercase">
          [ RESET PASSWORD ]
        </a>
      </div>
      <div class="warn-box">⚠ If you did not request this reset, ignore this email. Your password will not be changed.</div>
    </div>
  `);
  return sendEmail(to, `[.GOV] Password Reset Request`, html);
}

export async function sendPasswordChangedEmail(to: string, username: string, ip: string, timestamp: string): Promise<boolean> {
  const html = baseTemplate(`
    <div class="card">
      <div class="title">// Password Changed</div>
      <div class="body">
        <p>The password for operator <strong style="color:#00ff9f">${username}</strong> was successfully changed.</p>
        <p>If you did not make this change, use your recovery key immediately to regain control of your account.</p>
      </div>
      <hr class="divider">
      <div class="info-row"><span class="info-label">TIMESTAMP</span><span class="info-value">${timestamp}</span></div>
      <div class="info-row"><span class="info-label">IP ADDRESS</span><span class="info-value">${ip}</span></div>
    </div>
    <div class="warn-box">⚠ If this change was not authorized, your account may be compromised. Use your recovery key immediately.</div>
  `);
  return sendEmail(to, `[.GOV] Password Changed Alert`, html);
}

export async function sendAccountBannedEmail(to: string, username: string, reason: string, timestamp: string): Promise<boolean> {
  const html = baseTemplate(`
    <div class="card">
      <div class="title" style="color:#ff3232">// Account Suspended</div>
      <div class="body">
        <p>Operator <strong style="color:#ff6b6b">${username}</strong>, your .GOV account has been suspended by an administrator.</p>
      </div>
      <hr class="divider">
      <div class="info-row"><span class="info-label">REASON</span><span class="info-value" style="color:#ff6b6b">${reason || 'Policy violation'}</span></div>
      <div class="info-row"><span class="info-label">TIMESTAMP</span><span class="info-value">${timestamp}</span></div>
      <div class="info-row"><span class="info-label">STATUS</span><span class="info-value" style="color:#ff3232">SUSPENDED</span></div>
    </div>
  `);
  return sendEmail(to, `[.GOV] Account Suspended`, html);
}

export async function sendRoleChangedEmail(to: string, username: string, newRole: string, changedBy: string, timestamp: string): Promise<boolean> {
  const html = baseTemplate(`
    <div class="card">
      <div class="title">// Account Role Updated</div>
      <div class="body">
        <p>The account role for operator <strong style="color:#00ff9f">${username}</strong> has been updated.</p>
      </div>
      <hr class="divider">
      <div class="info-row"><span class="info-label">NEW ROLE</span><span class="info-value" style="color:#00ff9f">${newRole.toUpperCase()}</span></div>
      <div class="info-row"><span class="info-label">CHANGED BY</span><span class="info-value">${changedBy}</span></div>
      <div class="info-row"><span class="info-label">TIMESTAMP</span><span class="info-value">${timestamp}</span></div>
    </div>
  `);
  return sendEmail(to, `[.GOV] Account Role Updated — ${newRole}`, html);
}

export { isEmailEnabled };
