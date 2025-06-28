import nodemailer from 'nodemailer';
import fetch from 'node-fetch';
import logger from '../logger.js';

// Send email notification to a list of recipients
export async function sendEmailNotification({ emails, subject, text, html }) {
  if (!emails || emails.length === 0) return;
  // Configure your SMTP transport here
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER || 'user@example.com',
      pass: process.env.SMTP_PASS || 'password'
    }
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || 'alerts@observo.com',
    to: emails.join(','),
    subject,
    text,
    html
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info('✅ Alert email sent to:', emails);
  } catch (error) {
    logger.error('❌ Failed to send alert email:', error);
  }
}

// Send Slack notification to a webhook URL
export async function sendSlackNotification({ webhookUrl, message }) {
  if (!webhookUrl) return;
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message })
    });
    if (response.ok) {
      logger.info('✅ Slack alert sent');
    } else {
      logger.error('❌ Failed to send Slack alert:', await response.text());
    }
  } catch (error) {
    logger.error('❌ Error sending Slack alert:', error);
  }
} 