import { Kafka } from 'kafkajs';

export const createKafkaProducer = (config) => {
  const kafka = new Kafka({ brokers: config.kafka.brokers });
  const producer = kafka.producer();

  const sendLog = async ({ tag, server_id, line }) => {
    console.log(`🚀 Sending log to Kafka - Topic: ${config.kafka.topic_prefix}.${tag}, Server: ${server_id}`);
    try {
      await producer.send({
        topic: `${config.kafka.topic_prefix}.${tag}`,
        messages: [{
          value: JSON.stringify({
            timestamp: new Date().toISOString(),
            log: line,
            server_id,
            tag,
          }),
        }],
      });
      console.log(`✅ Log sent successfully to topic: ${config.kafka.topic_prefix}.${tag}`);
    } catch (error) {
      console.error(`❌ Failed to send log to Kafka:`, error);
    }
  };

  return { producer, sendLog };
};
