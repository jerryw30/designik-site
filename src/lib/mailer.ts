
import nodemailer from "nodemailer";
import { getNotifyEmails } from "@/lib/site-config";

/**
 * Shared notification sender.
 *
 * Recipients come from the admin-managed list
 * (Forms → Submission notifications).
 *
 * When that list is empty, it falls back to
 * CONTACT_TO / CONTACT_CC environment variables.
 *
 * Preview deployments never send outgoing emails.
 */
export async function sendNotification({
  subject,
  text,
  replyTo,
}: {
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<{ sent: boolean; error?: string }> {

  // Disable outgoing emails on Vercel Preview deployments.
  if (process.env.VERCEL_ENV === "preview") {
    console.info(
      "[mailer] Preview: outgoing notification email disabled."
    );

    return { sent: false };
  }

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_FROM,
    CONTACT_TO,
    CONTACT_CC,
  } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.info(
      "[mailer] SMTP not configured — skipping email:",
      subject
    );

    return { sent: false };
  }

  // Admin-managed recipients take priority.
  const managed = await getNotifyEmails();

  const to = managed.length
    ? managed[0]
    : CONTACT_TO || SMTP_USER;

  const cc = managed.length
    ? managed.slice(1)
    : (CONTACT_CC || "")
        .split(/[,;]+/)
        .map((s) => s.trim())
        .filter(Boolean);

  const port = Number(SMTP_PORT) || 465;

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: SMTP_FROM || `Designik Website <${SMTP_USER}>`,
      to,
      cc: cc.length ? cc : undefined,
      replyTo,
      subject,
      text,
    });

    return { sent: true };
  } catch (err) {
    console.error("[mailer] send failed:", err);

    return {
      sent: false,
      error:
        err instanceof Error
          ? err.message
          : "send failed",
    };
  }
}

/**
 * Send to a specific customer address.
 *
 * Used for hosting order confirmations
 * and WordPress credentials.
 *
 * Outgoing customer emails are disabled
 * on Vercel Preview deployments.
 */
export async function sendCustomerEmail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}): Promise<{ sent: boolean; error?: string }> {

  // Disable customer emails on Vercel Preview deployments.
  if (process.env.VERCEL_ENV === "preview") {
    console.info(
      "[mailer] Preview: outgoing customer email disabled."
    );

    return { sent: false };
  }

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_FROM,
  } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.info(
      "[mailer] SMTP not configured — skipping email:",
      subject
    );

    return { sent: false };
  }

  const port = Number(SMTP_PORT) || 465;

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: SMTP_FROM || `Designik <${SMTP_USER}>`,
      to,
      subject,
      text,
    });

    return { sent: true };
  } catch (error) {
    console.error("[mailer] customer send failed:", error);

    return {
      sent: false,
      error: String(error),
    };
  }
}
