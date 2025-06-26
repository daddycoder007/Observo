import { watchLogFile } from './logWatcher.js';
import { createKafkaProducer } from './kafkaProducer.js';

export const startAgent = async (config) => {
  const { sendLog, producer } = createKafkaProducer(config);
  await producer.connect();

  console.log('✅ Kafka connected. Watching log files...');

  for (const file of config.log_files) {
    watchLogFile(file, async ({ line, tag }) => {
      await sendLog({ tag, server_id: config.server_id, line });
    });
  }
};
