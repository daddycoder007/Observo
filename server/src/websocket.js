import { WebSocketServer } from 'ws';
import logger from './logger.js';

let wss = null;
const clients = new Set();

export function initializeWebSocket(server) {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    logger.info('🔌 New WebSocket client connected');
    clients.add(ws);

    // Send initial connection message
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Connected to Observo Log Service',
      timestamp: new Date().toISOString()
    }));

    ws.on('close', () => {
      logger.info('🔌 WebSocket client disconnected');
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      logger.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  logger.info('✅ WebSocket server initialized');
}

export function broadcastToClients(data) {
  const message = JSON.stringify(data);
  let sentCount = 0;
  
  clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      try {
        client.send(message);
        sentCount++;
      } catch (error) {
        logger.error('Error sending to WebSocket client:', error);
        clients.delete(client);
      }
    }
  });
  
  return sentCount;
}

export function getClientCount() {
  return clients.size;
}

export function closeWebSocket() {
  if (wss) {
    wss.close();
    wss = null;
  }
  clients.clear();
} 