const { Connection, PublicKey } = require('@solana/web3.js');
const walletManager = require('./walletManager');

// Cache for token decimals
const decimalsCache = new Map();

async function getTokenDecimals(mintAddress) {
  try {
    // Check cache first
    if (decimalsCache.has(mintAddress)) {
      return decimalsCache.get(mintAddress);
    }

    const connection = walletManager.getConnection();
    const mintPublicKey = new PublicKey(mintAddress);
    
    // Get mint info to find decimals
    const mintInfo = await connection.getParsedAccountInfo(mintPublicKey);
    
    if (mintInfo.value && mintInfo.value.data.parsed) {
      const decimals = mintInfo.value.data.parsed.info.decimals;
      decimalsCache.set(mintAddress, decimals);
      return decimals;
    }
    
    // Default to 9 if unable to fetch
    return 9;
  } catch (error) {
    console.error('Error getting token decimals:', error);
    // Default to 9 decimals for most SPL tokens
    return 9;
  }
}

function formatTokenAmount(amount, decimals) {
  return amount / Math.pow(10, decimals);
}

function parseTokenAmount(amount, decimals) {
  return Math.floor(amount * Math.pow(10, decimals));
}

module.exports = {
  getTokenDecimals,
  formatTokenAmount,
  parseTokenAmount,
};
