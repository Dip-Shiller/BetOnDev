# Quick Start Guide for BetOnDev

## Step 1: Prerequisites

Before you begin, ensure you have:

1. **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
2. **Solana Wallet(s)** with some SOL for trading
3. **Helius API Key** - [Get one free at Helius](https://dev.helius.xyz/)
4. **(Optional) Telegram Bot Token** - Create via [@BotFather](https://t.me/botfather)

## Step 2: Installation

```bash
# Clone the repository
git clone https://github.com/Dip-Shiller/BetOnDev.git
cd BetOnDev

# Install dependencies
npm install
```

## Step 3: Configuration

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your favorite editor
nano .env
```

### Required Configuration:

```env
# Your Helius API key
HELIUS_API_KEY=your_helius_api_key_here

# Whale wallets to track (comma-separated, no spaces)
WHALE_WALLETS=wallet_address_1,wallet_address_2

# Your trading wallet private keys (base58 encoded, comma-separated)
PRIVATE_KEYS=your_private_key_1,your_private_key_2
```

**⚠️ IMPORTANT:** 
- Never share your private keys
- Use test wallets first with small amounts
- Keep your `.env` file secure and never commit it

### Optional Configuration:

```env
# Telegram bot (optional)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Trading parameters (adjust as needed)
TAKE_PROFIT_PERCENT=100
STOP_LOSS_PERCENT=30
TRAILING_STOP_PERCENT=20
POSITION_TIMEOUT_MINUTES=60
COPY_TRADE_SOL_AMOUNT=0.1

# Webhook security (recommended)
WEBHOOK_SECRET=your_random_secret_string
```

## Step 4: Getting Your Private Key

Your private key needs to be in base58 format. Here's how to get it:

### From Phantom Wallet:
1. Open Phantom
2. Settings → Show Secret Recovery Phrase
3. Use a tool or script to convert to base58 (search "solana keypair to base58")

### From Solana CLI:
```bash
# If you have solana CLI installed
solana-keygen new --outfile ./my-wallet.json
# Then convert the JSON array to base58
```

## Step 5: Set Up Helius Webhook

1. Go to [Helius Dashboard](https://dev.helius.xyz/)
2. Create a new webhook
3. Set webhook type to **Enhanced Transaction**
4. Add your whale wallet addresses to track
5. Set webhook URL to: `https://your-domain.com/webhook/helius`
6. (Optional) Add your WEBHOOK_SECRET as a header for security

## Step 6: Start the Bot

```bash
# Production mode
npm start

# Development mode (auto-restart on changes)
npm run dev
```

You should see:
```
✅ Data store initialized
✅ Position manager started
✅ Telegram bot started
✅ Server running on port 3000
🎯 Bot is ready to copy trades!
```

## Step 7: Access the Dashboard

Open your browser and go to:
```
http://localhost:3000
```

You'll see:
- Real-time statistics
- Wallet balances
- Open positions
- Recent trades

## Step 8: Test the Bot

### Via Telegram (if configured):
```
/start - See available commands
/status - Check bot status
/positions - View open positions
/stats - See detailed statistics
```

### Via API:
```bash
# Check health
curl http://localhost:3000/health

# Get statistics
curl http://localhost:3000/api/stats

# Get positions
curl http://localhost:3000/api/positions
```

## Common Issues

### Bot won't start
- Check that all required environment variables are set
- Verify your private keys are valid base58 strings
- Ensure port 3000 is available

### No trades being copied
- Verify Helius webhook is configured correctly
- Check that webhook URL is accessible from the internet
- Confirm whale wallet addresses are correct
- Look at console logs for webhook events

### Trades failing
- Ensure wallets have enough SOL for trades
- Check Jupiter API is accessible
- Verify token liquidity is sufficient

## Deploying to Railway

1. Push your code to GitHub (without `.env` file!)
2. Create a new project in [Railway](https://railway.app)
3. Connect your GitHub repository
4. Add environment variables in Railway dashboard
5. Deploy!

Railway will automatically:
- Install dependencies
- Start the bot
- Provide a public URL for webhooks

## Security Checklist

- [ ] Private keys stored securely in `.env`
- [ ] `.env` added to `.gitignore`
- [ ] WEBHOOK_SECRET configured
- [ ] Using separate test wallets
- [ ] Started with small trade amounts
- [ ] Webhook URL uses HTTPS in production
- [ ] Telegram bot token kept private

## What's Next?

1. **Monitor Performance:** Keep an eye on the dashboard and Telegram notifications
2. **Adjust Parameters:** Fine-tune take-profit, stop-loss based on your strategy
3. **Scale Gradually:** Increase trade amounts as you gain confidence
4. **Add Wallets:** Scale horizontally by adding more trading wallets

## Need Help?

- Check the main [README.md](README.md) for detailed documentation
- Review console logs for error messages
- Open an issue on GitHub for bugs or questions

---

**Happy Trading! 🚀**

Remember: This bot trades automatically. Always start small and never invest more than you can afford to lose.