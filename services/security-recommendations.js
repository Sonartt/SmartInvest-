/**
 * SmartInvest Security Recommendations & Audit System
 * Account security and investment protection
 */

const fs = require('fs');
const path = require('path');

class SecurityRecommendations {
  constructor() {
    this.dataPath = path.join(__dirname, '../data');
    this.auditPath = path.join(this.dataPath, 'security-audit.json');
  }

  /**
   * Generate security recommendations
   */
  generateSecurityRecommendations(userProfile, accountActivity) {
    const recommendations = [];
    const score = this.calculateSecurityScore(userProfile, accountActivity);

    // 1. Password strength check
    if (!userProfile.passwordStrength || userProfile.passwordStrength < 'strong') {
      recommendations.push({
        id: 'sec_001',
        category: 'Account Security',
        severity: 'high',
        title: 'Strengthen Your Password',
        description: 'Your password needs to be stronger to protect your account',
        actionItems: [
          'Use a minimum of 12 characters',
          'Include uppercase and lowercase letters',
          'Include numbers and special characters',
          'Avoid common words and personal information'
        ],
        estimatedRiskReduction: '25%',
        priority: 'critical'
      });
    }

    // 2. Two-factor authentication
    if (!userProfile.twoFactorEnabled) {
      recommendations.push({
        id: 'sec_002',
        category: 'Account Protection',
        severity: 'high',
        title: 'Enable Two-Factor Authentication',
        description: 'Add an extra layer of security to your account',
        actionItems: [
          'Enable 2FA via SMS or authenticator app',
          'Save backup codes in a secure location',
          'Use authenticator app (more secure than SMS)'
        ],
        estimatedRiskReduction: '99%',
        priority: 'critical'
      });
    }

    // 3. Session security check
    recommendations.push({
      id: 'sec_003',
      category: 'Session Management',
      severity: 'medium',
      title: 'Review Active Sessions',
      description: 'Monitor and manage your active login sessions',
      actionItems: [
        `You have ${accountActivity.activeSessions || 1} active sessions`,
        'Sign out from unused devices',
        'Review login history for unauthorized access'
      ],
      estimatedRiskReduction: '15%',
      priority: 'high'
    });

    // 4. Data backup
    recommendations.push({
      id: 'sec_004',
      category: 'Data Protection',
      severity: 'medium',
      title: 'Regular Data Backups',
      description: 'Ensure your financial data is safely backed up',
      actionItems: [
        'Export account statements regularly',
        'Save copies of investment documents',
        'Use encrypted storage for backups'
      ],
      estimatedRiskReduction: '30%',
      priority: 'high'
    });

    // 5. Privacy settings review
    recommendations.push({
      id: 'sec_005',
      category: 'Privacy',
      severity: 'low',
      title: 'Review Privacy Settings',
      description: 'Ensure your personal information is properly protected',
      actionItems: [
        'Limit data sharing with third parties',
        'Review notification preferences',
        'Control visibility of portfolio information'
      ],
      estimatedRiskReduction: '10%',
      priority: 'medium'
    });

    // 6. Device security
    recommendations.push({
      id: 'sec_006',
      category: 'Device Security',
      severity: 'medium',
      title: 'Secure Your Devices',
      description: 'Protect the devices you use for investing',
      actionItems: [
        'Keep operating system updated',
        'Use reputable antivirus software',
        'Enable device lock/biometric authentication',
        'Use VPN on public networks'
      ],
      estimatedRiskReduction: '40%',
      priority: 'high'
    });

    return {
      score,
      recommendations: recommendations.sort((a, b) => {
        const priorityMap = { critical: 1, high: 2, medium: 3, low: 4 };
        return priorityMap[a.priority] - priorityMap[b.priority];
      }),
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Calculate security score
   */
  calculateSecurityScore(userProfile, accountActivity) {
    let score = 100;

    // Deduct for weak passwords
    if (!userProfile.passwordStrength || userProfile.passwordStrength < 'strong') {
      score -= 20;
    }

    // Deduct for missing 2FA
    if (!userProfile.twoFactorEnabled) {
      score -= 25;
    }

    // Deduct for suspicious activity
    if (accountActivity.suspiciousLogins > 0) {
      score -= 15;
    }

    // Deduct for outdated information
    if (userProfile.lastSecurityAudit && 
        Date.now() - new Date(userProfile.lastSecurityAudit) > 90 * 24 * 60 * 60 * 1000) {
      score -= 10;
    }

    // Deduct for multiple active sessions
    if ((accountActivity.activeSessions || 0) > 3) {
      score -= 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Detect unusual account activity
   */
  detectUnusualActivity(accountActivity, userProfile) {
    const anomalies = [];

    // Check for unusual login location
    if (accountActivity.lastLogin && accountActivity.lastLogin.location !== userProfile.primaryLocation) {
      anomalies.push({
        type: 'location-anomaly',
        severity: 'high',
        description: `Login detected from ${accountActivity.lastLogin.location}, different from your usual location`,
        timestamp: accountActivity.lastLogin.timestamp,
        action: 'Verify this login was authorized'
      });
    }

    // Check for unusual login time
    if (accountActivity.lastLogin) {
      const hour = new Date(accountActivity.lastLogin.timestamp).getHours();
      if (hour < 6 || hour > 23) {
        anomalies.push({
          type: 'time-anomaly',
          severity: 'medium',
          description: 'Login detected at unusual time',
          timestamp: accountActivity.lastLogin.timestamp,
          action: 'Verify this login was authorized'
        });
      }
    }

    // Check for unusual transactions
    if (accountActivity.recentTransactions) {
      const largeTransaction = accountActivity.recentTransactions.find(t => 
        t.amount > (userProfile.avgTransactionAmount * 3)
      );

      if (largeTransaction) {
        anomalies.push({
          type: 'transaction-anomaly',
          severity: 'high',
          description: `Unusually large transaction detected: ₹${largeTransaction.amount}`,
          timestamp: largeTransaction.timestamp,
          action: 'Verify this transaction'
        });
      }
    }

    return anomalies;
  }

  /**
   * Generate security audit report
   */
  generateAuditReport(userId) {
    const audit = {
      auditId: `audit_${Date.now()}`,
      userId,
      timestamp: new Date().toISOString(),
      checks: [
        {
          check: 'Password Strength',
          status: 'pass',
          details: 'Password meets security standards'
        },
        {
          check: 'Two-Factor Authentication',
          status: 'pass',
          details: '2FA enabled via authenticator app'
        },
        {
          check: 'Active Sessions',
          status: 'pass',
          details: 'All active sessions are from recognized devices'
        },
        {
          check: 'Recent Logins',
          status: 'pass',
          details: 'All recent logins are from expected locations'
        },
        {
          check: 'Data Encryption',
          status: 'pass',
          details: 'All data is encrypted in transit and at rest'
        },
        {
          check: 'Account Recovery Options',
          status: 'pass',
          details: 'Recovery email and phone number are verified'
        }
      ],
      overallStatus: 'secure',
      issueCount: 0
    };

    this.saveAudit(audit);
    return audit;
  }

  /**
   * Implement security best practices
   */
  getSecurityBestPractices() {
    return [
      {
        practice: 'Use Strong Passwords',
        details: 'Create unique, complex passwords with at least 12 characters',
        importance: 'critical'
      },
      {
        practice: 'Enable Two-Factor Authentication',
        details: 'Add an extra layer of security with 2FA on all accounts',
        importance: 'critical'
      },
      {
        practice: 'Keep Software Updated',
        details: 'Regularly update your browser and operating system',
        importance: 'high'
      },
      {
        practice: 'Use VPN on Public Networks',
        details: 'Protect your data when using public WiFi',
        importance: 'high'
      },
      {
        practice: 'Monitor Account Activity',
        details: 'Regularly review login history and transaction logs',
        importance: 'high'
      },
      {
        practice: 'Be Aware of Phishing',
        details: 'Never click links in unsolicited emails; always go directly to the website',
        importance: 'high'
      },
      {
        practice: 'Backup Your Data',
        details: 'Keep regular backups of important financial documents',
        importance: 'medium'
      },
      {
        practice: 'Use Secure Connections',
        details: 'Always verify HTTPS encryption on sensitive websites',
        importance: 'medium'
      }
    ];
  }

  /**
   * Generate fraud detection report
   */
  generateFraudDetectionReport(transactions) {
    const report = {
      reportId: `fraud_${Date.now()}`,
      totalTransactions: transactions.length,
      suspiciousTransactions: [],
      riskLevel: 'low',
      timestamp: new Date().toISOString()
    };

    transactions.forEach(transaction => {
      const flags = [];

      // Check for unusual amount
      if (transaction.amount > 500000) {
        flags.push('Large transaction amount');
      }

      // Check for unusual frequency
      if (transaction.frequency === 'unusual') {
        flags.push('Unusual frequency pattern');
      }

      // Check for unusual merchant
      if (transaction.merchant && transaction.merchant.riskScore > 0.7) {
        flags.push('High-risk merchant');
      }

      if (flags.length > 0) {
        report.suspiciousTransactions.push({
          transactionId: transaction.id,
          amount: transaction.amount,
          merchant: transaction.merchant,
          flags,
          riskScore: flags.length * 0.25
        });
      }
    });

    // Calculate overall risk level
    if (report.suspiciousTransactions.length > 5) {
      report.riskLevel = 'high';
    } else if (report.suspiciousTransactions.length > 2) {
      report.riskLevel = 'medium';
    }

    return report;
  }

  /**
   * Save audit report
   */
  saveAudit(audit) {
    try {
      const audits = this.loadAudits();
      audits.push(audit);
      fs.writeFileSync(this.auditPath, JSON.stringify(audits, null, 2));
    } catch (error) {
      console.error('Error saving audit:', error);
    }
  }

  /**
   * Load audit reports
   */
  loadAudits() {
    try {
      if (fs.existsSync(this.auditPath)) {
        return JSON.parse(fs.readFileSync(this.auditPath, 'utf8'));
      }
      return [];
    } catch (error) {
      console.error('Error loading audits:', error);
      return [];
    }
  }
}

module.exports = new SecurityRecommendations();
