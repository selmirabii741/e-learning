import nodemailer from "nodemailer";
import type { ReminderCandidate } from "@/lib/calendar/types";

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass || pass === "your_gmail_app_password_here") {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}

function priorityColor(priority?: string) {
  if (priority === "high") return "#ef4444";
  if (priority === "medium") return "#f97316";
  return "#22c55e";
}

function priorityLabel(priority?: string) {
  if (priority === "high") return "🔴 HIGH";
  if (priority === "medium") return "🟠 MEDIUM";
  return "🟢 LOW";
}

function buildHtml(reminder: ReminderCandidate) {
  const isTask = Boolean(reminder.task);
  const deadline = reminder.task?.deadline
    ? new Date(reminder.task.deadline).toLocaleString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    : reminder.scheduledFor;

  const priority = reminder.task?.priority;
  const details = reminder.task?.details;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${reminder.title}</title>
</head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#16a34a 0%,#4ade80 100%);padding:32px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.8);margin-bottom:6px;">EduAI · Notification</div>
                    <div style="font-size:28px;font-weight:800;color:#ffffff;line-height:1.3;">${isTask ? "⏰ Tâche arrivée à échéance" : "📅 Rappel d'événement"}</div>
                  </td>
                  <td align="right" style="vertical-align:top;">
                    <div style="background:rgba(255,255,255,0.2);border-radius:50%;width:56px;height:56px;display:inline-flex;align-items:center;justify-content:center;font-size:28px;line-height:56px;text-align:center;">
                      ${isTask ? "📋" : "📆"}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 36px;">

              <!-- Task Title -->
              <div style="font-size:22px;font-weight:700;color:#14532d;margin-bottom:12px;">
                ${reminder.task?.title ?? reminder.title}
              </div>

              ${
                priority
                  ? `<!-- Priority Badge -->
              <div style="display:inline-block;background:${priorityColor(priority)}1a;color:${priorityColor(priority)};font-size:12px;font-weight:700;padding:5px 14px;border-radius:999px;margin-bottom:20px;letter-spacing:0.05em;">
                ${priorityLabel(priority)}
              </div>`
                  : ""
              }

              <!-- Divider -->
              <div style="height:1px;background:#e7f5ec;margin:20px 0;"></div>

              <!-- Deadline row -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td width="36" style="vertical-align:top;padding-top:2px;">
                    <span style="font-size:20px;">🗓️</span>
                  </td>
                  <td>
                    <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#6b7280;margin-bottom:4px;">Échéance</div>
                    <div style="font-size:16px;font-weight:700;color:#111827;">${deadline}</div>
                  </td>
                </tr>
              </table>

              ${
                details
                  ? `<!-- Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td width="36" style="vertical-align:top;padding-top:2px;">
                    <span style="font-size:20px;">📝</span>
                  </td>
                  <td>
                    <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#6b7280;margin-bottom:4px;">Détails</div>
                    <div style="font-size:15px;color:#374151;line-height:1.6;">${details}</div>
                  </td>
                </tr>
              </table>`
                  : ""
              }

              <!-- Divider -->
              <div style="height:1px;background:#e7f5ec;margin:20px 0;"></div>

              <!-- Message -->
              <div style="font-size:15px;color:#4b5563;line-height:1.7;margin-bottom:28px;">
                ${reminder.body}
              </div>

              <!-- CTA Button -->
              <div style="text-align:center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}"
                   style="display:inline-block;background:linear-gradient(135deg,#16a34a,#22c55e);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:12px;letter-spacing:0.02em;box-shadow:0 4px 12px rgba(22,163,74,0.3);">
                  Ouvrir EduAI →
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 36px;">
              <div style="font-size:12px;color:#9ca3af;text-align:center;line-height:1.6;">
                Cet email a été envoyé automatiquement par <strong>EduAI</strong>.<br/>
                Ne pas répondre à cet email.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendReminderEmail(reminder: ReminderCandidate) {
  const transporter = getTransport();
  const from = process.env.SMTP_FROM ?? "EduAI <noreply@eduai.app>";
  const html = buildHtml(reminder);

  if (!transporter) {
    console.log("[EduAI Email] SMTP not configured — preview mode:");
    console.log(`  To: ${reminder.user.email}`);
    console.log(`  Subject: ${reminder.title}`);
    return {
      delivered: false,
      preview: {
        to: reminder.user.email,
        subject: reminder.title,
        html
      }
    };
  }

  const result = await transporter.sendMail({
    from,
    to: reminder.user.email,
    subject: reminder.title,
    html
  });

  console.log(`[EduAI Email] Sent to ${reminder.user.email} — messageId: ${result.messageId}`);

  return {
    delivered: true,
    messageId: result.messageId
  };
}
