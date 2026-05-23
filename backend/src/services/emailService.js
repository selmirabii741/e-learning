import nodemailer from 'nodemailer';

const FRONTEND_URL = () => process.env.FRONTEND_URL || 'http://localhost:3000';

// Build transporter — reads env vars lazily at call-time (after dotenv has run)
const createTransporter = () => {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (user && pass) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: parseInt(process.env.SMTP_PORT || '587') === 465,
      auth: { user, pass },
    });
  }
  return null;
};

const getSmtpFrom = () => {
  const user = process.env.SMTP_USER;
  return process.env.SMTP_FROM || `"EduAI Platform" <${user}>`;
};

/**
 * Send email verification to a newly created professor.
 * No password is included — the professor sets their own after clicking the link.
 *
 * @param {{ name: string, email: string, token: string }} params
 */
export async function sendProfessorVerificationEmail({ name, email, token }) {
  const verifyUrl = `${FRONTEND_URL()}/verify-email?token=${token}`;

  // Extract first name for the greeting
  const firstName = name.split(' ')[0];

  /* ------------------------------------------------------------------ */
  /*  HTML TEMPLATE                                                       */
  /* ------------------------------------------------------------------ */
  const htmlBody = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Confirm your EduAI account</title>
  <!--[if mso]>
  <noscript>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset */
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; outline: none; text-decoration: none; display: block; }
    a { color: #4f46e5; }

    /* Base */
    body {
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
    }

    /* Layout */
    .email-outer {
      width: 100%;
      padding: 32px 16px;
      background-color: #f1f5f9;
    }
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 32px rgba(0,0,0,0.10);
    }

    /* Header */
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      padding: 44px 40px 36px;
      text-align: center;
    }
    .header-logo {
      font-size: 32px;
      margin-bottom: 10px;
    }
    .header h1 {
      font-size: 26px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.5px;
      margin: 0 0 6px;
    }
    .header-sub {
      font-size: 14px;
      color: rgba(255,255,255,0.78);
      font-weight: 400;
    }

    /* Body */
    .body {
      padding: 44px 40px 32px;
    }
    .greeting {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 16px;
    }
    .text {
      font-size: 15px;
      line-height: 1.75;
      color: #475569;
      margin-bottom: 28px;
    }
    .text strong {
      color: #1e293b;
    }

    /* Highlight box */
    .info-box {
      background: #f8f7ff;
      border: 1.5px solid #c7d2fe;
      border-left: 4px solid #4f46e5;
      border-radius: 12px;
      padding: 16px 22px;
      margin-bottom: 32px;
      font-size: 14px;
      color: #4338ca;
      font-weight: 500;
    }
    .info-box span {
      display: block;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: #94a3b8;
      margin-bottom: 4px;
      font-weight: 600;
    }

    /* CTA Button */
    .btn-wrapper {
      text-align: center;
      margin: 36px 0;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 18px 48px;
      border-radius: 50px;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.02em;
      box-shadow: 0 8px 24px rgba(79, 70, 229, 0.4);
      transition: opacity 0.2s;
    }

    /* Steps */
    .steps {
      background: #f8fafc;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 28px;
    }
    .steps-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #94a3b8;
      margin-bottom: 16px;
    }
    .step {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      margin-bottom: 14px;
    }
    .step:last-child { margin-bottom: 0; }
    .step-num {
      flex-shrink: 0;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: #fff;
      font-size: 13px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-top: 1px;
    }
    .step-text {
      font-size: 14px;
      color: #475569;
      line-height: 1.65;
    }

    /* Expiry notice */
    .expiry-notice {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 10px;
      padding: 14px 18px;
      font-size: 13px;
      color: #92400e;
      margin-bottom: 28px;
      text-align: center;
    }
    .expiry-notice strong { color: #78350f; }

    /* Fallback link */
    .fallback {
      background: #f8fafc;
      border-radius: 10px;
      padding: 16px 20px;
      margin-bottom: 28px;
      text-align: center;
    }
    .fallback p {
      font-size: 12px;
      color: #94a3b8;
      margin-bottom: 8px;
    }
    .fallback a {
      font-size: 12px;
      color: #4f46e5;
      word-break: break-all;
      text-decoration: underline;
    }

    /* Divider */
    .divider {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 0;
    }

    /* Footer */
    .footer {
      background: #f8fafc;
      padding: 28px 40px;
      text-align: center;
    }
    .footer-brand {
      font-size: 15px;
      font-weight: 700;
      color: #4f46e5;
      margin-bottom: 8px;
    }
    .footer-text {
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.7;
    }
    .footer-text a {
      color: #64748b;
      text-decoration: none;
    }
    .footer-links {
      margin-top: 12px;
      font-size: 12px;
      color: #cbd5e1;
    }
    .footer-links a {
      color: #94a3b8;
      text-decoration: none;
      margin: 0 8px;
    }

    /* Mobile */
    @media only screen and (max-width: 600px) {
      .body { padding: 32px 24px 24px; }
      .header { padding: 32px 24px 28px; }
      .header h1 { font-size: 22px; }
      .btn { padding: 16px 32px; font-size: 15px; }
      .footer { padding: 24px; }
    }
  </style>
</head>
<body>
  <div class="email-outer">
    <div class="email-wrapper">

      <!-- HEADER -->
      <div class="header">
        <div class="header-logo">🎓</div>
        <h1>EduAI Platform</h1>
        <p class="header-sub">Professor Account Confirmation</p>
      </div>

      <!-- BODY -->
      <div class="body">
        <p class="greeting">Hello, ${firstName}! 👋</p>

        <p class="text">
          Welcome to <strong>EduAI Platform</strong>! An instructor account has been created for you.
          To activate your account and set your personal password, please confirm your email address
          by clicking the button below.
        </p>

        <!-- Email info box -->
        <div class="info-box">
          <span>Account email</span>
          ${email}
        </div>

        <!-- Steps -->
        <div class="steps">
          <p class="steps-title">How it works</p>
          <div class="step">
            <div class="step-num">1</div>
            <div class="step-text">Click the <strong>"Confirm my account"</strong> button below to verify your email address.</div>
          </div>
          <div class="step">
            <div class="step-num">2</div>
            <div class="step-text">You will be redirected to a secure page where you can <strong>set your personal password</strong>.</div>
          </div>
          <div class="step">
            <div class="step-num">3</div>
            <div class="step-text">Log in and start teaching on EduAI! 🚀</div>
          </div>
        </div>

        <!-- CTA Button -->
        <div class="btn-wrapper">
          <a href="${verifyUrl}" class="btn" target="_blank" rel="noopener noreferrer">
            ✅&nbsp;&nbsp;Confirm my account
          </a>
        </div>

        <!-- Expiry notice -->
        <div class="expiry-notice">
          ⏰ This link expires in <strong>24 hours</strong>. After that, please contact your administrator
          to request a new confirmation email.
        </div>

        <!-- Plain-text fallback -->
        <div class="fallback">
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <a href="${verifyUrl}" target="_blank" rel="noopener noreferrer">${verifyUrl}</a>
        </div>

        <p style="font-size:12px;color:#cbd5e1;text-align:center;">
          Never share this link — it is single-use and tied to your account.
        </p>
      </div>

      <hr class="divider" />

      <!-- FOOTER -->
      <div class="footer">
        <p class="footer-brand">🎓 EduAI Platform</p>
        <p class="footer-text">
          This message was sent automatically — please do not reply directly to this email.<br/>
          Need help? Contact us at
          <a href="mailto:support@eduai-platform.com">support@eduai-platform.com</a>
        </p>
        <p class="footer-links">
          <a href="${FRONTEND_URL()}">Visit Platform</a>·
          <a href="${FRONTEND_URL()}/privacy">Privacy Policy</a>·
          <a href="${FRONTEND_URL()}/terms">Terms of Use</a>
        </p>
        <p style="font-size:11px;color:#cbd5e1;margin-top:12px;">
          © ${new Date().getFullYear()} EduAI Platform. All rights reserved.
        </p>
      </div>

    </div>
  </div>
</body>
</html>`;

  /* ------------------------------------------------------------------ */
  /*  PLAIN-TEXT FALLBACK                                                 */
  /* ------------------------------------------------------------------ */
  const textBody = `
Hello ${firstName},

Welcome to EduAI Platform! An instructor account has been created for you.

Please confirm your email address to activate your account:

  ${verifyUrl}

⏰ This link expires in 24 hours.

--- How it works ---
1. Click the link above to verify your email.
2. Set your personal password on the secure page.
3. Log in and start teaching!

If you did not request this account, you can safely ignore this email.

Need help? Contact us at support@eduai-platform.com

© ${new Date().getFullYear()} EduAI Platform — This message was sent automatically.
`.trim();

  /* ------------------------------------------------------------------ */
  /*  SEND                                                                */
  /* ------------------------------------------------------------------ */
  const transporter = createTransporter();

  if (!transporter) {
    console.log('\n' + '='.repeat(60));
    console.log('📧 [DEV MODE] Professor verification email');
    console.log('='.repeat(60));
    console.log(`  To   : ${name} <${email}>`);
    console.log(`  Link : ${verifyUrl}`);
    console.log('='.repeat(60) + '\n');
    return { devMode: true, verifyUrl };
  }

  const smtpUser = process.env.SMTP_USER;
  console.log(`📧 Sending via SMTP (${smtpUser}) → ${email}`);

  await transporter.sendMail({
    from: getSmtpFrom(),
    to: `"${name}" <${email}>`,
    subject: '🎓 EduAI Platform – Confirm your professor account',
    html: htmlBody,
    text: textBody,
  });

  console.log(`✅ Verification email sent to ${email}`);
  return { devMode: false };
}

/**
 * Notify professor that their account is pending admin review.
 */
export async function sendProfessorPendingEmail({ name, email }) {
  const firstName = name.split(' ')[0];
  const htmlBody = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/><style>
body{background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1e293b;margin:0;padding:0}
.w{max-width:600px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,.1)}
.h{background:linear-gradient(135deg,#f59e0b,#d97706);padding:44px 40px 36px;text-align:center}
.h h1{font-size:26px;font-weight:800;color:#fff;margin:0 0 6px}
.h p{font-size:14px;color:rgba(255,255,255,.78)}
.b{padding:44px 40px 32px}
.g{font-size:22px;font-weight:700;color:#0f172a;margin-bottom:16px}
.t{font-size:15px;line-height:1.75;color:#475569;margin-bottom:28px}
.box{background:#fffbeb;border:1.5px solid #fde68a;border-left:4px solid #f59e0b;border-radius:12px;padding:16px 22px;margin-bottom:28px;font-size:14px;color:#92400e}
.f{background:#f8fafc;padding:28px 40px;text-align:center;font-size:12px;color:#94a3b8}
</style></head><body>
<div class="w">
  <div class="h"><div style="font-size:32px;margin-bottom:10px">⏳</div><h1>EduAI Platform</h1><p>Compte en attente de validation</p></div>
  <div class="b">
    <p class="g">Bonjour, ${firstName} ! 👋</p>
    <p class="t">Merci de votre inscription sur <strong>EduAI Platform</strong> en tant que professeur. Votre compte a été créé avec succès.</p>
    <div class="box">
      <strong>⏳ Votre compte est en attente de validation</strong><br/><br/>
      Un administrateur examinera votre certificat et activera votre compte dans les plus brefs délais. Vous recevrez un email de confirmation une fois approuvé.
    </div>
    <p class="t">Si vous n'avez pas encore envoyé votre certificat, connectez-vous pour le télécharger depuis votre espace.</p>
  </div>
  <div class="f"><p>🎓 EduAI Platform — © ${new Date().getFullYear()}</p></div>
</div>
</body></html>`;

  const textBody = `Bonjour ${firstName},\n\nMerci de votre inscription sur EduAI en tant que professeur.\nVotre compte est en attente de validation par un administrateur.\n\n© ${new Date().getFullYear()} EduAI Platform`;

  const transporter = createTransporter();
  if (!transporter) {
    console.log(`📧 [DEV] Pending email → ${email}`);
    return;
  }
  await transporter.sendMail({
    from: getSmtpFrom(),
    to: `"${name}" <${email}>`,
    subject: '⏳ EduAI — Votre compte professeur est en attente',
    html: htmlBody,
    text: textBody,
  });
  console.log(`✅ Pending notification sent to ${email}`);
}

