/**
 * Affiliate System with Premium Features
 * Affiliates earn commission on P2P transactions and get premium access
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const AFFILIATES_FILE = path.join(__dirname, '../data/affiliates.json');
const USERS_FILE = path.join(__dirname, '../data/users.json');

// Affiliate tiers and benefits
const AFFILIATE_TIERS = {
  bronze: {
    name: 'Bronze',
    commissionRate: 0.10, // 10% of platform fee
    minReferrals: 0,
    premiumAccess: true,
    features: ['P2P Commission', 'Premium Calculator Access', 'Basic Dashboard']
  },
  silver: {
    name: 'Silver',
    commissionRate: 0.15, // 15% of platform fee
    minReferrals: 10,
    premiumAccess: true,
    features: ['Higher Commission', 'Premium Calculator Access', 'Advanced Dashboard', 'Priority Support']
  },
  gold: {
    name: 'Gold',
    commissionRate: 0.20, // 20% of platform fee
    minReferrals: 50,
    premiumAccess: true,
    features: ['Highest Commission', 'Premium Calculator Access', 'Full Dashboard', 'API Access', 'Dedicated Support']
  }
};

class AffiliateSystem {
  constructor() {
    this.ensureDataFiles();
  }

  async ensureDataFiles() {
    try {
      await fs.access(AFFILIATES_FILE);
    } catch {
      await fs.writeFile(AFFILIATES_FILE, JSON.stringify({ affiliates: [] }, null, 2));
    }
  }

  /**
   * Register new affiliate
   */
  async registerAffiliate(params) {
    const {
      name,
      email,
      phone,
      country = 'Kenya',
      referredBy = null
    } = params;

    if (!name || !email || !phone) {
      throw new Error('Name, email, and phone are required');
    }

    const affiliates = await this.loadAffiliates();

    // Check if already registered
    const existing = affiliates.find(a => a.email === email || a.phone === phone);
    if (existing) {
      throw new Error('Affiliate already registered with this email or phone');
    }

    // Generate unique affiliate code
    const code = this.generateAffiliateCode(name);

    const affiliate = {
      id: crypto.randomUUID(),
      code: code,
      name: name,
      email: email,
      phone: phone,
      country: country,
      tier: 'bronze',
      status: 'active',
      referredBy: referredBy,
      referrals: [],
      commissions: [],
      totalEarned: 0,
      totalPaid: 0,
      withdrawalHistory: [],
      premiumAccess: true, // All affiliates get premium
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    affiliates.push(affiliate);
    await this.saveAllAffiliates(affiliates);

    // Grant premium access to user account if exists
    await this.grantPremiumAccess(email);

    return {
      success: true,
      affiliate: {
        code: affiliate.code,
        tier: affiliate.tier,
        commissionRate: AFFILIATE_TIERS[affiliate.tier].commissionRate,
        premiumAccess: true
      },
      message: 'Affiliate registration successful! Premium features unlocked.'
    };
  }

  /**
   * Get affiliate dashboard data
   */
  async getAffiliateDashboard(affiliateCode) {
    const affiliates = await this.loadAffiliates();
    const affiliate = affiliates.find(a => a.code === affiliateCode);

    if (!affiliate) {
      throw new Error('Affiliate not found');
    }

    const tier = AFFILIATE_TIERS[affiliate.tier];
    const pendingCommissions = affiliate.commissions.filter(c => c.status === 'pending');
    const paidCommissions = affiliate.commissions.filter(c => c.status === 'paid');

    const pendingAmount = pendingCommissions.reduce((sum, c) => sum + c.amount, 0);
    const availableForWithdrawal = affiliate.totalEarned - affiliate.totalPaid;

    return {
      success: true,
      dashboard: {
        affiliate: {
          code: affiliate.code,
          name: affiliate.name,
          email: affiliate.email,
          tier: affiliate.tier,
          status: affiliate.status
        },
        tier: {
          name: tier.name,
          commissionRate: `${(tier.commissionRate * 100)}%`,
          features: tier.features
        },
        earnings: {
          totalEarned: affiliate.totalEarned.toFixed(2),
          totalPaid: affiliate.totalPaid.toFixed(2),
          pending: pendingAmount.toFixed(2),
          availableForWithdrawal: availableForWithdrawal.toFixed(2),
          currency: 'USD'
        },
        referrals: {
          total: affiliate.referrals.length,
          active: affiliate.referrals.filter(r => r.status === 'active').length
        },
        transactions: {
          total: affiliate.commissions.length,
          pending: pendingCommissions.length,
          paid: paidCommissions.length
        },
        premiumAccess: affiliate.premiumAccess,
        joinedDate: affiliate.createdAt
      }
    };
  }

  /**
   * Get affiliate commissions history
   */
  async getCommissionsHistory(affiliateCode, limit = 50) {
    const affiliates = await this.loadAffiliates();
    const affiliate = affiliates.find(a => a.code === affiliateCode);

    if (!affiliate) {
      throw new Error('Affiliate not found');
    }

    const commissions = affiliate.commissions
      .sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))
      .slice(0, limit);

    return {
      success: true,
      commissions: commissions.map(c => ({
        transactionRef: c.transactionRef,
        amount: c.amount.toFixed(2),
        currency: c.currency,
        status: c.status,
        earnedAt: c.earnedAt,
        paidAt: c.paidAt || null
      }))
    };
  }

  /**
   * Request commission withdrawal
   */
  async requestWithdrawal(affiliateCode, amount, withdrawalMethod = 'mpesa') {
    const affiliates = await this.loadAffiliates();
    const affiliate = affiliates.find(a => a.code === affiliateCode);

    if (!affiliate) {
      throw new Error('Affiliate not found');
    }

    const availableAmount = affiliate.totalEarned - affiliate.totalPaid;
    const requestedAmount = parseFloat(amount);

    if (requestedAmount > availableAmount) {
      throw new Error(`Insufficient balance. Available: $${availableAmount.toFixed(2)}`);
    }

    if (requestedAmount < 10) {
      throw new Error('Minimum withdrawal amount is $10');
    }

    const withdrawal = {
      id: crypto.randomUUID(),
      amount: requestedAmount,
      method: withdrawalMethod,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      processedAt: null
    };

    if (!affiliate.withdrawalHistory) {
      affiliate.withdrawalHistory = [];
    }

    affiliate.withdrawalHistory.push(withdrawal);
    affiliate.updatedAt = new Date().toISOString();

    await this.saveAllAffiliates(affiliates);

    return {
      success: true,
      withdrawal: {
        id: withdrawal.id,
        amount: withdrawal.amount.toFixed(2),
        status: withdrawal.status,
        requestedAt: withdrawal.requestedAt
      },
      message: 'Withdrawal request submitted. Processing within 1-3 business days.'
    };
  }

  /**
   * Process withdrawal (admin only)
   */
  async processWithdrawal(affiliateCode, withdrawalId, status = 'paid') {
    const affiliates = await this.loadAffiliates();
    const affiliate = affiliates.find(a => a.code === affiliateCode);

    if (!affiliate) {
      throw new Error('Affiliate not found');
    }

    const withdrawal = affiliate.withdrawalHistory.find(w => w.id === withdrawalId);
    if (!withdrawal) {
      throw new Error('Withdrawal not found');
    }

    withdrawal.status = status;
    withdrawal.processedAt = new Date().toISOString();

    if (status === 'paid') {
      affiliate.totalPaid += withdrawal.amount;
    }

    affiliate.updatedAt = new Date().toISOString();
    await this.saveAllAffiliates(affiliates);

    return {
      success: true,
      message: `Withdrawal ${status}`,
      withdrawal
    };
  }

  /**
   * Get all affiliates (admin)
   */
  async getAllAffiliates(filters = {}) {
    const affiliates = await this.loadAffiliates();
    let filtered = [...affiliates];

    if (filters.tier) {
      filtered = filtered.filter(a => a.tier === filters.tier);
    }

    if (filters.status) {
      filtered = filtered.filter(a => a.status === filters.status);
    }

    return filtered.map(a => ({
      id: a.id,
      code: a.code,
      name: a.name,
      email: a.email,
      phone: a.phone,
      tier: a.tier,
      status: a.status,
      totalEarned: a.totalEarned.toFixed(2),
      totalPaid: a.totalPaid.toFixed(2),
      referralsCount: a.referrals.length,
      createdAt: a.createdAt
    }));
  }

  /**
   * Upgrade affiliate tier based on performance
   */
  async upgradeAffiliateTier(affiliateCode) {
    const affiliates = await this.loadAffiliates();
    const affiliate = affiliates.find(a => a.code === affiliateCode);

    if (!affiliate) {
      throw new Error('Affiliate not found');
    }

    const referralCount = affiliate.referrals.length;
    let newTier = affiliate.tier;

    if (referralCount >= 50 && affiliate.tier !== 'gold') {
      newTier = 'gold';
    } else if (referralCount >= 10 && affiliate.tier === 'bronze') {
      newTier = 'silver';
    }

    if (newTier !== affiliate.tier) {
      affiliate.tier = newTier;
      affiliate.updatedAt = new Date().toISOString();
      await this.saveAllAffiliates(affiliates);

      return {
        success: true,
        message: `Congratulations! Upgraded to ${AFFILIATE_TIERS[newTier].name} tier`,
        newTier: newTier,
        newCommissionRate: AFFILIATE_TIERS[newTier].commissionRate
      };
    }

    return {
      success: false,
      message: 'No tier upgrade available yet',
      currentTier: affiliate.tier,
      referralsNeeded: affiliate.tier === 'bronze' ? (10 - referralCount) : (50 - referralCount)
    };
  }

  // Helper methods
  generateAffiliateCode(name) {
    const prefix = name.substring(0, 3).toUpperCase();
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `${prefix}${random}`;
  }

  async grantPremiumAccess(email) {
    try {
      const usersData = await fs.readFile(USERS_FILE, 'utf8');
      const users = JSON.parse(usersData);
      
      const user = users.users?.find(u => u.email === email);
      if (user) {
        user.isPremium = true;
        user.premiumGrantedAt = new Date().toISOString();
        user.premiumReason = 'Affiliate Program';
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
      }
    } catch (error) {
      console.log('User file not found or error granting premium:', error.message);
    }
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

module.exports = new AffiliateSystem();
