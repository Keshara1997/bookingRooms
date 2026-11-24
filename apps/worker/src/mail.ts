import nodemailer from "nodemailer";

const mailFrom =
  process.env.MAIL_FROM ?? "BookingRooms <noreply@bookingrooms.local>";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  const host = process.env.SMTP_HOST;

  if (!host) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          : undefined,
    });
  }

  return transporter;
}

export async function sendMail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
}) {
  const transport = getTransporter();

  if (!transport) {
    console.log(
      `[mail:dev] To: ${options.to}\nSubject: ${options.subject}\n\n${options.text}`,
    );
    if (options.attachments?.length) {
      console.log(
        `[mail:dev] Attachments: ${options.attachments.map((a) => a.filename).join(", ")}`,
      );
    }
    return;
  }

  await transport.sendMail({
    from: mailFrom,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    attachments: options.attachments,
  });
}