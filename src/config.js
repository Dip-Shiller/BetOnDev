require('dotenv').config();

module.exports = {
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    heliusApiKey: process.env.HELIUS_API_KEY,
  },
  whaleWallets: (process.env.WHALE_WALLETS || '').split(',').filter(Boolean),
  privateKeys: (process.env.PRIVATE_KEYS || '').split(',').filter(Boolean),
  trading: {
    takeProfitPercent: parseFloat(process.env.TAKE_PROFIT_PERCENT || '100'),
    stopLossPercent: parseFloat(process.env.STOP_LOSS_PERCENT || '30'),
    trailingStopPercent: parseFloat(process.env.TRAILING_STOP_PERCENT || '20'),
    positionTimeoutMinutes: parseInt(process.env.POSITION_TIMEOUT_MINUTES || '60', 10),
    priceCheckIntervalSeconds: parseInt(process.env.PRICE_CHECK_INTERVAL_SECONDS || '10', 10),
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    webDashboardPort: parseInt(process.env.WEB_DASHBOARD_PORT || '3001', 10),
  },
  jupiter: {
    apiUrl: process.env.JUPITER_API_URL || 'https://quote-api.jup.ag/v6',
  },
};
