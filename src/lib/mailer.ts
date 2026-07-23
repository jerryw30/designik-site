import nodemailer from "nodemailer";

/**
 * Shared notification sender. Sends to CONTACT_TO with CONTACT_CC in copy,
 * using the configured SMTP account (e.g. Gmail app password). Best-effort:
 * returns { sent:false } when SMTP isn't configured or the send fails, so
 * callers never break the request over email.
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
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, CONTACT_TO, CONTACT_CC } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.info("[mailer] SMTP not configured — skipping email:", subject);
    return { sent: false };
  }
  const to = CONTACT_TO || SMTP_USER;
  const cc = (CONTACT_CC || "")
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const port = Number(SMTP_PORT) || 465;
  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
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
    return { sent: false, error: err instanceof Error ? err.message : "send failed" };
  }
}
