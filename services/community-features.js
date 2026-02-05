/**
 * SmartInvest Community & Social Features
 * Social comparison, leaderboards, and community engagement
 */

const fs = require('fs');
const path = require('path');

class CommunityFeatures {
  constructor() {
    this.dataPath = path.join(__dirname, '../data');
    this.communityPath = path.join(this.dataPath, 'community.json');
  }

  /**
   * Create community leaderboard
   */
  createLeaderboard(userProfiles) {
    const leaderboard = {
      leaderboardId: `lb_${Date.now()}`,
      categories: {
        topPerformers: this.getTopPerformers(userProfiles),
        highestReturns: this.getHighestReturns(userProfiles),
        mostDiversified: this.getMostDiversified(userProfiles),
        mostImproved: this.getMostImproved(userProfiles),
        topSavers: this.getTopSavers(userProfiles),
        riskManager: this.getRiskManagers(userProfiles)
      },
      generatedAt: new Date().toISOString()
    };

    return leaderboard;
  }

  /**
   * Get top performers
   */
  getTopPerformers(userProfiles) {
    return userProfiles
      .filter(u => u.portfolio)
      .sort((a, b) => (b.portfolio.totalReturn || 0) - (a.portfolio.totalReturn || 0))
      .slice(0, 10)
      .map((user, index) => ({
        rank: index + 1,
        userId: user.userId,
        username: user.username,
        return: user.portfolio.totalReturn,
        portfolioValue: user.portfolio.currentValue,
        badge: 'Top Performer'
      }));
  }

  /**
   * Get highest returns
   */
  getHighestReturns(userProfiles) {
    return userProfiles
      .filter(u => u.portfolio)
      .sort((a, b) => {
        const aReturn = (a.portfolio.currentValue - a.portfolio.totalInvested) / a.portfolio.totalInvested;
        const bReturn = (b.portfolio.currentValue - b.portfolio.totalInvested) / b.portfolio.totalInvested;
        return bReturn - aReturn;
      })
      .slice(0, 10)
      .map((user, index) => ({
        rank: index + 1,
        userId: user.userId,
        username: user.username,
        roi: ((user.portfolio.currentValue - user.portfolio.totalInvested) / user.portfolio.totalInvested * 100).toFixed(2),
        invested: user.portfolio.totalInvested,
        badge: 'High Return Investor'
      }));
  }

  /**
   * Get most diversified
   */
  getMostDiversified(userProfiles) {
    return userProfiles
      .filter(u => u.portfolio && u.portfolio.assets)
      .map(user => ({
        userId: user.userId,
        username: user.username,
        assetCount: user.portfolio.assets.length,
        diversificationScore: this.calculateDiversificationScore(user.portfolio.assets),
        sectors: this.getSectorDiversity(user.portfolio.assets)
      }))
      .sort((a, b) => b.diversificationScore - a.diversificationScore)
      .slice(0, 10)
      .map((user, index) => ({
        rank: index + 1,
        ...user,
        badge: 'Diversification Champion'
      }));
  }

  /**
   * Get most improved
   */
  getMostImproved(userProfiles) {
    return userProfiles
      .filter(u => u.portfolio && u.portfolio.monthlyReturns)
      .map(user => ({
        userId: user.userId,
        username: user.username,
        improvement: this.calculateImprovement(user.portfolio.monthlyReturns)
      }))
      .sort((a, b) => b.improvement - a.improvement)
      .slice(0, 10)
      .map((user, index) => ({
        rank: index + 1,
        ...user,
        badge: 'Most Improved'
      }));
  }

  /**
   * Get top savers
   */
  getTopSavers(userProfiles) {
    return userProfiles
      .filter(u => u.savingsData)
      .sort((a, b) => (b.savingsData.totalSaved || 0) - (a.savingsData.totalSaved || 0))
      .slice(0, 10)
      .map((user, index) => ({
        rank: index + 1,
        userId: user.userId,
        username: user.username,
        totalSaved: user.savingsData.totalSaved,
        savingsRate: user.savingsData.savingsRate,
        badge: 'Savings Champion'
      }));
  }

