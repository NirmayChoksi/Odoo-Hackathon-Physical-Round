import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter object using the default SMTP transport
// You will need to setup these environment variables
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendMail = async (to: string, subject: string, html: string) => {
  try {
    const info = await transporter.sendMail({
      from: `"Support" <${process.env.SMTP_USER || 'no-reply@example.com'}>`,
      to,
      subject,
      html,
    });
    const smtpHost = process.env.SMTP_HOST || 'smtp.ethereal.email';
    console.log('Mail handoff:', {
      smtpHost,
      ...(smtpHost.includes('ethereal') && {
        note: 'Ethereal does not deliver to real inboxes — configure SMTP_HOST for real delivery.',
      }),
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    });
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
