/**
 * SmartInvest Live Market Data & Widget
 * Real-time market data and interactive widgets
 */

const fs = require('fs');
const path = require('path');

class LiveMarketWidget {
  constructor() {
    this.dataPath = path.join(__dirname, '../data');
    this.marketDataPath = path.join(this.dataPath, 'market-data.json');
    this.initializeMarketData();
  }

  /**
   * Initialize market data
   */
  initializeMarketData() {
    if (!fs.existsSync(this.marketDataPath)) {
      const initialData = {
        indices: this.getIndices(),
        topGainers: this.getTopGainers(),
        topLosers: this.getTopLosers(),
        marketStatus: 'open',
        lastUpdated: new Date().toISOString()
      };
      fs.writeFileSync(this.marketDataPath, JSON.stringify(initialData, null, 2));
    }
  }

  /**
   * Get market indices
   */
  getIndices() {
    return [
      {
        indexId: 'nse_nifty50',
        name: 'NIFTY 50',
        value: 18456.25,
        change: 125.50,
        changePercent: 0.68,
        timestamp: new Date().toISOString(),
        components: 50,
        marketCap: 'N/A'
      },
      {
        indexId: 'nse_sensex',
        name: 'BSE SENSEX',
        value: 61234.80,
        change: 245.30,
        changePercent: 0.40,
        timestamp: new Date().toISOString(),
        components: 30,
        marketCap: 'N/A'
      },
      {
        indexId: 'nse_nifty100',
        name: 'NIFTY 100',
        value: 22150.40,
        change: 156.75,
        changePercent: 0.71,
        timestamp: new Date().toISOString(),
        components: 100,
        marketCap: 'N/A'
      },
      {
        indexId: 'nse_midcap50',
        name: 'NIFTY MIDCAP 50',
        value: 8945.65,
        change: 89.20,
        changePercent: 1.01,
        timestamp: new Date().toISOString(),
        components: 50,
        marketCap: 'N/A'
      },
      {
        indexId: 'nse_smallcap50',
        name: 'NIFTY SMALLCAP 50',
        value: 12456.30,
        change: 234.50,
        changePercent: 1.92,
        timestamp: new Date().toISOString(),
        components: 50,
        marketCap: 'N/A'
      }
    ];
  }

  /**
   * Get top gainers
   */
  getTopGainers() {
    return [
      {
        symbol: 'RELIANCE',
        name: 'Reliance Industries',
        price: 2845.50,
        change: 125.50,
        changePercent: 4.62,
        volume: 45230000,
        marketCap: 1895000000000
      },
      {
        symbol: 'TCS',
        name: 'Tata Consultancy Services',
        price: 3456.75,
        change: 98.30,
        changePercent: 2.93,
        volume: 23450000,
        marketCap: 980000000000
      },
      {
        symbol: 'HDFC',
        name: 'HDFC Bank',
        price: 1567.80,
        change: 67.40,
        changePercent: 4.50,
        volume: 56780000,
        marketCap: 875000000000
      },
      {
        symbol: 'INFY',
        name: 'Infosys',
        price: 1234.50,
        change: 45.20,
        changePercent: 3.80,
        volume: 34560000,
        marketCap: 750000000000
      },
      {
        symbol: 'ITC',
        name: 'ITC Limited',
        price: 456.30,
        change: 23.50,
        changePercent: 5.40,
        volume: 67890000,
        marketCap: 650000000000
      }
    ];
  }

  /**
   * Get top losers
   */
  getTopLosers() {
    return [
      {
        symbol: 'MARUTI',
        name: 'Maruti Suzuki India',
        price: 8234.50,
        change: -234.50,
        changePercent: -2.77,
        volume: 2345000,
        marketCap: 585000000000
      },
      {
        symbol: 'BAJAJ-AUTO',
        name: 'Bajaj Auto',
        price: 3456.75,
        change: -123.45,
        changePercent: -3.45,
        volume: 3456000,
        marketCap: 345000000000
      },
      {
        symbol: 'M&M',
        name: 'Mahindra & Mahindra',
        price: 876.50,
        change: -45.30,
        changePercent: -4.91,
        volume: 4567000,
        marketCap: 287000000000
      },
      {
        symbol: 'ASHOKLEY',
        name: 'Ashok Leyland',
        price: 123.45,
        change: -12.30,
        changePercent: -9.05,
        volume: 5678000,
        marketCap: 78000000000
      },
      {
        symbol: 'TATASTEEL',
        name: 'Tata Steel',
        price: 234.80,
        change: -15.60,
        changePercent: -6.23,
        volume: 6789000,
        marketCap: 125000000000
      }
    ];
  }

