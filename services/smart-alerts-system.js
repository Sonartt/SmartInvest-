/**
 * SmartInvest Smart Alerts System
 * Real-time notifications for important financial events
 */

const fs = require('fs');
const path = require('path');

class SmartAlertsSystem {
  constructor() {
    this.dataPath = path.join(__dirname, '../data');
    this.alertsPath = path.join(this.dataPath, 'alerts.json');
    this.alertSettingsPath = path.join(this.dataPath, 'alert-settings.json');
    this.ensureDataFiles();
  }

  ensureDataFiles() {
    if (!fs.existsSync(this.alertsPath)) {
      fs.writeFileSync(this.alertsPath, JSON.stringify({ alerts: [] }, null, 2));
    }
    if (!fs.existsSync(this.alertSettingsPath)) {
      fs.writeFileSync(this.alertSettingsPath, JSON.stringify({ settings: {} }, null, 2));
    }
  }

  /**
   * Create price threshold alert
   */
  createPriceAlert(userId, assetId, assetName, price, type, threshold) {
    const alert = {
      id: this.generateAlertId(),
      userId,
      type: 'price-alert',
      assetId,
      assetName,
      currentPrice: price,
      threshold,
      alertType: type, // 'above' or 'below'
      status: 'active',
      createdAt: new Date().toISOString(),
      triggeredAt: null
    };

    return this.saveAlert(alert);
  }

  /**
   * Create portfolio milestone alert
   */
  createMilestoneAlert(userId, milestoneType, targetAmount, currentAmount) {
    const milestones = [
      { value: 100000, name: '100K Milestone' },
      { value: 500000, name: '500K Milestone' },
      { value: 1000000, name: '1M Milestone' },
      { value: 5000000, name: '5M Milestone' }
    ];

    const milestone = milestones.find(m => m.value === targetAmount);
    if (!milestone) return false;

    const percentComplete = (currentAmount / targetAmount) * 100;

    const alert = {
      id: this.generateAlertId(),
      userId,
      type: 'milestone-alert',
      milestoneName: milestone.name,
      targetAmount,
      currentAmount,
      percentComplete,
      status: percentComplete >= 100 ? 'triggered' : 'active',
      createdAt: new Date().toISOString(),
      triggeredAt: percentComplete >= 100 ? new Date().toISOString() : null
    };

    return this.saveAlert(alert);
  }

  /**
   * Create market volatility alert
   */
  createVolatilityAlert(userId, indexName, volatilityLevel) {
    const alert = {
      id: this.generateAlertId(),
      userId,
      type: 'volatility-alert',
      indexName,
      volatilityLevel, // 'low', 'medium', 'high', 'extreme'
      threshold: this.getVolatilityThreshold(volatilityLevel),
      recommendation: this.getVolatilityRecommendation(volatilityLevel),
      status: 'active',
      createdAt: new Date().toISOString()
    };

    return this.saveAlert(alert);
  }

  /**
   * Create tax optimization alert
   */
  createTaxOptimizationAlert(userId, taxableLosses, taxableGains) {
    const alert = {
      id: this.generateAlertId(),
      userId,
      type: 'tax-alert',
      title: 'Tax-Loss Harvesting Opportunity',
      description: `You have ${Math.abs(taxableLosses).toFixed(2)} KES in unrealized losses that could offset gains`,
      taxableLosses,
      taxableGains,
      potentialTaxSavings: (taxableLosses * 0.25).toFixed(2),
      status: 'active',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString() // 31 days
    };

    return this.saveAlert(alert);
  }

  /**
   * Create security alert
   */
  createSecurityAlert(userId, eventType, details) {
    const alert = {
      id: this.generateAlertId(),
      userId,
      type: 'security-alert',
      eventType, // 'unusual-login', 'large-withdrawal', 'password-change', 'api-key-used'
      details,
      severity: this.getSecuritySeverity(eventType),
      status: 'active',
      createdAt: new Date().toISOString(),
      requiresAction: true
    };

    return this.saveAlert(alert);
  }

  /**
   * Create rebalancing alert
   */
  createRebalancingAlert(userId, currentAllocation, targetAllocation) {
    const drift = this.calculateAllocationDrift(currentAllocation, targetAllocation);
    
    const alert = {
      id: this.generateAlertId(),
      userId,
      type: 'rebalancing-alert',
      currentAllocation,
      targetAllocation,
      drift,
      driftPercentage: (drift * 100).toFixed(1),
      recommendation: 'Your portfolio has drifted from target allocation. Consider rebalancing.',
      status: drift > 0.05 ? 'active' : 'pending',
      createdAt: new Date().toISOString()
    };

    return this.saveAlert(alert);
  }