/**
 * Notify professor that their account has been approved.
 */
export async function sendProfessorApprovedEmail({ name, email }) {
  const firstName = name.split(' ')[0];
  const loginUrl = `${FRONTEND_URL()}/`;
  const htmlBody = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/><style>
body{background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1e293b;margin:0;padding:0}
.w{max-width:600px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,.1)}
.h{background:linear-gradient(135deg,#059669,#10b981);padding:44px 40px 36px;text-align:center}
.h h1{font-size:26px;font-weight:800;color:#fff;margin:0 0 6px}
.h p{font-size:14px;color:rgba(255,255,255,.78)}
.b{padding:44px 40px 32px}
.g{font-size:22px;font-weight:700;color:#0f172a;margin-bottom:16px}
.t{font-size:15px;line-height:1.75;color:#475569;margin-bottom:28px}
.box{background:#ecfdf5;border:1.5px solid #a7f3d0;border-left:4px solid #059669;border-radius:12px;padding:16px 22px;margin-bottom:28px;font-size:14px;color:#065f46}
.btn-w{text-align:center;margin:36px 0}
.btn{display:inline-block;background:linear-gradient(135deg,#059669,#10b981);color:#fff!important;text-decoration:none;padding:18px 48px;border-radius:50px;font-size:16px;font-weight:700;box-shadow:0 8px 24px rgba(5,150,105,.4)}
.f{background:#f8fafc;padding:28px 40px;text-align:center;font-size:12px;color:#94a3b8}
</style></head><body>
<div class="w">
  <div class="h"><div style="font-size:32px;margin-bottom:10px">✅</div><h1>EduAI Platform</h1><p>Compte approuvé !</p></div>
  <div class="b">
    <p class="g">Félicitations, ${firstName} ! 🎉</p>
    <p class="t">Votre compte professeur sur <strong>EduAI Platform</strong> a été <strong>approuvé</strong> par un administrateur.</p>
    <div class="box">
      <strong>✅ Votre compte est maintenant actif</strong><br/><br/>
      Vous pouvez dès à présent vous connecter et commencer à créer vos cours, gérer vos étudiants et utiliser tous les outils de la plateforme.
    </div>
    <div class="btn-w"><a href="${loginUrl}" class="btn">Se connecter →</a></div>
  </div>
  <div class="f"><p>🎓 EduAI Platform — © ${new Date().getFullYear()}</p></div>
</div>
</body></html>`;

  const textBody = `Félicitations ${firstName} !\n\nVotre compte professeur EduAI a été approuvé.\nConnectez-vous : ${loginUrl}\n\n© ${new Date().getFullYear()} EduAI Platform`;

  const transporter = createTransporter();
  if (!transporter) {
    console.log(`📧 [DEV] Approved email → ${email}`);
    return;
  }
  await transporter.sendMail({
    from: getSmtpFrom(),
    to: `"${name}" <${email}>`,
    subject: '✅ EduAI — Votre compte professeur est approuvé !',
    html: htmlBody,
    text: textBody,
  });
  console.log(`✅ Approval notification sent to ${email}`);
}

/**
 * Notify professor that their account has been rejected.
 */
export async function sendProfessorRejectedEmail({ name, email, comment }) {
  const firstName = name.split(' ')[0];
  const htmlBody = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/><style>
body{background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1e293b;margin:0;padding:0}
.w{max-width:600px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,.1)}
.h{background:linear-gradient(135deg,#dc2626,#ef4444);padding:44px 40px 36px;text-align:center}
.h h1{font-size:26px;font-weight:800;color:#fff;margin:0 0 6px}
.h p{font-size:14px;color:rgba(255,255,255,.78)}
.b{padding:44px 40px 32px}
.g{font-size:22px;font-weight:700;color:#0f172a;margin-bottom:16px}
.t{font-size:15px;line-height:1.75;color:#475569;margin-bottom:28px}
.box{background:#fef2f2;border:1.5px solid #fecaca;border-left:4px solid #dc2626;border-radius:12px;padding:16px 22px;margin-bottom:28px;font-size:14px;color:#991b1b}
.comment{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;margin-bottom:28px;font-size:14px;color:#475569;font-style:italic}
.f{background:#f8fafc;padding:28px 40px;text-align:center;font-size:12px;color:#94a3b8}
</style></head><body>
<div class="w">
  <div class="h"><div style="font-size:32px;margin-bottom:10px">❌</div><h1>EduAI Platform</h1><p>Compte non approuvé</p></div>
  <div class="b">
    <p class="g">Bonjour, ${firstName}</p>
    <p class="t">Nous sommes désolés de vous informer que votre demande de compte professeur sur <strong>EduAI Platform</strong> n'a pas été approuvée.</p>
    <div class="box">
      <strong>❌ Votre demande a été rejetée</strong><br/><br/>
      Votre certificat n'a pas pu être validé. Vous pouvez soumettre un nouveau certificat ou contacter l'administrateur.
    </div>
    ${comment ? `<div class="comment"><strong>Commentaire de l'administrateur :</strong><br/>${comment}</div>` : ''}
    <p class="t">Si vous pensez qu'il s'agit d'une erreur, contactez-nous à <a href="mailto:support@eduai-platform.com">support@eduai-platform.com</a>.</p>
  </div>
  <div class="f"><p>🎓 EduAI Platform — © ${new Date().getFullYear()}</p></div>
</div>
</body></html>`;

  const textBody = `Bonjour ${firstName},\n\nVotre demande de compte professeur EduAI a été rejetée.\n${comment ? `Commentaire : ${comment}\n` : ''}\nContactez support@eduai-platform.com pour plus d'informations.\n\n© ${new Date().getFullYear()} EduAI Platform`;

  const transporter = createTransporter();
  if (!transporter) {
    console.log(`📧 [DEV] Rejected email → ${email} (comment: ${comment || 'none'})`);
    return;
  }
  await transporter.sendMail({
    from: getSmtpFrom(),
    to: `"${name}" <${email}>`,
    subject: '❌ EduAI — Votre demande de compte professeur',
    html: htmlBody,
    text: textBody,
  });
  console.log(`✅ Rejection notification sent to ${email}`);
}
