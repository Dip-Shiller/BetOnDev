const WebSocket = require('ws');
const dataStore = require('../utils/dataStore');
const positionManager = require('../services/positionManager');
const walletManager = require('../utils/walletManager');

class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Set();
    this.setupWebSocket();
    this.startBroadcasting();
  }

  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      console.log('New WebSocket client connected');
      this.clients.add(ws);

      // Send initial data
      this.sendUpdate(ws);

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
  }

  startBroadcasting() {
    // Broadcast updates every 5 seconds
    setInterval(() => {
      this.broadcastUpdate();
    }, 5000);
  }

  async sendUpdate(ws) {
    try {
      const positions = dataStore.getOpenPositions();
      const stats = dataStore.getStats();
      const posStats = positionManager.getPositionStats();
      const trades = dataStore.getTrades(20);
      const balances = await walletManager.getAllBalances();

      const data = {
        type: 'update',
        timestamp: Date.now(),
        positions,
        stats: {
          ...stats,
          positionStats: posStats,
        },
        trades,
        balances,
      };

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error sending WebSocket update:', error);
    }
  }

  async broadcastUpdate() {
    for (const client of this.clients) {
      await this.sendUpdate(client);
    }
  }
}

module.exports = WebSocketServer;
