const { Telegraf } = require('telegraf');
const config = require('../config');
const dataStore = require('../utils/dataStore');
const positionManager = require('./positionManager');
const walletManager = require('../utils/walletManager');

class TelegramBot {
  constructor() {
    if (!config.telegram.botToken) {
      console.warn('Telegram bot token not configured');
      this.bot = null;
      return;
    }

    this.bot = new Telegraf(config.telegram.botToken);
    this.setupCommands();
  }

  setupCommands() {
    // /status - Show bot status
    this.bot.command('status', async (ctx) => {
      try {
        const stats = dataStore.getStats();
        const posStats = positionManager.getPositionStats();
        const uptime = Math.floor((Date.now() - stats.startTime) / 1000 / 60); // minutes

        const message = `
🤖 *BetOnDev Bot Status*

⏱️ Uptime: ${uptime} minutes
📊 Open Positions: ${posStats.open}
📈 Total Trades: ${stats.totalTrades}
✅ Successful: ${stats.successfulTrades}
❌ Failed: ${stats.failedTrades}
💰 Total PnL: ${stats.totalPnL.toFixed(4)} SOL
📍 Unrealized PnL: ${posStats.totalUnrealizedPnL.toFixed(4)} SOL
        `.trim();

        await ctx.reply(message, { parse_mode: 'Markdown' });
      } catch (error) {
        await ctx.reply('Error getting status: ' + error.message);
      }
    });

    // /positions - List all open positions
    this.bot.command('positions', async (ctx) => {
      try {
        const positions = dataStore.getOpenPositions();

        if (positions.length === 0) {
          await ctx.reply('No open positions');
          return;
        }

        let message = '📍 *Open Positions*\n\n';

        positions.forEach((pos, idx) => {
          const age = Math.floor((Date.now() - pos.entryTime) / 1000 / 60);
          message += `${idx + 1}. ${pos.tokenMint.substring(0, 8)}...\n`;
          message += `   Entry: ${pos.entryPrice.toFixed(8)} SOL\n`;
          message += `   Current: ${pos.currentPrice.toFixed(8)} SOL\n`;
          message += `   PnL: ${pos.pnlPercent.toFixed(2)}% (${pos.pnlAmount.toFixed(4)} SOL)\n`;
          message += `   Age: ${age}m\n`;
          message += `   ID: \`${pos.id}\`\n\n`;
        });

        await ctx.reply(message, { parse_mode: 'Markdown' });
      } catch (error) {
        await ctx.reply('Error getting positions: ' + error.message);
      }
    });

    // /sell <position_id> - Manually sell a position
    this.bot.command('sell', async (ctx) => {
      try {
        const args = ctx.message.text.split(' ');
        if (args.length < 2) {
          await ctx.reply('Usage: /sell <position_id>');
          return;
        }

        const positionId = args[1];
        await ctx.reply(`Selling position ${positionId}...`);

        const result = await positionManager.manualSell(positionId);

        if (result) {
          await ctx.reply(`✅ Position sold successfully`);
        } else {
          await ctx.reply(`❌ Failed to sell position`);
        }
      } catch (error) {
        await ctx.reply('Error selling position: ' + error.message);
      }
    });

    // /stats - Show detailed statistics
    this.bot.command('stats', async (ctx) => {
      try {
        const stats = dataStore.getStats();
        const trades = dataStore.getTrades(10); // Last 10 trades
        const balances = await walletManager.getAllBalances();

        let message = '📊 *Trading Statistics*\n\n';
        message += `Total Trades: ${stats.totalTrades}\n`;
        message += `Win Rate: ${stats.totalTrades > 0 ? ((stats.successfulTrades / stats.totalTrades) * 100).toFixed(2) : 0}%\n`;
        message += `Total PnL: ${stats.totalPnL.toFixed(4)} SOL\n\n`;

        message += '💼 *Wallet Balances*\n';
        balances.forEach((wallet, idx) => {
          message += `Wallet ${idx + 1}: ${wallet.balance.toFixed(4)} SOL\n`;
        });

        if (trades.length > 0) {
          message += '\n📜 *Recent Trades*\n';
          trades.slice(-5).forEach((trade, idx) => {
            message += `${idx + 1}. PnL: ${trade.pnlPercent.toFixed(2)}% | ${trade.exitReason}\n`;
          });
        }

        await ctx.reply(message, { parse_mode: 'Markdown' });
      } catch (error) {
        await ctx.reply('Error getting stats: ' + error.message);
      }
    });

    // Start command
    this.bot.command('start', async (ctx) => {
      const message = `
🤖 *Welcome to BetOnDev Copy Trading Bot*

Available commands:
/status - Bot status and summary
/positions - List open positions
/sell <id> - Manually sell a position
/stats - Detailed statistics

The bot automatically copies trades from whale wallets and manages positions with:
- 100% Take Profit
- 30% Stop Loss
- 20% Trailing Stop
- 60min Timeout
      `.trim();

      await ctx.reply(message, { parse_mode: 'Markdown' });
    });
  }

  async start() {
    if (!this.bot) {
      console.log('Telegram bot not configured, skipping...');
      return;
    }

    try {
      await this.bot.launch();
      console.log('Telegram bot started');
    } catch (error) {
      console.error('Error starting Telegram bot:', error);
    }
  }

  async sendNotification(message) {
    if (!this.bot || !config.telegram.chatId) {
      return;
    }

    try {
      await this.bot.telegram.sendMessage(config.telegram.chatId, message, {
        parse_mode: 'Markdown',
      });
    } catch (error) {
      console.error('Error sending Telegram notification:', error);
    }
  }

  stop() {
    if (this.bot) {
      this.bot.stop();
    }
  }
}

module.exports = new TelegramBot();
