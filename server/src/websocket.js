import { WebSocketServer } from 'ws';

let wss = null;
const clients = new Set();

export function initializeWebSocket(server) {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('🔌 New WebSocket client connected');
    clients.add(ws);

    // Send initial connection message
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Connected to Observo Log Service',
      timestamp: new Date().toISOString()
    }));

    ws.on('close', () => {
      console.log('🔌 WebSocket client disconnected');
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  console.log('✅ WebSocket server initialized');
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
        console.error('Error sending to WebSocket client:', error);
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