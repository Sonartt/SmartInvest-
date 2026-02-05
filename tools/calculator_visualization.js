// ========== DATA VISUALIZATION MODULE ==========
// Chart.js integration for financial data visualization
// Created: January 29, 2026

/**
 * Initialize Chart.js with financial data
 * Ensure Chart.js is loaded: <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
 */

class FinancialChartBuilder {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.chart = null;
  }

  /**
   * Create compound interest growth chart
   */
  createCompoundInterestChart(principal, rate, years, monthlyContribution = 0) {
    const labels = [];
    const principalData = [];
    const interestData = [];
    const totalData = [];

    let balance = principal;
    const monthlyRate = Math.pow(1 + rate / 100, 1 / 12) - 1;

    for (let year = 0; year <= years; year++) {
      labels.push(`Year ${year}`);
      
      if (year > 0) {
        for (let month = 0; month < 12; month++) {
          balance = balance * (1 + monthlyRate) + monthlyContribution;
        }
      }

      const totalContributions = principal + (monthlyContribution * 12 * year);
      const interest = balance - totalContributions;

      principalData.push(totalContributions);
      interestData.push(interest);
      totalData.push(balance);
    }

    this.chart = new Chart(this.ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Total Value',
            data: totalData,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Principal',
            data: principalData,
            borderColor: 'rgb(54, 162, 235)',
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Interest Earned',
            data: interestData,
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.1)',
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Investment Growth Over Time'
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (context) => {
                return `${context.dataset.label}: $${context.parsed.y.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => `$${value.toLocaleString()}`
            }
          }
        }
      }
    });

    return this.chart;
  }

  /**
   * Create portfolio allocation pie chart
   */
  createPortfolioAllocationChart(allocations) {
    // allocations = [{name: 'Stocks', value: 60}, {name: 'Bonds', value: 30}, ...]
    const labels = allocations.map(a => a.name);
    const data = allocations.map(a => a.value);
    const colors = [
      'rgba(255, 99, 132, 0.8)',
      'rgba(54, 162, 235, 0.8)',
      'rgba(255, 206, 86, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(153, 102, 255, 0.8)',
      'rgba(255, 159, 64, 0.8)'
    ];

    this.chart = new Chart(this.ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors.slice(0, data.length),
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Portfolio Allocation'
          },
          legend: {
            position: 'right'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                return `${label}: ${value}%`;
              }
            }
          }
        }
      }
    });

    return this.chart;
  }

  /**
   * Create efficient frontier chart
   */
  createEfficientFrontierChart(frontierPoints, currentPortfolio = null) {
    // frontierPoints = [{risk: 10, return: 8}, ...]
    const data = frontierPoints.map(p => ({ x: p.risk, y: p.expectedReturn }));

    const datasets = [{
      label: 'Efficient Frontier',
      data: data,
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
      pointRadius: 3,
      showLine: true,
      tension: 0.4
    }];

    // Add current portfolio point if provided
    if (currentPortfolio) {
      datasets.push({
        label: 'Your Portfolio',
        data: [{ x: currentPortfolio.risk, y: currentPortfolio.return }],
        backgroundColor: 'rgb(255, 99, 132)',
        pointRadius: 8,
        pointStyle: 'star'
      });
    }

    this.chart = new Chart(this.ctx, {
      type: 'scatter',
      data: { datasets },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Efficient Frontier - Risk vs Return'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `Risk: ${context.parsed.x.toFixed(2)}%, Return: ${context.parsed.y.toFixed(2)}%`;
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Risk (Standard Deviation %)'
            },
            ticks: {
              callback: (value) => `${value}%`
            }
          },
          y: {
            title: {
              display: true,
              text: 'Expected Return %'
            },
            ticks: {
              callback: (value) => `${value}%`
            }
          }
        }
      }
    });

    return this.chart;
  }

  /**
   * Create amortization schedule chart
   */
  createAmortizationChart(schedule) {
    // schedule = [{year: 1, principal: 1000, interest: 500, balance: 99000}, ...]
    const labels = schedule.map(s => `Year ${s.year}`);
    const principalData = schedule.map(s => s.principal * 12); // Annual
    const interestData = schedule.map(s => s.interest * 12);
    const balanceData = schedule.map(s => s.balance);

    this.chart = new Chart(this.ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Principal',
            data: principalData,
            backgroundColor: 'rgba(54, 162, 235, 0.8)',
            stack: 'Stack 0'
          },
          {
            label: 'Interest',
            data: interestData,
            backgroundColor: 'rgba(255, 99, 132, 0.8)',
            stack: 'Stack 0'
          },
          {
            label: 'Remaining Balance',
            data: balanceData,
            type: 'line',
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            yAxisID: 'y1',
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Loan Amortization Schedule'
          }
        },
        scales: {
          y: {
            stacked: true,
            position: 'left',
            title: {
              display: true,
              text: 'Annual Payment ($)'
            },
            ticks: {
              callback: (value) => `$${value.toLocaleString()}`
            }
          },
          y1: {
            position: 'right',
            title: {
              display: true,
              text: 'Balance ($)'
            },
            ticks: {
              callback: (value) => `$${value.toLocaleString()}`
            },
            grid: {
              drawOnChartArea: false
            }
          }
        }
      }
    });

    return this.chart;
  }

  /**
   * Create Monte Carlo simulation histogram
   */
  createMonteCarloHistogram(results, bins = 50) {
    // results = [100000, 105000, 98000, ...] (final values)
    const min = Math.min(...results);
    const max = Math.max(...results);
    const binWidth = (max - min) / bins;

    const histogram = new Array(bins).fill(0);
    const labels = [];

    for (let i = 0; i < bins; i++) {
      const binStart = min + i * binWidth;
      const binEnd = binStart + binWidth;
      labels.push(`$${Math.round(binStart / 1000)}k`);
      
      results.forEach(value => {
        if (value >= binStart && value < binEnd) {
          histogram[i]++;
        }
      });
    }

    this.chart = new Chart(this.ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Frequency',
          data: histogram,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgb(75, 192, 192)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Monte Carlo Simulation - Distribution of Outcomes'
          },
          tooltip: {
            callbacks: {
              label: (context) => `Simulations: ${context.parsed.y}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Simulations'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Final Portfolio Value'
            }
          }
        }
      }
    });

    return this.chart;
  }

  /**
   * Create cash flow waterfall chart
   */
  createCashFlowWaterfall(cashFlows) {
    // cashFlows = [{label: 'Revenue', value: 100000}, {label: 'COGS', value: -40000}, ...]
    const labels = cashFlows.map(cf => cf.label);
    const data = [];
    let cumulative = 0;

    cashFlows.forEach((cf, i) => {
      if (i === 0) {
        data.push([0, cf.value]);
        cumulative = cf.value;
      } else if (i === cashFlows.length - 1) {
        // Final bar (net result)
        data.push([0, cumulative]);
      } else {
        data.push([cumulative, cumulative + cf.value]);
        cumulative += cf.value;
      }
    });

    this.chart = new Chart(this.ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Cash Flow',
          data: data.map((d, i) => d[1] - d[0]),
          backgroundColor: data.map((d, i) => {
            if (i === 0 || i === data.length - 1) return 'rgba(75, 192, 192, 0.8)';
            return d[1] > d[0] ? 'rgba(54, 162, 235, 0.8)' : 'rgba(255, 99, 132, 0.8)';
          })
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Cash Flow Waterfall'
          }
        },
        scales: {
          y: {
            ticks: {
              callback: (value) => `$${value.toLocaleString()}`
            }
          }
        }
      }
    });

    return this.chart;
  }

  /**
   * Destroy current chart
   */
  destroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
}

/**
 * Create interactive comparison chart
 */
function createComparisonChart(canvasId, datasets) {
  // datasets = [{label: 'Scenario 1', data: [...]}, {label: 'Scenario 2', data: [...]}]
  const ctx = document.getElementById(canvasId);
  
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: datasets[0].labels,
      datasets: datasets.map((ds, i) => ({
        label: ds.label,
        data: ds.data,
        borderColor: `hsl(${i * 137.5}, 70%, 50%)`, // Golden angle for color distribution
        backgroundColor: `hsla(${i * 137.5}, 70%, 50%, 0.1)`,
        tension: 0.4,
        fill: true
      }))
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Scenario Comparison'
        },
        legend: {
          position: 'top'
        }
      },
      interaction: {
        mode: 'index',
        intersect: false
      }
    }
  });
}

/**
 * Export chart as image
 */
function exportChartAsImage(chart, filename = 'chart.png') {
  const url = chart.toBase64Image();
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FinancialChartBuilder,
    createComparisonChart,
    exportChartAsImage
  };
}
