const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const config = require('./config');
const dataStore = require('./utils/dataStore');
const positionManager = require('./services/positionManager');
const telegramBot = require('./services/telegramBot');
const WebSocketServer = require('./services/websocketServer');
const apiRoutes = require('./routes/api');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// API routes
app.use('/', apiRoutes);

// Initialize WebSocket server
const wsServer = new WebSocketServer(server);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

// Graceful shutdown
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

async function shutdown() {
  console.log('Shutting down gracefully...');
  
  positionManager.stop();
  telegramBot.stop();
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
}

// Start the application
async function start() {
  try {
    console.log('🚀 Starting BetOnDev Copy Trading Bot...');
    
    // Initialize data store
    await dataStore.init();
    console.log('✅ Data store initialized');

    // Start position manager
    positionManager.start();
    console.log('✅ Position manager started');

    // Start Telegram bot
    await telegramBot.start();
    console.log('✅ Telegram bot started');

    // Start server
    const port = config.server.port;
    server.listen(port, () => {
      console.log(`✅ Server running on port ${port}`);
      console.log(`📊 Dashboard: http://localhost:${port}`);
      console.log(`🔗 Webhook endpoint: http://localhost:${port}/webhook/helius`);
      console.log('');
      console.log('🎯 Bot is ready to copy trades!');
    });

  } catch (error) {
    console.error('Error starting application:', error);
    process.exit(1);
  }
}

// Start the application
start();

module.exports = app;
