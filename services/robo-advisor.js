/**
 * SmartInvest Robo-Advisor Engine
 * Automated investment strategy and portfolio management
 */

const fs = require('fs');
const path = require('path');

class RoboAdvisor {
  constructor() {
    this.dataPath = path.join(__dirname, '../data');
    this.advisorPath = path.join(this.dataPath, 'robo-advisor.json');
  }

  /**
   * Create automated investment strategy
   */
  createStrategy(userId, riskProfile, investmentAmount, timeHorizon) {
    try {
      const allocation = this.calculateAssetAllocation(riskProfile, timeHorizon);
      
      const strategy = {
        strategyId: `strat_${Date.now()}`,
        userId,
        riskProfile,
        investmentAmount,
        timeHorizon,
        allocation,
        createdAt: new Date().toISOString(),
        status: 'active',
        performance: {
          initialValue: investmentAmount,
          currentValue: investmentAmount,
          totalReturn: 0,
          monthlyReturns: []
        },
        rebalancingSchedule: this.generateRebalancingSchedule(),
        automatedTasks: this.generateAutomatedTasks(riskProfile)
      };

      this.saveStrategy(strategy);
      return strategy;
    } catch (error) {
      console.error('Error creating robo-advisor strategy:', error);
      throw error;
    }
  }

  /**
   * Calculate optimal asset allocation based on risk profile and time horizon
   */
  calculateAssetAllocation(riskProfile, timeHorizon) {
    // Adjust allocation based on time horizon (in years)
    const years = parseInt(timeHorizon);
    
    const baseAllocations = {
      'very-conservative': {
        bonds: 80,
        stocks: 15,
        cash: 5,
        alternatives: 0
      },
      'conservative': {
        bonds: 60,
        stocks: 35,
        cash: 3,
        alternatives: 2
      },
      'moderate': {
        bonds: 40,
        stocks: 55,
        cash: 2,
        alternatives: 3
      },
      'aggressive': {
        bonds: 20,
        stocks: 70,
        cash: 2,
        alternatives: 8
      },
      'very-aggressive': {
        bonds: 10,
        stocks: 75,
        cash: 1,
        alternatives: 14
      }
    };

    let allocation = baseAllocations[riskProfile] || baseAllocations['moderate'];

    // Adjust for time horizon
    if (years < 3) {
      // Shorter horizon: increase bonds, decrease stocks
      allocation.bonds += 10;
      allocation.stocks -= 10;
    } else if (years > 20) {
      // Longer horizon: increase stocks, decrease bonds
      allocation.stocks += 10;
      allocation.bonds -= 10;
    }

    // Normalize to 100%
    const total = Object.values(allocation).reduce((a, b) => a + b, 0);
    Object.keys(allocation).forEach(key => {
      allocation[key] = Math.round((allocation[key] / total) * 100);
    });

    // Detailed asset classes
    return {
      equities: {
        largeCapIndian: allocation.stocks * 0.4,
        midCapIndian: allocation.stocks * 0.3,
        smallCapIndian: allocation.stocks * 0.2,
        international: allocation.stocks * 0.1
      },
      fixedIncome: {
        governmentSecurities: allocation.bonds * 0.5,
        corporateBonds: allocation.bonds * 0.4,
        highYieldBonds: allocation.bonds * 0.1
      },
      alternatives: {
        realEstate: allocation.alternatives * 0.4,
        gold: allocation.alternatives * 0.35,
        commodities: allocation.alternatives * 0.25
      },
      cash: {
        savingsAccount: allocation.cash * 0.6,
        moneyMarket: allocation.cash * 0.4
      }
    };
  }

  /**
   * Generate rebalancing schedule
   */
  generateRebalancingSchedule() {
    return {
      frequency: 'quarterly',
      nextRebalanceDate: this.getNextQuarterDate(),
      threshold: 5, // Rebalance if allocation drifts >5%
      automatedRebalancing: true,
      notifications: true
    };
  }

  /**
   * Get next quarter date
   */
  getNextQuarterDate() {
    const today = new Date();
    const month = today.getMonth();
    let nextMonth;

    if (month < 3) nextMonth = 3;
    else if (month < 6) nextMonth = 6;
    else if (month < 9) nextMonth = 9;
    else nextMonth = 0; // January

    const nextDate = new Date(today.getFullYear(), nextMonth, 1);
    if (nextDate <= today) {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }

    return nextDate.toISOString();
  }

