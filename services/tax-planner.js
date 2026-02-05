/**
 * SmartInvest Tax Planning & Optimization Engine
 * Tax-efficient investment strategies and planning
 */

const fs = require('fs');
const path = require('path');

class TaxPlanner {
  constructor() {
    this.dataPath = path.join(__dirname, '../data');
    this.taxPath = path.join(this.dataPath, 'tax-plans.json');
  }

  /**
   * Create comprehensive tax plan
   */
  createTaxPlan(userId, income, investmentPortfolio, savingsGoals) {
    try {
      const taxPlan = {
        planId: `tax_${Date.now()}`,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        income,
        estimatedTaxLiability: this.calculateEstimatedTax(income),
        taxBracket: this.getTaxBracket(income),
        strategies: this.generateTaxStrategies(income, investmentPortfolio),
        savingsOpportunities: this.identifySavingsOpportunities(income, savingsGoals),
        estimatedSavings: 0,
        recommendations: []
      };

      // Calculate estimated savings
      taxPlan.estimatedSavings = this.calculateEstimatedSavings(taxPlan.strategies);
      taxPlan.recommendations = this.generateRecommendations(taxPlan);

      this.saveTaxPlan(taxPlan);
      return taxPlan;
    } catch (error) {
      console.error('Error creating tax plan:', error);
      throw error;
    }
  }

  /**
   * Calculate estimated tax liability
   */
  calculateEstimatedTax(income) {
    const indianTaxBrackets = [
      { min: 0, max: 250000, rate: 0 },
      { min: 250000, max: 500000, rate: 0.05 },
      { min: 500000, max: 1000000, rate: 0.20 },
      { min: 1000000, max: 1500000, rate: 0.30 },
      { min: 1500000, max: Infinity, rate: 0.30 }
    ];

    let tax = 0;
    for (let bracket of indianTaxBrackets) {
      if (income > bracket.min) {
        const taxableIncome = Math.min(income, bracket.max) - bracket.min;
        tax += taxableIncome * bracket.rate;
      }
    }

    // Add applicable cess (4% on total tax)
    tax = tax * 1.04;

    return tax.toFixed(2);
  }

  /**
   * Get tax bracket info
   */
  getTaxBracket(income) {
    const brackets = [
      { min: 0, max: 250000, bracket: 'Nil', rate: '0%' },
      { min: 250000, max: 500000, bracket: '5%', rate: '5%' },
      { min: 500000, max: 1000000, bracket: '20%', rate: '20%' },
      { min: 1000000, max: 1500000, bracket: '30%', rate: '30%' },
      { min: 1500000, max: Infinity, bracket: '30% (Plus CE)', rate: '30%' }
    ];

    const bracket = brackets.find(b => income >= b.min && income < b.max);
    return bracket || brackets[brackets.length - 1];
  }

  /**
   * Generate tax optimization strategies
   */
  generateTaxStrategies(income, portfolio) {
    const strategies = [];

    // Strategy 1: Tax-deferred investments
    strategies.push({
      strategyId: `str_${Date.now()}_1`,
      name: 'Maximize Tax-Deferred Accounts',
      description: 'Contribute to 80C investments',
      type: '80C',
      vehicles: [
        { name: 'ELSS', limit: 150000, benefit: 'Equity tax gain benefit' },
        { name: 'NSC', limit: 500000, benefit: 'Fixed income security' },
        { name: 'PPF', limit: 150000, benefit: 'Guaranteed returns, exempt interest' },
        { name: 'Life Insurance Premium', limit: 'Unlimited', benefit: 'Protection + savings' }
      ],
      potentialSavings: this.calculateSavings(income, 150000, 0.30),
      priority: 'high'
    });

    // Strategy 2: Dividends and interest optimization
    strategies.push({
      strategyId: `str_${Date.now()}_2`,
      name: 'Dividend Tax Optimization',
      description: 'Manage dividend income efficiently',
      type: 'dividend-income',
      tactics: [
        'Harvest tax losses on dividend-paying stocks',
        'Use spouse\'s lower bracket for dividend income',
        'Reinvest dividends for compounding',
        'Consider tax-free dividend ETFs'
      ],
      potentialSavings: this.calculateSavings(income, portfolio.dividendIncome || 0, 0.20),
      priority: 'high'
    });

    // Strategy 3: Capital gains optimization
    strategies.push({
      strategyId: `str_${Date.now()}_3`,
      name: 'Capital Gains Planning',
      description: 'Optimize long-term vs short-term gains',
      type: 'capital-gains',
      tactics: [
        'Hold investments >1 year for long-term gains (indexation benefit)',
        'Time realization of losses to offset gains',
        'Stagger gains across years if possible',
        'Use indexation on real estate/gold investments'
      ],
      potentialSavings: this.calculateSavings(income, portfolio.capitalGains || 0, 0.30),
      priority: 'high'
    });

    // Strategy 4: Home loan interest deduction
    strategies.push({
      strategyId: `str_${Date.now()}_4`,
      name: 'Home Loan Optimization',
      description: 'Maximize home loan interest deductions',
      type: 'home-loan',
      deductionLimit: 200000,
      potentialSavings: Math.min(200000, portfolio.homeInterest || 0) * (parseFloat(this.getTaxBracket(income).rate) || 0.30),
      priority: 'medium'
    });

    // Strategy 5: 80D Health Insurance
    strategies.push({
      strategyId: `str_${Date.now()}_5`,
      name: 'Health Insurance Deduction',
      description: 'Claim 80D health insurance premium deduction',
      type: '80D',
      deductionLimit: 60000, // 50000 base + 10000 for parents over 60
      potentialSavings: 60000 * (parseFloat(this.getTaxBracket(income).rate) || 0.30),
      priority: 'medium'
    });

    return strategies;
  }

