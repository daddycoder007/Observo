import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { connectToMongoDB } from './database/mongoClient.js';
import { startKafkaConsumer } from './kafka/consumer.js';
import { logRoutes } from './routes/logs.js';
import { initializeWebSocket, getClientCount, closeWebSocket } from './websocket.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize WebSocket
initializeWebSocket(server);

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Observo Log Service',
    websocketClients: getClientCount()
  });
});

// API Routes
app.use('/api/logs', logRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

async function startServer() {
  try {
    // Connect to MongoDB
    await connectToMongoDB();
    console.log('✅ Connected to MongoDB');

    // Start Kafka consumer
    await startKafkaConsumer();
    console.log('✅ Kafka consumer started');

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📝 Logs API: http://localhost:${PORT}/api/logs`);
      console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  closeWebSocket();
  server.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  closeWebSocket();
  server.close();
  process.exit(0);
});

startServer(); 