/**
 * Ads Payment System - Live Transaction Processing
 * Users pay to display ads on SmartInvest platform
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const ADS_FILE = path.join(__dirname, '../data/ads.json');
const AD_PAYMENTS_FILE = path.join(__dirname, '../data/ad-payments.json');

// Ads pricing configuration
const ADS_CONFIG = {
  platformNumber: process.env.PLATFORM_MPESA_NUMBER || '0114383762',
  packages: {
    banner: {
      name: 'Banner Ad',
      positions: ['top', 'bottom', 'sidebar'],
      pricing: {
        day: 5,
        week: 30,
        month: 100,
        quarter: 250,
        year: 900
      },
      dimensions: '728x90 or 300x250',
      impressionsEstimate: {
        day: 500,
        week: 3500,
        month: 15000,
        quarter: 45000,
        year: 180000
      }
    },
    featured: {
      name: 'Featured Listing',
      positions: ['homepage', 'category'],
      pricing: {
        day: 10,
        week: 60,
        month: 200,
        quarter: 500,
        year: 1800
      },
      features: ['Top placement', 'Highlighted border', 'Priority display']
    },
    popup: {
      name: 'Popup Ad',
      positions: ['entry', 'exit'],
      pricing: {
        day: 15,
        week: 90,
        month: 300,
        quarter: 750,
        year: 2500
      },
      frequency: 'Once per session',
      dimensions: '600x400'
    },
    sponsored: {
      name: 'Sponsored Content',
      positions: ['blog', 'insights', 'tools'],
      pricing: {
        week: 100,
        month: 350,
        quarter: 900,
        year: 3000
      },
      features: ['Full article', 'Author byline', 'Social sharing']
    },
    video: {
      name: 'Video Ad',
      positions: ['pre-roll', 'mid-roll'],
      pricing: {
        day: 20,
        week: 120,
        month: 400,
        quarter: 1000,
        year: 3500
      },
      duration: 'Up to 30 seconds',
      format: 'MP4, WebM'
    }
  },
  exchangeRates: {
    'KES': 130.0,
    'USD': 1.0,
    'GHS': 12.0,
    'NGN': 750.0,
    'ZAR': 18.5
  }
};

class AdsPaymentSystem {
  constructor() {
    this.ensureDataFiles();
  }

  async ensureDataFiles() {
    try {
      await fs.access(ADS_FILE);
    } catch {
      await fs.writeFile(ADS_FILE, JSON.stringify({ ads: [] }, null, 2));
    }
    try {
      await fs.access(AD_PAYMENTS_FILE);
    } catch {
      await fs.writeFile(AD_PAYMENTS_FILE, JSON.stringify({ payments: [] }, null, 2));
    }
  }

  /**
   * Get ad package pricing
   */
  getPackagePricing(packageType, duration) {
    const pkg = ADS_CONFIG.packages[packageType];
    if (!pkg) {
      throw new Error('Invalid package type');
    }
    
    if (!pkg.pricing[duration]) {
      throw new Error('Invalid duration for this package');
    }
    
    return {
      packageType,
      packageName: pkg.name,
      duration,
      price: pkg.pricing[duration],
      currency: 'USD',
      positions: pkg.positions,
      features: pkg.features,
      dimensions: pkg.dimensions,
      impressionsEstimate: pkg.impressionsEstimate?.[duration]
    };
  }

  /**
   * Calculate ad cost with any additional fees
   */
  calculateAdCost(packageType, duration, quantity = 1) {
    const pricing = this.getPackagePricing(packageType, duration);
    const basePrice = pricing.price * quantity;
    
    // No additional platform fee for ads - price is the price
    return {
      basePrice,
      quantity,
      platformFee: 0,
      totalCost: basePrice,
      currency: 'USD',
      pricing
    };
  }

  /**
   * Initiate ad payment (LIVE)
   */
  async initiateAdPayment(params) {
    const {
      packageType,
      duration,
      quantity = 1,
      advertiserName,
      advertiserEmail,
      advertiserPhone,
      companyName,
      adContent,
      targetUrl,
      position,
      currency = 'USD'
    } = params;

    // Validate required fields
    if (!packageType || !duration || !advertiserName || !advertiserEmail || !advertiserPhone) {
      throw new Error('Missing required fields');
    }

    if (!adContent || !targetUrl) {
      throw new Error('Ad content and target URL are required');
    }

    // Calculate cost
    const costDetails = this.calculateAdCost(packageType, duration, quantity);
    
    // Convert to local currency
    const exchangeRate = ADS_CONFIG.exchangeRates[currency] || 1.0;
    const localAmount = (costDetails.totalCost * exchangeRate).toFixed(2);

    // Generate payment reference
    const paymentRef = `AD-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Calculate ad validity period
    const startDate = new Date();
    const endDate = this.calculateEndDate(startDate, duration);

    // Create payment record
    const payment = {
      id: crypto.randomUUID(),
      reference: paymentRef,
      type: 'ad_payment',
      status: 'pending', // pending, paid, active, expired, cancelled
      advertiser: {
        name: advertiserName,
        email: advertiserEmail,
        phone: advertiserPhone,
        company: companyName || advertiserName
      },
      package: {
        type: packageType,
        name: costDetails.pricing.packageName,
        duration,
        quantity,
        position
      },
      cost: {
        basePrice: costDetails.basePrice,
        totalCost: costDetails.totalCost,
        currency: 'USD',
        localAmount,
        localCurrency: currency
      },
      ad: {
        content: adContent,
        targetUrl,
        position,
        status: 'pending_approval'
      },
      validity: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        durationDays: this.getDurationDays(duration)
      },
      platformNumber: ADS_CONFIG.platformNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save payment
    await this.savePayment(payment);

    return {
      success: true,
      payment: {
        reference: paymentRef,
        amount: localAmount,
        currency: currency,
        package: costDetails.pricing.packageName,
        duration,
        validUntil: endDate.toISOString(),
        platformNumber: ADS_CONFIG.platformNumber
      },
      message: `Ad payment initiated. Pay ${localAmount} ${currency} to ${ADS_CONFIG.platformNumber}`
    };
  }

  /**
   * Complete ad payment and activate ad (LIVE)
   */
  async completeAdPayment(reference, mpesaReceipt) {
    const payments = await this.loadPayments();
    const payment = payments.find(p => p.reference === reference);

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status === 'paid' || payment.status === 'active') {
      throw new Error('Payment already completed');
    }

    // Update payment status
    payment.status = 'paid';
    payment.mpesaReceipt = mpesaReceipt;
    payment.paidAt = new Date().toISOString();
    payment.updatedAt = new Date().toISOString();

    await this.saveAllPayments(payments);

    // Create active ad
    const ad = await this.createActiveAd(payment);

    return {
      success: true,
      message: 'Payment completed! Ad pending approval.',
      payment,
      ad
    };
  }

  /**
   * Create active ad after payment
   */
  async createActiveAd(payment) {
    const ad = {
      id: crypto.randomUUID(),
      paymentReference: payment.reference,
      advertiser: payment.advertiser,
      package: payment.package,
      content: payment.ad.content,
      targetUrl: payment.ad.targetUrl,
      position: payment.ad.position,
      status: 'pending_approval', // pending_approval, active, paused, expired
      validity: payment.validity,
      stats: {
        impressions: 0,
        clicks: 0,
        ctr: 0
      },
      createdAt: new Date().toISOString(),
      activatedAt: null,
      updatedAt: new Date().toISOString()
    };

    const ads = await this.loadAds();
    ads.push(ad);
    await this.saveAllAds(ads);

    return ad;
  }

  /**
   * Approve ad (admin only)
   */
  async approveAd(adId) {
    const ads = await this.loadAds();
    const ad = ads.find(a => a.id === adId);

    if (!ad) {
      throw new Error('Ad not found');
    }

    ad.status = 'active';
    ad.activatedAt = new Date().toISOString();
    ad.updatedAt = new Date().toISOString();

    await this.saveAllAds(ads);

    // Update payment status
    const payments = await this.loadPayments();
    const payment = payments.find(p => p.reference === ad.paymentReference);
    if (payment) {
      payment.status = 'active';
      payment.ad.status = 'active';
      payment.updatedAt = new Date().toISOString();
      await this.saveAllPayments(payments);
    }

    return {
      success: true,
      message: 'Ad approved and activated',
      ad
    };
  }

  /**
   * Get active ads for display
   */
  async getActiveAds(position = null) {
    const ads = await this.loadAds();
    const now = new Date();

    let activeAds = ads.filter(ad => {
      const isActive = ad.status === 'active';
      const notExpired = new Date(ad.validity.endDate) > now;
      const positionMatch = !position || ad.position === position;
      
      return isActive && notExpired && positionMatch;
    });

    // Sort by creation date (newest first)
    activeAds.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return activeAds;
  }

  /**
   * Record ad impression
   */
  async recordImpression(adId) {
    const ads = await this.loadAds();
    const ad = ads.find(a => a.id === adId);

    if (ad) {
      ad.stats.impressions += 1;
      ad.stats.ctr = ad.stats.clicks / ad.stats.impressions;
      ad.updatedAt = new Date().toISOString();
      await this.saveAllAds(ads);
    }
  }

  /**
   * Record ad click
   */
  async recordClick(adId) {
    const ads = await this.loadAds();
    const ad = ads.find(a => a.id === adId);

    if (ad) {
      ad.stats.clicks += 1;
      ad.stats.ctr = ad.stats.clicks / ad.stats.impressions;
      ad.updatedAt = new Date().toISOString();
      await this.saveAllAds(ads);
    }
  }

  /**
   * Get advertiser's ads
   */
  async getAdvertiserAds(email) {
    const ads = await this.loadAds();
    return ads.filter(ad => ad.advertiser.email === email);
  }

  /**
   * Get all ad payments (admin)
   */
  async getAllPayments(filters = {}) {
    const payments = await this.loadPayments();
    let filtered = [...payments];

    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }

    if (filters.packageType) {
      filtered = filtered.filter(p => p.package.type === filters.packageType);
    }

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Get ads statistics
   */
  async getAdsStats() {
    const payments = await this.loadPayments();
    const ads = await this.loadAds();

    const totalRevenue = payments
      .filter(p => p.status === 'paid' || p.status === 'active')
      .reduce((sum, p) => sum + p.cost.totalCost, 0);

    const activeAds = ads.filter(a => a.status === 'active').length;
    const totalImpressions = ads.reduce((sum, a) => sum + a.stats.impressions, 0);
    const totalClicks = ads.reduce((sum, a) => sum + a.stats.clicks, 0);

    return {
      totalPayments: payments.length,
      totalRevenue: totalRevenue.toFixed(2),
      activeAds,
      pendingApproval: ads.filter(a => a.status === 'pending_approval').length,
      totalImpressions,
      totalClicks,
      overallCTR: totalImpressions > 0 ? (totalClicks / totalImpressions).toFixed(4) : 0,
      currency: 'USD'
    };
  }

  // Helper methods
  calculateEndDate(startDate, duration) {
    const date = new Date(startDate);
    const days = this.getDurationDays(duration);
    date.setDate(date.getDate() + days);
    return date;
  }

  getDurationDays(duration) {
    const daysMap = {
      day: 1,
      week: 7,
      month: 30,
      quarter: 90,
      year: 365
    };
    return daysMap[duration] || 1;
  }

  async loadPayments() {
    try {
      const data = await fs.readFile(AD_PAYMENTS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      return parsed.payments || [];
    } catch {
      return [];
    }
  }

  async savePayment(payment) {
    const payments = await this.loadPayments();
    payments.push(payment);
    await fs.writeFile(AD_PAYMENTS_FILE, JSON.stringify({ payments }, null, 2));
  }

  async saveAllPayments(payments) {
    await fs.writeFile(AD_PAYMENTS_FILE, JSON.stringify({ payments }, null, 2));
  }

  async loadAds() {
    try {
      const data = await fs.readFile(ADS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      return parsed.ads || [];
    } catch {
      return [];
    }
  }

  async saveAllAds(ads) {
    await fs.writeFile(ADS_FILE, JSON.stringify({ ads }, null, 2));
  }
}

module.exports = new AdsPaymentSystem();
