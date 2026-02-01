/**
 * SOPHISTICATED ACTUARIAL & INSURANCE CALCULATORS
 * Comprehensive financial modeling for insurance, pensions, annuities, and actuarial science
 * Created: January 30, 2026
 */

// ========== LIFE INSURANCE CALCULATORS ==========

/**
 * Term Life Insurance Premium Calculator
 * Estimates premiums based on age, health, coverage, and term length
 * @param {number} age - Current age
 * @param {number} coverageAmount - Death benefit amount
 * @param {number} termYears - Term length (10, 20, 30 years)
 * @param {string} health - Health status (excellent, good, average, poor)
 * @param {boolean} isSmoker - Smoking status
 * @returns {object} Premium estimates and comparisons
 */
function calculateTermLifeInsurance(age, coverageAmount, termYears, health = 'good', isSmoker = false) {
  // Base rates per $1000 of coverage (per year)
  const baseRates = {
    excellent: { 10: 0.25, 20: 0.45, 30: 0.75 },
    good: { 10: 0.35, 20: 0.65, 30: 1.10 },
    average: { 10: 0.55, 20: 1.05, 30: 1.85 },
    poor: { 10: 1.05, 20: 2.15, 30: 4.25 }
  };

  const baseRate = baseRates[health][termYears] || 0.65;
  
  // Age multiplier (increases exponentially with age)
  const ageMultiplier = Math.pow(1.08, Math.max(0, age - 35));
  
  // Smoker surcharge (typically 2-3x higher)
  const smokerMultiplier = isSmoker ? 2.5 : 1.0;
  
  // Calculate monthly premium
  const coverage = coverageAmount / 1000;
  const adjustedRate = baseRate * ageMultiplier * smokerMultiplier;
  const monthlyPremium = (coverage * adjustedRate) / 12;
  const annualPremium = monthlyPremium * 12;
  const totalCost = annualPremium * termYears;

  // Life expectancy impact
  const lifeExpectancy = calculateLifeExpectancy(age, isSmoker);
  const deathProbability = calculateDeathProbability(age, termYears, isSmoker);

  return {
    monthlyPremium: parseFloat(monthlyPremium.toFixed(2)),
    annualPremium: parseFloat(annualPremium.toFixed(2)),
    totalCostOverTerm: parseFloat(totalCost.toFixed(2)),
    termYears,
    coverageAmount,
    projectedLifeExpectancy: lifeExpectancy,
    deathProbabilityDuringTerm: (deathProbability * 100).toFixed(2) + '%',
    breakEvenAge: age + Math.round((coverageAmount / (annualPremium * 1000)) * 100) / 100,
    healthClassification: health,
    smokerStatus: isSmoker ? 'Smoker' : 'Non-smoker'
  };
}

/**
 * Whole Life Insurance Premium & Cash Value Calculator
 * @param {number} age - Current age
 * @param {number} coverageAmount - Death benefit amount
 * @param {number} years - Years to model (typically life expectancy)
 * @returns {object} Premium, cash value, and surrender analysis
 */
function calculateWholeLifeInsurance(age, coverageAmount, years = 50) {
  // Whole life rates (per $1000 of coverage annually)
  const baseRate = 7.50; // Approximate average
  const ageMultiplier = Math.pow(1.10, Math.max(0, age - 35));
  
  const coverage = coverageAmount / 1000;
  const annualPremium = coverage * baseRate * ageMultiplier;
  const monthlyPremium = annualPremium / 12;

  // Cash value accumulation (simplified)
  const schedule = [];
  let cashValue = 0;
  const deathBenefit = coverageAmount;

  for (let year = 1; year <= Math.min(years, 50); year++) {
    // Cash value grows at ~3-5% annually after initial years
    const growthRate = year <= 5 ? 0.02 : 0.04;
    const netPremium = annualPremium * 0.80; // After expenses
    cashValue = cashValue * (1 + growthRate) + netPremium;

    if (year % 5 === 0 || year === 1) {
      schedule.push({
        year,
        age: age + year,
        annualPremium: parseFloat(annualPremium.toFixed(2)),
        cashValue: parseFloat(cashValue.toFixed(2)),
        deathBenefit: deathBenefit,
        borrowingCapacity: parseFloat((cashValue * 0.90).toFixed(2))
      });
    }
  }

  // Break-even analysis
  const totalPremiums = annualPremium * years;

  return {
    monthlyPremium: parseFloat(monthlyPremium.toFixed(2)),
    annualPremium: parseFloat(annualPremium.toFixed(2)),
    deathBenefit: coverageAmount,
    cashValueSchedule: schedule,
    finalCashValue: parseFloat(cashValue.toFixed(2)),
    totalPremiumsPaid: parseFloat(totalPremiums.toFixed(2)),
    guaranteedCashValue: parseFloat((cashValue * 0.95).toFixed(2)),
    dividendProjection: calculateDividendProjection(annualPremium, years),
    surrenderChargeYears: Math.min(15, Math.round(years / 3))
  };
}

