# 🎯 BetOnDev - Solana Wallet Tracker

A beginner-friendly Solana wallet tracker with DexScreener-like UI. Track whale wallets, copy trades with one click, and monitor performance in real-time. Features big green/red PNL cards, wallet leaderboards, and instant wallet search - all in a clean, mobile-first interface.

## 🌟 Features

### 📊 DexScreener-Like Interface
- **One-Click Copy Trading**: Search any wallet and start copying instantly
- **Big PNL Cards**: Green/red cards show profits/losses at a glance
- **Wallet Search**: Instant stats for any Solana wallet address
- **Leaderboard**: Top performers ranked by win rate and profit
- **Live Updates**: Real-time WebSocket data streaming
- **Mobile-First Design**: Optimized for all screen sizes

### 🎯 Wallet Tracking
- Monitor multiple whale wallets simultaneously
- Track performance metrics (PNL, win rate, total trades)
- Instant wallet stats on search
- Add/remove wallets from tracking list
- Performance history and analytics

### 💹 Trading Engine
- **Whale Tracking**: Monitor via Helius webhooks
- **Auto-Copy Trading**: Instantly copy detected trades
- **Multi-Wallet Support**: Trade with multiple wallets
- **Smart Position Management**:
  - 100% Take-Profit target
  - 30% Stop-Loss protection
  - 20% Trailing Stop from peak
  - 60-minute timeout exit
  - Price checks every 10 seconds

### 🤖 Monitoring & Control
- **Web Dashboard**: Beautiful real-time interface
  - Search any wallet instantly
  - Big green/red PNL cards for quick scanning
  - Wallet leaderboard (top performers)
  - Token holdings view
  - Trade history timeline
  - Large BUY/SELL/COPY buttons
  - Live WebSocket updates
  - Mobile-responsive design
  
- **Telegram Bot**: Real-time control and notifications
  - `/status` - View bot status and summary
  - `/positions` - List all open positions
  - `/sell <id>` - Manually close a position
  - `/stats` - Detailed trading statistics

