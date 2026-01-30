const config = require('../config');
const positionManager = require('./positionManager');
const jupiterService = require('./jupiterService');
const dataStore = require('../utils/dataStore');
const walletManager = require('../utils/walletManager');

class WebhookHandler {
  async handleHeliusWebhook(webhookData) {
    try {
      console.log('Received Helius webhook:', JSON.stringify(webhookData, null, 2));

      // Parse webhook data
      const transactions = webhookData[0]?.events?.nft?.nfts || [];
      const description = webhookData[0]?.description || '';
      const accountData = webhookData[0]?.accountData || [];

      // Check if this is a token buy from a whale wallet
      const fromAddress = webhookData[0]?.feePayer;
      
      if (!config.whaleWallets.includes(fromAddress)) {
        console.log('Transaction not from tracked whale wallet');
        return;
      }

      console.log(`Detected transaction from whale: ${fromAddress}`);

      // Extract token mint from transaction
      let tokenMint = null;
      let amount = 0;

      // Parse account data for SPL token transfers
      for (const account of accountData) {
        if (account.account && account.tokenBalanceChanges) {
          for (const change of account.tokenBalanceChanges) {
            if (change.rawTokenAmount && parseFloat(change.rawTokenAmount.tokenAmount) > 0) {
              tokenMint = change.mint;
              amount = parseFloat(change.rawTokenAmount.tokenAmount) / Math.pow(10, change.rawTokenAmount.decimals);
              break;
            }
          }
        }
      }

      if (!tokenMint) {
        console.log('Could not extract token mint from webhook');
        return;
      }

      console.log(`Whale bought token: ${tokenMint}, amount: ${amount}`);

      // Copy the trade for all our wallets
      await this.copyTrade(tokenMint, amount);

    } catch (error) {
      console.error('Error handling Helius webhook:', error);
    }
  }

  async copyTrade(tokenMint, referenceAmount) {
    try {
      const wallets = walletManager.getWallets();
      
      // Use a fixed SOL amount or percentage of balance
      const solAmountToBuy = 0.1; // 0.1 SOL per trade

      for (const wallet of wallets) {
        console.log(`Copying trade for wallet ${wallet.index}...`);

        // Execute buy
        const result = await jupiterService.buyToken(tokenMint, solAmountToBuy, wallet.index);

        if (result.success) {
          console.log(`Buy successful for wallet ${wallet.index}: ${result.txid}`);

          // Get entry price (SOL per token)
          const entryPrice = result.quote.inAmount / result.quote.outAmount;
          const tokenAmount = result.quote.outAmount;

          // Create position
          await positionManager.createPosition(
            tokenMint,
            entryPrice,
            tokenAmount,
            wallet.index
          );
        } else {
          console.error(`Buy failed for wallet ${wallet.index}:`, result.error);
        }
      }
    } catch (error) {
      console.error('Error copying trade:', error);
    }
  }
}

module.exports = new WebhookHandler();
