const config = require('../config');
const dataStore = require('../utils/dataStore');
const jupiterService = require('./jupiterService');
const axios = require('axios');

class PositionManager {
  constructor() {
    this.checkInterval = null;
    this.priceCache = new Map();
  }

  start() {
    console.log('Starting PositionManager...');
    this.checkInterval = setInterval(
      () => this.checkPositions(),
      config.trading.priceCheckIntervalSeconds * 1000
    );
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  generateId() {
    // Use timestamp + counter for guaranteed uniqueness
    if (!this.idCounter) this.idCounter = 0;
    this.idCounter = (this.idCounter + 1) % 10000;
    return `pos_${Date.now()}_${this.idCounter.toString().padStart(4, '0')}`;
  }

  async createPosition(tokenMint, entryPrice, amount, walletIndex) {
    const position = {
      id: this.generateId(),
      tokenMint,
      entryPrice,
      amount,
      walletIndex,
      status: 'open',
      entryTime: Date.now(),
      highestPrice: entryPrice,
      currentPrice: entryPrice,
      pnlPercent: 0,
      pnlAmount: 0,
    };

    dataStore.addPosition(position);
    console.log(`Created position ${position.id} for token ${tokenMint}`);
    return position;
  }

  async getTokenPrice(tokenMint) {
    try {
      // Cache prices for 5 seconds to avoid rate limiting
      const cached = this.priceCache.get(tokenMint);
      if (cached && Date.now() - cached.timestamp < 5000) {
        return cached.price;
      }

      // Get price from Jupiter by attempting to swap a standard amount
      // Note: Uses 1e6 (1 token with 6 decimals) as a standard. For tokens with different
      // decimals, this provides an approximate price. For production use, consider
      // fetching actual token decimals from the mint account.
      const SOL_MINT = 'So11111111111111111111111111111111111111112';
      const quote = await jupiterService.getQuote(tokenMint, SOL_MINT, 1e6);
      
      const price = parseFloat(quote.outAmount) / 1e9; // Convert to SOL
      this.priceCache.set(tokenMint, { price, timestamp: Date.now() });
      
      return price;
    } catch (error) {
      console.error(`Error getting price for ${tokenMint}:`, error.message);
      return null;
    }
  }

  async checkPositions() {
    const openPositions = dataStore.getOpenPositions();
    
    if (openPositions.length === 0) {
      return;
    }

    console.log(`Checking ${openPositions.length} open positions...`);

    for (const position of openPositions) {
      await this.checkPosition(position);
    }
  }

  async checkPosition(position) {
    try {
      const currentPrice = await this.getTokenPrice(position.tokenMint);
      
      if (!currentPrice) {
        return;
      }

      // Update position data
      const pnlPercent = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;
      const pnlAmount = (currentPrice - position.entryPrice) * position.amount;
      
      // Update highest price for trailing stop
      const highestPrice = Math.max(position.highestPrice, currentPrice);
      
      dataStore.updatePosition(position.id, {
        currentPrice,
        highestPrice,
        pnlPercent,
        pnlAmount,
      });

      // Check exit conditions
      const shouldExit = this.shouldExitPosition(position, currentPrice, highestPrice);
      
      if (shouldExit.exit) {
        await this.exitPosition(position, shouldExit.reason);
      }
    } catch (error) {
      console.error(`Error checking position ${position.id}:`, error);
    }
  }

  shouldExitPosition(position, currentPrice, highestPrice) {
    const entryTime = position.entryTime;
    const elapsedMinutes = (Date.now() - entryTime) / (1000 * 60);
    
    // Calculate PnL percentage
    const pnlPercent = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;
    
    // Check take profit (100%)
    if (pnlPercent >= config.trading.takeProfitPercent) {
      return { exit: true, reason: 'take_profit' };
    }
    
    // Check stop loss (30%)
    if (pnlPercent <= -config.trading.stopLossPercent) {
      return { exit: true, reason: 'stop_loss' };
    }
    
    // Check trailing stop (20% from highest)
    const dropFromHigh = ((highestPrice - currentPrice) / highestPrice) * 100;
    if (dropFromHigh >= config.trading.trailingStopPercent) {
      return { exit: true, reason: 'trailing_stop' };
    }
    
    // Check timeout (60 minutes)
    if (elapsedMinutes >= config.trading.positionTimeoutMinutes) {
      return { exit: true, reason: 'timeout' };
    }
    
    return { exit: false };
  }

  async exitPosition(position, reason) {
    try {
      console.log(`Exiting position ${position.id} - Reason: ${reason}`);
      
      // Execute sell via Jupiter
      const result = await jupiterService.sellToken(
        position.tokenMint,
        position.amount,
        position.walletIndex
      );

      if (result.success) {
        const exitPrice = position.currentPrice || position.entryPrice;
        const pnlPercent = ((exitPrice - position.entryPrice) / position.entryPrice) * 100;
        const pnlAmount = (exitPrice - position.entryPrice) * position.amount;

        // Update position as closed
        dataStore.updatePosition(position.id, {
          status: 'closed',
          exitPrice,
          exitTime: Date.now(),
          exitReason: reason,
          txid: result.txid,
        });

        // Record trade
        dataStore.addTrade({
          id: position.id,
          tokenMint: position.tokenMint,
          entryPrice: position.entryPrice,
          exitPrice,
          amount: position.amount,
          pnlPercent,
          pnlAmount,
          exitReason: reason,
          entryTime: position.entryTime,
          exitTime: Date.now(),
          txid: result.txid,
        });

        // Update stats
        const stats = dataStore.getStats();
        dataStore.updateStats({
          totalTrades: stats.totalTrades + 1,
          successfulTrades: pnlAmount > 0 ? stats.successfulTrades + 1 : stats.successfulTrades,
          failedTrades: pnlAmount <= 0 ? stats.failedTrades + 1 : stats.failedTrades,
          totalPnL: stats.totalPnL + pnlAmount,
        });

        // Remove from open positions
        dataStore.removePosition(position.id);

        console.log(`Position ${position.id} closed. PnL: ${pnlPercent.toFixed(2)}%`);
        return true;
      } else {
        console.error(`Failed to exit position ${position.id}:`, result.error);
        return false;
      }
    } catch (error) {
      console.error(`Error exiting position ${position.id}:`, error);
      return false;
    }
  }

  async manualSell(positionId) {
    const position = dataStore.getPositions().find(p => p.id === positionId);
    if (!position) {
      throw new Error('Position not found');
    }
    if (position.status !== 'open') {
      throw new Error('Position is not open');
    }
    return this.exitPosition(position, 'manual');
  }

  getPositionStats() {
    const positions = dataStore.getPositions();
    const openPositions = positions.filter(p => p.status === 'open');
    
    let totalPnL = 0;
    openPositions.forEach(p => {
      totalPnL += p.pnlAmount || 0;
    });

    return {
      total: positions.length,
      open: openPositions.length,
      closed: positions.length - openPositions.length,
      totalUnrealizedPnL: totalPnL,
    };
  }
}

module.exports = new PositionManager();
