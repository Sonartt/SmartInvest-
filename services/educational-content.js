/**
 * SmartInvest Educational Content Feed
 * Educational resources and learning materials
 */

const fs = require('fs');
const path = require('path');

class EducationalContent {
  constructor() {
    this.contentPath = path.join(__dirname, '../data/educational-content.json');
    this.initializeContent();
  }

  /**
   * Initialize educational content database
   */
  initializeContent() {
    if (!fs.existsSync(this.contentPath)) {
      const initialContent = {
        courses: this.getInitialCourses(),
        articles: this.getInitialArticles(),
        videos: this.getInitialVideos(),
        glossary: this.getInitialGlossary()
      };
      fs.writeFileSync(this.contentPath, JSON.stringify(initialContent, null, 2));
    }
  }

  /**
   * Get initial courses
   */
  getInitialCourses() {
    return [
      {
        courseId: 'course_001',
        title: 'Investment Fundamentals',
        description: 'Learn the basics of investing, asset classes, and portfolio construction',
        level: 'beginner',
        duration: '4 weeks',
        topics: ['Stocks', 'Bonds', 'Mutual Funds', 'Portfolio Basics'],
        estimatedTime: '8 hours',
        difficulty: 'easy'
      },
      {
        courseId: 'course_002',
        title: 'Risk Management & Diversification',
        description: 'Master risk assessment and portfolio diversification strategies',
        level: 'intermediate',
        duration: '3 weeks',
        topics: ['Risk Assessment', 'Diversification', 'Asset Allocation', 'Hedging'],
        estimatedTime: '6 hours',
        difficulty: 'medium'
      },
      {
        courseId: 'course_003',
        title: 'Tax-Efficient Investing',
        description: 'Optimize your investment returns through tax planning',
        level: 'intermediate',
        duration: '2 weeks',
        topics: ['Tax Laws', 'Deductions', 'Capital Gains', 'Tax Planning'],
        estimatedTime: '4 hours',
        difficulty: 'medium'
      },
      {
        courseId: 'course_004',
        title: 'Advanced Trading Strategies',
        description: 'Learn technical and fundamental analysis for active trading',
        level: 'advanced',
        duration: '6 weeks',
        topics: ['Technical Analysis', 'Fundamental Analysis', 'Options', 'Derivatives'],
        estimatedTime: '12 hours',
        difficulty: 'hard'
      },
      {
        courseId: 'course_005',
        title: 'Retirement Planning 101',
        description: 'Plan your retirement with confidence and security',
        level: 'beginner',
        duration: '3 weeks',
        topics: ['Retirement Goals', 'Savings Vehicles', 'Income Projection', 'Social Security'],
        estimatedTime: '5 hours',
        difficulty: 'easy'
      }
    ];
  }

  /**
   * Get initial articles
   */
  getInitialArticles() {
    return [
      {
        articleId: 'art_001',
        title: 'Getting Started with Mutual Funds',
        category: 'Investing Basics',
        readTime: '7 min',
        difficulty: 'beginner',
        published: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        summary: 'An introduction to mutual funds, how they work, and why they might be right for you.'
      },
      {
        articleId: 'art_002',
        title: 'Understanding Dollar-Cost Averaging',
        category: 'Investment Strategy',
        readTime: '5 min',
        difficulty: 'beginner',
        published: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        summary: 'Learn how consistent investing can reduce timing risk and build wealth over time.'
      },
      {
        articleId: 'art_003',
        title: 'The Power of Compound Interest',
        category: 'Financial Concepts',
        readTime: '6 min',
        difficulty: 'beginner',
        published: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        summary: 'Discover how compound interest can turn small investments into substantial wealth.'
      },
      {
        articleId: 'art_004',
        title: 'Tax Implications of Stock Investments',
        category: 'Tax Planning',
        readTime: '8 min',
        difficulty: 'intermediate',
        published: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        summary: 'Navigate the tax landscape and optimize your investment strategy for tax efficiency.'
      },
      {
        articleId: 'art_005',
        title: 'Building a Diversified Portfolio',
        category: 'Portfolio Management',
        readTime: '10 min',
        difficulty: 'intermediate',
        published: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        summary: 'Learn the principles of diversification and how to build a balanced portfolio.'
      }
    ];
  }

  /**
   * Get initial videos
   */
  getInitialVideos() {
    return [
      {
        videoId: 'vid_001',
        title: 'Investing 101: Stock Market Basics',
        category: 'Basics',
        duration: '12 min',
        difficulty: 'beginner',
        instructor: 'Finance Experts',
        published: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        url: '/videos/investing-101'
      },
      {
        videoId: 'vid_002',
        title: 'How to Read Financial Statements',
        category: 'Analysis',
        duration: '15 min',
        difficulty: 'intermediate',
        instructor: 'Investment Professionals',
        published: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
        url: '/videos/financial-statements'
      },
      {
        videoId: 'vid_003',
        title: 'Risk Management Strategies',
        category: 'Risk',
        duration: '18 min',
        difficulty: 'intermediate',
        instructor: 'Risk Analysts',
        published: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
        url: '/videos/risk-management'
      },
      {
        videoId: 'vid_004',
        title: 'Tax-Efficient Investing in India',
        category: 'Tax',
        duration: '20 min',
        difficulty: 'intermediate',
        instructor: 'Tax Experts',
        published: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        url: '/videos/tax-efficient-india'
      }
    ];
  }

