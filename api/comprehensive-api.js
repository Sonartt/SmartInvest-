/**
 * SmartInvest Comprehensive API Routes
 * Exposes all intelligent financial services as REST endpoints
 */

const express = require('express');
const router = express.Router();

// Import all services
const recommendationEngine = require('../services/recommendation-engine');
const financialHealthCalculator = require('../services/financial-health-calculator');
const smartAlerts = require('../services/smart-alerts-system');
const goalPlanner = require('../services/goal-planner');
const riskAssessment = require('../services/risk-assessment');
const performanceAnalytics = require('../services/performance-analytics');
const roboAdvisor = require('../services/robo-advisor');
const taxPlanner = require('../services/tax-planner');
const educationalContent = require('../services/educational-content');
const securityRecommendations = require('../services/security-recommendations');
const communityFeatures = require('../services/community-features');
const savingsTracker = require('../services/savings-tracker');
const liveMarketWidget = require('../services/live-market-widget');

// ============================================================
// RECOMMENDATION ENGINE ENDPOINTS
// ============================================================

/**
 * POST /api/recommendations/generate
 * Generate personalized investment recommendations
 */
router.post('/recommendations/generate', (req, res) => {
  try {
    const { userProfile, portfolio } = req.body;
    
    if (!userProfile || !portfolio) {
      return res.status(400).json({ error: 'userProfile and portfolio required' });
    }

    const recommendations = recommendationEngine.generateRecommendations(userProfile, portfolio);
    res.json({
      success: true,
      recommendations,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// FINANCIAL HEALTH ENDPOINTS
// ============================================================

/**
 * POST /api/health/calculate
 * Calculate financial health score
 */
router.post('/health/calculate', (req, res) => {
  try {
    const { userProfile, portfolio, transactions } = req.body;
    
    if (!userProfile || !portfolio || !transactions) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const healthScore = financialHealthCalculator.calculateHealthScore(userProfile, portfolio, transactions);
    const insights = financialHealthCalculator.getHealthInsights(userProfile, portfolio);

    res.json({
      success: true,
      healthScore,
      insights,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/health/:userId
 * Get user's financial health report
 */
router.get('/health/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    // In production, fetch from database
    res.json({
      success: true,
      message: 'Financial health report',
      userId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// SMART ALERTS ENDPOINTS
// ============================================================

/**
 * POST /api/alerts/create
 * Create a new alert
 */
router.post('/alerts/create', (req, res) => {
  try {
    const { userId, alertType, alertData } = req.body;
    
    if (!userId || !alertType || !alertData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let alert;
    switch (alertType) {
      case 'price':
        alert = smartAlerts.createPriceAlert(userId, alertData.assetId, alertData.price, alertData.type, alertData.threshold);
        break;
      case 'volatility':
        alert = smartAlerts.createVolatilityAlert(userId, alertData.indexName, alertData.volatilityLevel);
        break;
      case 'tax':
        alert = smartAlerts.createTaxOptimizationAlert(userId, alertData.portfolio);
        break;
      case 'security':
        alert = smartAlerts.createSecurityAlert(userId, alertData.eventType, alertData.details);
        break;
      case 'rebalancing':
        alert = smartAlerts.createRebalancingAlert(userId, alertData.portfolio);
        break;
      case 'goal':
        alert = smartAlerts.createSavingsGoalAlert(userId, alertData.goal);
        break;
      default:
        return res.status(400).json({ error: 'Invalid alert type' });
    }

    res.json({
      success: true,
      alert,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/alerts/:userId
 * Get all alerts for user
 */
router.get('/alerts/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const alerts = smartAlerts.getUserAlerts(userId);
    
    res.json({
      success: true,
      alerts,
      count: alerts.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// GOAL PLANNER ENDPOINTS
// ============================================================

/**
 * POST /api/goals/create
 * Create a new investment goal
 */
router.post('/goals/create', (req, res) => {
  try {
    const { userId, goalData } = req.body;
    
    if (!userId || !goalData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const goal = goalPlanner.createGoal(userId, goalData);
    
    res.json({
      success: true,
      goal,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/goals/:userId
 * Get all goals for user
 */
router.get('/goals/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const goals = goalPlanner.getUserGoals(userId);
    
    res.json({
      success: true,
      goals,
      count: goals.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/goals/:goalId/actionplan
 * Get action plan for goal
 */
router.get('/goals/:goalId/actionplan', (req, res) => {
  try {
    const { goalId } = req.params;
    // In production, fetch goal from database
    const actionPlan = goalPlanner.generateActionPlan({ id: goalId });
    
    res.json({
      success: true,
      actionPlan
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// RISK ASSESSMENT ENDPOINTS
// ============================================================

/**
 * GET /api/risk/questionnaire
 * Get risk assessment questionnaire
 */
router.get('/risk/questionnaire', (req, res) => {
  try {
    const questionnaire = riskAssessment.getQuestionnaire();
    
    res.json({
      success: true,
      questionnaire,
      totalQuestions: questionnaire.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/risk/calculate
 * Calculate risk profile from answers
 */
router.post('/risk/calculate', (req, res) => {
  try {
    const { answers } = req.body;
    
    if (!answers || answers.length === 0) {
      return res.status(400).json({ error: 'Answers required' });
    }

    const riskScore = riskAssessment.calculateRiskScore(answers);
    const riskTolerance = riskAssessment.determineTolerance(riskScore);
    const allocation = riskAssessment.getAllocation(riskTolerance);

    res.json({
      success: true,
      riskScore,
      riskTolerance,
      allocation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// PERFORMANCE ANALYTICS ENDPOINTS
// ============================================================

/**
 * POST /api/analytics/metrics
 * Calculate portfolio performance metrics
 */
router.post('/analytics/metrics', (req, res) => {
  try {
    const { portfolio, transactions } = req.body;
    
    if (!portfolio || !transactions) {
      return res.status(400).json({ error: 'Portfolio and transactions required' });
    }

    const metrics = performanceAnalytics.calculateMetrics(portfolio, transactions);
    
    res.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/analytics/report
 * Generate comprehensive performance report
 */
router.post('/analytics/report', (req, res) => {
  try {
    const { portfolio, transactions } = req.body;
    
    if (!portfolio || !transactions) {
      return res.status(400).json({ error: 'Portfolio and transactions required' });
    }

    const report = performanceAnalytics.generateReport(portfolio, transactions);
    
    res.json({
      success: true,
      report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// ROBO-ADVISOR ENDPOINTS
// ============================================================

/**
 * POST /api/robo-advisor/strategy
 * Create automated investment strategy
 */
router.post('/robo-advisor/strategy', (req, res) => {
  try {
    const { userId, riskProfile, investmentAmount, timeHorizon } = req.body;
    
    if (!userId || !riskProfile || !investmentAmount || !timeHorizon) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const strategy = roboAdvisor.createStrategy(userId, riskProfile, investmentAmount, timeHorizon);
    
    res.json({
      success: true,
      strategy,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/robo-advisor/strategy/:strategyId
 * Get robo-advisor strategy details
 */
router.get('/robo-advisor/strategy/:strategyId', (req, res) => {
  try {
    const { strategyId } = req.params;
    const strategy = roboAdvisor.getStrategy(strategyId);
    
    if (!strategy) {
      return res.status(404).json({ error: 'Strategy not found' });
    }

    res.json({
      success: true,
      strategy
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// TAX PLANNING ENDPOINTS
// ============================================================

/**
 * POST /api/tax/plan
 * Create personalized tax plan
 */
router.post('/tax/plan', (req, res) => {
  try {
    const { userId, income, investmentPortfolio, savingsGoals } = req.body;
    
    if (!userId || !income) {
      return res.status(400).json({ error: 'userId and income required' });
    }

    const taxPlan = taxPlanner.createTaxPlan(userId, income, investmentPortfolio || {}, savingsGoals || []);
    
    res.json({
      success: true,
      taxPlan,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tax/loss-harvesting
 * Get tax-loss harvesting opportunities
 */
router.post('/api/tax/loss-harvesting', (req, res) => {
  try {
    const { portfolio } = req.body;
    
    if (!portfolio) {
      return res.status(400).json({ error: 'Portfolio required' });
    }

    const opportunities = taxPlanner.calculateTaxLossHarvesting(portfolio);
    
    res.json({
      success: true,
      opportunities,
      potentialSavings: opportunities.reduce((sum, opp) => sum + parseFloat(opp.taxSavings), 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// EDUCATIONAL CONTENT ENDPOINTS
// ============================================================

/**
 * GET /api/education/learning-path
 * Get personalized learning path
 */
router.get('/api/education/learning-path/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { goal } = req.query;
    
    // In production, fetch user profile from database
    const learningPath = educationalContent.getPersonalizedPath(
      { userId, experience: 'beginner' },
      goal || 'investing'
    );
    
    res.json({
      success: true,
      learningPath
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/education/trending
 * Get trending educational content
 */
router.get('/api/education/trending', (req, res) => {
  try {
    const content = educationalContent.getTrendingContent();
    
    res.json({
      success: true,
      content
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/education/search
 * Search educational content
 */
router.get('/api/education/search', (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const results = educationalContent.searchContent(q);
    
    res.json({
      success: true,
      results,
      count: Object.values(results).reduce((sum, arr) => sum + arr.length, 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// SECURITY RECOMMENDATIONS ENDPOINTS
// ============================================================

/**
 * POST /api/security/recommendations
 * Generate security recommendations
 */
router.post('/api/security/recommendations', (req, res) => {
  try {
    const { userProfile, accountActivity } = req.body;
    
    if (!userProfile || !accountActivity) {
      return res.status(400).json({ error: 'userProfile and accountActivity required' });
    }

    const securityRecs = securityRecommendations.generateSecurityRecommendations(userProfile, accountActivity);
    
    res.json({
      success: true,
      ...securityRecs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/security/best-practices
 * Get security best practices
 */
router.get('/api/security/best-practices', (req, res) => {
  try {
    const practices = securityRecommendations.getSecurityBestPractices();
    
    res.json({
      success: true,
      practices
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// COMMUNITY FEATURES ENDPOINTS
// ============================================================

/**
 * GET /api/community/leaderboard
 * Get community leaderboard
 */
router.get('/api/community/leaderboard', (req, res) => {
  try {
    // In production, fetch all users from database
    const leaderboard = communityFeatures.createLeaderboard([]);
    
    res.json({
      success: true,
      leaderboard
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/community/compare
 * Compare user portfolios
 */
router.post('/api/community/compare', (req, res) => {
  try {
    const { userId1, userId2 } = req.body;
    
    if (!userId1 || !userId2) {
      return res.status(400).json({ error: 'Both userId1 and userId2 required' });
    }

    // In production, fetch user profiles from database
    const comparison = communityFeatures.compareProfiles(userId1, userId2, []);
    
    res.json({
      success: true,
      comparison
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// SAVINGS TRACKER ENDPOINTS
// ============================================================

/**
 * POST /api/savings/challenge
 * Create savings challenge
 */
router.post('/api/savings/challenge', (req, res) => {
  try {
    const { userId, challengeType, targetAmount, duration } = req.body;
    
    if (!userId || !challengeType || !targetAmount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const challenge = savingsTracker.createChallenge(userId, challengeType, targetAmount, duration);
    
    res.json({
      success: true,
      challenge
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/savings/track
 * Track daily savings
 */
router.post('/api/savings/track', (req, res) => {
  try {
    const { challengeId, amount } = req.body;
    
    if (!challengeId || amount === undefined) {
      return res.status(400).json({ error: 'challengeId and amount required' });
    }

    const checkIn = savingsTracker.trackDailySavings(challengeId, amount);
    
    res.json({
      success: true,
      checkIn
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// LIVE MARKET DATA ENDPOINTS
// ============================================================

/**
 * GET /api/market/indices
 * Get market indices
 */
router.get('/api/market/indices', (req, res) => {
  try {
    const indices = liveMarketWidget.getIndices();
    const status = liveMarketWidget.getMarketStatus();
    
    res.json({
      success: true,
      indices,
      status
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/market/gainers
 * Get top gainers
 */
router.get('/api/market/gainers', (req, res) => {
  try {
    const gainers = liveMarketWidget.getTopGainers();
    
    res.json({
      success: true,
      gainers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/market/losers
 * Get top losers
 */
router.get('/api/market/losers', (req, res) => {
  try {
    const losers = liveMarketWidget.getTopLosers();
    
    res.json({
      success: true,
      losers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/market/stock/:symbol
 * Get stock details
 */
router.get('/api/market/stock/:symbol', (req, res) => {
  try {
    const { symbol } = req.params;
    const stock = liveMarketWidget.getStockDetails(symbol);
    
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    res.json({
      success: true,
      stock
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/market/sectors
 * Get sector performance
 */
router.get('/api/market/sectors', (req, res) => {
  try {
    const sectors = liveMarketWidget.getSectorPerformance();
    
    res.json({
      success: true,
      sectors
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/market/news
 * Get market news
 */
router.get('/api/market/news', (req, res) => {
  try {
    const news = liveMarketWidget.getMarketNews();
    
    res.json({
      success: true,
      news
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
