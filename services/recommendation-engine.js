/**
 * SmartInvest Personalized Recommendation Engine
 * Analyzes user profile, portfolio, and market conditions to provide investment recommendations
 */

const fs = require('fs');
const path = require('path');

class RecommendationEngine {
  constructor() {
    this.dataPath = path.join(__dirname, '../data');
    this.recommendationsPath = path.join(this.dataPath, 'recommendations.json');
    this.ensureDataFile();
  }

  ensureDataFile() {
    if (!fs.existsSync(this.recommendationsPath)) {
      fs.writeFileSync(this.recommendationsPath, JSON.stringify({ recommendations: [] }, null, 2));
    }
  }

  /**
   * Generate personalized recommendations based on user profile
   */
  generateRecommendations(userProfile, portfolio) {
    const recommendations = [];

    // 1. Risk-based recommendations
    if (userProfile.riskTolerance === 'conservative') {
      recommendations.push({
        type: 'asset-allocation',
        title: 'Conservative Portfolio Allocation',
        description: 'Based on your risk tolerance, consider: 70% Bonds, 20% Stocks, 10% Cash',
        priority: 'high',
        action: 'Adjust portfolio allocation',
        expectedReturn: '4-6% annually'
      });
    } else if (userProfile.riskTolerance === 'moderate') {
      recommendations.push({
        type: 'asset-allocation',
        title: 'Balanced Portfolio Allocation',
        description: 'Consider: 50% Stocks, 40% Bonds, 10% Alternatives',
        priority: 'high',
        action: 'Rebalance your holdings',
        expectedReturn: '6-8% annually'
      });
    } else if (userProfile.riskTolerance === 'aggressive') {
      recommendations.push({
        type: 'asset-allocation',
        title: 'Growth-Focused Portfolio',
        description: 'Consider: 80% Stocks, 15% Bonds, 5% Cash',
        priority: 'medium',
        action: 'Increase equity exposure',
        expectedReturn: '8-12% annually'
      });
    }

    // 2. Diversification recommendations
    const diversification = this.analyzeDiversification(portfolio);
    if (diversification.concentration > 0.7) {
      recommendations.push({
        type: 'diversification',
        title: `Portfolio Concentration Alert`,
        description: `Your portfolio is ${(diversification.concentration * 100).toFixed(1)}% concentrated in ${diversification.topSector}. Consider diversifying.`,
        priority: 'high',
        action: 'Add assets in underrepresented sectors',
        risk: 'Concentration risk'
      });
    }

    // 3. Goal-based recommendations
    if (userProfile.goals) {
      userProfile.goals.forEach(goal => {
        const recommendation = this.getGoalRecommendation(goal, portfolio, userProfile);
        if (recommendation) {
          recommendations.push(recommendation);
        }
      });
    }

    // 4. Tax optimization recommendations
    if (portfolio.taxableGains > 5000) {
      recommendations.push({
        type: 'tax-optimization',
        title: 'Tax-Loss Harvesting Opportunity',
        description: `Your portfolio has ${Math.abs(portfolio.taxableLosses).toFixed(2)} KES in losses that could offset gains.`,
        priority: 'medium',
        action: 'Implement tax-loss harvesting',
        taxSavings: (portfolio.taxableLosses * 0.25).toFixed(2) // 25% tax rate estimate
      });
    }

    // 5. Rebalancing recommendations
    const needsRebalancing = this.checkRebalancingNeed(portfolio);
    if (needsRebalancing) {
      recommendations.push({
        type: 'rebalancing',
        title: 'Portfolio Rebalancing Recommended',
        description: 'Your portfolio has drifted from target allocation by more than 5%.',
        priority: 'medium',
        action: 'Rebalance to target allocation',
        lastRebalance: portfolio.lastRebalanceDate
      });
    }

    // 6. Opportunity-based recommendations
    if (portfolio.investableAssets < userProfile.monthlyIncome * 3) {
      recommendations.push({
        type: 'accumulation',
        title: 'Increase Investment Contributions',
        description: `Consider investing more regularly. Current rate: ${(portfolio.monthlyContribution / userProfile.monthlyIncome * 100).toFixed(1)}% of income.`,
        priority: 'low',
        action: 'Set up auto-investment',
        suggestedAmount: (userProfile.monthlyIncome * 0.15).toFixed(2)
      });
    }

    return {
      recommendations: recommendations.slice(0, 5), // Top 5 recommendations
      generatedAt: new Date().toISOString(),
      score: this.calculateRecommendationScore(recommendations)
    };
  }

