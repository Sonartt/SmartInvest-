/**
 * SmartInvest Performance Analytics & Reporting
 * Comprehensive portfolio analytics and performance tracking
 */

const fs = require('fs');
const path = require('path');

class PerformanceAnalytics {
  constructor() {
    this.dataPath = path.join(__dirname, '../data');
    this.analyticsPath = path.join(this.dataPath, 'analytics.json');
  }

  /**
   * Calculate portfolio performance metrics
   */
  calculateMetrics(portfolio, transactions) {
    const metrics = {};

    // 1. Total Return
    metrics.totalReturn = this.calculateTotalReturn(portfolio, transactions);

    // 2. Time-weighted Returns
    metrics.oneMonthReturn = this.calculateTimeWeightedReturn(transactions, 30);
    metrics.threeMonthReturn = this.calculateTimeWeightedReturn(transactions, 90);
    metrics.sixMonthReturn = this.calculateTimeWeightedReturn(transactions, 180);
    metrics.oneYearReturn = this.calculateTimeWeightedReturn(transactions, 365);

    // 3. Sharpe Ratio
    metrics.sharpeRatio = this.calculateSharpeRatio(transactions);

    // 4. Max Drawdown
    metrics.maxDrawdown = this.calculateMaxDrawdown(transactions);

    // 5. Volatility
    metrics.volatility = this.calculateVolatility(transactions);

    // 6. Win/Loss Ratio
    metrics.winLossRatio = this.calculateWinLossRatio(transactions);

    // 7. Best/Worst Days
    metrics.bestDay = this.getBestDay(transactions);
    metrics.worstDay = this.getWorstDay(transactions);

    // 8. Benchmarking
    metrics.vsNSE = this.compareToBenchmark(portfolio, 'NSE');
    metrics.vsMSCI = this.compareToBenchmark(portfolio, 'MSCI');

    return metrics;
  }

  /**
   * Calculate total return percentage
   */
  calculateTotalReturn(portfolio, transactions) {
    const currentValue = portfolio.currentValue || 0;
    const totalInvested = portfolio.totalInvested || 0;

    if (totalInvested === 0) return 0;

    const totalReturn = ((currentValue - totalInvested) / totalInvested) * 100;
    return totalReturn.toFixed(2);
  }

  /**
   * Calculate time-weighted return
   */
  calculateTimeWeightedReturn(transactions, days) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const relevantTransactions = transactions.filter(t => 
      new Date(t.date) >= cutoffDate
    );

    if (relevantTransactions.length === 0) return 0;

    const returns = relevantTransactions.map(t => t.return || 0);
    const totalReturn = returns.reduce((a, b) => a + b, 0);

