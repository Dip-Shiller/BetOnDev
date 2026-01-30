const dataStore = require('../utils/dataStore');
const walletManager = require('../utils/walletManager');

class WalletTrackerService {
  constructor() {
    this.trackedWallets = new Map(); // address -> wallet data
    this.walletPerformance = new Map(); // address -> performance metrics
  }

  async init() {
    // Load tracked wallets from data store
    const saved = await dataStore.getTrackedWallets();
    if (saved) {
      saved.forEach(wallet => {
        this.trackedWallets.set(wallet.address, wallet);
      });
    }
  }

  trackWallet(address, metadata = {}) {
    if (!this.trackedWallets.has(address)) {
      const wallet = {
        address,
        addedAt: Date.now(),
        trades: [],
        totalPnL: 0,
        winRate: 0,
        totalTrades: 0,
        successfulTrades: 0,
        ...metadata
      };
      this.trackedWallets.set(address, wallet);
      this.saveTrackedWallets();
      return wallet;
    }
    return this.trackedWallets.get(address);
  }

  untrackWallet(address) {
    const removed = this.trackedWallets.delete(address);
    if (removed) {
      this.saveTrackedWallets();
    }
    return removed;
  }

  getTrackedWallets() {
    return Array.from(this.trackedWallets.values());
  }

  getWallet(address) {
    return this.trackedWallets.get(address);
  }

  updateWalletPerformance(address, trade) {
    const wallet = this.trackedWallets.get(address);
    if (!wallet) return;

    wallet.trades.push(trade);
    wallet.totalTrades++;
    if (trade.pnlAmount > 0) {
      wallet.successfulTrades++;
    }
    wallet.totalPnL += trade.pnlAmount;
    wallet.winRate = (wallet.successfulTrades / wallet.totalTrades) * 100;
    wallet.lastTradeAt = Date.now();

    this.trackedWallets.set(address, wallet);
    this.saveTrackedWallets();
  }

  getLeaderboard(sortBy = 'pnl', limit = 50) {
    const wallets = this.getTrackedWallets();
    
    // Sort based on criteria
    wallets.sort((a, b) => {
      if (sortBy === 'pnl') {
        return (b.totalPnL || 0) - (a.totalPnL || 0);
      } else if (sortBy === 'winRate') {
        return (b.winRate || 0) - (a.winRate || 0);
      } else if (sortBy === 'trades') {
        return (b.totalTrades || 0) - (a.totalTrades || 0);
      }
      return 0;
    });

    return wallets.slice(0, limit).map((wallet, index) => ({
      rank: index + 1,
      address: wallet.address,
      totalPnL: wallet.totalPnL,
      winRate: wallet.winRate,
      totalTrades: wallet.totalTrades,
      pnl: wallet.winRate, // for display
    }));
  }

  async getWalletStats(address) {
    const wallet = this.trackedWallets.get(address);
    if (!wallet) {
      // Try to fetch from on-chain if not tracked
      return this.fetchWalletStats(address);
    }

    return {
      address: wallet.address,
      totalPnL: wallet.totalPnL || 0,
      winRate: wallet.winRate || 0,
      totalTrades: wallet.totalTrades || 0,
      successfulTrades: wallet.successfulTrades || 0,
      trades: wallet.trades || [],
      performance: this.calculatePerformanceHistory(wallet.trades),
    };
  }

  async fetchWalletStats(address) {
    // For now, return empty stats for untracked wallets
    // In production, this could fetch from blockchain
    return {
      address,
      totalPnL: 0,
      winRate: 0,
      totalTrades: 0,
      successfulTrades: 0,
      trades: [],
      performance: [],
    };
  }

  calculatePerformanceHistory(trades) {
    if (!trades || trades.length === 0) return [];
    
    let cumulative = 0;
    return trades.map(trade => {
      cumulative += trade.pnlAmount || 0;
      return {
        timestamp: trade.exitTime || trade.timestamp,
        pnl: cumulative,
      };
    });
  }

  async saveTrackedWallets() {
    const wallets = this.getTrackedWallets();
    await dataStore.saveTrackedWallets(wallets);
  }

  getStats() {
    const wallets = this.getTrackedWallets();
    const totalWallets = wallets.length;
    const totalTrades = wallets.reduce((sum, w) => sum + (w.totalTrades || 0), 0);
    const avgWinRate = wallets.length > 0 
      ? wallets.reduce((sum, w) => sum + (w.winRate || 0), 0) / wallets.length 
      : 0;

    return {
      trackedWallets: totalWallets,
      totalTrades,
      averageWinRate: avgWinRate,
    };
  }
}

module.exports = new WalletTrackerService();
