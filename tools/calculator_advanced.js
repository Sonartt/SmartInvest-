// ========== PHASE 1: HIGH-PRIORITY ADVANCED FINANCIAL CALCULATORS ==========
// Real Estate, Complete Tax, Enhanced Portfolio, DCF Valuation
// Created: January 29, 2026

// ========== REAL ESTATE FINANCE ==========

/**
 * Comprehensive Mortgage Calculator with PMI, taxes, insurance
 */
function calculateMortgage(homePrice, downPayment, interestRate, loanTerm, propertyTax, insurance, hoa = 0, pmi = 0) {
  const loanAmount = homePrice - downPayment;
  const monthlyRate = interestRate / 100 / 12;
  const months = loanTerm * 12;
  
  // Monthly mortgage payment (P&I)
  const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                         (Math.pow(1 + monthlyRate, months) - 1);
  
  // Additional monthly costs
  const monthlyPropertyTax = propertyTax / 12;
  const monthlyInsurance = insurance / 12;
  const monthlyHOA = hoa / 12;
  const monthlyPMI = (downPayment / homePrice < 0.20) ? (loanAmount * pmi / 100 / 12) : 0;
  
  const totalMonthlyPayment = monthlyPayment + monthlyPropertyTax + monthlyInsurance + monthlyHOA + monthlyPMI;
  
  // Amortization schedule summary
  let balance = loanAmount;
  let totalInterest = 0;
  const schedule = [];
  
  for (let month = 1; month <= months; month++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    balance -= principalPayment;
    totalInterest += interestPayment;
    
    if (month === 1 || month % 12 === 0 || month === months) {
      schedule.push({
        month,
        year: Math.ceil(month / 12),
        principal: principalPayment,
        interest: interestPayment,
        balance: Math.max(0, balance),
        totalInterest
      });
    }
  }
  
  // LTV and equity
  const ltv = (loanAmount / homePrice) * 100;
  const equity = homePrice - loanAmount;
  
  return {
    loanAmount,
    monthlyPayment,
    totalMonthlyPayment,
    monthlyPropertyTax,
    monthlyInsurance,
    monthlyHOA,
    monthlyPMI,
    totalInterest,
    totalCost: monthlyPayment * months + totalInterest,
    ltv,
    equity,
    schedule
  };
}

/**
 * Rental Property Analysis - Cap Rate, Cash Flow, ROI
 */
function calculateRentalProperty(purchasePrice, downPayment, closingCosts, monthlyRent, 
                                 vacancy, expenses, mortgagePayment, appreciation = 3) {
  const initialInvestment = downPayment + closingCosts;
  
  // Annual calculations
  const annualRent = monthlyRent * 12;
  const vacancyLoss = annualRent * (vacancy / 100);
  const effectiveRent = annualRent - vacancyLoss;
  
  const annualExpenses = expenses * 12;
  const annualMortgage = mortgagePayment * 12;
  
  const noi = effectiveRent - annualExpenses; // Net Operating Income
  const cashFlow = noi - annualMortgage;
  const monthlyCashFlow = cashFlow / 12;
  
  // Cap Rate
  const capRate = (noi / purchasePrice) * 100;
  
  // Cash-on-Cash Return
  const cocReturn = (cashFlow / initialInvestment) * 100;
  
  // Gross Rent Multiplier
  const grm = purchasePrice / annualRent;
  
  // 5-year projection
  const projections = [];
  let propertyValue = purchasePrice;
  
  for (let year = 1; year <= 5; year++) {
    propertyValue *= (1 + appreciation / 100);
    const yearNOI = noi * Math.pow(1.02, year); // 2% rent increase
    const yearCashFlow = yearNOI - annualMortgage;
    
    projections.push({
      year,
      propertyValue,
      noi: yearNOI,
      cashFlow: yearCashFlow,
      equity: propertyValue - (purchasePrice - downPayment)
    });
  }
  
  return {
    noi,
    cashFlow,
    monthlyCashFlow,
    capRate,
    cocReturn,
    grm,
    vacancy: vacancyLoss,
    breakEven: annualExpenses + annualMortgage,
    projections
  };
}

/**
 * Real Estate Investment Analysis - 1031 Exchange, Depreciation
 */