/**
 * Disability Insurance Need Calculator
 * Determines appropriate disability coverage
 * @param {number} monthlyIncome - Current monthly income
 * @param {number} monthlyExpenses - Monthly living expenses
 * @param {number} monthsEmergencyFund - Months of emergency savings
 * @param {number} ageRetirement - Planned retirement age
 * @param {number} currentAge - Current age
 * @returns {object} Coverage recommendations and cost
 */
function calculateDisabilityInsurance(monthlyIncome, monthlyExpenses, monthsEmergencyFund = 6, ageRetirement = 65, currentAge = 40) {
  // Income replacement need (typically 60-70% of income)
  const replacementRatio = 0.65;
  const requiredMonthlyBenefit = monthlyIncome * replacementRatio;

  // Account for emergency fund buffer
  const emergencyBuffer = monthsEmergencyFund * monthlyExpenses;
  const adjustedBenefit = Math.max(monthlyExpenses, requiredMonthlyBenefit - (emergencyBuffer / 240)); // Spread over 20 years

  // Benefit period (years until retirement)
  const benefitPeriod = ageRetirement - currentAge;

  // Cost estimation (per $100 of monthly benefit)
  const costPer100 = 0.45 + (0.05 * (currentAge - 35)); // Increases with age
  const annualPremium = (adjustedBenefit / 100) * costPer100 * 12;

  // Tax implications
  const taxableIncome = monthlyIncome * 12;
  const taxDeduction = annualPremium * 0.25; // Partial deductibility

  // Waiting period options
  const waitingPeriodOptions = {
    30: annualPremium,
    60: annualPremium * 0.85,
    90: annualPremium * 0.75,
    180: annualPremium * 0.65
  };

  return {
    requiredMonthlyBenefit: parseFloat(adjustedBenefit.toFixed(2)),
    annualPremium: parseFloat(annualPremium.toFixed(2)),
    monthlyPremium: parseFloat((annualPremium / 12).toFixed(2)),
    benefitPeriod: benefitPeriod,
    totalLifetimeCost: parseFloat((annualPremium * benefitPeriod).toFixed(2)),
    waitingPeriodOptions: Object.fromEntries(
      Object.entries(waitingPeriodOptions).map(([k, v]) => [k, parseFloat(v.toFixed(2))])
    ),
    estimatedTaxDeduction: parseFloat(taxDeduction.toFixed(2)),
    costAsPercentageOfIncome: ((annualPremium / taxableIncome) * 100).toFixed(2) + '%'
  };
}

/**
 * Long-Term Care Insurance Cost & Need Calculator
 * @param {number} currentAge - Current age
 * @param {number} dailyCost - Estimated daily care cost
 * @param {number} yearsOfCare - Expected years needing care
 * @param {boolean} hasFamilySupport - Family support available
 * @returns {object} LTC insurance recommendations
 */
