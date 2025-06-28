import fetch from 'node-fetch';
import { settingsService } from '../database/settingsService.js';
import { sendEmailNotification, sendSlackNotification } from './alertNotifications.js';
import logger from '../logger.js';

let intervalId = null;
let failureCounts = {};

export async function startSystemCheckService() {
  if (intervalId) clearInterval(intervalId);
  const settings = await settingsService.getSection('systemCheck');
  if (!settings?.enabled || !settings.endpoints?.length) return;
  const interval = (settings.intervalSeconds || 60) * 1000;

  intervalId = setInterval(async () => {
    const alertSettings = await settingsService.getSection('alerts');
    for (const endpoint of settings.endpoints) {
      try {
        const res = await fetch(endpoint.url, { method: 'GET', timeout: 10000 });
        if (res.ok) {
          failureCounts[endpoint.url] = 0;
        } else {
          failureCounts[endpoint.url] = (failureCounts[endpoint.url] || 0) + 1;
        }
      } catch (err) {
        failureCounts[endpoint.url] = (failureCounts[endpoint.url] || 0) + 1;
      }
      // If failed 3 times in a row, trigger alert
      if (failureCounts[endpoint.url] === 3) {
        const subject = `System Check Alert: ${endpoint.name} is DOWN`;
        const text = `Endpoint ${endpoint.name} (${endpoint.url}) failed 3 consecutive health checks.`;
        const html = `<b>Endpoint ${endpoint.name} (${endpoint.url}) failed 3 consecutive health checks.</b>`;
        // Email
        if (alertSettings.notifications.email && alertSettings.notifications.emails?.length) {
          await sendEmailNotification({ emails: alertSettings.notifications.emails, subject, text, html });
        }
        // Slack
        if (alertSettings.notifications.slack && alertSettings.notifications.slackWebhookUrl) {
          await sendSlackNotification({ webhookUrl: alertSettings.notifications.slackWebhookUrl, message: text });
        }
        // Webhook
        if (alertSettings.notifications.webhook && alertSettings.notifications.webhookUrl) {
          try {
            await fetch(alertSettings.notifications.webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'systemCheck', endpoint, message: text })
            });
          } catch (err) {
            logger.error('❌ Failed to send system check webhook alert:', err);
          }
        }
      }
    }
  }, interval);
  logger.info('✅ System check service started');
}

export function stopSystemCheckService() {
  if (intervalId) clearInterval(intervalId);
  intervalId = null;
  failureCounts = {};
  logger.info('🛑 System check service stopped');
} 