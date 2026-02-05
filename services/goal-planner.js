/**
 * SmartInvest Goal-Based Investment Planning
 * Helps users plan for retirement, education, emergency funds, etc.
 */

const fs = require('fs');
const path = require('path');

class GoalPlanner {
  constructor() {
    this.dataPath = path.join(__dirname, '../data');
    this.goalsPath = path.join(this.dataPath, 'investment-goals.json');
    this.ensureDataFile();
  }

  ensureDataFile() {
    if (!fs.existsSync(this.goalsPath)) {
      fs.writeFileSync(this.goalsPath, JSON.stringify({ goals: [] }, null, 2));
    }
  }

  /**
   * Create a new investment goal
   */
  createGoal(userId, goalData) {
    const goal = {
      id: this.generateGoalId(),
      userId,
      name: goalData.name,
      type: goalData.type, // 'retirement', 'education', 'home', 'emergency', 'vacation', 'business'
      targetAmount: goalData.targetAmount,
      currentAmount: goalData.currentAmount || 0,
      targetDate: goalData.targetDate,
      priority: goalData.priority || 'medium', // 'low', 'medium', 'high'
      status: 'active',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    // Calculate goal metrics
    goal.metrics = this.calculateGoalMetrics(goal);
    goal.recommendedStrategy = this.getRecommendedStrategy(goal);

    return this.saveGoal(goal);
  }

  /**
   * Calculate goal metrics (progress, timeline, required savings)
   */
  calculateGoalMetrics(goal) {
    const now = new Date();
    const targetDate = new Date(goal.targetDate);
    const timeRemaining = (targetDate - now) / (1000 * 60 * 60 * 24); // days
    const yearsRemaining = timeRemaining / 365;
    const monthsRemaining = timeRemaining / 30;

    const amountNeeded = goal.targetAmount - goal.currentAmount;
    const monthlyRequired = amountNeeded / monthsRemaining;
    const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;

    // Calculate required annual return
    const requiredReturn = this.calculateRequiredReturn(
      goal.currentAmount,
      monthlyRequired,
      yearsRemaining
    );

    return {
      progressPercentage: Math.min(100, progressPercentage),
      amountNeeded,
      monthlyRequired: Math.max(0, monthlyRequired),
      timeRemaining: Math.ceil(timeRemaining),
      yearsRemaining: yearsRemaining.toFixed(2),
      monthsRemaining: Math.ceil(monthsRemaining),
      requiredAnnualReturn: requiredReturn.toFixed(2),
      onTrack: this.isGoalOnTrack(goal),
      daysUntilDeadline: Math.ceil(timeRemaining)
    };
  }

  /**
   * Calculate required annual return using compound interest
   */
  calculateRequiredReturn(principal, monthlyPayment, years) {
    if (years <= 0) return 0;
    
    // Simplified calculation: we need to solve for r in FV = PV(1+r)^n + PMT[((1+r)^n-1)/r]
    // Using approximation
    const targetFV = principal + (monthlyPayment * 12 * years);
    const rate = ((Math.pow(targetFV / principal, 1 / years) - 1) * 100) || 0;
    return Math.max(0, rate);
  }

  /**
   * Get recommended investment strategy for goal
   */
  getRecommendedStrategy(goal) {
    const yearsRemaining = goal.metrics?.yearsRemaining || 1;
    const type = goal.type;

    // Time-based allocation strategy
    let allocation = {};

    if (yearsRemaining >= 10) {
      allocation = { stocks: 80, bonds: 15, cash: 5 }; // Aggressive growth
    } else if (yearsRemaining >= 5) {
      allocation = { stocks: 60, bonds: 30, cash: 10 }; // Growth
    } else if (yearsRemaining >= 2) {
      allocation = { stocks: 40, bonds: 45, cash: 15 }; // Balanced
    } else {
      allocation = { stocks: 20, bonds: 60, cash: 20 }; // Conservative
    }

    // Adjust based on goal type
    const typeStrategies = {
      'retirement': { stocks: 70, bonds: 20, cash: 10 },
      'education': { stocks: 65, bonds: 25, cash: 10 },
      'emergency': { stocks: 10, bonds: 20, cash: 70 },
      'home': { stocks: 30, bonds: 50, cash: 20 },
      'vacation': { stocks: 20, bonds: 40, cash: 40 }
    };

    if (typeStrategies[type]) {
      allocation = typeStrategies[type];
    }

    return {
      allocation,
      description: this.getStrategyDescription(type, yearsRemaining),
      riskLevel: this.determineRiskLevel(allocation),
      expectedReturn: this.estimateReturn(allocation)
    };
  }

  /**
   * Get strategy description
   */
  getStrategyDescription(type, years) {
    if (years >= 10) return `${type.charAt(0).toUpperCase() + type.slice(1)} goal with 10+ years: Growth-focused strategy`;
    if (years >= 5) return `${type.charAt(0).toUpperCase() + type.slice(1)} goal with 5-10 years: Balanced growth strategy`;
    if (years >= 2) return `${type.charAt(0).toUpperCase() + type.slice(1)} goal with 2-5 years: Moderate strategy`;
    return `${type.charAt(0).toUpperCase() + type.slice(1)} goal within 2 years: Conservative strategy`;
  }

  /**
   * Determine risk level from allocation
   */
  determineRiskLevel(allocation) {
    const stockPercentage = allocation.stocks || 0;
    if (stockPercentage >= 70) return 'high';
    if (stockPercentage >= 40) return 'medium';
    return 'low';
  }

  /**
   * Estimate annual return based on allocation
   */
  estimateReturn(allocation) {
    // Historical average returns
    const returns = {
      stocks: 0.10, // 10%
      bonds: 0.05,   // 5%
      cash: 0.02     // 2%
    };

    let expectedReturn = 0;
    Object.entries(allocation).forEach(([asset, percentage]) => {
      expectedReturn += (returns[asset] || 0) * (percentage / 100);
    });

    return (expectedReturn * 100).toFixed(2);
  }

  /**
   * Check if goal is on track
   */
  isGoalOnTrack(goal) {
    const { currentAmount, targetAmount, targetDate } = goal;
    const now = new Date();
    const targetDateObj = new Date(targetDate);
    const createdDateObj = new Date(goal.createdAt);

    const totalTimespan = targetDateObj - createdDateObj;
    const timeElapsed = now - createdDateObj;
    const timeProgress = timeElapsed / totalTimespan;

    const amountProgress = currentAmount / targetAmount;

    return amountProgress >= (timeProgress * 0.9); // Allow 10% margin
  }

  /**
   * Generate goal action plan
   */
  generateActionPlan(goal) {
    const metrics = goal.metrics;
    const strategy = goal.recommendedStrategy;

    const actions = [];

    // Action 1: Immediate contribution
    if (metrics.monthlyRequired > 0) {
      actions.push({
        priority: 'high',
        action: `Contribute ${metrics.monthlyRequired.toFixed(2)} KES monthly`,
        frequency: 'monthly',
        timeframe: 'immediate'
      });
    }

    // Action 2: Set up auto-investment
    actions.push({
      priority: 'high',
      action: 'Set up automated monthly investments',
      frequency: 'one-time setup',
      timeframe: 'this week'
    });

    // Action 3: Implement allocation strategy
    actions.push({
      priority: 'medium',
      action: `Implement allocation: ${Object.entries(strategy.allocation).map(([k, v]) => `${k} ${v}%`).join(', ')}`,
      frequency: 'quarterly review',
      timeframe: 'this month'
    });

    // Action 4: Review progress
    actions.push({
      priority: 'medium',
      action: 'Review goal progress',
      frequency: 'monthly',
      timeframe: 'ongoing'
    });

    // Action 5: Adjust if needed
    if (!this.isGoalOnTrack(goal)) {
      actions.push({
        priority: 'high',
        action: 'You are behind on this goal. Increase contributions or adjust timeline.',
        frequency: 'urgent',
        timeframe: 'immediately'
      });
    }

    return actions;
  }

  /**
   * Generate unique goal ID
   */
  generateGoalId() {
    return `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save goal
   */
  saveGoal(goal) {
    try {
      const data = JSON.parse(fs.readFileSync(this.goalsPath, 'utf8'));
      
      // Check if goal already exists and update
      const existingIndex = data.goals.findIndex(g => g.id === goal.id);
      if (existingIndex >= 0) {
        data.goals[existingIndex] = goal;
      } else {
        data.goals.push(goal);
      }

      fs.writeFileSync(this.goalsPath, JSON.stringify(data, null, 2));
      return goal;
    } catch (err) {
      console.error('Error saving goal:', err);
      return null;
    }
  }

  /**
   * Get user goals
   */
  getUserGoals(userId) {
    try {
      const data = JSON.parse(fs.readFileSync(this.goalsPath, 'utf8'));
      return data.goals.filter(g => g.userId === userId && g.status === 'active');
    } catch (err) {
      return [];
    }
  }

  /**
   * Update goal progress
   */
  updateGoalProgress(goalId, newAmount) {
    try {
      const data = JSON.parse(fs.readFileSync(this.goalsPath, 'utf8'));
      const goal = data.goals.find(g => g.id === goalId);
      
      if (goal) {
        goal.currentAmount = newAmount;
        goal.lastUpdated = new Date().toISOString();
        goal.metrics = this.calculateGoalMetrics(goal);

        // Check if goal is complete
        if (goal.currentAmount >= goal.targetAmount) {
          goal.status = 'completed';
          goal.completedAt = new Date().toISOString();
        }

        fs.writeFileSync(this.goalsPath, JSON.stringify(data, null, 2));
        return goal;
      }
      return null;
    } catch (err) {
      console.error('Error updating goal:', err);
      return null;
    }
  }

  /**
   * Get goal milestones
   */
  getMilestones(goal) {
    const milestones = [];
    const increment = goal.targetAmount / 5; // 5 milestones

    for (let i = 1; i <= 5; i++) {
      const amount = increment * i;
      milestones.push({
        percentage: (i * 20),
        amount: amount.toFixed(2),
        reached: goal.currentAmount >= amount
      });
    }

    return milestones;
  }
}

module.exports = new GoalPlanner();