function calculateLongTermCareInsurance(currentAge, dailyCost = 250, yearsOfCare = 3, hasFamilySupport = false) {
  // Annual care cost
  const annualCost = dailyCost * 365;
  
  // Inflation adjustment (healthcare typically 4-5% annually)
  const inflationRate = 0.045;
  
  // Age-based premium (per $100 monthly benefit)
  const ageFactors = {
    50: 0.35, 55: 0.48, 60: 0.72, 65: 1.15, 70: 1.85, 75: 3.25, 80: 5.75
  };

  let ageFactor = 0.35;
  for (const [age, factor] of Object.entries(ageFactors)) {
    if (currentAge >= parseInt(age)) ageFactor = factor;
  }

  // Monthly benefit ($3000-$6000 typical)
  const monthlyBenefit = Math.min(6000, Math.ceil(annualCost / 12));
  const monthlyPremium = (monthlyBenefit / 100) * ageFactor;
  const annualPremium = monthlyPremium * 12;

  // Total need calculation
  const totalNeed = annualCost * yearsOfCare;
  const adjustedNeed = hasFamilySupport ? totalNeed * 0.6 : totalNeed;

  // Hybrid life/LTC products
  const hybridCost = annualPremium * 1.5; // Typically 1.3-1.7x LTC-only
  const hybridDeathBenefit = adjustedNeed * 0.5; // Death benefit component

  // Partner plan option (discount for couple)
  const partnerCost = annualPremium * 0.7; // 30% discount for couple enrollment

  return {
    monthlyPremium: parseFloat(monthlyPremium.toFixed(2)),
    annualPremium: parseFloat(annualPremium.toFixed(2)),
    monthlyBenefit: monthlyBenefit,
    estimatedDailyNeed: dailyCost,
    totalCareNeed: parseFloat(adjustedNeed.toFixed(2)),
    yearsOfProjectedCare: yearsOfCare,
    inflationAdjustedCostYear5: parseFloat((annualCost * Math.pow(1 + inflationRate, 5)).toFixed(2)),
    hybridProduct: {
      annualPremium: parseFloat(hybridCost.toFixed(2)),
      deathBenefit: parseFloat(hybridDeathBenefit.toFixed(2)),
      description: 'Life + LTC combined policy'
    },
    partnerEnrollmentDiscount: {
      annualCost: parseFloat((partnerCost * 2).toFixed(2)),
      savingsPerCouple: parseFloat((annualPremium * 0.6).toFixed(2))
    }
  };
}

// ========== ANNUITY CALCULATORS ==========

/**
 * Fixed Annuity Calculator
 * Projects income from immediate or deferred fixed annuities
 * @param {number} investmentAmount - Principal investment
 * @param {number} currentAge - Current age
 * @param {number} startAge - Age to start withdrawals
 * @param {number} annualRate - Fixed interest rate
 * @param {boolean} isImmediateAnnuity - Immediate vs deferred
 * @returns {object} Payment schedule and projections
 */
function calculateFixedAnnuity(investmentAmount, currentAge, startAge, annualRate = 4.5, isImmediateAnnuity = true) {
  const lifeExpectancy = calculateLifeExpectancy(currentAge);
  const deferralYears = Math.max(0, startAge - currentAge);
  
  // Future value at start of annuity (if deferred)
  let presentValue = investmentAmount;
  if (deferralYears > 0) {
    presentValue = investmentAmount * Math.pow(1 + annualRate / 100, deferralYears);
  }

  // Annuity payment calculation (simplified immediate annuity formula)
  const months = (lifeExpectancy - startAge) * 12;
  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment = presentValue * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                        (Math.pow(1 + monthlyRate, months) - 1);
  const annualPayment = monthlyPayment * 12;

  // Schedule generation
  const schedule = [];
  let balance = presentValue;
  let totalPaid = 0;
  let age = startAge;

  for (let year = 1; age <= lifeExpectancy && year <= 30; year++, age++) {
    const interest = balance * (annualRate / 100);
    balance = balance + interest - annualPayment;
    totalPaid += annualPayment;

    if (year % 5 === 0 || year === 1) {
      schedule.push({
        year,
        age,
        annualPayment: parseFloat(annualPayment.toFixed(2)),
        accumulatedPayments: parseFloat(totalPaid.toFixed(2)),
        remainingBalance: Math.max(0, parseFloat(balance.toFixed(2)))
      });
    }
  }

  return {
    monthlyPayment: parseFloat(monthlyPayment.toFixed(2)),
    annualPayment: parseFloat(annualPayment.toFixed(2)),
    totalProjectedPayments: parseFloat((annualPayment * (lifeExpectancy - startAge)).toFixed(2)),
    deferralGrowth: parseFloat((presentValue - investmentAmount).toFixed(2)),
    paymentSchedule: schedule,
    breakEvenAge: startAge + Math.round((investmentAmount / annualPayment) * 10) / 10,
    lifeExpectancy,
    annuityFactor: (annualPayment / investmentAmount * 100).toFixed(2) + '%'
  };
}