  /**
   * Identify savings opportunities
   */
  identifySavingsOpportunities(income, savingsGoals) {
    const opportunities = [];

    // Opportunity 1: Education savings
    opportunities.push({
      opportunityId: `opp_${Date.now()}_1`,
      name: '80E - Education Loan Interest',
      description: 'Deduction on education loan interest',
      condition: 'Have active education loan',
      deductionLimit: 'No limit',
      annualBenefit: 'Variable based on interest paid'
    });

    // Opportunity 2: Charitable giving
    opportunities.push({
      opportunityId: `opp_${Date.now()}_2`,
      name: '80G - Charitable Donations',
      description: 'Deduction for approved charitable donations',
      condition: 'Donate to eligible organizations',
      deductionLimit: '100% of taxable income',
      annualBenefit: (100000 * (parseFloat(this.getTaxBracket(income).rate) || 0.30)).toFixed(2)
    });

    // Opportunity 3: Senior citizens savings
    opportunities.push({
      opportunityId: `opp_${Date.now()}_3`,
      name: 'Senior Citizens Scheme',
      description: 'Special tax treatment for senior citizens',
      condition: 'Age above 60 years',
      deductionLimit: 'Age exemption benefits',
      annualBenefit: 'Reduced tax liability'
    });

    // Opportunity 4: Business loss offset
    opportunities.push({
      opportunityId: `opp_${Date.now()}_4`,
      name: 'Loss Carry Forward',
      description: 'Offset business losses against future income',
      condition: 'Have business losses',
      deductionLimit: '8 years for most losses',
      annualBenefit: 'Variable based on loss amount'
    });

    return opportunities;
  }

  /**
   * Calculate estimated tax savings
   */
  calculateSavings(income, investmentAmount, marginalRate) {
    const rate = parseFloat(this.getTaxBracket(income).rate) || marginalRate;
    return investmentAmount * rate;
  }

  /**
   * Calculate total estimated savings
   */
  calculateEstimatedSavings(strategies) {
    return strategies.reduce((total, strategy) => {
      return total + (strategy.potentialSavings || 0);
    }, 0).toFixed(2);
  }

  /**
   * Generate tax planning recommendations
   */
  generateRecommendations(taxPlan) {
    const recommendations = [];

    const estimatedSavings = parseFloat(taxPlan.estimatedSavings);
    
    if (estimatedSavings > 100000) {
      recommendations.push({
        priority: 'high',
        action: 'Implement Tax Strategies',
        expectedSavings: estimatedSavings.toFixed(2),
        description: `Implementing recommended strategies can save approximately ₹${estimatedSavings.toFixed(2)} in taxes`
      });
    }

    recommendations.push({
      priority: 'high',
      action: 'Maximize 80C Investments',
      expectedSavings: (150000 * (parseFloat(taxPlan.taxBracket.rate) || 0.30)).toFixed(2),
      description: 'Invest in ELSS, PPF, NSC to maximize ₹1.5 lakh 80C limit'
    });

    recommendations.push({
      priority: 'medium',
      action: 'Plan Capital Gains Realization',
      description: 'Stagger capital gains realization across financial years to optimize tax'
    });

    recommendations.push({
      priority: 'medium',
      action: 'Use Tax-Loss Harvesting',
      description: 'Periodically review portfolio for losses to offset against gains'
    });

    return recommendations;
  }

  /**
   * Generate tax report
   */
  generateTaxReport(userId, financialYear = '2023-24') {
    try {
      const plans = this.loadTaxPlans();
      const userPlans = plans.filter(p => p.userId === userId);

      if (userPlans.length === 0) {
        return { error: 'No tax plans found for user' };
      }

      const latestPlan = userPlans.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      )[0];

      return {
        financialYear,
        estimatedTaxLiability: latestPlan.estimatedTaxLiability,
        taxBracket: latestPlan.taxBracket,
        applicableStrategies: latestPlan.strategies,
        estimatedSavings: latestPlan.estimatedSavings,
        recommendations: latestPlan.recommendations,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating tax report:', error);
      throw error;
    }
  }

  /**
   * Calculate tax-loss harvesting opportunities
   */
  calculateTaxLossHarvesting(portfolio) {
    const opportunities = [];

    portfolio.forEach(asset => {
      if (asset.currentValue < asset.costBasis) {
        const loss = asset.costBasis - asset.currentValue;
        const holdingPeriod = new Date() - new Date(asset.purchaseDate);
        const isLongTerm = holdingPeriod > 365 * 24 * 60 * 60 * 1000;

        opportunities.push({
          assetId: asset.id,
          asset: asset.symbol,
          loss: loss.toFixed(2),
          isLongTerm,
          taxSavings: (loss * 0.30).toFixed(2),
          recommendation: 'Harvest this loss to offset capital gains'
        });
      }
    });

    return opportunities.sort((a, b) => b.taxSavings - a.taxSavings);
  }

  /**
   * Save tax plan to file
   */
  saveTaxPlan(taxPlan) {
    try {
      const plans = this.loadTaxPlans();
      plans.push(taxPlan);
      fs.writeFileSync(this.taxPath, JSON.stringify(plans, null, 2));
    } catch (error) {
      console.error('Error saving tax plan:', error);
    }
  }

  /**
   * Load tax plans from file
   */
  loadTaxPlans() {
    try {
      if (fs.existsSync(this.taxPath)) {
        return JSON.parse(fs.readFileSync(this.taxPath, 'utf8'));
      }
      return [];
    } catch (error) {
      console.error('Error loading tax plans:', error);
      return [];
    }
  }
}

module.exports = new TaxPlanner();