  /**
   * Get market status
   */
  getMarketStatus() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const day = now.getDay();

    let status = 'closed';
    let nextOpen = null;

    // Market open: 9:15 AM to 3:30 PM on weekdays (Mon-Fri)
    if (day >= 1 && day <= 5) { // Monday to Friday
      if ((hours === 9 && minutes >= 15) || (hours > 9 && hours < 15) || (hours === 15 && minutes < 30)) {
        status = 'open';
      } else if (hours < 9 || (hours === 9 && minutes < 15)) {
        const nextDate = new Date();
        nextDate.setHours(9, 15, 0, 0);
        nextOpen = nextDate.toISOString();
      } else {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + 1);
        nextDate.setHours(9, 15, 0, 0);
        nextOpen = nextDate.toISOString();
      }
    } else {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + (8 - day) % 7);
      nextDate.setHours(9, 15, 0, 0);
      nextOpen = nextDate.toISOString();
    }

    return {
      status,
      lastUpdated: new Date().toISOString(),
      nextOpen,
      message: status === 'open' ? 'Market is open' : 'Market is closed'
    };
  }

  /**
   * Get sector performance
   */
  getSectorPerformance() {
    return [
      {
        sector: 'IT',
        value: 2345.60,
        change: 145.30,
        changePercent: 6.60,
        companies: ['TCS', 'INFY', 'WIPRO', 'HCL-INSYS', 'PERSIST']
      },
      {
        sector: 'Finance',
        value: 1876.45,
        change: 98.50,
        changePercent: 5.53,
        companies: ['HDFC', 'ICICIBANK', 'AXISBANK', 'KOTAKBANK', 'INDUSIND']
      },
      {
        sector: 'Energy',
        value: 3456.75,
        change: 125.60,
        changePercent: 3.76,
        companies: ['RELIANCE', 'NTPC', 'POWERGRID', 'GAIL', 'COALINDIA']
      },
      {
        sector: 'Pharma',
        value: 1234.50,
        change: 45.20,
        changePercent: 3.80,
        companies: ['SUNPHARMA', 'LUPIN', 'DRREDDY', 'DIVISLAB', 'CIPLA']
      },
      {
        sector: 'Auto',
        value: 987.30,
        change: -45.60,
        changePercent: -4.41,
        companies: ['MARUTI', 'TATASTEEL', 'BHARATIARTL', 'EICHERMOT', 'BAJAJ-AUTO']
      }
    ];
  }

  /**
   * Get market news
   */
  getMarketNews() {
    return [
      {
        newsId: 'news_1',
        title: 'NIFTY 50 hits new high, surpasses 18,500 mark',
        summary: 'The Indian equity market reached new highs on strong global cues and positive domestic data.',
        source: 'Economic Times',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        impact: 'positive'
      },
      {
        newsId: 'news_2',
        title: 'RBI maintains repo rate, inflation concerns persist',
        summary: 'The Reserve Bank kept rates unchanged citing persistent inflation pressures.',
        source: 'CNBC-TV18',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        impact: 'neutral'
      },
      {
        newsId: 'news_3',
        title: 'Tech stocks rally on Q3 earnings optimism',
        summary: 'IT companies show strong fundamentals ahead of quarter-end results.',
        source: 'Moneycontrol',
        timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
        impact: 'positive'
      },
      {
        newsId: 'news_4',
        title: 'Rupee weakens to 82.50 against US dollar',
        summary: 'Indian currency hits new lows amid strong dollar and capital outflows.',
        source: 'Reuters',
        timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
        impact: 'negative'
      }
    ];
  }

  /**
   * Get stock details
   */
  getStockDetails(symbol) {
    const stocks = {
      'RELIANCE': {
        symbol: 'RELIANCE',
        name: 'Reliance Industries Limited',
        price: 2845.50,
        change: 125.50,
        changePercent: 4.62,
        open: 2750.00,
        high: 2856.75,
        low: 2748.30,
        volume: 45230000,
        marketCap: 1895000000000,
        pe: 18.5,
        pb: 2.8,
        dividend: 60,
        yield: 2.1,
        daysHigh: 2856.75,
        daysLow: 2748.30,
        fiftyTwoWeekHigh: 3245.60,
        fiftyTwoWeekLow: 1856.30
      },
      'TCS': {
        symbol: 'TCS',
        name: 'Tata Consultancy Services Limited',
        price: 3456.75,
        change: 98.30,
        changePercent: 2.93,
        open: 3380.00,
        high: 3465.50,
        low: 3340.25,
        volume: 23450000,
        marketCap: 980000000000,
        pe: 22.3,
        pb: 1.8,
        dividend: 90,
        yield: 2.6,
        daysHigh: 3465.50,
        daysLow: 3340.25,
        fiftyTwoWeekHigh: 4234.50,
        fiftyTwoWeekLow: 2567.30
      }
    };

    return stocks[symbol] || null;
  }

  /**
   * Get watchlist recommendations
   */
  getWatchlistRecommendations(userProfile) {
    const recommendations = [];

    if (userProfile.riskProfile?.score > 60) {
      recommendations.push('RELIANCE', 'TATASTEEL', 'TATAMOTORS');
    } else {
      recommendations.push('TCS', 'HDFC', 'INFY');
    }

    return recommendations.map(symbol => this.getStockDetails(symbol)).filter(s => s !== null);
  }

  /**
   * Get chart data
   */
  getChartData(symbol, period = '1m') {
    // Generate mock chart data
    const dataPoints = this.getDataPointsForPeriod(period);
    const basePrice = 3500;

    const data = [];
    for (let i = 0; i < dataPoints; i++) {
      const price = basePrice + (Math.random() - 0.5) * 200;
      data.push({
        time: new Date(Date.now() - (dataPoints - i) * this.getPeriodMilliseconds(period)).toISOString(),
        price: parseFloat(price.toFixed(2)),
        volume: Math.floor(Math.random() * 10000000)
      });
    }

    return {
      symbol,
      period,
      data,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Get data points for period
   */
  getDataPointsForPeriod(period) {
    const periods = {
      '1d': 24, // hourly
      '1w': 7,  // daily
      '1m': 30, // daily
      '3m': 90, // daily
      '1y': 52  // weekly
    };
    return periods[period] || 30;
  }

  /**
   * Get period milliseconds
   */
  getPeriodMilliseconds(period) {
    const periods = {
      '1d': 60 * 60 * 1000,        // 1 hour
      '1w': 24 * 60 * 60 * 1000,   // 1 day
      '1m': 24 * 60 * 60 * 1000,   // 1 day
      '3m': 24 * 60 * 60 * 1000,   // 1 day
      '1y': 7 * 24 * 60 * 60 * 1000 // 1 week
    };
    return periods[period] || 24 * 60 * 60 * 1000;
  }

  /**
   * Get breadth indicators
   */
  getBreadthIndicators() {
    return {
      advancing: 1245,
      declining: 845,
      unchanged: 234,
      advancingPercent: ((1245 / (1245 + 845)) * 100).toFixed(2),
      vix: 18.45,
      bullishPercent: 65,
      marketSentiment: 'bullish'
    };
  }

  /**
   * Save market data
   */
  saveMarketData(data) {
    try {
      fs.writeFileSync(this.marketDataPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving market data:', error);
    }
  }

  /**
   * Load market data
   */
  loadMarketData() {
    try {
      if (fs.existsSync(this.marketDataPath)) {
        return JSON.parse(fs.readFileSync(this.marketDataPath, 'utf8'));
      }
      return {};
    } catch (error) {
      console.error('Error loading market data:', error);
      return {};
    }
  }
}

module.exports = new LiveMarketWidget();