/**
 * Variable Annuity Projection
 * Models variable annuity growth with different asset allocation strategies
 * @param {number} investmentAmount - Initial investment
 * @param {number} monthlyContribution - Monthly additions
 * @param {number} years - Projection period
 * @param {array} assetAllocation - [equities%, bonds%, cash%]
 * @param {number} fees - Annual fees percentage
 * @returns {object} Scenarios and projections
 */
function calculateVariableAnnuity(investmentAmount, monthlyContribution, years, assetAllocation = [70, 25, 5], fees = 1.5) {
  const equityReturn = 0.08; // 8% average
  const bondReturn = 0.04;   // 4% average
  const cashReturn = 0.02;   // 2% average
  
  const [equityPct, bondPct, cashPct] = assetAllocation.map(x => x / 100);
  const portfolioReturn = (equityReturn * equityPct) + (bondReturn * bondPct) + (cashReturn * cashPct);
  const netReturn = portfolioReturn - (fees / 100);

  // Three scenarios: Conservative, Base, Optimistic
  const scenarios = {};
  const scenarioReturns = {
    conservative: portfolioReturn * 0.75,
    base: portfolioReturn,
    optimistic: portfolioReturn * 1.25
  };

  for (const [scenario, scenarioReturn] of Object.entries(scenarioReturns)) {
    let balance = investmentAmount;
    let totalContributed = investmentAmount;
    const yearlyValues = [];

    for (let year = 1; year <= years; year++) {
      const growth = balance * (scenarioReturn - (fees / 100));
      const yearlyContrib = monthlyContribution * 12;
      balance += growth + yearlyContrib;
      totalContributed += yearlyContrib;

      if (year % 5 === 0 || year === years) {
        yearlyValues.push({
          year,
          value: parseFloat(balance.toFixed(2)),
          gain: parseFloat((balance - totalContributed).toFixed(2))
        });
      }
    }

    scenarios[scenario] = {
      finalValue: parseFloat(balance.toFixed(2)),
      totalContributed: parseFloat(totalContributed.toFixed(2)),
      investmentGain: parseFloat((balance - totalContributed).toFixed(2)),
      cagr: (Math.pow(balance / investmentAmount, 1 / years) - 1) * 100,
      yearlyProjection: yearlyValues
    };
  }

  return {
    initialInvestment: investmentAmount,
    monthlyContribution,
    assetAllocation: { equities: equityPct * 100, bonds: bondPct * 100, cash: cashPct * 100 },
    annualFees: fees,
    projectionYears: years,
    scenarios
  };
}

// ========== PENSION CALCULATORS ==========

/**
 * Defined Benefit Pension Calculator
 * @param {number} years_service - Years of service
 * @param {number} salary - Current annual salary
 * @param {number} accrual_rate - Benefit percentage per year (e.g., 1.5% per year = 0.015)
 * @param {number} retirement_age - Age at retirement
 * @returns {object} Pension benefit calculations
 */
