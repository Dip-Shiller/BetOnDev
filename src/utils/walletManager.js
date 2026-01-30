const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const bs58 = require('bs58');
const config = require('../config');

class WalletManager {
  constructor() {
    this.connection = new Connection(config.solana.rpcUrl, 'confirmed');
    this.wallets = [];
    this.initWallets();
  }

  initWallets() {
    try {
      config.privateKeys.forEach((privateKey, index) => {
        const secretKey = bs58.decode(privateKey);
        const keypair = Keypair.fromSecretKey(secretKey);
        this.wallets.push({
          index,
          keypair,
          publicKey: keypair.publicKey.toString(),
        });
      });
      console.log(`Initialized ${this.wallets.length} trading wallets`);
    } catch (error) {
      console.error('Error initializing wallets - check your PRIVATE_KEYS configuration');
      throw error; // Fail fast if wallets cannot be initialized
    }
  }

  getWallets() {
    return this.wallets;
  }

  getWallet(index = 0) {
    return this.wallets[index] || null;
  }

  async getBalance(walletIndex = 0) {
    try {
      const wallet = this.getWallet(walletIndex);
      if (!wallet) return 0;
      
      const balance = await this.connection.getBalance(wallet.keypair.publicKey);
      return balance / 1e9; // Convert lamports to SOL
    } catch (error) {
      console.error('Error getting balance:', error);
      return 0;
    }
  }

  async getAllBalances() {
    const balances = [];
    for (let i = 0; i < this.wallets.length; i++) {
      const balance = await this.getBalance(i);
      balances.push({
        index: i,
        publicKey: this.wallets[i].publicKey,
        balance,
      });
    }
    return balances;
  }

  getConnection() {
    return this.connection;
  }
}

module.exports = new WalletManager();