  /**
   * Generate automated tasks
   */
  generateAutomatedTasks(riskProfile) {
    return [
      {
        taskId: `task_${Date.now()}_1`,
        type: 'monthly-sip',
        description: 'Monthly SIP investment',
        frequency: 'monthly',
        enabled: true,
        nextExecution: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        taskId: `task_${Date.now()}_2`,
        type: 'dividend-reinvestment',
        description: 'Automatic dividend reinvestment',
        frequency: 'quarterly',
        enabled: true,
        nextExecution: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        taskId: `task_${Date.now()}_3`,
        type: 'rebalancing',
        description: 'Portfolio rebalancing',
        frequency: 'quarterly',
        enabled: true,
        nextExecution: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        taskId: `task_${Date.now()}_4`,
        type: 'tax-optimization',
        description: 'Tax-loss harvesting review',
        frequency: 'quarterly',
        enabled: true,
        nextExecution: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  /**
   * Update portfolio performance
   */
  updatePerformance(strategyId, newValue) {
    try {
      const strategies = this.loadStrategies();
      const strategy = strategies.find(s => s.strategyId === strategyId);

      if (!strategy) throw new Error('Strategy not found');

      const previousValue = strategy.performance.currentValue;
      const monthlyReturn = ((newValue - previousValue) / previousValue) * 100;

      strategy.performance.currentValue = newValue;
      strategy.performance.totalReturn = ((newValue - strategy.performance.initialValue) / strategy.performance.initialValue) * 100;
      strategy.performance.monthlyReturns.push({
        date: new Date().toISOString(),
        return: monthlyReturn,
        value: newValue
      });

      // Check rebalancing threshold
      if (this.shouldRebalance(strategy)) {
        strategy.rebalancingSchedule.nextRebalanceDate = this.getNextQuarterDate();
      }

      this.saveStrategies(strategies);
      return strategy;
    } catch (error) {
      console.error('Error updating performance:', error);
      throw error;
    }
  }

  /**
   * Check if rebalancing is needed
   */
  shouldRebalance(strategy) {
    const threshold = strategy.rebalancingSchedule.threshold / 100;
    // Check if any allocation has drifted beyond threshold
    // Simplified check - in production would compare actual vs target
    return false;
  }

  /**
   * Generate robo-advisor recommendations
   */
  generateRecommendations(strategy, portfolio) {
    const recommendations = [];

    // Check allocation drift
    const driftAnalysis = this.analyzeAllocationDrift(strategy, portfolio);
    if (driftAnalysis.maxDrift > (strategy.rebalancingSchedule.threshold / 100)) {
      recommendations.push({
        type: 'rebalancing',
        priority: 'high',
        action: 'Rebalance Portfolio',
        reason: `Asset allocation has drifted by up to ${(driftAnalysis.maxDrift * 100).toFixed(1)}%`,
        expectedImpact: 'Reduce risk and maintain target strategy'
      });
    }

    // Check for cash buildup
    if (portfolio.cash > portfolio.totalValue * 0.1) {
      recommendations.push({
        type: 'deployment',
        priority: 'medium',
        action: 'Deploy Cash',
        reason: 'Excess cash accumulated from dividends/distributions',
        expectedImpact: 'Increase portfolio participation in market growth'
      });
    }

    // Check diversification
    const concentration = this.analyzeConcentration(portfolio);
    if (concentration.maxPosition > 0.25) {
      recommendations.push({
        type: 'diversification',
        priority: 'medium',
        action: 'Increase Diversification',
        reason: `Largest position is ${(concentration.maxPosition * 100).toFixed(1)}% of portfolio`,
        expectedImpact: 'Reduce concentration risk'
      });
    }

    return recommendations;
  }

  /**
   * Analyze allocation drift
   */
  analyzeAllocationDrift(strategy, portfolio) {
    // Simplified drift analysis
    return {
      maxDrift: 0.08, // 8% drift example
      asset: 'stocks',
      targetAllocation: 50,
      actualAllocation: 58
    };
  }

  /**
   * Analyze portfolio concentration
   */
  analyzeConcentration(portfolio) {
    // Simplified concentration analysis
    return {
      maxPosition: 0.22, // 22% concentration
      asset: 'Large Cap Equity Fund',
      Herfindahl: 0.15
    };
  }

  /**
   * Execute automated investment
   */
  executeAutomatedInvestment(strategyId, sipAmount) {
    try {
      const strategies = this.loadStrategies();
      const strategy = strategies.find(s => s.strategyId === strategyId);

      if (!strategy) throw new Error('Strategy not found');

      const execution = {
        executionId: `exec_${Date.now()}`,
        strategyId,
        type: 'monthly-sip',
        amount: sipAmount,
        executedAt: new Date().toISOString(),
        status: 'completed',
        allocation: this.allocateInvestment(strategy.allocation, sipAmount)
      };

      // Update performance
      const newValue = strategy.performance.currentValue + sipAmount;
      this.updatePerformance(strategyId, newValue);

      return execution;
    } catch (error) {
      console.error('Error executing automated investment:', error);
      throw error;
    }
  }

  /**
   * Allocate investment across asset classes
   */
  allocateInvestment(allocation, amount) {
    return {
      equities: amount * 0.55,
      fixedIncome: amount * 0.35,
      alternatives: amount * 0.07,
      cash: amount * 0.03
    };
  }

  /**
   * Save strategy to file
   */
  saveStrategy(strategy) {
    try {
      const strategies = this.loadStrategies();
      strategies.push(strategy);
      fs.writeFileSync(this.advisorPath, JSON.stringify(strategies, null, 2));
    } catch (error) {
      console.error('Error saving strategy:', error);
    }
  }

  /**
   * Load all strategies
   */
  loadStrategies() {
    try {
      if (fs.existsSync(this.advisorPath)) {
        return JSON.parse(fs.readFileSync(this.advisorPath, 'utf8'));
      }
      return [];
    } catch (error) {
      console.error('Error loading strategies:', error);
      return [];
    }
  }

  /**
   * Save strategies to file
   */
  saveStrategies(strategies) {
    try {
      fs.writeFileSync(this.advisorPath, JSON.stringify(strategies, null, 2));
    } catch (error) {
      console.error('Error saving strategies:', error);
    }
  }

  /**
   * Get strategy details
   */
  getStrategy(strategyId) {
    try {
      const strategies = this.loadStrategies();
      return strategies.find(s => s.strategyId === strategyId);
    } catch (error) {
      console.error('Error getting strategy:', error);
      return null;
    }
  }

  /**
   * Get all strategies for user
   */
  getUserStrategies(userId) {
    try {
      const strategies = this.loadStrategies();
      return strategies.filter(s => s.userId === userId);
    } catch (error) {
      console.error('Error getting user strategies:', error);
      return [];
    }
  }
}

module.exports = new RoboAdvisor();