function calculateDefinedBenefitPension(years_service, salary, accrual_rate = 0.015, retirement_age = 65) {
  // Standard formula: Annual Benefit = Salary × Accrual Rate × Years of Service
  const annualBenefit = salary * accrual_rate * years_service;
  const monthlyBenefit = annualBenefit / 12;

  // Apply age reduction factors (early retirement penalties)
  const agePenalty = retirement_age < 65 ? 0.06 * (65 - retirement_age) : 0;
  const reducedAnnualBenefit = annualBenefit * (1 - agePenalty);
  const reducedMonthlyBenefit = reducedAnnualBenefit / 12;

  // Joint and survivor options (typically 80-90% to survivor)
  const survivorOption = {
    '100%': reducedAnnualBenefit,
    '75%': reducedAnnualBenefit * 0.95, // Slight reduction for guarantee
    '50%': reducedAnnualBenefit * 0.92
  };

  // Projected lifetime payments (based on life expectancy)
  const lifeExpectancy = calculateLifeExpectancy(retirement_age);
  const yearsOfPayment = lifeExpectancy - retirement_age;
  const projectedLifetimePayment = reducedAnnualBenefit * yearsOfPayment;

  // Present value of pension (discount rate 4%)
  const discountRate = 0.04;
  let pv = 0;
  for (let year = 1; year <= yearsOfPayment; year++) {
    pv += reducedAnnualBenefit / Math.pow(1 + discountRate, year);
  }

  return {
    yearsOfService: years_service,
    currentSalary: salary,
    accrualRate: (accrual_rate * 100).toFixed(1) + '%',
    unreducedAnnualBenefit: parseFloat(annualBenefit.toFixed(2)),
    unreducedMonthlyBenefit: parseFloat(monthlyBenefit.toFixed(2)),
    earlyRetirementPenalty: (agePenalty * 100).toFixed(2) + '%',
    reducedAnnualBenefit: parseFloat(reducedAnnualBenefit.toFixed(2)),
    reducedMonthlyBenefit: parseFloat(reducedMonthlyBenefit.toFixed(2)),
    survivorOptions: Object.fromEntries(
      Object.entries(survivorOption).map(([k, v]) => [k, parseFloat(v.toFixed(2))])
    ),
    projectedLifetimePayments: parseFloat(projectedLifetimePayment.toFixed(2)),
    presentValue: parseFloat(pv.toFixed(2)),
    lifeExpectancyAtRetirement: lifeExpectancy
  };
}

/**
 * Defined Contribution (401k/403b) Retirement Calculator
 * @param {number} currentAge - Current age
 * @param {number} retirementAge - Target retirement age
 * @param {number} currentBalance - Current account balance
 * @param {number} annualContribution - Annual contribution (including employer match)
 * @param {number} returnRate - Annual return percentage
 * @param {number} inflationRate - Annual inflation rate
 * @returns {object} Retirement readiness analysis
 */
function calculateDefinedContribution401k(currentAge, retirementAge, currentBalance, annualContribution, returnRate = 7, inflationRate = 3) {
  const years = retirementAge - currentAge;
  const lifeExpectancy = calculateLifeExpectancy(retirementAge);
  const retirementYears = lifeExpectancy - retirementAge;

  // Future value calculation
  let balance = currentBalance;
  const annualValues = [];

  for (let year = 1; year <= years; year++) {
    balance = balance * (1 + returnRate / 100) + annualContribution;
    
    if (year % 5 === 0 || year === years) {
      annualValues.push({
        year,
        age: currentAge + year,
        balance: parseFloat(balance.toFixed(2))
      });
    }
  }

  const retirementBalance = balance;

  // Sustainable withdrawal strategy (4% rule)
  const safeAnnualWithdrawal = retirementBalance * 0.04;
  const safeMonthlyWithdrawal = safeAnnualWithdrawal / 12;

  // Real purchasing power (adjusted for inflation)
  const realWithdrawal = safeAnnualWithdrawal / Math.pow(1 + inflationRate / 100, retirementYears / 2);

  // Required income analysis
  const growthMultiplier = Math.pow(1 + returnRate / 100, years);
  const contributionFV = annualContribution * ((Math.pow(1 + returnRate / 100, years) - 1) / (returnRate / 100));

  // RMD calculations (Required Minimum Distributions at age 73)
  const rmdAge = 73;
  const yearsToRMD = Math.max(0, rmdAge - retirementAge);
  let rmdBalance = retirementBalance;
  
  for (let i = 0; i < yearsToRMD; i++) {
    rmdBalance *= (1 + returnRate / 100);
  }
  
  const rmdFactor = 26.5; // Approximate for age 73
  const firstRMD = rmdBalance / rmdFactor;

  return {
    projectionYears: years,
    retirementAge,
    currentBalance,
    annualContribution,
    averageReturn: returnRate,
    projectedBalance: parseFloat(retirementBalance.toFixed(2)),
    safeAnnualWithdrawal: parseFloat(safeAnnualWithdrawal.toFixed(2)),
    safeMonthlyWithdrawal: parseFloat(safeMonthlyWithdrawal.toFixed(2)),
    realMonthlyIncome: parseFloat((realWithdrawal / 12).toFixed(2)),
    yearsOfRetirement: retirementYears,
    balanceProjection: annualValues,
    requiredMonthlyContribution: parseFloat((annualContribution / 12).toFixed(2)),
    firstRMDAmount: parseFloat(firstRMD.toFixed(2)),
    rmdStartAge: rmdAge
  };
}