  /**
   * Get initial glossary
   */
  getInitialGlossary() {
    return [
      {
        term: 'Bull Market',
        definition: 'A market condition where prices are rising and investor confidence is high, typically associated with economic growth.'
      },
      {
        term: 'Bear Market',
        definition: 'A market condition where prices are declining and investor sentiment is negative, often associated with economic slowdown.'
      },
      {
        term: 'Dividend',
        definition: 'A distribution of earnings to shareholders, typically in cash or additional shares, as decided by the company\'s board.'
      },
      {
        term: 'Portfolio',
        definition: 'A collection of investments owned by an individual or institution, including stocks, bonds, and other assets.'
      },
      {
        term: 'Volatility',
        definition: 'A measure of the degree of price fluctuation of an investment, indicating the level of risk.'
      },
      {
        term: 'Index Fund',
        definition: 'A mutual fund designed to track the performance of a market index like Nifty 50 or Sensex.'
      },
      {
        term: 'Asset Allocation',
        definition: 'The distribution of investments across different asset classes to balance risk and return based on investment goals.'
      },
      {
        term: 'Expense Ratio',
        definition: 'The annual percentage of a fund\'s assets deducted to cover operating expenses.'
      }
    ];
  }

  /**
   * Get personalized learning path based on user profile
   */
  getPersonalizedPath(userProfile, investmentGoal) {
    const path = {
      pathId: `path_${Date.now()}`,
      userId: userProfile.userId,
      goal: investmentGoal,
      recommendedCourses: [],
      recommendedArticles: [],
      recommendedVideos: [],
      estimatedDuration: 0
    };

    const content = this.loadContent();

    // Recommend courses based on experience level
    if (userProfile.experience === 'beginner') {
      path.recommendedCourses = content.courses.filter(c => c.level === 'beginner');
    } else if (userProfile.experience === 'intermediate') {
      path.recommendedCourses = content.courses.filter(c => c.level === 'intermediate');
    } else {
      path.recommendedCourses = content.courses.filter(c => c.level === 'advanced');
    }

    // Recommend articles based on goal
    path.recommendedArticles = content.articles.slice(0, 3);

    // Recommend videos based on experience
    path.recommendedVideos = content.videos.filter(v => 
      v.difficulty === userProfile.experience
    );

    // Calculate total duration
    path.estimatedDuration = this.calculateTotalDuration(path);

    return path;
  }

  /**
   * Calculate total learning duration
   */
  calculateTotalDuration(path) {
    let total = 0;

    path.recommendedCourses.forEach(course => {
      const hours = parseInt(course.estimatedTime);
      total += hours;
    });

    path.recommendedArticles.forEach(article => {
      const minutes = parseInt(article.readTime);
      total += minutes / 60;
    });

    path.recommendedVideos.forEach(video => {
      const minutes = parseInt(video.duration);
      total += minutes / 60;
    });

    return total.toFixed(1);
  }

  /**
   * Track learning progress
   */
  trackProgress(userId, courseId, completionPercentage) {
    return {
      userId,
      courseId,
      completionPercentage,
      lastAccessed: new Date().toISOString(),
      status: completionPercentage === 100 ? 'completed' : 'in-progress'
    };
  }

  /**
   * Generate certificate of completion
   */
  generateCertificate(userId, courseId, courseName) {
    return {
      certificateId: `cert_${Date.now()}`,
      userId,
      courseId,
      courseName,
      issuedDate: new Date().toISOString(),
      validFrom: new Date().toISOString(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  /**
   * Get trending content
   */
  getTrendingContent() {
    const content = this.loadContent();

    return {
      trendingArticles: content.articles.slice(0, 3),
      trendingCourses: content.courses.slice(0, 3),
      trendingVideos: content.videos.slice(0, 2)
    };
  }

  /**
   * Search educational content
   */
  searchContent(query) {
    const content = this.loadContent();
    const results = {
      articles: [],
      courses: [],
      videos: [],
      glossaryTerms: []
    };

    const lowerQuery = query.toLowerCase();

    results.articles = content.articles.filter(a =>
      a.title.toLowerCase().includes(lowerQuery) ||
      a.summary.toLowerCase().includes(lowerQuery)
    );

    results.courses = content.courses.filter(c =>
      c.title.toLowerCase().includes(lowerQuery) ||
      c.description.toLowerCase().includes(lowerQuery)
    );

    results.videos = content.videos.filter(v =>
      v.title.toLowerCase().includes(lowerQuery)
    );

    results.glossaryTerms = content.glossary.filter(g =>
      g.term.toLowerCase().includes(lowerQuery) ||
      g.definition.toLowerCase().includes(lowerQuery)
    );

    return results;
  }

  /**
   * Load content from file
   */
  loadContent() {
    try {
      if (fs.existsSync(this.contentPath)) {
        return JSON.parse(fs.readFileSync(this.contentPath, 'utf8'));
      }
      return { courses: [], articles: [], videos: [], glossary: [] };
    } catch (error) {
      console.error('Error loading educational content:', error);
      return { courses: [], articles: [], videos: [], glossary: [] };
    }
  }
}

module.exports = new EducationalContent();
