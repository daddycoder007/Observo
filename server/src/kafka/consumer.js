import { Kafka } from 'kafkajs';
import { getCollection } from '../database/mongoClient.js';
import { broadcastToClients, getClientCount } from '../websocket.js';

let consumer = null;
let isRunning = false;

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'observo-log-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});

export async function startKafkaConsumer() {
  try {
    const topicPrefix = process.env.KAFKA_TOPIC_PREFIX || 'testing-logs';
    const topics = process.env.KAFKA_TOPICS 
      ? process.env.KAFKA_TOPICS.split(',') 
      : [`${topicPrefix}.output`]; // Default to output topic
    const groupId = process.env.KAFKA_GROUP_ID || 'observo-log-consumer-group';

    consumer = kafka.consumer({ groupId });

    await consumer.connect();
    
    // Subscribe to all specified topics
    for (const topic of topics) {
      await consumer.subscribe({ topic, fromBeginning: false });
      console.log(`📥 Subscribed to Kafka topic: ${topic}`);
    }

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          await processLogMessage(message, topic);
        } catch (error) {
          console.error('Error processing message:', error);
          // Continue processing other messages even if one fails
        }
      },
      autoCommit: true,
      autoCommitInterval: 5000,
      autoCommitThreshold: 100,
    });

    isRunning = true;
    console.log('✅ Kafka consumer started successfully');
    console.log(`📊 Monitoring topics: ${topics.join(', ')}`);

  } catch (error) {
    console.error('❌ Failed to start Kafka consumer:', error);
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

    console.log('logEntry from kafka consumer ========>>>>>>>>>>', logEntry);

    // Insert log into MongoDB
    const result = await collection.insertOne(logEntry);
    
    console.log(`📝 Log stored in MongoDB: ${result.insertedId} (${tag})`);
    
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
      console.log(`🔌 Broadcasted new log to ${sentCount} WebSocket clients`);
    } catch (wsError) {
      console.error('Error broadcasting to WebSocket clients:', wsError);
    }
    
    return result;
  } catch (error) {
    console.error('Error processing log message:', error);
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
      console.log('✅ Kafka consumer stopped');
    } catch (error) {
      console.error('Error stopping Kafka consumer:', error);
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