### Data & Persistence
- JSON file-based persistence
- Trade history tracking
- Performance statistics
- No database required

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- Solana wallet(s) with SOL
- Helius API key
- Telegram Bot Token (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Dip-Shiller/BetOnDev.git
cd BetOnDev
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
```

Edit `.env` with your settings:
```env
# Solana Configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
HELIUS_API_KEY=your_helius_api_key_here

# Whale Wallets to Track (comma-separated)
WHALE_WALLETS=wallet1,wallet2,wallet3

# Your Private Keys (comma-separated, base58 encoded)
PRIVATE_KEYS=your_private_key_1,your_private_key_2

# Trading Configuration
TAKE_PROFIT_PERCENT=100
STOP_LOSS_PERCENT=30
TRAILING_STOP_PERCENT=20
POSITION_TIMEOUT_MINUTES=60
PRICE_CHECK_INTERVAL_SECONDS=10
COPY_TRADE_SOL_AMOUNT=0.1

# Telegram Bot (Optional)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

# Server Configuration
PORT=3000

# Webhook Security (recommended)
WEBHOOK_SECRET=your_random_secret_string
```

4. Start the tracker:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## 🌐 Dashboard

Access the web dashboard at `http://localhost:3000`

The dashboard provides:
- **Instant Wallet Search**: Look up any Solana wallet
- **Big PNL Cards**: See profits/losses at a glance (green for profit, red for loss)
- **Leaderboard**: Top tracked wallets ranked by performance
- **Live Position Tracking**: Real-time updates via WebSocket
- **Trade History Timeline**: Complete trading history
- **One-Click Actions**: Copy trades or track wallets instantly
- **Mobile-First Design**: Perfect on any device

## 🤖 Telegram Bot Setup

1. Create a bot via [@BotFather](https://t.me/botfather)
2. Get your bot token
3. Find your chat ID (send a message to your bot, then visit `https://api.telegram.org/bot<TOKEN>/getUpdates`)
4. Add both values to `.env`

## 🔗 Helius Webhook Setup

1. Create a webhook at [Helius Dashboard](https://dev.helius.xyz/)
2. Set webhook URL to: `https://your-domain.com/webhook/helius`
3. Configure to track your whale wallets
4. Select "Enhanced Transaction" webhook type

## 🏗️ Project Structure

```
BetOnDev/
├── src/
│   ├── config.js                 # Configuration loader
│   ├── index.js                  # Main application entry
│   ├── services/
│   │   ├── jupiterService.js     # Jupiter swap integration
│   │   ├── positionManager.js    # Position tracking & auto-sell
│   │   ├── telegramBot.js        # Telegram bot commands
│   │   ├── webhookHandler.js     # Helius webhook processing
│   │   └── websocketServer.js    # WebSocket for dashboard
│   ├── utils/
│   │   ├── dataStore.js          # JSON persistence
│   │   └── walletManager.js      # Wallet management
│   └── routes/
│       └── api.js                # REST API endpoints
├── public/
│   └── index.html                # Web dashboard
├── data/                         # JSON data storage
├── package.json
└── .env.example
```

## 📝 API Endpoints

### Core Endpoints
- `GET /health` - Health check
- `GET /api/stats` - Trading statistics
- `GET /api/positions` - Get all positions
- `GET /api/positions/open` - Get open positions
- `POST /api/positions/:id/sell` - Manually sell position
- `GET /api/trades` - Get trade history
- `GET /api/balances` - Get wallet balances

### Wallet Tracking Endpoints
- `GET /api/leaderboard` - Get top performing wallets
- `GET /api/wallet/:address` - Get wallet stats
- `POST /api/wallet/:address/track` - Add wallet to tracking
- `DELETE /api/wallet/:address/track` - Remove from tracking
- `GET /api/tracked-wallets` - Get all tracked wallets

### Webhook
- `POST /webhook/helius` - Helius webhook receiver

## 🚂 Railway Deployment

1. Push to GitHub
2. Connect repository to Railway
3. Add environment variables in Railway dashboard
4. Deploy automatically

Railway configuration is included in `railway.json`.

## ⚠️ Important Notes

### Security
- **Never commit your `.env` file or expose private keys**
- Keep private keys secure and use separate wallets for trading
- Set `WEBHOOK_SECRET` to verify webhook authenticity
- Start with small amounts for testing
- The bot does not validate whale wallet addresses - ensure they are correct

### Known Limitations
- **Token Decimals**: Price calculations assume standard token decimals. Some tokens with non-standard decimals may show approximate prices.
- **Webhook Format**: Designed for Helius Enhanced Transaction webhooks. Other formats may need adjustment.
- **Rate Limits**: Jupiter API and RPC endpoints have rate limits. Monitor usage accordingly.
- **No Database**: Uses JSON file storage. For high-volume trading, consider a database.

### Risk Management
- This bot trades automatically based on whale activity
- Test thoroughly on devnet before using real funds
- Monitor positions regularly
- Start with conservative risk parameters
- Consider implementing additional risk controls for production use

## 🛠️ Development

Run in development mode:
```bash
npm run dev
```

The bot will automatically restart on file changes.

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a PR.

## ⚡ Performance Tips

1. **RPC Endpoint**: Use a dedicated RPC for better performance
2. **Helius**: Use Helius RPC for fastest transaction detection
3. **Multiple Wallets**: Distribute trades across wallets
4. **Price Checks**: Adjust interval based on token volatility

## 🐛 Troubleshooting

**Bot not copying trades?**
- Check Helius webhook configuration
- Verify whale wallets are correct
- Check webhook endpoint is accessible

**Positions not auto-selling?**
- Ensure PositionManager is running
- Check price check interval
- Verify Jupiter API access

**WebSocket not connecting?**
- Check firewall settings
- Ensure port is accessible
- Try different browser

## 📞 Support

For issues and questions, please open a GitHub issue.

---

**Disclaimer**: Trading cryptocurrencies carries risk. This bot is provided as-is with no guarantees. Use at your own risk.