    return (totalReturn / relevantTransactions.length).toFixed(2);
  }

  /**
   * Calculate Sharpe Ratio
   * Measures risk-adjusted return
   */
  calculateSharpeRatio(transactions, riskFreeRate = 0.04) {
    const returns = transactions.map(t => t.return || 0);
    
    if (returns.length === 0) return 0;

    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;

    const sharpeRatio = (avgReturn - riskFreeRate) / stdDev;
    return sharpeRatio.toFixed(2);
  }

  /**
   * Calculate maximum drawdown
   * Largest peak-to-trough decline
   */
  calculateMaxDrawdown(transactions) {
    if (transactions.length === 0) return 0;

    let peak = 0;
    let maxDrawdown = 0;

    transactions.forEach(t => {
      const value = t.portfolioValue || 0;
      
      if (value > peak) {
        peak = value;
      }
      
      const drawdown = (peak - value) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });

    return (maxDrawdown * 100).toFixed(2);
  }

  /**
   * Calculate portfolio volatility (standard deviation)
   */
  calculateVolatility(transactions) {
    const returns = transactions.map(t => t.return || 0);
    
    if (returns.length < 2) return 0;

    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1);
    const volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized

    return (volatility * 100).toFixed(2);
  }

  /**
   * Calculate win/loss ratio
   */
  calculateWinLossRatio(transactions) {
    const wins = transactions.filter(t => (t.return || 0) > 0).length;
    const losses = transactions.filter(t => (t.return || 0) < 0).length;

    if (losses === 0) return wins > 0 ? Infinity : 0;

    return (wins / losses).toFixed(2);
  }

  /**
   * Get best performing day
   */
  getBestDay(transactions) {
    if (transactions.length === 0) return null;

    const bestTransaction = transactions.reduce((max, t) => 
      (t.return || 0) > (max.return || 0) ? t : max
    );

    return {
      date: bestTransaction.date,
      return: bestTransaction.return,
      asset: bestTransaction.asset
    };
  }

  /**
   * Get worst performing day
   */
  getWorstDay(transactions) {
    if (transactions.length === 0) return null;

    const worstTransaction = transactions.reduce((min, t) => 
      (t.return || 0) < (min.return || 0) ? t : min
    );

    return {
      date: worstTransaction.date,
      return: worstTransaction.return,
      asset: worstTransaction.asset
    };
  }

  /**
   * Compare portfolio to benchmark
   */
  compareToBenchmark(portfolio, benchmark) {
    // Simulated benchmark returns
    const benchmarks = {
      'NSE': { oneYear: 8.5, threeYear: 7.2, fiveYear: 6.8 },
      'MSCI': { oneYear: 12.3, threeYear: 10.1, fiveYear: 9.5 }
    };

    const benchmarkData = benchmarks[benchmark] || benchmarks['NSE'];

    return {
      benchmark,
      oneYearOutperformance: (portfolio.oneYearReturn - benchmarkData.oneYear).toFixed(2),
      threeYearOutperformance: (portfolio.threeYearReturn - benchmarkData.threeYear).toFixed(2),
      fiveYearOutperformance: (portfolio.fiveYearReturn - benchmarkData.fiveYear).toFixed(2)
    };
  }

  /**
   * Generate performance report
   */
  generateReport(portfolio, transactions) {
    const metrics = this.calculateMetrics(portfolio, transactions);
    const insights = this.generateInsights(metrics, portfolio);

    return {
      generatedAt: new Date().toISOString(),
      metrics,
      insights,
      recommendations: this.getRecommendations(metrics),
      benchmarking: {
        nseComparison: metrics.vsNSE,
        msciComparison: metrics.vsMSCI
      }
    };
  }

  /**
   * Generate performance insights
   */
  generateInsights(metrics, portfolio) {
    const insights = [];

    // Insight 1: Return performance
    const totalReturn = parseFloat(metrics.totalReturn);
    if (totalReturn > 15) {
      insights.push({
        type: 'positive',
        title: 'Excellent Performance',
        message: `Your portfolio has delivered ${totalReturn.toFixed(2)}% return, outperforming typical market returns.`
      });
    } else if (totalReturn > 8) {
      insights.push({
        type: 'positive',
        title: 'Good Performance',
        message: `Your portfolio has returned ${totalReturn.toFixed(2)}%, meeting typical market expectations.`
      });
    } else if (totalReturn < 0) {
      insights.push({
        type: 'negative',
        title: 'Negative Returns',
        message: `Your portfolio is currently down ${Math.abs(totalReturn).toFixed(2)}%. Consider reviewing your strategy.`
      });
    }

    // Insight 2: Risk assessment
    const volatility = parseFloat(metrics.volatility);
    if (volatility > 20) {
      insights.push({
        type: 'warning',
        title: 'High Volatility',
        message: `Your portfolio volatility is ${volatility.toFixed(2)}%. Consider diversifying to reduce risk.`
      });
    }

    // Insight 3: Drawdown risk
    const maxDrawdown = parseFloat(metrics.maxDrawdown);
    if (maxDrawdown > 20) {
      insights.push({
        type: 'warning',
        title: 'Significant Drawdown Experienced',
        message: `Your portfolio experienced a ${maxDrawdown.toFixed(2)}% drawdown. Review risk management.`
      });
    }

    return insights;
  }

  /**
   * Get performance recommendations
   */
  getRecommendations(metrics) {
    const recommendations = [];

    const sharpeRatio = parseFloat(metrics.sharpeRatio);
    if (sharpeRatio < 1) {
      recommendations.push({
        action: 'Improve Risk-Adjusted Returns',
        suggestion: 'Your Sharpe ratio is low. Consider rebalancing for better risk-adjusted returns.'
      });
    }

    const winLossRatio = parseFloat(metrics.winLossRatio);
    if (winLossRatio < 1) {
      recommendations.push({
        action: 'Review Asset Selection',
        suggestion: 'Your win/loss ratio is below 1. Review your asset selection strategy.'
      });
    }

    return recommendations;
  }

  /**
   * Generate chart data
   */
  generateChartData(transactions, timeframe = '1y') {
    const days = this.getTimeframeDays(timeframe);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const relevantTransactions = transactions.filter(t => 
      new Date(t.date) >= cutoffDate
    ).sort((a, b) => new Date(a.date) - new Date(b.date));

    const chartData = {
      labels: relevantTransactions.map(t => new Date(t.date).toLocaleDateString()),
      datasets: [
        {
          label: 'Portfolio Value',
          data: relevantTransactions.map(t => t.portfolioValue),
          borderColor: '#7C3AED',
          tension: 0.4,
          fill: false
        },
        {
          label: 'Cumulative Return',
          data: relevantTransactions.map(t => t.cumulativeReturn),
          borderColor: '#EC4899',
          tension: 0.4,
          fill: false
        }
      ]
    };

    return chartData;
  }

  /**
   * Get timeframe in days
   */
  getTimeframeDays(timeframe) {
    const timeframes = {
      '1m': 30,
      '3m': 90,
      '6m': 180,
      '1y': 365,
      '5y': 1825
    };
    return timeframes[timeframe] || 365;
  }
}

module.exports = new PerformanceAnalytics();