// ========== ACTUARIAL & MORTALITY FUNCTIONS ==========

/**
 * Life Expectancy Calculation
 * Uses actuarial tables adjusted for smoking and health
 * @param {number} age - Current age
 * @param {boolean} isSmoker - Smoking status
 * @param {string} health - Health status
 * @returns {number} Projected life expectancy
 */
function calculateLifeExpectancy(age, isSmoker = false, health = 'good') {
  // Base life expectancy tables (simplified by decade)
  const baseExpectancy = {
    30: 80, 40: 82, 50: 83, 60: 84, 70: 85, 80: 88, 90: 92
  };

  let baseLE = 80;
  for (const [ageKey, le] of Object.entries(baseExpectancy)) {
    if (age >= parseInt(ageKey)) baseLE = le;
  }

  // Interpolate for exact age
  const yearsUntilNextDecade = 10 - (age % 10);
  baseLE += (yearsUntilNextDecade * 0.3) / 10;

  // Adjustments
  const smokerReduction = isSmoker ? 8 : 0; // 8 year reduction
  const healthAdjustment = health === 'poor' ? 5 : (health === 'excellent' ? 2 : 0);

  return Math.round((baseLE - smokerReduction + healthAdjustment) * 10) / 10;
}

/**
 * Mortality Probability Calculator
 * Estimates probability of death within a given period
 * @param {number} age - Current age
 * @param {number} years - Time period
 * @param {boolean} isSmoker - Smoking status
 * @returns {number} Probability (0-1)
 */
function calculateDeathProbability(age, years, isSmoker = false) {
  // Annual mortality rates (per 1000) - simplified
  const annualMortality = {
    30: 1.2, 40: 1.8, 50: 4.5, 60: 12.5, 70: 35.0, 80: 95.0
  };

  let baseRate = 1.2;
  for (const [ageKey, rate] of Object.entries(annualMortality)) {
    if (age >= parseInt(ageKey)) baseRate = rate;
  }

  baseRate = baseRate / 1000; // Convert to decimal
  if (isSmoker) baseRate *= 2.5; // Smokers have 2.5x mortality risk

  // Calculate cumulative probability
  let cumulativeProbability = 0;
  let survivalProbability = 1;

  for (let year = 0; year < years; year++) {
    const adjustedRate = baseRate * Math.pow(1.08, Math.max(0, age + year - 40));
    survivalProbability *= (1 - Math.min(0.99, adjustedRate)); // Cap at 99%
  }

  cumulativeProbability = 1 - survivalProbability;
  return Math.max(0, Math.min(1, cumulativeProbability));
}

/**
 * Mortality Table Generator (GAM83 based)
 * @param {number} startAge - Starting age
 * @param {number} endAge - Ending age
 * @returns {object} Mortality rates by age
 */
function generateMortalityTable(startAge = 30, endAge = 100) {
  const table = {};
  
  for (let age = startAge; age <= endAge; age++) {
    // Gompertz-Makeham mortality model
    const a = 0.00005;
    const b = 0.085;
    const c = 0.0000001;
    
    const qx = a + (b * Math.exp(c * age)); // Annual mortality rate
    
    table[age] = {
      age,
      deathRate: Math.min(0.99, qx),
      survivalRate: Math.max(0.01, 1 - qx),
      deathPer1000: Math.round(qx * 1000)
    };
  }

  return table;
}

/**
 * Dividend Projection for Life Insurance
 * @param {number} basePremium - Annual premium
 * @param {number} years - Projection years
 * @returns {array} Annual dividend projections
 */
