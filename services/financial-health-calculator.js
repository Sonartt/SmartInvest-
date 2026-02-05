/**
 * SmartInvest Financial Health Score Calculator
 * Calculates comprehensive financial wellness score (0-100)
 */

const fs = require('fs');
const path = require('path');

class FinancialHealthCalculator {
  constructor() {
    this.dataPath = path.join(__dirname, '../data');
    this.scoresPath = path.join(this.dataPath, 'health-scores.json');
    this.ensureDataFile();
  }

  ensureDataFile() {
    if (!fs.existsSync(this.scoresPath)) {
      fs.writeFileSync(this.scoresPath, JSON.stringify({ scores: [] }, null, 2));
    }
  }

  /**
   * Calculate comprehensive financial health score
   */
  calculateHealthScore(userProfile, portfolio, transactions) {
    let score = 100;
    const breakdown = {};

    // 1. Portfolio Diversification (25 points)
    const diversificationScore = this.scoreDiversification(portfolio);
    breakdown.diversification = diversificationScore;
    score -= (25 - diversificationScore);

    // 2. Emergency Fund (20 points)
    const emergencyFundScore = this.scoreEmergencyFund(portfolio, userProfile);
    breakdown.emergencyFund = emergencyFundScore;
    score -= (20 - emergencyFundScore);

    // 3. Savings Rate (20 points)
    const savingsRateScore = this.scoreSavingsRate(userProfile, transactions);
    breakdown.savingsRate = savingsRateScore;
    score -= (20 - savingsRateScore);

    // 4. Portfolio Growth (15 points)
    const growthScore = this.scoreGrowth(portfolio, transactions);
    breakdown.growth = growthScore;
    score -= (15 - growthScore);

    // 5. Debt Management (10 points)
    const debtScore = this.scoreDebtManagement(userProfile);
    breakdown.debtManagement = debtScore;
    score -= (10 - debtScore);

    // 6. Investment Knowledge (10 points)
    const knowledgeScore = this.scoreInvestmentKnowledge(userProfile);
    breakdown.investmentKnowledge = knowledgeScore;
    score -= (10 - knowledgeScore);

    return {
      score: Math.max(0, Math.min(100, score)),
      breakdown,
      grade: this.getGrade(score),
      previousScore: this.getPreviousScore(userProfile.id),
      trend: this.calculateTrend(userProfile.id, score),
      recommendations: this.getHealthRecommendations(score, breakdown)
    };
  }

  /**
   * Score portfolio diversification (0-25)
   */
  scoreDiversification(portfolio) {
    const assets = portfolio.assets || [];
    if (assets.length === 0) return 0;

    const sectors = {};
    let totalValue = 0;

    assets.forEach(asset => {
      sectors[asset.sector] = (sectors[asset.sector] || 0) + asset.value;
      totalValue += asset.value;
    });

    // Calculate concentration
    let concentration = 0;
    Object.values(sectors).forEach(value => {
      concentration += Math.pow(value / totalValue, 2);
    });

    // Ideal HHI is around 0.10-0.20 for good diversification
    if (concentration < 0.10) return 25; // Excellent
    if (concentration < 0.15) return 22;
    if (concentration < 0.20) return 20;
    if (concentration < 0.30) return 15;
    if (concentration < 0.40) return 10;
    return 5; // Poor diversification
  }

  /**
   * Score emergency fund adequacy (0-20)
   */
  scoreEmergencyFund(portfolio, userProfile) {
    const monthlyExpenses = userProfile.monthlyExpenses || userProfile.monthlyIncome * 0.6;
    const emergencyFund = portfolio.liquidAssets || 0;
    const monthsCovered = emergencyFund / monthlyExpenses;

    if (monthsCovered >= 6) return 20; // 6+ months is excellent
    if (monthsCovered >= 3) return 15; // 3-6 months is good
    if (monthsCovered >= 1) return 10; // 1-3 months is fair
    if (monthsCovered > 0) return 5;   // Less than 1 month
    return 0; // No emergency fund
  }