  /**
   * Create savings goal alert
   */
  createSavingsGoalAlert(userId, goalName, targetAmount, currentAmount, deadline) {
    const progressPercentage = (currentAmount / targetAmount) * 100;
    const daysUntilDeadline = this.calculateDaysUntil(deadline);

    const alert = {
      id: this.generateAlertId(),
      userId,
      type: 'savings-goal-alert',
      goalName,
      targetAmount,
      currentAmount,
      progressPercentage,
      deadline,
      daysRemaining: daysUntilDeadline,
      onTrack: this.isOnTrackForGoal(currentAmount, targetAmount, daysUntilDeadline),
      status: progressPercentage >= 100 ? 'completed' : 'active',
      createdAt: new Date().toISOString()
    };

    return this.saveAlert(alert);
  }

  /**
   * Get volatility threshold
   */
  getVolatilityThreshold(level) {
    const thresholds = {
      'low': { vix: '< 12', action: 'No action needed' },
      'medium': { vix: '12-20', action: 'Review portfolio' },
      'high': { vix: '20-30', action: 'Consider defensive positions' },
      'extreme': { vix: '> 30', action: 'Reduce exposure, increase cash' }
    };
    return thresholds[level] || thresholds['medium'];
  }

  /**
   * Get volatility recommendation
   */
  getVolatilityRecommendation(level) {
    const recommendations = {
      'low': 'Market is stable. Good time for long-term investing.',
      'medium': 'Moderate volatility. Stick to your investment plan.',
      'high': 'High volatility. Consider defensive strategies.',
      'extreme': 'Extreme volatility. Increase cash reserves and avoid impulsive decisions.'
    };
    return recommendations[level] || recommendations['medium'];
  }

  /**
   * Calculate allocation drift
   */
  calculateAllocationDrift(current, target) {
    let totalDrift = 0;
    Object.keys(target).forEach(asset => {
      const drift = Math.abs(current[asset] - target[asset]);
      totalDrift += drift;
    });
    return totalDrift / 2; // Divide by 2 because each diff is counted twice
  }

  /**
   * Check if on track for goal
   */
  isOnTrackForGoal(current, target, daysRemaining) {
    const daysTotal = 365; // Assume annual goal
    const daysElapsed = daysTotal - daysRemaining;
    const requiredProgress = daysElapsed / daysTotal;
    const actualProgress = current / target;

    return actualProgress >= (requiredProgress * 0.9); // 90% on track threshold
  }

  /**
   * Calculate days until date
   */
  calculateDaysUntil(targetDate) {
    const now = new Date();
    const target = new Date(targetDate);
    const diff = target - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Get security severity
   */
  getSecuritySeverity(eventType) {
    const severities = {
      'unusual-login': 'high',
      'large-withdrawal': 'high',
      'password-change': 'medium',
      'api-key-used': 'medium',
      'failed-login-attempts': 'high',
      'new-device': 'medium'
    };
    return severities[eventType] || 'medium';
  }

  /**
   * Generate unique alert ID
   */
  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save alert
   */
  saveAlert(alert) {
    try {
      const data = JSON.parse(fs.readFileSync(this.alertsPath, 'utf8'));
      data.alerts.push(alert);
      fs.writeFileSync(this.alertsPath, JSON.stringify(data, null, 2));
      return alert;
    } catch (err) {
      console.error('Error saving alert:', err);
      return null;
    }
  }

  /**
   * Get user alerts
   */
  getUserAlerts(userId, status = 'active') {
    try {
      const data = JSON.parse(fs.readFileSync(this.alertsPath, 'utf8'));
      return data.alerts.filter(a => a.userId === userId && a.status === status);
    } catch (err) {
      return [];
    }
  }

  /**
   * Dismiss alert
   */
  dismissAlert(alertId) {
    try {
      const data = JSON.parse(fs.readFileSync(this.alertsPath, 'utf8'));
      const alert = data.alerts.find(a => a.id === alertId);
      if (alert) {
        alert.status = 'dismissed';
        alert.dismissedAt = new Date().toISOString();
        fs.writeFileSync(this.alertsPath, JSON.stringify(data, null, 2));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error dismissing alert:', err);
      return false;
    }
  }

  /**
   * Set alert preferences
   */
  setAlertPreferences(userId, preferences) {
    try {
      const data = JSON.parse(fs.readFileSync(this.alertSettingsPath, 'utf8'));
      data.settings[userId] = {
        ...data.settings[userId],
        ...preferences,
        updatedAt: new Date().toISOString()
      };
      fs.writeFileSync(this.alertSettingsPath, JSON.stringify(data, null, 2));
      return true;
    } catch (err) {
      console.error('Error saving preferences:', err);
      return false;
    }
  }

  /**
   * Get alert preferences
   */
  getAlertPreferences(userId) {
    try {
      const data = JSON.parse(fs.readFileSync(this.alertSettingsPath, 'utf8'));
      return data.settings[userId] || {
        priceAlerts: true,
        volumeAlerts: true,
        trendAlerts: true,
        taxAlerts: true,
        securityAlerts: true,
        pushNotifications: true,
        emailNotifications: true
      };
    } catch (err) {
      return {};
    }
  }
}

module.exports = new SmartAlertsSystem();
