const axios = require('axios');
const { VersionedTransaction } = require('@solana/web3.js');
const config = require('../config');
const walletManager = require('../utils/walletManager');

class JupiterService {
  constructor() {
    this.apiUrl = config.jupiter.apiUrl;
  }

  async getQuote(inputMint, outputMint, amount, slippageBps = 50) {
    try {
      const params = {
        inputMint,
        outputMint,
        amount: Math.floor(amount),
        slippageBps,
      };

      const response = await axios.get(`${this.apiUrl}/quote`, { params });
      return response.data;
    } catch (error) {
      console.error('Error getting Jupiter quote:', error.message);
      throw error;
    }
  }

  async getSwapTransaction(quoteResponse, userPublicKey) {
    try {
      const response = await axios.post(`${this.apiUrl}/swap`, {
        quoteResponse,
        userPublicKey,
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: 'auto',
      });

      return response.data;
    } catch (error) {
      console.error('Error getting swap transaction:', error.message);
      throw error;
    }
  }

  async executeSwap(inputMint, outputMint, amount, walletIndex = 0) {
    try {
      const wallet = walletManager.getWallet(walletIndex);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      console.log(`Getting quote for swap: ${amount} from ${inputMint} to ${outputMint}`);
      const quote = await this.getQuote(inputMint, outputMint, amount);

      console.log('Getting swap transaction...');
      const swapData = await this.getSwapTransaction(quote, wallet.publicKey);

      // Deserialize the transaction
      const swapTransactionBuf = Buffer.from(swapData.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

      // Sign the transaction
      transaction.sign([wallet.keypair]);

      // Send and confirm transaction
      const connection = walletManager.getConnection();
      const rawTransaction = transaction.serialize();
      const txid = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
        maxRetries: 2,
      });

      console.log('Transaction sent:', txid);

      // Wait for confirmation
      const latestBlockHash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: txid,
      });

      console.log('Transaction confirmed:', txid);

      return {
        success: true,
        txid,
        inputAmount: quote.inAmount,
        outputAmount: quote.outAmount,
        quote,
      };
    } catch (error) {
      console.error('Error executing swap:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async buyToken(tokenMint, solAmount, walletIndex = 0) {
    const SOL_MINT = 'So11111111111111111111111111111111111111112';
    const amountInLamports = Math.floor(solAmount * 1e9);
    return this.executeSwap(SOL_MINT, tokenMint, amountInLamports, walletIndex);
  }

  async sellToken(tokenMint, tokenAmount, walletIndex = 0) {
    const SOL_MINT = 'So11111111111111111111111111111111111111112';
    return this.executeSwap(tokenMint, SOL_MINT, tokenAmount, walletIndex);
  }
}

module.exports = new JupiterService();