  /**
   * Get risk managers
   */
  getRiskManagers(userProfiles) {
    return userProfiles
      .filter(u => u.portfolio)
      .map(user => ({
        userId: user.userId,
        username: user.username,
        volatility: this.calculateVolatility(user.portfolio),
        sharpeRatio: this.calculateSharpeRatio(user.portfolio),
        maxDrawdown: this.calculateMaxDrawdown(user.portfolio)
      }))
      .sort((a, b) => b.sharpeRatio - a.sharpeRatio)
      .slice(0, 10)
      .map((user, index) => ({
        rank: index + 1,
        ...user,
        badge: 'Risk Manager'
      }));
  }

  /**
   * Calculate diversification score
   */
  calculateDiversificationScore(assets) {
    if (assets.length === 0) return 0;
    
    // Calculate Herfindahl Index
    let sum = 0;
    const totalValue = assets.reduce((t, a) => t + (a.value || 0), 0);

    assets.forEach(asset => {
      const weight = (asset.value || 0) / totalValue;
      sum += weight * weight;
    });

    // Convert to 0-100 score (lower Herfindahl = higher diversification)
    return Math.round((1 - sum) * 100);
  }

  /**
   * Get sector diversity
   */
  getSectorDiversity(assets) {
    const sectors = {};
    assets.forEach(asset => {
      const sector = asset.sector || 'Other';
      sectors[sector] = (sectors[sector] || 0) + 1;
    });
    return sectors;
  }

  /**
   * Calculate improvement
   */
  calculateImprovement(monthlyReturns) {
    if (monthlyReturns.length < 2) return 0;

    const recentMonths = monthlyReturns.slice(-3);
    const olderMonths = monthlyReturns.slice(-6, -3);

    const recentAvg = recentMonths.reduce((a, b) => a + b, 0) / recentMonths.length;
    const olderAvg = olderMonths.reduce((a, b) => a + b, 0) / olderMonths.length;

    return recentAvg - olderAvg;
  }

  /**
   * Calculate volatility (simple version)
   */
  calculateVolatility(portfolio) {
    return 15; // Placeholder
  }

  /**
   * Calculate Sharpe Ratio (simple version)
   */
  calculateSharpeRatio(portfolio) {
    return 1.2; // Placeholder
  }

  /**
   * Calculate Max Drawdown (simple version)
   */
  calculateMaxDrawdown(portfolio) {
    return 8; // Placeholder
  }

  /**
   * Create community post
   */
  createPost(userId, username, title, content, category = 'general') {
    const post = {
      postId: `post_${Date.now()}`,
      userId,
      username,
      title,
      content,
      category,
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: [],
      shares: 0,
      views: 0
    };

    return post;
  }

  /**
   * Create discussion forum
   */
  createForum() {
    return {
      forumId: `forum_${Date.now()}`,
      categories: [
        {
          categoryId: 'cat_1',
          name: 'Investment Strategies',
          description: 'Discuss various investment strategies and approaches',
          threads: []
        },
        {
          categoryId: 'cat_2',
          name: 'Market Analysis',
          description: 'Share and discuss market trends and analysis',
          threads: []
        },
        {
          categoryId: 'cat_3',
          name: 'Success Stories',
          description: 'Share your investment success stories',
          threads: []
        },
        {
          categoryId: 'cat_4',
          name: 'Beginners Question',
          description: 'Beginner-friendly questions and answers',
          threads: []
        },
        {
          categoryId: 'cat_5',
          name: 'Portfolio Showcase',
          description: 'Share and get feedback on your portfolio',
          threads: []
        }
      ]
    };
  }

