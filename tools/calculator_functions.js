// ========== COMPREHENSIVE FINANCIAL CALCULATOR FUNCTIONS ==========
// All sophisticated calculation functions for actuarial science, investments, 
// risk analysis, insurance, bonds, pensions, retirement, business & auditing

// ========== BOND CALCULATIONS ==========
function calculateBond(faceValue, couponRate, years, marketYield, paymentsPerYear) {
  const n = years * paymentsPerYear;
  const couponPayment = (faceValue * couponRate / 100) / paymentsPerYear;
  const yieldPerPeriod = marketYield / 100 / paymentsPerYear;
  
  // Bond Price = PV of coupons + PV of face value
  let pvCoupons = 0;
  if (yieldPerPeriod > 0) {
    pvCoupons = couponPayment * (1 - Math.pow(1 + yieldPerPeriod, -n)) / yieldPerPeriod;
  } else {
    pvCoupons = couponPayment * n;
  }
  const pvFace = faceValue * Math.pow(1 + yieldPerPeriod, -n);
  const bondPrice = pvCoupons + pvFace;
  
  // Macaulay Duration
  let duration = 0;
  for (let t = 1; t <= n; t++) {
    const cfPV = couponPayment * Math.pow(1 + yieldPerPeriod, -t);
    duration += t * cfPV;
  }
  duration += n * pvFace;
  duration = duration / bondPrice / paymentsPerYear;
  
  // Modified Duration
  const modDuration = duration / (1 + yieldPerPeriod);
  
  // Convexity
  let convexity = 0;
  for (let t = 1; t <= n; t++) {
    const cfPV = couponPayment * Math.pow(1 + yieldPerPeriod, -t);
    convexity += t * (t + 1) * cfPV;
  }
  convexity += n * (n + 1) * pvFace;
  convexity = convexity / (bondPrice * Math.pow(1 + yieldPerPeriod, 2)) / Math.pow(paymentsPerYear, 2);
  
  // Current Yield
  const currentYield = (faceValue * couponRate / 100) / bondPrice * 100;
  
  return {
    price: bondPrice,
    duration: duration,
    modDuration: modDuration,
    convexity: convexity,
    currentYield: currentYield,
    ytm: marketYield,
    totalCouponPayments: couponPayment * n,
    premium: bondPrice > faceValue,
    discount: bondPrice < faceValue
  };
}

// ========== PENSION/RETIREMENT CALCULATIONS ==========
function calculateRetirement(currentAge, retireAge, currentSavings, monthlyContrib, annualReturn, employerMatch, inflation, lifeExpectancy) {
  const yearsToRetirement = retireAge - currentAge;
  const yearsInRetirement = lifeExpectancy - retireAge;
  const monthlyRate = Math.pow(1 + annualReturn / 100, 1 / 12) - 1;
  
  // Accumulation phase
  let balance = currentSavings;
  const totalContrib = monthlyContrib * (1 + employerMatch / 100);
  const months = yearsToRetirement * 12;
  
  for (let m = 1; m <= months; m++) {
    balance = balance * (1 + monthlyRate) + totalContrib;
  }
  
  const retirementBalance = balance;
  
  // Real purchasing power (inflation-adjusted)
  const realBalance = retirementBalance / Math.pow(1 + inflation / 100, yearsToRetirement);
  
  // Withdrawal phase - sustainable withdrawal (4% rule adjusted)
  const safeWithdrawalRate = 0.04;
  const annualWithdrawal = retirementBalance * safeWithdrawalRate;
  const monthlyIncome = annualWithdrawal / 12;
  
  // Calculate if savings will last through retirement
  let retBalance = retirementBalance;
  const retMonthlyRate = Math.pow(1 + (annualReturn - inflation) / 100, 1 / 12) - 1;
  let lastingYears = 0;
  
  for (let y = 0; y < yearsInRetirement; y++) {
    for (let m = 0; m < 12; m++) {
      retBalance = retBalance * (1 + retMonthlyRate) - monthlyIncome;
      if (retBalance <= 0) break;
    }
    if (retBalance <= 0) break;
    lastingYears++;
  }
  
  const sufficient = lastingYears >= yearsInRetirement;
  
  return {
    retirementBalance,
    realBalance,
    annualWithdrawal,
    monthlyIncome,
    totalContributions: currentSavings + totalContrib * months,
    investmentGains: retirementBalance - (currentSavings + totalContrib * months),
    lastingYears: lastingYears > yearsInRetirement ? yearsInRetirement : lastingYears,
    sufficient
  };
}

