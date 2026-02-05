/**
 * SmartInvest Risk Assessment & Tolerance Analyzer
 * Determines investor risk profile through interactive questionnaire
 */

const fs = require('fs');
const path = require('path');

class RiskAssessment {
  constructor() {
    this.dataPath = path.join(__dirname, '../data');
    this.profilesPath = path.join(this.dataPath, 'risk-profiles.json');
    this.ensureDataFile();
  }

  ensureDataFile() {
    if (!fs.existsSync(this.profilesPath)) {
      fs.writeFileSync(this.profilesPath, JSON.stringify({ profiles: [] }, null, 2));
    }
  }

  /**
   * Get risk assessment questionnaire
   */
  getQuestionnaire() {
    return [
      {
        id: 1,
        question: 'What is your investment time horizon?',
        type: 'single-select',
        weight: 15,
        options: [
          { value: 1, label: 'Less than 2 years', score: 0 },
          { value: 2, label: '2-5 years', score: 25 },
          { value: 3, label: '5-10 years', score: 50 },
          { value: 4, label: '10+ years', score: 100 }
        ]
      },
      {
        id: 2,
        question: 'How would you react if your portfolio dropped 20% in value?',
        type: 'single-select',
        weight: 20,
        options: [
          { value: 1, label: 'I would panic and sell', score: 0 },
          { value: 2, label: 'I would be concerned but hold', score: 30 },
          { value: 3, label: 'I would stay calm and wait', score: 70 },
          { value: 4, label: 'I would see it as a buying opportunity', score: 100 }
        ]
      },
      {
        id: 3,
        question: 'What is your investment experience level?',
        type: 'single-select',
        weight: 10,
        options: [
          { value: 1, label: 'Beginner (no experience)', score: 0 },
          { value: 2, label: 'Novice (1-3 years)', score: 33 },
          { value: 3, label: 'Intermediate (3-10 years)', score: 66 },
          { value: 4, label: 'Expert (10+ years)', score: 100 }
        ]
      },
      {
        id: 4,
        question: 'What percentage of your income can you invest monthly without hardship?',
        type: 'single-select',
        weight: 15,
        options: [
          { value: 1, label: 'Less than 5%', score: 0 },
          { value: 2, label: '5-15%', score: 33 },
          { value: 3, label: '15-25%', score: 66 },
          { value: 4, label: 'More than 25%', score: 100 }
        ]
      },
      {
        id: 5,
        question: 'Do you have an emergency fund covering 3-6 months of expenses?',
        type: 'yes-no',
        weight: 10,
        options: [
          { value: 'no', score: 0 },
          { value: 'yes', score: 100 }
        ]
      },
      {
        id: 6,
        question: 'What is your primary investment goal?',
        type: 'single-select',
        weight: 12,
        options: [
          { value: 1, label: 'Capital preservation', score: 0 },
          { value: 2, label: 'Income generation', score: 30 },
          { value: 3, label: 'Moderate growth', score: 60 },
          { value: 4, label: 'Aggressive growth', score: 100 }
        ]
      },
      {
        id: 7,
        question: 'How familiar are you with different investment types?',
        type: 'single-select',
        weight: 8,
        options: [
          { value: 1, label: 'Not familiar', score: 0 },
          { value: 2, label: 'Somewhat familiar', score: 33 },
          { value: 3, label: 'Familiar', score: 66 },
          { value: 4, label: 'Very familiar', score: 100 }
        ]
      },
      {
        id: 8,
        question: 'What is your debt-to-income ratio?',
        type: 'single-select',
        weight: 10,
        options: [
          { value: 1, label: 'More than 50% (high debt)', score: 0 },
          { value: 2, label: '30-50% (moderate debt)', score: 33 },
          { value: 3, label: '10-30% (low debt)', score: 66 },
          { value: 4, label: 'Less than 10% (minimal debt)', score: 100 }
        ]
      }
    ];
  }

  /**
   * Calculate risk score from answers
   */
  calculateRiskScore(answers) {
    const questionnaire = this.getQuestionnaire();
    let totalScore = 0;
    let totalWeight = 0;

    questionnaire.forEach(question => {
      const answer = answers.find(a => a.questionId === question.id);
      if (answer) {
        const option = question.options.find(o => o.value === answer.value);
        if (option) {
          totalScore += option.score * question.weight;
          totalWeight += 100 * question.weight;
        }
      }
    });

    return totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
  }

  /**
   * Determine risk tolerance level
   */
  determineTolerance(riskScore) {
    if (riskScore < 20) return 'very-conservative';
    if (riskScore < 40) return 'conservative';
    if (riskScore < 60) return 'moderate';
    if (riskScore < 80) return 'aggressive';
    return 'very-aggressive';
  }

