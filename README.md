# 🎯 BetOnDev - Solana Copy Trading Bot

A sophisticated automated trading bot that monitors whale wallets on Solana and automatically copies their trades using Jupiter aggregator. Features intelligent position management with take-profit, stop-loss, trailing stops, and timeout mechanisms.

## 🌟 Features

### Trading Engine
- **Whale Tracking**: Monitor multiple whale wallets via Helius webhooks
- **Auto-Copy Trading**: Instantly copy detected trades via Jupiter API
- **Multi-Wallet Support**: Trade with multiple wallets simultaneously
- **Smart Position Management**:
  - 100% Take-Profit target
  - 30% Stop-Loss protection
  - 20% Trailing Stop from peak
  - 60-minute timeout exit
  - Price checks every 10 seconds

### Monitoring & Control
- **Telegram Bot**: Real-time control and notifications
  - `/status` - View bot status and summary
  - `/positions` - List all open positions
  - `/sell <id>` - Manually close a position
  - `/stats` - Detailed trading statistics

- **Web Dashboard**: Beautiful real-time interface
  - Live PnL tracking with WebSocket updates
  - Wallet balance monitoring
  - Open positions overview
  - Trade history
  - Interactive controls

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

# Telegram Bot (Optional)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

# Server Configuration
PORT=3000
```

4. Start the bot:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## 📊 Dashboard

Access the web dashboard at `http://localhost:3000`

The dashboard provides:
- Real-time position tracking
- Live PnL updates via WebSocket
- Wallet balance monitoring
- Trade history
- Performance metrics
- Manual position control

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

## 🌐 API Endpoints

- `GET /health` - Health check
- `POST /webhook/helius` - Helius webhook receiver
- `GET /api/positions` - Get all positions
- `GET /api/positions/open` - Get open positions
- `POST /api/positions/:id/sell` - Manually sell position
- `GET /api/trades` - Get trade history
- `GET /api/stats` - Get trading statistics
- `GET /api/balances` - Get wallet balances

## 🚂 Railway Deployment

1. Push to GitHub
2. Connect repository to Railway
3. Add environment variables in Railway dashboard
4. Deploy automatically

Railway configuration is included in `railway.json`.

## ⚠️ Important Notes

### Security
- **Never commit your `.env` file**
- Keep private keys secure
- Use separate wallets for trading
- Start with small amounts

### Risk Management
- This bot trades automatically
- Test thoroughly on devnet first
- Monitor positions regularly
- Adjust risk parameters as needed

### Rate Limits
- Jupiter API has rate limits
- Price checks are cached for 5 seconds
- Adjust `PRICE_CHECK_INTERVAL_SECONDS` if needed

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