// ========== ACTUARIAL SCIENCE CALCULATIONS ==========
function calculateAnnuity(type, payment, rate, periods, age, deferral) {
  const r = rate / 100;
  let pv = 0;
  
  // Simplified mortality table (Gompertz-Makeham)
  function survivalProb(x, t) {
    const mortality = 0.0005 * Math.exp(0.08 * (x - 20));
    return Math.exp(-mortality * t);
  }
  
  if (type === 'immediate') {
    // Ordinary annuity: PV = PMT * [(1 - (1+r)^-n) / r]
    pv = payment * (1 - Math.pow(1 + r, -periods)) / r;
  } else if (type === 'deferred') {
    // Deferred annuity: PV = PMT * [(1 - (1+r)^-n) / r] * (1+r)^-deferral
    const ordinaryPV = payment * (1 - Math.pow(1 + r, -periods)) / r;
    pv = ordinaryPV * Math.pow(1 + r, -deferral);
  } else if (type === 'life') {
    // Life annuity with mortality
    for (let t = 1; t <= periods; t++) {
      const survival = survivalProb(age, t);
      pv += payment * survival * Math.pow(1 + r, -t);
    }
  } else if (type === 'certain') {
    // Annuity certain (same as immediate)
    pv = payment * (1 - Math.pow(1 + r, -periods)) / r;
  }
  
  const totalPayments = payment * periods;
  const discountEffect = totalPayments - pv;
  
  return {
    presentValue: pv,
    totalPayments: totalPayments,
    discountEffect: discountEffect,
    effectiveReturn: rate
  };
}

// ========== RISK ANALYSIS CALCULATIONS ==========
function calculateRisk(value, expectedReturn, stdDev, rfRate, confidence, days, beta, marketReturn) {
  // Value at Risk (VaR) - Parametric method
  const zScores = { 90: 1.282, 95: 1.645, 99: 2.326 };
  const z = zScores[confidence] || 1.645;
  
  const dailyReturn = expectedReturn / 100 / 252; // 252 trading days
  const dailyStd = stdDev / 100 / Math.sqrt(252);
  
  const varAbsolute = value * z * dailyStd * Math.sqrt(days);
  const varPercent = z * dailyStd * Math.sqrt(days) * 100;
  
  // Sharpe Ratio
  const sharpeRatio = (expectedReturn - rfRate) / stdDev;
  
  // Treynor Ratio
  const treynorRatio = (expectedReturn - rfRate) / beta;
  
  // Jensen's Alpha
  const alpha = expectedReturn - (rfRate + beta * (marketReturn - rfRate));
  
  // Expected Shortfall (CVaR) - approximation
  const cvar = value * dailyStd * Math.sqrt(days) * Math.exp(-0.5 * z * z) / ((1 - confidence / 100) * Math.sqrt(2 * Math.PI));
  
  // Portfolio volatility
  const annualizedVol = stdDev;
  
  return {
    var: varAbsolute,
    varPercent: varPercent,
    cvar: cvar,
    sharpe: sharpeRatio,
    treynor: treynorRatio,
    alpha: alpha,
    beta: beta,
    annualizedVol: annualizedVol
  };
}

// ========== BUSINESS FINANCE CALCULATIONS ==========
function calculateNPVIRR(initial, cashflows, rate) {
  // NPV calculation
  let npv = -initial;
  cashflows.forEach((cf, i) => {
    npv += cf / Math.pow(1 + rate / 100, i + 1);
  });
  
  // IRR calculation using Newton-Raphson method
  function npvAtRate(r) {
    let val = -initial;
    cashflows.forEach((cf, i) => {
      val += cf / Math.pow(1 + r, i + 1);
    });
    return val;
  }
  
  function npvDerivative(r) {
    let val = 0;
    cashflows.forEach((cf, i) => {
      val -= (i + 1) * cf / Math.pow(1 + r, i + 2);
    });
    return val;
  }
  
  let irr = 0.1; // Initial guess
  for (let iter = 0; iter < 100; iter++) {
    const f = npvAtRate(irr);
    const df = npvDerivative(irr);
    if (Math.abs(f) < 0.0001) break;
    irr = irr - f / df;
    if (irr < -0.99) irr = -0.99; // Prevent negative infinity
  }
  
  // Payback period
  let cumulative = -initial;
  let payback = 0;
  for (let i = 0; i < cashflows.length; i++) {
    cumulative += cashflows[i];
    if (cumulative >= 0) {
      payback = i + 1 - (cumulative - cashflows[i]) / cashflows[i];
      break;
    }
  }
  if (cumulative < 0) payback = cashflows.length;
  
  // Profitability Index
  let pvInflows = 0;
  cashflows.forEach((cf, i) => {
    pvInflows += cf / Math.pow(1 + rate / 100, i + 1);
  });
  const pi = pvInflows / initial;
  
  return {
    npv: npv,
    irr: irr * 100,
    payback: payback,
    pi: pi,
    totalCashflow: cashflows.reduce((a, b) => a + b, 0)
  };
}

