/**
 * SmartInvest Savings Rate Tracker & Gamification
 * Track savings goals with gamification elements
 */

const fs = require('fs');
const path = require('path');

class SavingsTracker {
  constructor() {
    this.dataPath = path.join(__dirname, '../data');
    this.trackerPath = path.join(this.dataPath, 'savings-tracker.json');
  }

  /**
   * Create savings challenge
   */
  createChallenge(userId, challengeType, targetAmount, duration = 30) {
    const challenge = {
      challengeId: `challenge_${Date.now()}`,
      userId,
      type: challengeType,
      targetAmount,
      currentAmount: 0,
      duration,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      rewards: this.getRewards(challengeType),
      milestones: this.generateMilestones(targetAmount),
      dailyCheckIns: [],
      badges: []
    };

    return challenge;
  }

  /**
   * Get challenge rewards
   */
  getRewards(challengeType) {
    const rewards = {
      '30-day-save': {
        completion: 'Certificate of Achievement',
        points: 500,
        badge: 'Savings Champion'
      },
      '100k-target': {
        completion: 'Premium Features Unlock',
        points: 1000,
        badge: 'Century Achiever'
      },
      'consistent-saver': {
        completion: 'Personalized Financial Report',
        points: 750,
        badge: 'Consistent Investor'
      },
      'emergency-fund': {
        completion: 'Financial Security Badge',
        points: 1200,
        badge: 'Emergency Fund Master'
      }
    };

    return rewards[challengeType] || { completion: 'Participation Certificate', points: 100, badge: 'Saver' };
  }

  /**
   * Generate milestones
   */
  generateMilestones(targetAmount) {
    const milestones = [];
    for (let i = 1; i <= 5; i++) {
      const value = (targetAmount / 5) * i;
      milestones.push({
        milestoneId: `milestone_${i}`,
        name: `${i * 20}% Goal`,
        targetValue: value,
        currentValue: 0,
        achieved: false,
        achievedDate: null,
        reward: `${i * 100} points`
      });
    }
    return milestones;
  }

  /**
   * Track daily savings
   */
  trackDailySavings(challengeId, amount) {
    const checkIn = {
      checkInId: `checkin_${Date.now()}`,
      challengeId,
      amount,
      date: new Date().toISOString(),
      streak: 0,
      motivation: this.getMotivation(amount)
    };

    return checkIn;
  }

  /**
   * Get motivation message
   */
  getMotivation(amount) {
    if (amount === 0) {
      return 'No savings today, but tomorrow is a new day!';
    } else if (amount < 1000) {
      return 'Good start! Every rupee counts.';
    } else if (amount < 5000) {
      return 'Great effort! You\'re on track!';
    } else if (amount < 10000) {
      return 'Excellent! You\'re crushing your goals!';
    } else {
      return 'Amazing! You\'re a savings superstar!';
    }
  }

  /**
   * Calculate savings metrics
   */
  calculateMetrics(challenge) {
    const metrics = {
      totalSaved: challenge.currentAmount,
      targetAmount: challenge.targetAmount,
      progressPercentage: (challenge.currentAmount / challenge.targetAmount * 100).toFixed(2),
      daysRemaining: Math.ceil((new Date(challenge.endDate) - new Date()) / (24 * 60 * 60 * 1000)),
      averageDailySavings: challenge.currentAmount / challenge.dailyCheckIns.length || 0,
      streakDays: this.calculateStreak(challenge.dailyCheckIns),
      onTrack: this.isOnTrack(challenge),
      projectedAmount: this.calculateProjection(challenge)
    };

    return metrics;
  }