function calculateDividendProjection(basePremium, years) {
  const dividends = [];
  let cumulativeDividend = 0;

  for (let year = 1; year <= Math.min(years, 30); year++) {
    // Dividends typically start small and grow
    const dividendRate = 0.01 + (0.002 * year); // Increases over time
    const annualDividend = basePremium * Math.min(0.20, dividendRate);
    cumulativeDividend += annualDividend;

    if (year % 5 === 0 || year === 1) {
      dividends.push({
        year,
        annualDividend: parseFloat(annualDividend.toFixed(2)),
        cumulativeDividends: parseFloat(cumulativeDividend.toFixed(2)),
        dividendUse: 'Reduce Premium' // Can also be 'Cash', 'Buy Additional Insurance'
      });
    }
  }

  return dividends;
}

// ========== BUSINESS & TAX INSURANCE ==========

/**
 * Key Person Insurance Valuation
 * Determines appropriate coverage for critical employees
 * @param {number} annualRevenue - Annual revenue attributable to key person
 * @param {number} profitMargin - Operating profit margin
 * @param {number} months - Months needed to replace person
 * @param {number} salary - Key person annual salary
 * @returns {object} Coverage recommendations
 */
function calculateKeyPersonInsurance(annualRevenue, profitMargin = 0.20, months = 12, salary) {
  const monthlyRevenueLoss = (annualRevenue * profitMargin) / 12;
  const lossCoveragNeed = monthlyRevenueLoss * months;
  
  const replacementSalaryCost = (salary * months) / 12;
  const totalCoveragNeed = lossCoveragNeed + replacementSalaryCost;

  // Term life is typical for key person insurance
  const termCost = (totalCoveragNeed / 100000) * 750; // ~$7.50 per $100k
  const annualCost = termCost;

  return {
    revenueLossMonthly: parseFloat(monthlyRevenueLoss.toFixed(2)),
    totalRevenueAtRisk: parseFloat(lossCoveragNeed.toFixed(2)),
    replacementCosts: parseFloat(replacementSalaryCost.toFixed(2)),
    recommendedCoverage: parseFloat(totalCoveragNeed.toFixed(2)),
    estimatedAnnualPremium: parseFloat(annualCost.toFixed(2)),
    roi: ((totalCoveragNeed / (annualCost * 20)) * 100).toFixed(1) + '%' // 20 year horizon
  };
}

/**
 * Business Succession Insurance (Buyout Calculator)
 * @param {number} businessValue - Current business valuation
 * @param {number} ownerAge - Owner age
 * @param {number} yearsToRetirement - Years until retirement
 * @param {number} partners - Number of partners
 * @returns {object} Buyout coverage needs
 */
function calculateBusinessBuyout(businessValue, ownerAge, yearsToRetirement, partners = 1) {
  const ownerShare = businessValue / (partners + 1);
  
  // Inflation adjustment
  const inflationRate = 0.03;
  const futureBusinessValue = businessValue * Math.pow(1 + inflationRate, yearsToRetirement);
  const futureOwnerShare = futureBusinessValue / (partners + 1);

  // Life insurance needed
  const insuranceNeeded = futureOwnerShare * 1.2; // 20% buffer

  // Cross-purchase arrangement
  const perPartnerShare = insuranceNeeded / partners;

  // Estimated cost (decreases with policy duration)
  const costPerOwner = (perPartnerShare / 100000) * 450; // ~$4.50 per $100k for cross-purchase

  return {
    currentBusinessValue: businessValue,
    ownerShare: parseFloat(ownerShare.toFixed(2)),
    projectedFutureValue: parseFloat(futureBusinessValue.toFixed(2)),
    projectedOwnerShare: parseFloat(futureOwnerShare.toFixed(2)),
    insuranceNeeded: parseFloat(insuranceNeeded.toFixed(2)),
    perPartnerCost: parseFloat(costPerOwner.toFixed(2)),
    totalGroupCost: parseFloat((costPerOwner * partners).toFixed(2)),
    recommendedPolicyType: 'Cross-Purchase Term Life',
    yearsToFundNeeds: yearsToRetirement
  };
}

/**
 * Estate Tax Planning Calculator
 * @param {number} totalAssets - Total estate value
 * @param {number} liabilities - Outstanding debts
 * @param {number} yearsToPass - Estimated years until estate settled
 * @returns {object} Estate tax analysis
 */
