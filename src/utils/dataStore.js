const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const POSITIONS_FILE = path.join(DATA_DIR, 'positions.json');
const TRADES_FILE = path.join(DATA_DIR, 'trades.json');
const STATS_FILE = path.join(DATA_DIR, 'stats.json');

class DataStore {
  constructor() {
    this.positions = [];
    this.trades = [];
    this.stats = {
      totalTrades: 0,
      successfulTrades: 0,
      failedTrades: 0,
      totalPnL: 0,
      startTime: Date.now(),
    };
  }

  async init() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await this.loadAll();
    } catch (error) {
      console.error('Error initializing data store:', error);
    }
  }

  async loadAll() {
    try {
      const positionsData = await fs.readFile(POSITIONS_FILE, 'utf8');
      this.positions = JSON.parse(positionsData);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Error loading positions:', error);
      }
    }

    try {
      const tradesData = await fs.readFile(TRADES_FILE, 'utf8');
      this.trades = JSON.parse(tradesData);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Error loading trades:', error);
      }
    }

    try {
      const statsData = await fs.readFile(STATS_FILE, 'utf8');
      this.stats = JSON.parse(statsData);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Error loading stats:', error);
      }
    }
  }

  async savePositions() {
    try {
      await fs.writeFile(POSITIONS_FILE, JSON.stringify(this.positions, null, 2));
    } catch (error) {
      console.error('Error saving positions:', error);
    }
  }

  async saveTrades() {
    try {
      await fs.writeFile(TRADES_FILE, JSON.stringify(this.trades, null, 2));
    } catch (error) {
      console.error('Error saving trades:', error);
    }
  }

  async saveStats() {
    try {
      await fs.writeFile(STATS_FILE, JSON.stringify(this.stats, null, 2));
    } catch (error) {
      console.error('Error saving stats:', error);
    }
  }

  // Position methods
  async addPosition(position) {
    this.positions.push(position);
    await this.savePositions();
  }

  async updatePosition(id, updates) {
    const index = this.positions.findIndex(p => p.id === id);
    if (index !== -1) {
      this.positions[index] = { ...this.positions[index], ...updates };
      await this.savePositions();
    }
  }

  async removePosition(id) {
    this.positions = this.positions.filter(p => p.id !== id);
    await this.savePositions();
  }

  getPositions() {
    return this.positions;
  }

  getOpenPositions() {
    return this.positions.filter(p => p.status === 'open');
  }

  // Trade methods
  async addTrade(trade) {
    this.trades.push(trade);
    await this.saveTrades();
  }

  getTrades(limit = 100) {
    return this.trades.slice(-limit);
  }

  // Stats methods
  async updateStats(updates) {
    this.stats = { ...this.stats, ...updates };
    await this.saveStats();
  }

  getStats() {
    return this.stats;
  }
}

module.exports = new DataStore();