function calculateRatios(currAssets, currLiab, totAssets, totLiab, revenue, netIncome) {
  return {
    currentRatio: currAssets / currLiab,
    quickRatio: (currAssets * 0.7) / currLiab, // Assuming 70% is liquid
    debtToEquity: totLiab / (totAssets - totLiab),
    debtToAssets: totLiab / totAssets,
    roe: netIncome / (totAssets - totLiab) * 100,
    roa: netIncome / totAssets * 100,
    profitMargin: netIncome / revenue * 100,
    workingCapital: currAssets - currLiab
  };
}

// ========== AUDITING TOOLS ==========
function calculateAudit(assets, revenue, income, matPct, popSize, confLevel, margin, errorRate) {
  // Materiality thresholds
  const assetMateriality = assets * (matPct / 100);
  const revenueMateriality = revenue * (matPct / 100);
  const incomeMateriality = income * (matPct / 100);
  
  // Choose the smallest (most conservative)
  const materiality = Math.min(assetMateriality, revenueMateriality, incomeMateriality);
  const performanceMateriality = materiality * 0.75; // Typically 75% of materiality
  const trivialThreshold = materiality * 0.05; // 5% of materiality
  
  // Sample size calculation (for attributes sampling)
  const zScores = { 90: 1.645, 95: 1.96, 99: 2.576 };
  const z = zScores[confLevel] || 1.96;
  const p = errorRate / 100;
  const e = margin / 100;
  
  // Formula: n = (z² * p * (1-p)) / e²
  let sampleSize = (z * z * p * (1 - p)) / (e * e);
  
  // Finite population correction
  if (popSize > 0) {
    sampleSize = sampleSize / (1 + ((sampleSize - 1) / popSize));
  }
  
  sampleSize = Math.ceil(sampleSize);
  
  return {
    materiality,
    performanceMateriality,
    trivialThreshold,
    sampleSize,
    samplingRate: (sampleSize / popSize * 100)
  };
}

// ========== ADDITIONAL CALCULATIONS ==========

// Options Pricing (Black-Scholes)
function calculateBlackScholes(S, K, T, r, sigma, optionType = 'call') {
  // S = current stock price
  // K = strike price
  // T = time to maturity (years)
  // r = risk-free rate
  // sigma = volatility
  
  function normalCDF(x) {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - prob : prob;
  }
  
  const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  
  let price, delta, gamma, vega, theta, rho;
  
  if (optionType === 'call') {
    price = S * normalCDF(d1) - K * Math.exp(-r * T) * normalCDF(d2);
    delta = normalCDF(d1);
    rho = K * T * Math.exp(-r * T) * normalCDF(d2) / 100;
  } else {
    price = K * Math.exp(-r * T) * normalCDF(-d2) - S * normalCDF(-d1);
    delta = normalCDF(d1) - 1;
    rho = -K * T * Math.exp(-r * T) * normalCDF(-d2) / 100;
  }
  
  // Greeks (common for both)
  gamma = Math.exp(-d1 * d1 / 2) / (S * sigma * Math.sqrt(2 * Math.PI * T));
  vega = S * Math.sqrt(T) * Math.exp(-d1 * d1 / 2) / Math.sqrt(2 * Math.PI) / 100;
  theta = (-S * sigma * Math.exp(-d1 * d1 / 2) / (2 * Math.sqrt(2 * Math.PI * T)) 
           - r * K * Math.exp(-r * T) * (optionType === 'call' ? normalCDF(d2) : normalCDF(-d2))) / 365;
  
  return { price, delta, gamma, vega, theta, rho };
}