function calculateEstateTaxPlanning(totalAssets, liabilities = 0, yearsToPass = 25) {
  // 2024 federal estate tax exemption
  const federalExemption = 13610000;
  const topTaxRate = 0.40;

  const netEstate = totalAssets - liabilities;
  const taxableEstate = Math.max(0, netEstate - federalExemption);
  const federalEstateTax = taxableEstate * topTaxRate;

  // State estate tax (varies; using average 10% on excess)
  const stateEstateTax = Math.max(0, (netEstate - 5000000) * 0.05);
  
  const totalEstateTax = federalEstateTax + stateEstateTax;
  const effectiveTaxRate = (totalEstateTax / netEstate * 100).toFixed(2);

  // Life insurance offset need
  const insuranceNeeded = totalEstateTax * 1.1; // 10% buffer

  // ILIT (Irrevocable Life Insurance Trust) benefit
  const illtInsuranceAmount = Math.max(0, taxableEstate * 1.1);

  return {
    totalAssets,
    liabilities,
    netEstate: parseFloat(netEstate.toFixed(2)),
    federalExemption,
    taxableEstate: parseFloat(taxableEstate.toFixed(2)),
    estimatedFederalTax: parseFloat(federalEstateTax.toFixed(2)),
    estimatedStateTax: parseFloat(stateEstateTax.toFixed(2)),
    totalEstateTax: parseFloat(totalEstateTax.toFixed(2)),
    effectiveTaxRate: effectiveTaxRate + '%',
    lifeInsuranceNeeded: parseFloat(insuranceNeeded.toFixed(2)),
    illtRecommendedCoverage: parseFloat(illtInsuranceAmount.toFixed(2)),
    taxDeferralStrategy: 'Qualified Charitable Distribution or ILIT'
  };
}

// ========== INVESTMENT & TAX INSURANCE ==========

/**
 * Umbrella Liability Insurance Calculator
 * Determines need for excess liability coverage
 * @param {number} homeValue - Home value
 * @param {number} assets - Liquid assets
 * @param {number} annualIncome - Annual income
 * @param {boolean} hasEmployees - Business with employees
 * @returns {object} Coverage recommendations
 */
function calculateUmbrellaLiability(homeValue, assets, annualIncome, hasEmployees = false) {
  // Recommendation: Coverage = Assets + 10 years of income
  const incomeComponent = annualIncome * 10;
  const recommendedCoverage = assets + incomeComponent;

  // Typical umbrella coverage: $1M-$5M
  const coverage1M = 1000000;
  const coverage2M = 2000000;
  const coverage5M = 5000000;

  // Annual costs (per $1M of coverage)
  const costPer1M = 150 + (hasEmployees ? 100 : 0);
  
  const options = {
    '1M': { coverage: coverage1M, annualCost: costPer1M },
    '2M': { coverage: coverage2M, annualCost: costPer1M * 1.7 },
    '5M': { coverage: coverage5M, annualCost: costPer1M * 3.5 }
  };

  return {
    homeValue,
    assets,
    annualIncome,
    recommendedCoverage: parseFloat(recommendedCoverage.toFixed(2)),
    coverageOptions: Object.fromEntries(
      Object.entries(options).map(([k, v]) => [k, { coverage: v.coverage, annualCost: parseFloat(v.annualCost.toFixed(2)) }])
    ),
    riskProfile: recommendedCoverage > coverage5M ? 'High Risk - Consider $10M' : 'Standard Coverage Available'
  };
}

// ========== EXPORT FOR NODE.JS ==========

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // Life Insurance
    calculateTermLifeInsurance,
    calculateWholeLifeInsurance,
    calculateDisabilityInsurance,
    calculateLongTermCareInsurance,
    
    // Annuities
    calculateFixedAnnuity,
    calculateVariableAnnuity,
    
    // Pensions
    calculateDefinedBenefitPension,
    calculateDefinedContribution401k,
    
    // Actuarial Functions
    calculateLifeExpectancy,
    calculateDeathProbability,
    generateMortalityTable,
    calculateDividendProjection,
    
    // Business Insurance
    calculateKeyPersonInsurance,
    calculateBusinessBuyout,
    calculateEstateTaxPlanning,
    calculateUmbrellaLiability
  };
}