function calculate1031Exchange(oldProperty, newProperty, capitalGainsTax = 20, depreciationRecapture = 25) {
  const gain = newProperty.purchasePrice - oldProperty.purchasePrice;
  
  // Taxes if sold outright
  const capitalGains = gain > 0 ? gain : 0;
  const depreciation = oldProperty.accumulatedDepreciation || 0;
  
  const capitalGainsTaxOwed = capitalGains * (capitalGainsTax / 100);
  const depreciationTaxOwed = depreciation * (depreciationRecapture / 100);
  const totalTaxOwed = capitalGainsTaxOwed + depreciationTaxOwed;
  
  // Benefits of 1031 exchange
  const taxDeferred = totalTaxOwed;
  const additionalCapital = taxDeferred; // Money that can be invested
  
  // New property basis
  const newBasis = oldProperty.purchasePrice + (newProperty.purchasePrice - oldProperty.purchasePrice);
  
  return {
    oldPropertyValue: oldProperty.purchasePrice,
    newPropertyValue: newProperty.purchasePrice,
    capitalGains,
    depreciation,
    taxDeferred,
    additionalCapital,
    newBasis,
    recommendation: taxDeferred > 10000 ? '1031 Exchange highly beneficial' : 'Consider direct sale'
  };
}

// ========== COMPLETE TAX PLANNING ==========

/**
 * Comprehensive Tax Calculator - Federal, State, Capital Gains
 */
function calculateCompleteTax(income, filingStatus, state, capitalGains, dividends, deductions) {
  // Federal Income Tax (2024 brackets)
  const federalBrackets = {
    single: [
      { limit: 11600, rate: 0.10 },
      { limit: 47150, rate: 0.12 },
      { limit: 100525, rate: 0.22 },
      { limit: 191950, rate: 0.24 },
      { limit: 243725, rate: 0.32 },
      { limit: 609350, rate: 0.35 },
      { limit: Infinity, rate: 0.37 }
    ],
    married: [
      { limit: 23200, rate: 0.10 },
      { limit: 94300, rate: 0.12 },
      { limit: 201050, rate: 0.22 },
      { limit: 383900, rate: 0.24 },
      { limit: 487450, rate: 0.32 },
      { limit: 731200, rate: 0.35 },
      { limit: Infinity, rate: 0.37 }
    ]
  };
  
  // Calculate federal tax
  const taxableIncome = Math.max(0, income - deductions);
  let federalTax = 0;
  let prevLimit = 0;
  
  for (const bracket of federalBrackets[filingStatus] || federalBrackets.single) {
    if (taxableIncome > prevLimit) {
      const taxableInBracket = Math.min(taxableIncome, bracket.limit) - prevLimit;
      federalTax += taxableInBracket * bracket.rate;
      prevLimit = bracket.limit;
    } else {
      break;
    }
  }
  
  // State tax (simplified - flat rates for common states)
  const stateTaxRates = {
    'CA': 0.093,
    'NY': 0.0685,
    'TX': 0.0,
    'FL': 0.0,
    'WA': 0.0,
    'IL': 0.0495,
    'MA': 0.05,
    'PA': 0.0307
  };
  
  const stateTax = taxableIncome * (stateTaxRates[state] || 0.05);
  
  // Capital Gains Tax (long-term)
  let capitalGainsTax = 0;
  if (taxableIncome < 47025) {
    capitalGainsTax = capitalGains * 0.0;
  } else if (taxableIncome < 518900) {
    capitalGainsTax = capitalGains * 0.15;
  } else {
    capitalGainsTax = capitalGains * 0.20;
  }
  
  // Qualified Dividends (same as capital gains rates)
  const dividendTax = capitalGainsTax > 0 ? dividends * 0.15 : dividends * 0.0;
  
  // FICA (Social Security + Medicare)
  const socialSecurity = Math.min(income, 168600) * 0.062;
  const medicare = income * 0.0145;
  const additionalMedicare = income > 200000 ? (income - 200000) * 0.009 : 0;
  const ficaTax = socialSecurity + medicare + additionalMedicare;
  
  // Total tax
  const totalTax = federalTax + stateTax + capitalGainsTax + dividendTax + ficaTax;
  const effectiveRate = (totalTax / income) * 100;
  const afterTaxIncome = income + capitalGains + dividends - totalTax;
  
  return {
    grossIncome: income,
    capitalGains,
    dividends,
    totalIncome: income + capitalGains + dividends,
    deductions,
    taxableIncome,
    federalTax,
    stateTax,
    capitalGainsTax,
    dividendTax,
    ficaTax,
    totalTax,
    effectiveRate,
    afterTaxIncome,
    breakdown: {
      federal: federalTax,
      state: stateTax,
      fica: ficaTax,
      investment: capitalGainsTax + dividendTax
    }
  };
}