  /**
   * Get asset allocation for risk profile
   */
  getAllocation(riskTolerance) {
    const allocations = {
      'very-conservative': {
        stocks: 10,
        bonds: 60,
        cash: 20,
        alternatives: 10,
        expectedReturn: '3-4%',
        maxDrawdown: '-5%'
      },
      'conservative': {
        stocks: 25,
        bonds: 50,
        cash: 15,
        alternatives: 10,
        expectedReturn: '4-6%',
        maxDrawdown: '-10%'
      },
      'moderate': {
        stocks: 50,
        bonds: 30,
        cash: 10,
        alternatives: 10,
        expectedReturn: '6-8%',
        maxDrawdown: '-15%'
      },
      'aggressive': {
        stocks: 75,
        bonds: 15,
        cash: 5,
        alternatives: 5,
        expectedReturn: '8-12%',
        maxDrawdown: '-25%'
      },
      'very-aggressive': {
        stocks: 90,
        bonds: 5,
        cash: 3,
        alternatives: 2,
        expectedReturn: '12-16%',
        maxDrawdown: '-40%'
      }
    };

    return allocations[riskTolerance] || allocations['moderate'];
  }

  /**
   * Get risk profile description
   */
  getRiskDescription(riskTolerance) {
    const descriptions = {
      'very-conservative': {
        title: 'Very Conservative Investor',
        description: 'You prioritize capital preservation and stability. You prefer predictable returns over growth.',
        characteristics: [
          'Low tolerance for market volatility',
          'Prefer stable, fixed income returns',
          'Short investment horizon',
          'Focus on protecting principal'
        ]
      },
      'conservative': {
        title: 'Conservative Investor',
        description: 'You seek steady growth with minimal risk. You are comfortable with slight market fluctuations.',
        characteristics: [
          'Limited tolerance for volatility',
          'Focus on regular income',
          'Moderate time horizon (5+ years)',
          'Some growth, mostly stability'
        ]
      },
      'moderate': {
        title: 'Moderate Risk Investor',
        description: 'You balance growth and stability. You accept some volatility for reasonable returns.',
        characteristics: [
          'Moderate tolerance for volatility',
          'Balance between income and growth',
          'Medium-term investment horizon (10+ years)',
          'Diversified portfolio'
        ]
      },
      'aggressive': {
        title: 'Aggressive Investor',
        description: 'You prioritize growth and accept significant volatility. You have a long-term perspective.',
        characteristics: [
          'High tolerance for market swings',
          'Focus on capital appreciation',
          'Long investment horizon (15+ years)',
          'Comfort with equity-heavy portfolio'
        ]
      },
      'very-aggressive': {
        title: 'Very Aggressive Investor',
        description: 'You seek maximum growth and can handle substantial market fluctuations.',
        characteristics: [
          'Very high risk tolerance',
          'Seek maximum capital appreciation',
          'Very long time horizon (20+ years)',
          'Comfortable with high volatility'
        ]
      }
    };

    return descriptions[riskTolerance] || descriptions['moderate'];
  }

  /**
   * Create risk profile
   */
  createProfile(userId, answers) {
    const riskScore = this.calculateRiskScore(answers);
    const tolerance = this.determineTolerance(riskScore);
    const allocation = this.getAllocation(tolerance);
    const description = this.getRiskDescription(tolerance);

    const profile = {
      userId,
      riskScore: riskScore.toFixed(2),
      riskTolerance: tolerance,
      allocation,
      description,
      completedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      answers
    };

    return this.saveProfile(profile);
  }

  /**
   * Save profile
   */
  saveProfile(profile) {
    try {
      const data = JSON.parse(fs.readFileSync(this.profilesPath, 'utf8'));
      
      // Remove old profile for this user
      data.profiles = data.profiles.filter(p => p.userId !== profile.userId);
      
      data.profiles.push(profile);
      fs.writeFileSync(this.profilesPath, JSON.stringify(data, null, 2));
      return profile;
    } catch (err) {
      console.error('Error saving profile:', err);
      return null;
    }
  }

  /**
   * Get user's risk profile
   */
  getUserProfile(userId) {
    try {
      const data = JSON.parse(fs.readFileSync(this.profilesPath, 'utf8'));
      const profile = data.profiles.find(p => p.userId === userId);
      
      if (profile && new Date(profile.expiresAt) > new Date()) {
        return profile;
      }
      return null;
    } catch (err) {
      return null;
    }
  }

  /**
   * Get recommendation based on profile
   */
  getRecommendation(profile) {
    const tolerance = profile.riskTolerance;

    const recommendations = {
      'very-conservative': [
        'Focus on bonds and high-dividend stocks',
        'Consider target-date funds for retirement',
        'Maintain larger cash reserves',
        'Avoid leveraged or complex instruments'
      ],
      'conservative': [
        'Build a balanced portfolio with 60% bonds',
        'Add dividend-paying blue-chip stocks',
        'Consider bond funds and fixed income ETFs',
        'Rebalance quarterly'
      ],
      'moderate': [
        'Implement 50/50 stocks and bonds allocation',
        'Include both growth and income stocks',
        'Add some international diversification',
        'Rebalance semi-annually'
      ],
      'aggressive': [
        'Focus on growth stocks and equity funds',
        'Include emerging markets exposure',
        'Add alternative investments like REITs',
        'Rebalance annually'
      ],
      'very-aggressive': [
        'Maximize equity exposure (90%)',
        'Include growth and small-cap stocks',
        'Consider international and emerging markets',
        'Add alternative investments'
      ]
    };

    return recommendations[tolerance] || recommendations['moderate'];
  }
}

module.exports = new RiskAssessment();