// Loan Affordability Calculator
function calculateLoanAffordability(monthlyIncome, monthlyDebt, downPayment, interestRate, loanTerm) {
  const dti = 0.43; // 43% debt-to-income ratio (standard)
  const maxMonthlyPayment = (monthlyIncome * dti) - monthlyDebt;
  
  const r = interestRate / 100 / 12;
  const n = loanTerm * 12;
  
  // Maximum loan amount based on payment
  const maxLoan = maxMonthlyPayment * (1 - Math.pow(1 + r, -n)) / r;
  const maxHomePrice = maxLoan + downPayment;
  
  return {
    maxMonthlyPayment,
    maxLoan,
    maxHomePrice,
    downPayment,
    dtiRatio: dti * 100
  };
}

// Portfolio Optimization (Sharpe Ratio Maximization)
function optimizePortfolio(assets) {
  // assets = [{return: 8, risk: 15, weight: 0}, ...]
  // Simple equal-weight as baseline
  const n = assets.length;
  assets.forEach(a => a.weight = 1 / n);
  
  const portfolioReturn = assets.reduce((sum, a) => sum + a.return * a.weight, 0);
  const portfolioRisk = Math.sqrt(assets.reduce((sum, a) => sum + Math.pow(a.risk * a.weight, 2), 0));
  const sharpe = portfolioReturn / portfolioRisk;
  
  return {
    expectedReturn: portfolioReturn,
    risk: portfolioRisk,
    sharpeRatio: sharpe,
    weights: assets.map(a => ({ asset: a.name, weight: (a.weight * 100).toFixed(2) + '%' }))
  };
}

// Depreciation Calculators
function calculateDepreciation(cost, salvageValue, usefulLife, method = 'straight-line', year = 1) {
  let depreciation, bookValue;
  
  if (method === 'straight-line') {
    depreciation = (cost - salvageValue) / usefulLife;
    bookValue = cost - (depreciation * year);
  } else if (method === 'declining-balance') {
    const rate = 2 / usefulLife; // Double declining
    let remainingValue = cost;
    for (let y = 1; y <= year; y++) {
      depreciation = remainingValue * rate;
      remainingValue -= depreciation;
      if (remainingValue < salvageValue) {
        depreciation = remainingValue - salvageValue;
        remainingValue = salvageValue;
      }
    }
    bookValue = remainingValue;
  } else if (method === 'sum-of-years') {
    const sumOfYears = (usefulLife * (usefulLife + 1)) / 2;
    const yearFactor = (usefulLife - year + 1) / sumOfYears;
    depreciation = (cost - salvageValue) * yearFactor;
    bookValue = cost - depreciation;
  }
  
  return {
    annualDepreciation: depreciation,
    accumulatedDepreciation: cost - bookValue,
    bookValue: bookValue,
    method: method
  };
}

// Tax Calculations
function calculateIncomeTax(income, filingStatus = 'single', deductions = 0) {
  // 2024 US Federal Tax Brackets (simplified)
  const brackets = {
    single: [
      { limit: 11600, rate: 0.10 },
      { limit: 47150, rate: 0.12 },
      { limit: 100525, rate: 0.22 },
      { limit: 191950, rate: 0.24 },
      { limit: 243725, rate: 0.32 },
      { limit: 609350, rate: 0.35 },
      { limit: Infinity, rate: 0.37 }
    ]
  };
  
  const taxableIncome = Math.max(0, income - deductions);
  let tax = 0;
  let prevLimit = 0;
  
  for (const bracket of brackets[filingStatus]) {
    if (taxableIncome > prevLimit) {
      const taxableInBracket = Math.min(taxableIncome, bracket.limit) - prevLimit;
      tax += taxableInBracket * bracket.rate;
      prevLimit = bracket.limit;
    } else {
      break;
    }
  }
  
  return {
    grossIncome: income,
    deductions: deductions,
    taxableIncome: taxableIncome,
    totalTax: tax,
    effectiveRate: (tax / income * 100).toFixed(2),
    afterTaxIncome: income - tax
  };
}

// Export all functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateBond,
    calculateRetirement,
    calculateAnnuity,
    calculateRisk,
    calculateNPVIRR,
    calculateRatios,
    calculateAudit,
    calculateBlackScholes,
    calculateLoanAffordability,
    optimizePortfolio,
    calculateDepreciation,
    calculateIncomeTax
  };
}