/**
 * Roth vs Traditional IRA Comparison
 */
function compareIRA(contribution, years, returnRate, currentTaxRate, retirementTaxRate) {
  const rate = returnRate / 100;
  
  // Traditional IRA
  const traditionalContribution = contribution; // Pre-tax
  const traditionalBalance = contribution * Math.pow(1 + rate, years);
  const traditionalAfterTax = traditionalBalance * (1 - retirementTaxRate / 100);
  
  // Roth IRA
  const rothContribution = contribution * (1 - currentTaxRate / 100); // After-tax
  const rothBalance = rothContribution * Math.pow(1 + rate, years);
  const rothAfterTax = rothBalance; // Tax-free withdrawal
  
  // Tax savings
  const traditionalTaxSavingsNow = contribution * (currentTaxRate / 100);
  const rothTaxSavingsRetirement = rothBalance * (retirementTaxRate / 100);
  
  const difference = rothAfterTax - traditionalAfterTax;
  const betterChoice = difference > 0 ? 'Roth IRA' : 'Traditional IRA';
  
  return {
    traditional: {
      contribution: traditionalContribution,
      balance: traditionalBalance,
      afterTax: traditionalAfterTax,
      taxSavingsNow: traditionalTaxSavingsNow
    },
    roth: {
      contribution: rothContribution,
      balance: rothBalance,
      afterTax: rothAfterTax,
      taxSavingsRetirement: rothTaxSavingsRetirement
    },
    difference,
    betterChoice,
    recommendation: difference > 1000 ? `${betterChoice} is significantly better` : 'Both options are similar'
  };
}

/**
 * Tax Loss Harvesting Calculator
 */
function calculateTaxLossHarvesting(capitalGains, capitalLosses, carryover, income, taxRate) {
  // Net capital gains/losses
  const netGains = capitalGains - capitalLosses - carryover;
  
  // Offset against ordinary income (up to $3,000)
  const ordinaryIncomeOffset = netGains < 0 ? Math.min(Math.abs(netGains), 3000) : 0;
  
  // Remaining loss to carry forward
  const newCarryover = netGains < 0 ? Math.abs(netGains) - ordinaryIncomeOffset : 0;
  
  // Tax savings
  const capitalGainsTaxSaved = Math.max(0, -netGains - ordinaryIncomeOffset) * (taxRate / 100);
  const ordinaryIncomeTaxSaved = ordinaryIncomeOffset * (taxRate / 100);
  const totalTaxSaved = capitalGainsTaxSaved + ordinaryIncomeTaxSaved;
  
  return {
    capitalGains,
    capitalLosses,
    carryover,
    netGains,
    ordinaryIncomeOffset,
    newCarryover,
    totalTaxSaved,
    recommendation: totalTaxSaved > 500 ? 'Tax loss harvesting is beneficial' : 'Consider waiting for better opportunities'
  };
}

// ========== ENHANCED PORTFOLIO OPTIMIZATION ==========

/**
 * Modern Portfolio Theory - Efficient Frontier
 */
function calculateEfficientFrontier(assets, riskFreeRate = 2) {
  // assets = [{name, return, stdDev, correlation: {...}}]
  const n = assets.length;
  const frontier = [];
  
  // Generate points on efficient frontier
  for (let targetReturn = 5; targetReturn <= 20; targetReturn += 0.5) {
    // Simple optimization: minimize risk for target return
    // Using equal-weighted baseline then adjust
    let weights = new Array(n).fill(1 / n);
    
    // Iterative adjustment (simplified Markowitz)
    for (let iter = 0; iter < 50; iter++) {
      const portfolioReturn = weights.reduce((sum, w, i) => sum + w * assets[i].return, 0);
      
      if (Math.abs(portfolioReturn - targetReturn) < 0.1) break;
      
      // Adjust weights toward target
      const adjustment = (targetReturn - portfolioReturn) / n;
      weights = weights.map((w, i) => Math.max(0, w + adjustment / assets[i].return));
      
      // Normalize
      const sum = weights.reduce((a, b) => a + b, 0);
      weights = weights.map(w => w / sum);
    }
    
    // Calculate portfolio risk
    let variance = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const correlation = i === j ? 1 : (assets[i].correlation?.[assets[j].name] || 0);
        variance += weights[i] * weights[j] * assets[i].stdDev * assets[j].stdDev * correlation;
      }
    }
    const risk = Math.sqrt(variance);
    
    const sharpe = (targetReturn - riskFreeRate) / risk;
    
    frontier.push({
      expectedReturn: targetReturn,
      risk,
      sharpe,
      weights: weights.map((w, i) => ({ asset: assets[i].name, weight: w }))
    });
  }
  
  // Find optimal portfolio (max Sharpe)
  const optimal = frontier.reduce((best, current) => 
    current.sharpe > best.sharpe ? current : best
  );
  
  return {
    frontier,
    optimal,
    riskFreeRate
  };
}

