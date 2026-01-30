const config = require('../config');
const positionManager = require('./positionManager');
const jupiterService = require('./jupiterService');
const dataStore = require('../utils/dataStore');
const walletManager = require('../utils/walletManager');

class WebhookHandler {
  async handleHeliusWebhook(webhookData) {
    try {
      console.log('Received Helius webhook');

      // Helius Enhanced Transaction webhook structure
      if (!Array.isArray(webhookData) || webhookData.length === 0) {
        console.log('Invalid webhook data structure');
        return;
      }

      const transaction = webhookData[0];
      const fromAddress = transaction.feePayer;
      
      if (!config.whaleWallets.includes(fromAddress)) {
        console.log('Transaction not from tracked whale wallet');
        return;
      }

      console.log(`Detected transaction from whale: ${fromAddress}`);

      // Extract token mint and amount from tokenTransfers or accountData
      let tokenMint = null;
      let amount = 0;

      // Try to extract from tokenTransfers first (more reliable)
      if (transaction.tokenTransfers && transaction.tokenTransfers.length > 0) {
        for (const transfer of transaction.tokenTransfers) {
          // Look for incoming transfers to the whale (buys)
          if (transfer.toUserAccount === fromAddress && transfer.tokenAmount > 0) {
            tokenMint = transfer.mint;
            amount = transfer.tokenAmount;
            break;
          }
        }
      }

      // Fallback to accountData if tokenTransfers not available
      if (!tokenMint && transaction.accountData) {
        for (const account of transaction.accountData) {
          if (account.tokenBalanceChanges) {
            for (const change of account.tokenBalanceChanges) {
              if (change.userAccount === fromAddress && parseFloat(change.tokenAmount) > 0) {
                tokenMint = change.mint;
                amount = parseFloat(change.tokenAmount);
                break;
              }
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
      
      // Use configured SOL amount for copying trades
      const solAmountToBuy = config.trading.copyTradeAmount;

      for (const wallet of wallets) {
        console.log(`Copying trade for wallet ${wallet.index}...`);

        // Execute buy
        const result = await jupiterService.buyToken(tokenMint, solAmountToBuy, wallet.index);

        if (result.success) {
          console.log(`Buy successful for wallet ${wallet.index}: ${result.txid}`);

          // Calculate entry price (SOL per token with decimals)
          const entryPrice = parseFloat(result.quote.inAmount) / parseFloat(result.quote.outAmount);
          const tokenAmount = parseFloat(result.quote.outAmount);

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