  /**
   * Calculate savings streak
   */
  calculateStreak(checkIns) {
    if (checkIns.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();

    for (let i = checkIns.length - 1; i >= 0; i--) {
      const checkInDate = new Date(checkIns[i].date);
      const diffDays = Math.floor((currentDate - checkInDate) / (24 * 60 * 60 * 1000));

      if (diffDays === streak) {
        streak++;
        currentDate = checkInDate;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Check if on track
   */
  isOnTrack(challenge) {
    const daysElapsed = Math.ceil((new Date() - new Date(challenge.startDate)) / (24 * 60 * 60 * 1000));
    const expectedSavings = (challenge.targetAmount / challenge.duration) * daysElapsed;
    return challenge.currentAmount >= expectedSavings;
  }

  /**
   * Calculate projected amount
   */
  calculateProjection(challenge) {
    const metrics = {
      currentAmount: challenge.currentAmount,
      targetAmount: challenge.targetAmount,
      daysRemaining: Math.ceil((new Date(challenge.endDate) - new Date()) / (24 * 60 * 60 * 1000))
    };

    const daysElapsed = challenge.duration - metrics.daysRemaining;
    const dailyAverage = challenge.currentAmount / (daysElapsed || 1);

    return (challenge.currentAmount + (dailyAverage * metrics.daysRemaining)).toFixed(2);
  }

  /**
   * Generate leaderboard for savings challenges
   */
  generateSavingsLeaderboard(challenges) {
    return challenges
      .map(challenge => ({
        challengeId: challenge.challengeId,
        userId: challenge.userId,
        saved: challenge.currentAmount,
        target: challenge.targetAmount,
        progress: (challenge.currentAmount / challenge.targetAmount * 100).toFixed(2),
        streak: this.calculateStreak(challenge.dailyCheckIns),
        badges: challenge.badges.length
      }))
      .sort((a, b) => b.saved - a.saved)
      .map((item, index) => ({
        rank: index + 1,
        ...item
      }));
  }

  /**
   * Unlock achievements
   */
  unlockAchievements(challenge) {
    const achievements = [];

    // Check milestones
    challenge.milestones.forEach(milestone => {
      if (challenge.currentAmount >= milestone.targetValue && !milestone.achieved) {
        achievements.push({
          type: 'milestone',
          name: milestone.name,
          reward: milestone.reward
        });
      }
    });

    // Check streak achievements
    const streak = this.calculateStreak(challenge.dailyCheckIns);
    if (streak >= 7) {
      achievements.push({
        type: 'streak',
        name: 'Week Warrior',
        reward: '100 points'
      });
    }
    if (streak >= 30) {
      achievements.push({
        type: 'streak',
        name: 'Monthly Master',
        reward: '500 points'
      });
    }

    // Check target achievement
    if (challenge.currentAmount >= challenge.targetAmount) {
      achievements.push({
        type: 'target',
        name: 'Target Achieved!',
        reward: challenge.rewards.points
      });
    }

    return achievements;
  }

  /**
   * Create savings plan
   */
  createSavingsPlan(userId, monthlyIncome, targetSavingsRate = 0.20) {
    const plan = {
      planId: `plan_${Date.now()}`,
      userId,
      monthlyIncome,
      targetSavingsRate,
      monthlyTarget: monthlyIncome * targetSavingsRate,
      allocation: this.allocateSavings(monthlyIncome, targetSavingsRate),
      recommendations: this.getSavingsRecommendations(monthlyIncome),
      createdAt: new Date().toISOString()
    };

    return plan;
  }

  /**
   * Allocate savings
   */
  allocateSavings(income, savingsRate) {
    const totalSavings = income * savingsRate;

    return {
      emergencyFund: totalSavings * 0.30,
      investments: totalSavings * 0.50,
      goals: totalSavings * 0.20
    };
  }

  /**
   * Get savings recommendations
   */
  getSavingsRecommendations(income) {
    return [
      {
        recommendation: 'Emergency Fund',
        amount: (income * 0.20 * 0.30).toFixed(2),
        description: 'Build 6 months of expenses in savings'
      },
      {
        recommendation: 'Investment',
        amount: (income * 0.20 * 0.50).toFixed(2),
        description: 'Invest in diversified portfolio (stocks, bonds, etc.)'
      },
      {
        recommendation: 'Retirement',
        amount: (income * 0.10).toFixed(2),
        description: 'Contribute to retirement accounts (EPF, NPS)'
      },
      {
        recommendation: 'Goals',
        amount: (income * 0.20 * 0.20).toFixed(2),
        description: 'Allocate to short-term and long-term goals'
      }
    ];
  }

  /**
   * Get savings insights
   */
  getSavingsInsights(userProfile) {
    const insights = [];

    const savingsRate = (userProfile.monthlySavings || 0) / (userProfile.monthlyIncome || 1);

    if (savingsRate < 0.10) {
      insights.push({
        type: 'warning',
        title: 'Low Savings Rate',
        message: `Your savings rate is ${(savingsRate * 100).toFixed(1)}%. Aim for at least 20%.`,
        action: 'Review expenses and increase savings'
      });
    } else if (savingsRate < 0.20) {
      insights.push({
        type: 'suggestion',
        title: 'Increase Savings Rate',
        message: `Your savings rate is ${(savingsRate * 100).toFixed(1)}%. Try to reach 20%.`,
        action: 'Reduce discretionary spending'
      });
    } else if (savingsRate >= 0.30) {
      insights.push({
        type: 'positive',
        title: 'Excellent Savings Rate',
        message: `Your savings rate of ${(savingsRate * 100).toFixed(1)}% is excellent!`,
        action: 'Maintain this discipline'
      });
    }

    return insights;
  }

  /**
   * Save tracker data
   */
  saveTracker(data) {
    try {
      fs.writeFileSync(this.trackerPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving tracker data:', error);
    }
  }

  /**
   * Load tracker data
   */
  loadTracker() {
    try {
      if (fs.existsSync(this.trackerPath)) {
        return JSON.parse(fs.readFileSync(this.trackerPath, 'utf8'));
      }
      return {};
    } catch (error) {
      console.error('Error loading tracker data:', error);
      return {};
    }
  }
}

module.exports = new SavingsTracker();