  /**
   * Analyze portfolio diversification
   */
  analyzeDiversification(portfolio) {
    const sectors = {};
    const assets = portfolio.assets || [];

    assets.forEach(asset => {
      sectors[asset.sector] = (sectors[asset.sector] || 0) + asset.value;
    });

    const totalValue = Object.values(sectors).reduce((a, b) => a + b, 0);
    const concentrations = Object.entries(sectors).map(([sector, value]) => ({
      sector,
      concentration: value / totalValue
    }));

    const maxConcentration = Math.max(...concentrations.map(c => c.concentration), 0);
    const topSector = concentrations.find(c => c.concentration === maxConcentration)?.sector || 'Unknown';

    return {
      sectors,
      concentration: maxConcentration,
      topSector,
      herfindahlIndex: this.calculateHerfindahl(concentrations)
    };
  }

  /**
   * Calculate Herfindahl-Hirschman Index for diversification
   */
  calculateHerfindahl(concentrations) {
    return concentrations.reduce((sum, c) => sum + Math.pow(c.concentration, 2), 0);
  }

  /**
   * Get goal-based recommendation
   */
  getGoalRecommendation(goal, portfolio, userProfile) {
    const yearsToGoal = goal.targetYear - new Date().getFullYear();
    const amountNeeded = goal.targetAmount;
    const currentSavings = goal.currentAmount || 0;
    const remainingAmount = amountNeeded - currentSavings;

    if (remainingAmount <= 0) {
      return {
        type: 'goal-achievement',
        title: `Goal "${goal.name}" Achieved! 🎉`,
        description: `You've reached your target of ${amountNeeded.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}`,
        priority: 'low',
        action: 'Set a new goal'
      };
    }

    if (yearsToGoal <= 0) {
      return {
        type: 'goal-urgent',
        title: `Goal "${goal.name}" - Deadline Approaching`,
        description: `Your target of ${amountNeeded.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })} is due this year.`,
        priority: 'high',
        action: 'Accelerate contributions or adjust timeline'
      };
    }

    const monthlyNeeded = remainingAmount / (yearsToGoal * 12);
    const requiredReturn = this.calculateRequiredReturn(remainingAmount, monthlyNeeded, yearsToGoal);

    return {
      type: 'goal-planning',
      title: `Goal: ${goal.name}`,
      description: `Target: ${amountNeeded.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })} by ${goal.targetYear}`,
      priority: 'medium',
      action: `Monthly investment: ${monthlyNeeded.toFixed(2)} KES`,
      requiredReturn: `${requiredReturn.toFixed(2)}% annually`
    };
  }

  /**
   * Calculate required return for goal
   */
  calculateRequiredReturn(principal, monthlyPayment, years) {
    // Using simplified calculation (actual would use more complex finance formula)
    return (principal / (monthlyPayment * years * 12) - 1) * 100;
  }

  /**
   * Check if portfolio needs rebalancing
   */
  checkRebalancingNeed(portfolio) {
    if (!portfolio.targetAllocation) return false;

    const drift = Object.entries(portfolio.targetAllocation).some(([asset, target]) => {
      const current = portfolio.currentAllocation?.[asset] || 0;
      return Math.abs(current - target) > 0.05; // 5% drift threshold
    });

    return drift;
  }

  /**
   * Calculate recommendation score (0-100)
   */
  calculateRecommendationScore(recommendations) {
    let score = 100;

    recommendations.forEach(rec => {
      if (rec.priority === 'high') score -= 10;
      if (rec.priority === 'medium') score -= 5;
    });

    return Math.max(0, score);
  }

  /**
   * Save recommendations to database
   */
  saveRecommendations(userId, recommendations) {
    try {
      const data = JSON.parse(fs.readFileSync(this.recommendationsPath, 'utf8'));
      
      // Remove old recommendations for this user
      data.recommendations = data.recommendations.filter(r => r.userId !== userId);

      // Add new recommendations
      data.recommendations.push({
        userId,
        ...recommendations,
        savedAt: new Date().toISOString()
      });

      fs.writeFileSync(this.recommendationsPath, JSON.stringify(data, null, 2));
      return true;
    } catch (err) {
      console.error('Error saving recommendations:', err);
      return false;
    }
  }

  /**
   * Get saved recommendations for user
   */
  getRecommendations(userId) {
    try {
      const data = JSON.parse(fs.readFileSync(this.recommendationsPath, 'utf8'));
      return data.recommendations.find(r => r.userId === userId) || null;
    } catch (err) {
      console.error('Error reading recommendations:', err);
      return null;
    }
  }
}

module.exports = new RecommendationEngine();