  /**
   * Get user profile comparison
   */
  compareProfiles(userId1, userId2, userProfiles) {
    const user1 = userProfiles.find(u => u.userId === userId1);
    const user2 = userProfiles.find(u => u.userId === userId2);

    if (!user1 || !user2) return null;

    return {
      comparison: [
        {
          metric: 'Portfolio Value',
          user1: user1.portfolio?.currentValue || 0,
          user2: user2.portfolio?.currentValue || 0
        },
        {
          metric: 'Total Return',
          user1: (user1.portfolio?.totalReturn || 0).toFixed(2) + '%',
          user2: (user2.portfolio?.totalReturn || 0).toFixed(2) + '%'
        },
        {
          metric: 'Number of Assets',
          user1: user1.portfolio?.assets?.length || 0,
          user2: user2.portfolio?.assets?.length || 0
        },
        {
          metric: 'Risk Score',
          user1: user1.riskProfile?.score || 'N/A',
          user2: user2.riskProfile?.score || 'N/A'
        },
        {
          metric: 'Experience Level',
          user1: user1.experience || 'N/A',
          user2: user2.experience || 'N/A'
        }
      ]
    };
  }

  /**
   * Get community recommendations
   */
  getCommunityRecommendations(userProfile, community) {
    const recommendations = [];

    // Find similar users
    const similarUsers = community.filter(u => 
      u.riskProfile?.score === userProfile.riskProfile?.score &&
      u.userId !== userProfile.userId
    );

    similarUsers.forEach(similar => {
      if (similar.portfolio && userProfile.portfolio) {
        const assets = similar.portfolio.assets || [];
        const topAssets = assets.slice(0, 3);

        if (topAssets.length > 0) {
          recommendations.push({
            type: 'community-recommendation',
            fromUser: similar.username,
            assets: topAssets,
            reason: `Recommended by ${similar.username} with similar risk profile`,
            confidence: 0.8
          });
        }
      }
    });

    return recommendations;
  }

  /**
   * Create achievement/badge system
   */
  getAchievements(userProfile) {
    const achievements = [];

    // Badge: First Investment
    if (userProfile.portfolio?.assets?.length > 0) {
      achievements.push({
        badgeId: 'badge_1',
        name: 'First Investor',
        description: 'Completed your first investment',
        icon: '🚀',
        unlockedDate: userProfile.createdAt
      });
    }

    // Badge: Diversified
    if (userProfile.portfolio?.assets?.length >= 5) {
      achievements.push({
        badgeId: 'badge_2',
        name: 'Diversification Master',
        description: 'Invested in 5+ different assets',
        icon: '🎯',
        unlockedDate: new Date().toISOString()
      });
    }

    // Badge: Consistent Investor
    if (userProfile.portfolio?.monthlyInvestments >= 12) {
      achievements.push({
        badgeId: 'badge_3',
        name: 'Consistent Investor',
        description: 'Made monthly investments for 12 months',
        icon: '⚡',
        unlockedDate: new Date().toISOString()
      });
    }

    // Badge: High Returns
    if (userProfile.portfolio?.totalReturn > 20) {
      achievements.push({
        badgeId: 'badge_4',
        name: 'High Returns Achiever',
        description: 'Achieved 20%+ portfolio returns',
        icon: '💰',
        unlockedDate: new Date().toISOString()
      });
    }

    return achievements;
  }

  /**
   * Get engagement metrics
   */
  getEngagementMetrics(userId, community) {
    const user = community.find(u => u.userId === userId);

    if (!user) return null;

    return {
      userId,
      username: user.username,
      followers: user.followers || 0,
      following: user.following || 0,
      posts: user.communityPosts || 0,
      comments: user.communityComments || 0,
      engagementScore: (user.followers || 0) * 0.3 + (user.communityPosts || 0) * 0.4 + (user.communityComments || 0) * 0.3,
      recentActivity: user.lastActive || 'N/A'
    };
  }
}

module.exports = new CommunityFeatures();
