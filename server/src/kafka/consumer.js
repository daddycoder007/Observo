import { Kafka } from 'kafkajs';
import { getCollection } from '../database/mongoClient.js';
import { broadcastToClients, getClientCount } from '../websocket.js';
import { sendEmailNotification, sendSlackNotification } from '../utils/alertNotifications.js';
import logger from '../logger.js';

let consumer = null;
let isRunning = false;
let kafka = null;

export async function startKafkaConsumer() {
  try {
    // Create Kafka instance here after environment variables are loaded
    kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || 'observo-log-service',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });

    const topicPrefix = process.env.KAFKA_TOPIC_PREFIX || 'testing-logs';
    const topics = process.env.KAFKA_TOPICS 
      ? process.env.KAFKA_TOPICS.split(',') 
      : [`${topicPrefix}.output`]; // Default to output topic
    const groupId = process.env.KAFKA_GROUP_ID || 'observo-log-consumer-group';

    // Log the configuration for debugging
    logger.info(`🔧 Kafka Configuration:`, {
      brokers: process.env.KAFKA_BROKERS || 'localhost:9092',
      clientId: process.env.KAFKA_CLIENT_ID || 'observo-log-service',
      groupId: groupId,
      topics: topics
    });

    consumer = kafka.consumer({ groupId });

    await consumer.connect();
    
    // Subscribe to all specified topics
    for (const topic of topics) {
      await consumer.subscribe({ topic, fromBeginning: false });
    }

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          await processLogMessage(message, topic);
        } catch (error) {
          logger.error('Error processing message:', error);
          // Continue processing other messages even if one fails
        }
      },
      autoCommit: true,
      autoCommitInterval: 5000,
      autoCommitThreshold: 100,
    });

    isRunning = true;
    logger.info('✅ Kafka consumer started successfully');

  } catch (error) {
    logger.error('❌ Failed to start Kafka consumer:', error);
    throw error;
  }
}

async function processLogMessage(message, topic) {
  try {
    const logData = JSON.parse(message.value.toString());
    const collection = getCollection();

    // Extract tag from topic name (e.g., "testing-logs.output" -> "output")
    const tag = topic.split('.').pop();

    // Transform log data to match our schema
    const logEntry = {
      timestamp: new Date(logData.timestamp || Date.now()),
      level: determineLogLevel(logData.log),
      message: logData.log,
      service: logData.server_id || 'unknown',
      tag: tag,
      metadata: {
        host: logData.server_id || 'unknown',
        topic: topic,
        partition: message.partition,
        offset: message.offset
      },
      kafkaMetadata: {
        topic: topic,
        partition: message.partition,
        offset: message.offset,
        receivedAt: new Date()
      },
      raw: logData // Keep original data for reference
    };


    // Insert log into MongoDB
    const result = await collection.insertOne(logEntry);
        
    // Broadcast new log to WebSocket clients
    try {
      const sentCount = broadcastToClients({
        type: 'newLog',
        data: {
          ...logEntry,
          _id: result.insertedId
        },
        timestamp: new Date().toISOString()
      });
    } catch (wsError) {
      logger.error('Error broadcasting to WebSocket clients:', wsError);
    }

    // ALERT LOGIC PLACEHOLDER: Check thresholds and trigger alerts (webhook, email, Slack)
    try {
      // Fetch alert settings
      const { settingsService } = await import('../database/settingsService.js');
      const alertSettings = await settingsService.getSection('alerts');
      if (alertSettings?.enabled && alertSettings.notifications) {
        // Example: Check if this log is an error and if errorRateThreshold is exceeded
        // (For demo, just trigger on every error log)
        if (logEntry.level === 'error' && alertSettings.notifications) {
          const subject = 'Observo Alert: Error Log Detected';
          const text = `An error log was detected: ${logEntry.message}`;
          const html = `<b>An error log was detected:</b><br>${logEntry.message}`;
          // Email
          if (alertSettings.notifications.email && alertSettings.notifications.emails?.length) {
            await sendEmailNotification({
              emails: alertSettings.notifications.emails,
              subject,
              text,
              html
            });
          }
          // Slack
          if (alertSettings.notifications.slack && alertSettings.notifications.slackWebhookUrl) {
            await sendSlackNotification({
              webhookUrl: alertSettings.notifications.slackWebhookUrl,
              message: text
            });
          }
          // Webhook (generic)
          if (alertSettings.notifications.webhook && alertSettings.notifications.webhookUrl) {
            try {
              await fetch(alertSettings.notifications.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'alert',
                  log: logEntry,
                  message: text
                })
              });
            } catch (err) {
              logger.error('❌ Failed to send webhook alert:', err);
            }
          }
        }
      }
    } catch (alertError) {
      logger.error('❌ Error in alert logic:', alertError);
    }
    
    return result;
  } catch (error) {
    logger.error('Error processing log message:', error);
    throw error;
  }
}

function determineLogLevel(logMessage) {
  const message = logMessage.toLowerCase();
  
  if (message.includes('error') || message.includes('err')) {
    return 'error';
  } else if (message.includes('warn') || message.includes('warning')) {
    return 'warn';
  } else if (message.includes('debug')) {
    return 'debug';
  } else if (message.includes('info')) {
    return 'info';
  } else {
    return 'info'; // Default level
  }
}

export async function stopKafkaConsumer() {
  if (consumer && isRunning) {
    try {
      await consumer.disconnect();
      isRunning = false;
    } catch (error) {
      logger.error('Error stopping Kafka consumer:', error);
    }
  }
}

export function isConsumerRunning() {
  return isRunning;
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await stopKafkaConsumer();
});

process.on('SIGTERM', async () => {
  await stopKafkaConsumer();
}); 