/**
 * Capital Asset Pricing Model (CAPM)
 */
function calculateCAPM(riskFreeRate, marketReturn, beta) {
  const expectedReturn = riskFreeRate + beta * (marketReturn - riskFreeRate);
  const marketRiskPremium = marketReturn - riskFreeRate;
  
  return {
    expectedReturn,
    riskFreeRate,
    marketReturn,
    beta,
    marketRiskPremium,
    interpretation: beta > 1 ? 'More volatile than market' : beta < 1 ? 'Less volatile than market' : 'Tracks market'
  };
}

/**
 * Monte Carlo Simulation for Portfolio
 */
function monteCarloSimulation(initialInvestment, annualReturn, stdDev, years, simulations = 1000) {
  const results = [];
  
  for (let sim = 0; sim < simulations; sim++) {
    let value = initialInvestment;
    
    for (let year = 0; year < years; year++) {
      // Generate random return using normal distribution
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); // Box-Muller
      const yearReturn = annualReturn / 100 + (stdDev / 100) * z;
      
      value *= (1 + yearReturn);
    }
    
    results.push(value);
  }
  
  results.sort((a, b) => a - b);
  
  // Calculate percentiles
  const median = results[Math.floor(simulations / 2)];
  const percentile10 = results[Math.floor(simulations * 0.10)];
  const percentile90 = results[Math.floor(simulations * 0.90)];
  const mean = results.reduce((a, b) => a + b, 0) / simulations;
  
  return {
    simulations,
    years,
    initialInvestment,
    mean,
    median,
    percentile10,
    percentile90,
    bestCase: results[simulations - 1],
    worstCase: results[0],
    probabilityOfLoss: results.filter(r => r < initialInvestment).length / simulations * 100
  };
}

// ========== DCF VALUATION ==========

/**
 * Discounted Cash Flow (DCF) Valuation
 */
function calculateDCF(freeCashFlows, terminalGrowthRate, wacc, cashAndEquivalents, debt, sharesOutstanding) {
  const discountRate = wacc / 100;
  const growthRate = terminalGrowthRate / 100;
  
  // Present value of projected cash flows
  let pvCashFlows = 0;
  freeCashFlows.forEach((fcf, i) => {
    pvCashFlows += fcf / Math.pow(1 + discountRate, i + 1);
  });
  
  // Terminal value
  const lastFCF = freeCashFlows[freeCashFlows.length - 1];
  const terminalValue = (lastFCF * (1 + growthRate)) / (discountRate - growthRate);
  const pvTerminalValue = terminalValue / Math.pow(1 + discountRate, freeCashFlows.length);
  
  // Enterprise value
  const enterpriseValue = pvCashFlows + pvTerminalValue;
  
  // Equity value
  const equityValue = enterpriseValue + cashAndEquivalents - debt;
  
  // Price per share
  const pricePerShare = equityValue / sharesOutstanding;
  
  return {
    pvCashFlows,
    terminalValue,
    pvTerminalValue,
    enterpriseValue,
    equityValue,
    pricePerShare,
    wacc,
    terminalGrowthRate,
    breakdown: {
      cashFlowValue: pvCashFlows,
      terminalValuePortion: pvTerminalValue,
      cash: cashAndEquivalents,
      debt: -debt
    }
  };
}

/**
 * Dividend Discount Model (DDM) - Gordon Growth
 */
function calculateDDM(currentDividend, growthRate, requiredReturn) {
  const g = growthRate / 100;
  const r = requiredReturn / 100;
  
  if (r <= g) {
    return {
      error: 'Required return must be greater than growth rate',
      intrinsicValue: null
    };
  }
  
  const nextDividend = currentDividend * (1 + g);
  const intrinsicValue = nextDividend / (r - g);
  
  return {
    currentDividend,
    nextDividend,
    growthRate,
    requiredReturn,
    intrinsicValue,
    dividendYield: (nextDividend / intrinsicValue) * 100
  };
}

