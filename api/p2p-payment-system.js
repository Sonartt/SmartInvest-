/**
 * P2P Payment System with Dynamic Transaction Costs
 * Transaction fees calculated as percentage of amount + flat fee
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const P2P_TRANSACTIONS_FILE = path.join(__dirname, '../data/p2p-transactions.json');
const USERS_FILE = path.join(__dirname, '../data/users.json');
const AFFILIATES_FILE = path.join(__dirname, '../data/affiliates.json');

// Platform configuration with tiered pricing
const PLATFORM_CONFIG = {
  platformNumber: process.env.PLATFORM_MPESA_NUMBER || '0114383762',
  currency: 'USD',
  // Tiered fee structure based on amount
  feeStructure: {
    tier1: { max: 10, flatFee: 0.50, percentFee: 0.05 },      // Up to $10: $0.50 + 5%
    tier2: { max: 50, flatFee: 1.00, percentFee: 0.04 },      // $10-$50: $1 + 4%
    tier3: { max: 100, flatFee: 2.00, percentFee: 0.03 },     // $50-$100: $2 + 3%
    tier4: { max: 500, flatFee: 3.00, percentFee: 0.025 },    // $100-$500: $3 + 2.5%
    tier5: { max: Infinity, flatFee: 5.00, percentFee: 0.02 } // $500+: $5 + 2%
  },
  exchangeRates: {
    'KES': 130.0,
    'USD': 1.0,
    'GHS': 12.0,
    'NGN': 750.0,
    'ZAR': 18.5
  }
};

class P2PPaymentSystem {
  constructor() {
    this.ensureDataFiles();
  }

  async ensureDataFiles() {
    try {
      await fs.access(P2P_TRANSACTIONS_FILE);
    } catch {
      await fs.writeFile(P2P_TRANSACTIONS_FILE, JSON.stringify({ transactions: [] }, null, 2));
    }
    try {
      await fs.access(AFFILIATES_FILE);
    } catch {
      await fs.writeFile(AFFILIATES_FILE, JSON.stringify({ affiliates: [] }, null, 2));
    }
  }

  /**
   * Calculate dynamic transaction fee based on amount
   */
  calculateTransactionFee(amount) {
    const { feeStructure } = PLATFORM_CONFIG;
    let tier;
    
    if (amount <= feeStructure.tier1.max) tier = feeStructure.tier1;
    else if (amount <= feeStructure.tier2.max) tier = feeStructure.tier2;
    else if (amount <= feeStructure.tier3.max) tier = feeStructure.tier3;
    else if (amount <= feeStructure.tier4.max) tier = feeStructure.tier4;
    else tier = feeStructure.tier5;
    
    const percentageFee = amount * tier.percentFee;
    const totalFee = tier.flatFee + percentageFee;
    
    return {
      flatFee: tier.flatFee,
      percentageFee: parseFloat(percentageFee.toFixed(2)),
      totalFee: parseFloat(totalFee.toFixed(2)),
      feeRate: `${(tier.percentFee * 100)}%`
    };
  }

  /**
   * Initiate P2P payment with dynamic transaction cost
   * @param {Object} params - Payment parameters
   * @returns {Object} Transaction result
   */
  async initiateP2PPayment(params) {
    const {
      senderPhone,
      senderEmail,
      recipientPhone,
      recipientEmail,
      amount,
      currency = 'USD',
      description = 'P2P Transfer',
      affiliateCode = null
    } = params;

    // Validate inputs
    if (!senderPhone || !recipientPhone || !amount) {
      throw new Error('Sender phone, recipient phone, and amount are required');
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw new Error('Invalid amount');
    }

    // Calculate dynamic transaction fee
    const feeDetails = this.calculateTransactionFee(numericAmount);
    const transactionFee = feeDetails.totalFee;
    const totalAmount = numericAmount + transactionFee;

    // Convert to local currency if needed
    const exchangeRate = PLATFORM_CONFIG.exchangeRates[currency] || 1.0;
    const localAmount = (totalAmount * exchangeRate).toFixed(2);
    const recipientAmount = (numericAmount * exchangeRate).toFixed(2);
    const feeInLocal = (transactionFee * exchangeRate).toFixed(2);

    // Generate transaction reference
    const transactionRef = `P2P-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Create transaction record
    const transaction = {
      id: crypto.randomUUID(),
      reference: transactionRef,
      type: 'p2p_transfer',
      status: 'pending',
      sender: {
        phone: senderPhone,
        email: senderEmail || 'N/A'
      },
      recipient: {
        phone: recipientPhone,
        email: recipientEmail || 'N/A'
      },
      amount: {
        base: numericAmount,
        fee: transactionFee,
        total: totalAmount,
        currency: 'USD'
      },
      localAmount: {
        base: recipientAmount,
        fee: feeInLocal,
        total: localAmount,
        currency: currency
      },
      platformFee: {
        amount: transactionFee,
        flatFee: feeDetails.flatFee,
        percentageFee: feeDetails.percentageFee,
        feeRate: feeDetails.feeRate,
        platformNumber: PLATFORM_CONFIG.platformNumber,
        currency: 'USD'
      },
      affiliateCode: affiliateCode,
      description: description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save transaction
    await this.saveTransaction(transaction);

    // If affiliate code provided, record commission
    if (affiliateCode) {
      await this.recordAffiliateCommission(affiliateCode, transaction);
    }

    return {
      success: true,
      transaction: {
        reference: transactionRef,
        totalAmount: localAmount,
        recipientAmount: recipientAmount,
        transactionFee: feeInLocal,
        currency: currency,
        platformNumber: PLATFORM_CONFIG.platformNumber
      },
      message: `Payment initiated. Total: ${localAmount} ${currency} (includes ${feeInLocal} ${currency} transaction fee)`
    };
  }

  /**
   * Complete P2P transaction after payment confirmation
   */
  async completeP2PTransaction(reference, mpesaReceiptNumber) {
    const transactions = await this.loadTransactions();
    const transaction = transactions.find(t => t.reference === reference);

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    transaction.status = 'completed';
    transaction.mpesaReceipt = mpesaReceiptNumber;
    transaction.completedAt = new Date().toISOString();
    transaction.updatedAt = new Date().toISOString();

    await this.saveAllTransactions(transactions);

    return {
      success: true,
      message: 'Transaction completed successfully',
      transaction
    };
  }

  /**
   * Get transaction history for a user
   */
  async getUserTransactions(phone, email = null) {
    const transactions = await this.loadTransactions();
    return transactions.filter(t => 
      t.sender.phone === phone || 
      t.recipient.phone === phone ||
      (email && (t.sender.email === email || t.recipient.email === email))
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Get all P2P transactions (admin)
   */
  async getAllTransactions(filters = {}) {
    const transactions = await this.loadTransactions();
    let filtered = [...transactions];

    if (filters.status) {
      filtered = filtered.filter(t => t.status === filters.status);
    }

    if (filters.fromDate) {
      filtered = filtered.filter(t => new Date(t.createdAt) >= new Date(filters.fromDate));
    }

    if (filters.toDate) {
      filtered = filtered.filter(t => new Date(t.createdAt) <= new Date(filters.toDate));
    }

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Get P2P transaction statistics
   */
  async getTransactionStats() {
    const transactions = await this.loadTransactions();
    const completed = transactions.filter(t => t.status === 'completed');

    const totalVolume = completed.reduce((sum, t) => sum + t.amount.base, 0);
    const totalFees = completed.reduce((sum, t) => sum + t.amount.fee, 0);
    const totalTransactions = completed.length;

    return {
      totalTransactions,
      totalVolume: totalVolume.toFixed(2),
      totalFeesCollected: totalFees.toFixed(2),
      pendingTransactions: transactions.filter(t => t.status === 'pending').length,
      failedTransactions: transactions.filter(t => t.status === 'failed').length,
      currency: 'USD'
    };
  }

  /**
   * Record affiliate commission
   */
  async recordAffiliateCommission(affiliateCode, transaction) {
    try {
      const affiliates = await this.loadAffiliates();
      const affiliate = affiliates.find(a => a.code === affiliateCode && a.status === 'active');

      if (!affiliate) {
        console.log(`Affiliate ${affiliateCode} not found or inactive`);
        return;
      }

      // Commission: 10% of the platform fee ($0.50 of $5)
      const commissionRate = 0.10;
      const commission = transaction.amount.fee * commissionRate;

      if (!affiliate.commissions) {
        affiliate.commissions = [];
      }

      affiliate.commissions.push({
        transactionRef: transaction.reference,
        amount: commission,
        currency: 'USD',
        earnedAt: new Date().toISOString(),
        status: 'pending'
      });

      affiliate.totalEarned = (affiliate.totalEarned || 0) + commission;
      affiliate.updatedAt = new Date().toISOString();

      await this.saveAllAffiliates(affiliates);
    } catch (error) {
      console.error('Error recording affiliate commission:', error);
    }
  }

  // Helper methods for data persistence
  async loadTransactions() {
    try {
      const data = await fs.readFile(P2P_TRANSACTIONS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      return parsed.transactions || [];
    } catch {
      return [];
    }
  }

  async saveTransaction(transaction) {
    const transactions = await this.loadTransactions();
    transactions.push(transaction);
    await fs.writeFile(P2P_TRANSACTIONS_FILE, JSON.stringify({ transactions }, null, 2));
  }

  async saveAllTransactions(transactions) {
    await fs.writeFile(P2P_TRANSACTIONS_FILE, JSON.stringify({ transactions }, null, 2));
  }

  async loadAffiliates() {
    try {
      const data = await fs.readFile(AFFILIATES_FILE, 'utf8');
      const parsed = JSON.parse(data);
      return parsed.affiliates || [];
    } catch {
      return [];
    }
  }

  async saveAllAffiliates(affiliates) {
    await fs.writeFile(AFFILIATES_FILE, JSON.stringify({ affiliates }, null, 2));
  }
}

module.exports = new P2PPaymentSystem();