  /**
   * Score savings rate (0-20)
   */
  scoreSavingsRate(userProfile, transactions) {
    const monthlyIncome = userProfile.monthlyIncome || 50000;
    
    // Calculate average monthly savings from last 3 months
    const recentTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return date > threeMonthsAgo && t.type === 'investment';
    });

    const totalSaved = recentTransactions.reduce((sum, t) => sum + t.amount, 0);
    const avgMonthly = totalSaved / 3;
    const savingsRate = avgMonthly / monthlyIncome;

    if (savingsRate >= 0.20) return 20; // 20%+ savings rate
    if (savingsRate >= 0.15) return 18;
    if (savingsRate >= 0.10) return 15;
    if (savingsRate >= 0.05) return 10;
    if (savingsRate > 0) return 5;
    return 0;
  }

  /**
   * Score portfolio growth (0-15)
   */
  scoreGrowth(portfolio, transactions) {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const yearlyTransactions = transactions.filter(t => new Date(t.date) > oneYearAgo);
    const totalValue = portfolio.totalValue || 0;
    
    if (yearlyTransactions.length === 0) return 0;

    const totalReturn = yearlyTransactions.reduce((sum, t) => sum + (t.return || 0), 0);
    const returnPercentage = (totalReturn / totalValue) * 100;

    if (returnPercentage >= 12) return 15;
    if (returnPercentage >= 8) return 12;
    if (returnPercentage >= 4) return 10;
    if (returnPercentage >= 0) return 5;
    if (returnPercentage >= -5) return 3;
    return 0;
  }

  /**
   * Score debt management (0-10)
   */
  scoreDebtManagement(userProfile) {
    const totalDebt = userProfile.totalDebt || 0;
    const monthlyIncome = userProfile.monthlyIncome || 50000;
    const debtToIncomeRatio = totalDebt / (monthlyIncome * 12);

    if (debtToIncomeRatio === 0) return 10; // No debt
    if (debtToIncomeRatio < 0.25) return 10;
    if (debtToIncomeRatio < 0.50) return 8;
    if (debtToIncomeRatio < 0.75) return 5;
    if (debtToIncomeRatio < 1.0) return 3;
    return 0;
  }

  /**
   * Score investment knowledge (0-10)
   */
  scoreInvestmentKnowledge(userProfile) {
    let score = 0;

    if (userProfile.hasCompletedInvestmentQuiz) score += 3;
    if (userProfile.hasViewedEducationalContent) score += 2;
    if (userProfile.yearsOfInvestingExperience >= 5) score += 3;
    if (userProfile.diversificationStrategy) score += 2;

    return Math.min(10, score);
  }

  /**
   * Get letter grade for score
   */
  getGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Get previous score for comparison
   */
  getPreviousScore(userId) {
    try {
      const data = JSON.parse(fs.readFileSync(this.scoresPath, 'utf8'));
      const scores = data.scores.filter(s => s.userId === userId).sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      return scores.length > 1 ? scores[1].score : null;
    } catch (err) {
      return null;
    }
  }

  /**
   * Calculate month-over-month trend
   */
  calculateTrend(userId, currentScore) {
    const previousScore = this.getPreviousScore(userId);
    if (!previousScore) return null;

    const change = currentScore - previousScore;
    return {
      direction: change > 0 ? 'up' : (change < 0 ? 'down' : 'stable'),
      change: Math.abs(change),
      percentage: ((change / previousScore) * 100).toFixed(1)
    };
  }

  /**
   * Generate recommendations based on score breakdown
   */
  getHealthRecommendations(score, breakdown) {
    const recommendations = [];

    if (breakdown.diversification < 20) {
      recommendations.push({
        priority: 'high',
        area: 'Diversification',
        action: 'Expand your portfolio across different sectors and asset classes'
      });
    }

    if (breakdown.emergencyFund < 15) {
      recommendations.push({
        priority: 'high',
        area: 'Emergency Fund',
        action: 'Build an emergency fund covering 3-6 months of expenses'
      });
    }

    if (breakdown.savingsRate < 10) {
      recommendations.push({
        priority: 'medium',
        area: 'Savings Rate',
        action: 'Try to save at least 10-15% of your income monthly'
      });
    }

    if (breakdown.debtManagement < 8) {
      recommendations.push({
        priority: 'high',
        area: 'Debt',
        action: 'Focus on reducing your debt-to-income ratio'
      });
    }

    return recommendations;
  }

  /**
   * Save health score to history
   */
  saveHealthScore(userId, scoreData) {
    try {
      const data = JSON.parse(fs.readFileSync(this.scoresPath, 'utf8'));
      
      data.scores.push({
        userId,
        ...scoreData,
        timestamp: new Date().toISOString()
      });

      // Keep only last 12 months
      data.scores = data.scores.filter(s => {
        const date = new Date(s.timestamp);
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        return date > oneYearAgo;
      });

      fs.writeFileSync(this.scoresPath, JSON.stringify(data, null, 2));
      return true;
    } catch (err) {
      console.error('Error saving health score:', err);
      return false;
    }
  }

  /**
   * Get score history for user
   */
  getScoreHistory(userId, months = 12) {
    try {
      const data = JSON.parse(fs.readFileSync(this.scoresPath, 'utf8'));
      const userScores = data.scores
        .filter(s => s.userId === userId)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .slice(-months);

      return userScores;
    } catch (err) {
      return [];
    }
  }
}

module.exports = new FinancialHealthCalculator();