/**
 * Weighted Average Cost of Capital (WACC)
 */
function calculateWACC(marketValueEquity, marketValueDebt, costOfEquity, costOfDebt, taxRate) {
  const totalCapital = marketValueEquity + marketValueDebt;
  const equityWeight = marketValueEquity / totalCapital;
  const debtWeight = marketValueDebt / totalCapital;
  
  const afterTaxCostOfDebt = costOfDebt * (1 - taxRate / 100);
  const wacc = (equityWeight * costOfEquity) + (debtWeight * afterTaxCostOfDebt);
  
  return {
    wacc,
    equityWeight: equityWeight * 100,
    debtWeight: debtWeight * 100,
    costOfEquity,
    costOfDebt,
    afterTaxCostOfDebt,
    taxRate
  };
}

// ========== PHASE 2: MEDIUM PRIORITY ==========

/**
 * Credit Analysis - Debt Service Coverage Ratio
 */
function calculateDSCR(netOperatingIncome, totalDebtService) {
  const dscr = netOperatingIncome / totalDebtService;
  
  let rating;
  if (dscr >= 1.25) rating = 'Excellent - Low risk';
  else if (dscr >= 1.15) rating = 'Good - Acceptable risk';
  else if (dscr >= 1.0) rating = 'Marginal - High risk';
  else rating = 'Poor - Cannot cover debt';
  
  return {
    dscr,
    netOperatingIncome,
    totalDebtService,
    excessCashFlow: netOperatingIncome - totalDebtService,
    rating
  };
}

/**
 * Lease vs Buy Analysis
 */
function calculateLeaseVsBuy(assetCost, leaseTerm, monthlyLease, purchaseOption, 
                             loanRate, salvageValue, taxRate) {
  // Lease analysis
  const totalLeasePayments = monthlyLease * leaseTerm * 12;
  const purchaseOptionCost = purchaseOption || 0;
  const totalLeaseCost = totalLeasePayments + purchaseOptionCost;
  
  // Tax benefit of lease (deductible)
  const leaseTaxSavings = totalLeasePayments * (taxRate / 100);
  const netLeaseCost = totalLeaseCost - leaseTaxSavings;
  
  // Buy analysis
  const monthlyRate = loanRate / 100 / 12;
  const months = leaseTerm * 12;
  const monthlyPayment = assetCost * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                         (Math.pow(1 + monthlyRate, months) - 1);
  
  const totalBuyPayments = monthlyPayment * months;
  let totalInterest = 0;
  let balance = assetCost;
  
  for (let i = 0; i < months; i++) {
    const interest = balance * monthlyRate;
    totalInterest += interest;
    balance -= (monthlyPayment - interest);
  }
  
  // Depreciation tax shield (assuming 5-year MACRS)
  const depreciationTaxSavings = assetCost * 0.7 * (taxRate / 100); // Simplified
  const totalBuyCost = totalBuyPayments - salvageValue - depreciationTaxSavings;
  
  const savings = netLeaseCost - totalBuyCost;
  const recommendation = savings > 0 ? 'Buy' : 'Lease';
  
  return {
    lease: {
      monthlyPayment: monthlyLease,
      totalPayments: totalLeasePayments,
      purchaseOption: purchaseOptionCost,
      taxSavings: leaseTaxSavings,
      netCost: netLeaseCost
    },
    buy: {
      monthlyPayment,
      totalPayments: totalBuyPayments,
      interest: totalInterest,
      salvageValue,
      depreciationShield: depreciationTaxSavings,
      netCost: totalBuyCost
    },
    savings,
    recommendation
  };
}

// Export all functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // Real Estate
    calculateMortgage,
    calculateRentalProperty,
    calculate1031Exchange,
    
    // Tax Planning
    calculateCompleteTax,
    compareIRA,
    calculateTaxLossHarvesting,
    
    // Portfolio Optimization
    calculateEfficientFrontier,
    calculateCAPM,
    monteCarloSimulation,
    
    // DCF Valuation
    calculateDCF,
    calculateDDM,
    calculateWACC,
    
    // Phase 2
    calculateDSCR,
    calculateLeaseVsBuy
  };
}
