const express = require('express');
const config = require('../config');
const webhookHandler = require('../services/webhookHandler');
const dataStore = require('../utils/dataStore');
const walletManager = require('../utils/walletManager');
const positionManager = require('../services/positionManager');
const walletTracker = require('../services/walletTracker');

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Helius webhook endpoint
router.post('/webhook/helius', async (req, res) => {
  try {
    // Verify webhook signature if secret is configured
    if (config.server.webhookSecret) {
      const signature = req.headers['x-webhook-signature'];
      if (!signature || signature !== config.server.webhookSecret) {
        console.warn('Invalid webhook signature');
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }
    
    console.log('Received Helius webhook');
    await webhookHandler.handleHeliusWebhook(req.body);
    res.json({ success: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all positions
router.get('/api/positions', (req, res) => {
  try {
    const positions = dataStore.getPositions();
    res.json(positions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get open positions
router.get('/api/positions/open', (req, res) => {
  try {
    const positions = dataStore.getOpenPositions();
    res.json(positions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manually sell a position
router.post('/api/positions/:id/sell', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await positionManager.manualSell(id);
    res.json({ success: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get trades
router.get('/api/trades', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const trades = dataStore.getTrades(limit);
    res.json(trades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get stats
router.get('/api/stats', (req, res) => {
  try {
    const stats = dataStore.getStats();
    const posStats = positionManager.getPositionStats();
    res.json({ ...stats, positionStats: posStats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get wallet balances
router.get('/api/balances', async (req, res) => {
  try {
    const balances = await walletManager.getAllBalances();
    res.json(balances);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Wallet tracking endpoints
router.get('/api/leaderboard', (req, res) => {
  try {
    const sortBy = req.query.sortBy || 'pnl';
    const limit = parseInt(req.query.limit) || 50;
    const leaderboard = walletTracker.getLeaderboard(sortBy, limit);
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/api/wallet/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const stats = await walletTracker.getWalletStats(address);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/wallet/:address/track', async (req, res) => {
  try {
    const { address } = req.params;
    const wallet = walletTracker.trackWallet(address, req.body);
    res.json({ success: true, wallet });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/api/wallet/:address/track', async (req, res) => {
  try {
    const { address } = req.params;
    const removed = walletTracker.untrackWallet(address);
    res.json({ success: removed });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/api/tracked-wallets', (req, res) => {
  try {
    const wallets = walletTracker.getTrackedWallets();
    res.json(wallets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
