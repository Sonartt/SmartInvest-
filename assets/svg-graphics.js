// SVG Graphics Library for SmartInvest
// Embedded SVG graphics for features and educational content

const SVGGraphics = {
  // Calculator Icons
  icons: {
    compound: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="w-12 h-12">
      <circle cx="50" cy="50" r="45" fill="#E8F5E9" stroke="#4CAF50" stroke-width="2"/>
      <path d="M 30 60 L 40 40 L 50 50 L 60 30 L 70 45" fill="none" stroke="#4CAF50" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="30" cy="60" r="2.5" fill="#4CAF50"/>
      <circle cx="70" cy="45" r="2.5" fill="#4CAF50"/>
      <text x="50" y="85" font-size="10" font-weight="bold" text-anchor="middle" fill="#4CAF50">Compound</text>
    </svg>`,

    roi: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="w-12 h-12">
      <circle cx="50" cy="50" r="45" fill="#E3F2FD" stroke="#2196F3" stroke-width="2"/>
      <rect x="25" y="55" width="15" height="20" fill="#2196F3" opacity="0.7"/>
      <rect x="45" y="40" width="15" height="35" fill="#2196F3" opacity="0.9"/>
      <rect x="65" y="25" width="15" height="50" fill="#2196F3"/>
      <text x="50" y="85" font-size="10" font-weight="bold" text-anchor="middle" fill="#2196F3">ROI</text>
    </svg>`,

    savings: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="w-12 h-12">
      <circle cx="50" cy="50" r="45" fill="#FFF3E0" stroke="#FF9800" stroke-width="2"/>
      <ellipse cx="50" cy="35" rx="20" ry="12" fill="none" stroke="#FF9800" stroke-width="2"/>
      <path d="M 30 35 L 30 65 Q 30 75 50 75 Q 70 75 70 65 L 70 35" fill="none" stroke="#FF9800" stroke-width="2"/>
      <line x1="50" y1="35" x2="50" y2="75" stroke="#FF9800" stroke-width="1.5"/>
      <text x="50" y="85" font-size="10" font-weight="bold" text-anchor="middle" fill="#FF9800">Savings</text>
    </svg>`,

    insurance: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="w-12 h-12">
      <circle cx="50" cy="50" r="45" fill="#F3E5F5" stroke="#9C27B0" stroke-width="2"/>
      <path d="M 50 25 L 65 35 L 65 60 Q 65 75 50 75 Q 35 75 35 60 L 35 35 Z" fill="none" stroke="#9C27B0" stroke-width="2.5"/>
      <path d="M 45 50 L 50 55 L 60 45" fill="none" stroke="#9C27B0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="50" y="85" font-size="10" font-weight="bold" text-anchor="middle" fill="#9C27B0">Insurance</text>
    </svg>`,

    cashflow: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="w-12 h-12">
      <circle cx="50" cy="50" r="45" fill="#E0F2F1" stroke="#009688" stroke-width="2"/>
      <circle cx="35" cy="55" r="8" fill="#009688" opacity="0.7"/>
      <circle cx="50" cy="55" r="8" fill="#009688" opacity="0.85"/>
      <circle cx="65" cy="55" r="8" fill="#009688"/>
      <path d="M 43 51 L 57 51 M 43 51 L 50 40 M 57 51 L 50 62" stroke="#009688" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="50" y="85" font-size="10" font-weight="bold" text-anchor="middle" fill="#009688">Cash Flow</text>
    </svg>`,

    emergency: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="w-12 h-12">
      <circle cx="50" cy="50" r="45" fill="#FFEBEE" stroke="#F44336" stroke-width="2"/>
      <rect x="35" y="30" width="30" height="40" rx="4" fill="none" stroke="#F44336" stroke-width="2"/>
      <path d="M 42 50 L 48 50 M 50 45 L 50 55" stroke="#F44336" stroke-width="3" stroke-linecap="round"/>
      <circle cx="58" cy="35" r="4" fill="#F44336"/>
      <text x="50" y="85" font-size="10" font-weight="bold" text-anchor="middle" fill="#F44336">Emergency</text>
    </svg>`,

    risk: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="w-12 h-12">
      <circle cx="50" cy="50" r="45" fill="#FCE4EC" stroke="#E91E63" stroke-width="2"/>
      <path d="M 25 75 Q 35 45 50 30 Q 65 45 75 75" fill="none" stroke="#E91E63" stroke-width="2.5"/>
      <circle cx="50" cy="30" r="3" fill="#E91E63"/>
      <line x1="25" y1="75" x2="75" y2="75" stroke="#E91E63" stroke-width="1.5"/>
      <text x="50" y="85" font-size="10" font-weight="bold" text-anchor="middle" fill="#E91E63">Risk</text>
    </svg>`,

    retirement: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="w-12 h-12">
      <circle cx="50" cy="50" r="45" fill="#EDE7F6" stroke="#673AB7" stroke-width="2"/>
      <circle cx="40" cy="40" r="8" fill="#673AB7" opacity="0.7"/>
      <circle cx="60" cy="40" r="8" fill="#673AB7" opacity="0.9"/>
      <path d="M 35 55 L 45 65 L 55 55 L 65 65" fill="none" stroke="#673AB7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="50" y="85" font-size="10" font-weight="bold" text-anchor="middle" fill="#673AB7">Retirement</text>
    </svg>`,

    tax: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="w-12 h-12">
      <circle cx="50" cy="50" r="45" fill="#F1F8E9" stroke="#689F38" stroke-width="2"/>
      <rect x="30" y="35" width="40" height="30" rx="3" fill="none" stroke="#689F38" stroke-width="2"/>
      <line x1="50" y1="35" x2="50" y2="65" stroke="#689F38" stroke-width="1.5"/>
      <line x1="30" y1="50" x2="70" y2="50" stroke="#689F38" stroke-width="1.5"/>
      <text x="50" y="85" font-size="10" font-weight="bold" text-anchor="middle" fill="#689F38">Tax</text>
    </svg>`,

    debt: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="w-12 h-12">
      <circle cx="50" cy="50" r="45" fill="#FFF9C4" stroke="#FBC02D" stroke-width="2"/>
      <path d="M 30 50 Q 50 35 70 50 Q 50 65 30 50" fill="none" stroke="#FBC02D" stroke-width="2.5"/>
      <circle cx="50" cy="50" r="4" fill="#FBC02D"/>
      <path d="M 40 45 L 60 45 M 40 55 L 60 55" stroke="#FBC02D" stroke-width="1.5" stroke-linecap="round"/>
      <text x="50" y="85" font-size="10" font-weight="bold" text-anchor="middle" fill="#FBC02D">Debt</text>
    </svg>`,

    property: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="w-12 h-12">
      <circle cx="50" cy="50" r="45" fill="#E8EAF6" stroke="#3F51B5" stroke-width="2"/>
      <path d="M 30 65 L 50 35 L 70 65 Z" fill="none" stroke="#3F51B5" stroke-width="2.5"/>
      <rect x="40" y="50" width="20" height="15" fill="none" stroke="#3F51B5" stroke-width="1.5"/>
      <rect x="42" y="52" width="6" height="6" fill="none" stroke="#3F51B5" stroke-width="1"/>
      <rect x="52" y="52" width="6" height="6" fill="none" stroke="#3F51B5" stroke-width="1"/>
      <text x="50" y="85" font-size="10" font-weight="bold" text-anchor="middle" fill="#3F51B5">Property</text>
    </svg>`,

    education: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="w-12 h-12">
      <circle cx="50" cy="50" r="45" fill="#E0E4F7" stroke="#5C6BC0" stroke-width="2"/>
      <path d="M 25 60 L 50 35 L 75 60" fill="none" stroke="#5C6BC0" stroke-width="2.5"/>
      <rect x="30" y="60" width="40" height="20" fill="none" stroke="#5C6BC0" stroke-width="2"/>
      <line x1="40" y1="60" x2="40" y2="80" stroke="#5C6BC0" stroke-width="1.5"/>
      <line x1="60" y1="60" x2="60" y2="80" stroke="#5C6BC0" stroke-width="1.5"/>
      <text x="50" y="85" font-size="10" font-weight="bold" text-anchor="middle" fill="#5C6BC0">Education</text>
    </svg>`
  },

  // Infographic: Compound Interest Growth
  compoundGrowth: `<svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" class="w-full">
    <!-- Background -->
    <rect width="600" height="400" fill="#F5F5F5"/>
    
    <!-- Title -->
    <text x="300" y="30" font-size="24" font-weight="bold" text-anchor="middle" fill="#333">Power of Compound Interest</text>
    
    <!-- Grid -->
    <line x1="60" y1="360" x2="560" y2="360" stroke="#999" stroke-width="2"/>
    <line x1="60" y1="60" x2="60" y2="360" stroke="#999" stroke-width="2"/>
    
    <!-- Y-axis labels -->
    <text x="50" y="365" font-size="12" text-anchor="end" fill="#666">0</text>
    <text x="50" y="280" font-size="12" text-anchor="end" fill="#666">50K</text>
    <text x="50" y="200" font-size="12" text-anchor="end" fill="#666">100K</text>
    <text x="50" y="120" font-size="12" text-anchor="end" fill="#666">150K</text>
    
    <!-- X-axis labels -->
    <text x="80" y="380" font-size="11" text-anchor="middle" fill="#666">Year 1</text>
    <text x="200" y="380" font-size="11" text-anchor="middle" fill="#666">Year 5</text>
    <text x="320" y="380" font-size="11" text-anchor="middle" fill="#666">Year 10</text>
    <text x="440" y="380" font-size="11" text-anchor="middle" fill="#666">Year 15</text>
    <text x="560" y="380" font-size="11" text-anchor="middle" fill="#666">Year 20</text>
    
    <!-- Simple Interest Line -->
    <polyline points="80,330 200,280 320,230 440,180 560,130" fill="none" stroke="#FF9800" stroke-width="3"/>
    
    <!-- Compound Interest Line -->
    <path d="M 80 330 Q 200 290 320 180 T 560 80" fill="none" stroke="#4CAF50" stroke-width="3" stroke-linecap="round"/>
    
    <!-- Points -->
    <circle cx="80" cy="330" r="4" fill="#4CAF50"/>
    <circle cx="200" cy="240" r="4" fill="#4CAF50"/>
    <circle cx="320" cy="140" r="4" fill="#4CAF50"/>
    <circle cx="440" cy="80" r="4" fill="#4CAF50"/>
    
    <!-- Legend -->
    <g transform="translate(350, 320)">
      <line x1="0" y1="0" x2="20" y2="0" stroke="#4CAF50" stroke-width="3"/>
      <text x="30" y="5" font-size="13" fill="#333">Compound Interest</text>
      
      <line x1="0" y1="25" x2="20" y2="25" stroke="#FF9800" stroke-width="3"/>
      <text x="30" y="30" font-size="13" fill="#333">Simple Interest</text>
    </g>
    
    <!-- Tip -->
    <rect x="80" y="50" width="250" height="30" fill="#E8F5E9" stroke="#4CAF50" stroke-width="1" rx="4"/>
    <text x="90" y="70" font-size="12" fill="#2E7D32" font-weight="bold">💡 Money grows faster with compounding!</text>
  </svg>`,

  // Infographic: Risk vs Return
  riskReturn: `<svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" class="w-full">
    <!-- Background -->
    <rect width="600" height="400" fill="#F5F5F5"/>
    
    <!-- Title -->
    <text x="300" y="30" font-size="24" font-weight="bold" text-anchor="middle" fill="#333">Risk vs Return Profile</text>
    
    <!-- Grid -->
    <line x1="80" y1="350" x2="540" y2="350" stroke="#999" stroke-width="2"/>
    <line x1="80" y1="80" x2="80" y2="350" stroke="#999" stroke-width="2"/>
    
    <!-- Axis labels -->
    <text x="300" y="375" font-size="14" text-anchor="middle" fill="#666" font-weight="bold">Risk Level (Volatility)</text>
    <text x="20" y="200" font-size="14" text-anchor="middle" fill="#666" font-weight="bold" transform="rotate(-90 20 200)">Return (%)</text>
    
    <!-- Risk axis ticks -->
    <text x="150" y="365" font-size="11" text-anchor="middle" fill="#666">Low</text>
    <text x="300" y="365" font-size="11" text-anchor="middle" fill="#666">Medium</text>
    <text x="450" y="365" font-size="11" text-anchor="middle" fill="#666">High</text>
    
    <!-- Asset bubbles -->
    <!-- Savings -->
    <circle cx="150" cy="300" r="35" fill="#FF9800" opacity="0.7" stroke="#FF6F00" stroke-width="2"/>
    <text x="150" y="295" font-size="13" font-weight="bold" text-anchor="middle" fill="white">Savings</text>
    <text x="150" y="310" font-size="12" text-anchor="middle" fill="white">2-3%</text>
    
    <!-- Bonds -->
    <circle cx="280" cy="230" r="40" fill="#2196F3" opacity="0.7" stroke="#1565C0" stroke-width="2"/>
    <text x="280" y="225" font-size="13" font-weight="bold" text-anchor="middle" fill="white">Bonds</text>
    <text x="280" y="240" font-size="12" text-anchor="middle" fill="white">4-6%</text>
    
    <!-- Balanced Portfolio -->
    <circle cx="340" cy="200" r="45" fill="#8BC34A" opacity="0.7" stroke="#558B2F" stroke-width="2"/>
    <text x="340" y="195" font-size="13" font-weight="bold" text-anchor="middle" fill="white">Balanced</text>
    <text x="340" y="210" font-size="12" text-anchor="middle" fill="white">8-10%</text>
    
    <!-- Stocks -->
    <circle cx="450" cy="130" r="45" fill="#E91E63" opacity="0.7" stroke="#C2185B" stroke-width="2"/>
    <text x="450" y="125" font-size="13" font-weight="bold" text-anchor="middle" fill="white">Stocks</text>
    <text x="450" y="140" font-size="12" text-anchor="middle" fill="white">10-15%</text>
    
    <!-- Efficient frontier curve -->
    <path d="M 150 300 Q 280 220 450 130" fill="none" stroke="#FF5722" stroke-width="2" stroke-dasharray="5,5" opacity="0.6"/>
    
    <!-- Tip -->
    <rect x="80" y="50" width="460" height="25" fill="#F3E5F5" stroke="#9C27B0" stroke-width="1" rx="4"/>
    <text x="90" y="68" font-size="12" fill="#6A1B9A" font-weight="bold">💡 Higher risk can mean higher returns, but also bigger losses!</text>
  </svg>`,

  // Infographic: Debt Payoff Strategies
  debtPayoff: `<svg viewBox="0 0 600 450" xmlns="http://www.w3.org/2000/svg" class="w-full">
    <!-- Background -->
    <rect width="600" height="450" fill="#F5F5F5"/>
    
    <!-- Title -->
    <text x="300" y="30" font-size="24" font-weight="bold" text-anchor="middle" fill="#333">Debt Payoff Strategies</text>
    
    <!-- Avalanche Method -->
    <g transform="translate(50, 80)">
      <rect width="240" height="160" fill="#FFEBEE" stroke="#F44336" stroke-width="2" rx="8"/>
      <text x="120" y="25" font-size="16" font-weight="bold" text-anchor="middle" fill="#C62828">⚡ Avalanche Method</text>
      
      <!-- Debt 1 (highest interest) -->
      <rect x="10" y="40" width="220" height="30" fill="#EF5350" rx="4"/>
      <text x="20" y="60" font-size="11" fill="white" font-weight="bold">Credit Card 18% APR</text>
      <text x="200" y="60" font-size="11" fill="white" text-anchor="end">Paid First ⭐</text>
      
      <!-- Debt 2 -->
      <rect x="10" y="75" width="180" height="30" fill="#EF5350" opacity="0.7" rx="4"/>
      <text x="20" y="95" font-size="11" fill="white" font-weight="bold">Car Loan 6% APR</text>
      
      <!-- Debt 3 -->
      <rect x="10" y="110" width="140" height="30" fill="#EF5350" opacity="0.5" rx="4"/>
      <text x="20" y="130" font-size="11" fill="white" font-weight="bold">Mortgage 3% APR</text>
      
      <text x="120" y="155" font-size="12" text-anchor="middle" fill="#C62828" font-weight="bold">Save Most Interest ✓</text>
    </g>
    
    <!-- Snowball Method -->
    <g transform="translate(310, 80)">
      <rect width="240" height="160" fill="#E8F5E9" stroke="#4CAF50" stroke-width="2" rx="8"/>
      <text x="120" y="25" font-size="16" font-weight="bold" text-anchor="middle" fill="#2E7D32">❄️ Snowball Method</text>
      
      <!-- Debt 1 (smallest) -->
      <rect x="10" y="40" width="80" height="30" fill="#81C784" rx="4"/>
      <text x="20" y="60" font-size="11" fill="white" font-weight="bold">Mortgage 3%</text>
      <text x="135" y="60" font-size="11" fill="#2E7D32" text-anchor="end">Paid First ⭐</text>
      
      <!-- Debt 2 -->
      <rect x="10" y="75" width="140" height="30" fill="#81C784" opacity="0.7" rx="4"/>
      <text x="20" y="95" font-size="11" fill="white" font-weight="bold">Car Loan 6%</text>
      
      <!-- Debt 3 -->
      <rect x="10" y="110" width="180" height="30" fill="#81C784" opacity="0.5" rx="4"/>
      <text x="20" y="130" font-size="11" fill="white" font-weight="bold">Credit Card 18%</text>
      
      <text x="120" y="155" font-size="12" text-anchor="middle" fill="#2E7D32" font-weight="bold">Quick Wins! 🎯</text>
    </g>
    
    <!-- Comparison -->
    <g transform="translate(50, 280)">
      <rect width="500" height="140" fill="white" stroke="#999" stroke-width="1" rx="6"/>
      
      <text x="15" y="25" font-size="14" font-weight="bold" fill="#333">Comparison</text>
      
      <!-- Headers -->
      <rect x="15" y="35" width="150" height="25" fill="#F0F0F0"/>
      <rect x="175" y="35" width="160" height="25" fill="#F0F0F0"/>
      <rect x="345" y="35" width="190" height="25" fill="#F0F0F0"/>
      
      <text x="25" y="52" font-size="12" font-weight="bold" fill="#333">Metric</text>
      <text x="185" y="52" font-size="12" font-weight="bold" fill="#333">Avalanche</text>
      <text x="355" y="52" font-size="12" font-weight="bold" fill="#333">Snowball</text>
      
      <!-- Data rows -->
      <line x1="15" y1="65" x2="535" y2="65" stroke="#DDD" stroke-width="1"/>
      
      <text x="25" y="82" font-size="11" fill="#333">Total Interest Paid</text>
      <text x="185" y="82" font-size="11" fill="#F44336" font-weight="bold">Lower ✓</text>
      <text x="355" y="82" font-size="11" fill="#999">Higher</text>
      
      <line x1="15" y1="92" x2="535" y2="92" stroke="#DDD" stroke-width="1"/>
      
      <text x="25" y="109" font-size="11" fill="#333">Motivation/Psychology</text>
      <text x="185" y="109" font-size="11" fill="#999">Slower wins</text>
      <text x="355" y="109" font-size="11" fill="#4CAF50" font-weight="bold">Quick wins ✓</text>
      
      <line x1="15" y1="119" x2="535" y2="119" stroke="#DDD" stroke-width="1"/>
      
      <text x="25" y="136" font-size="11" fill="#333">Time to Debt-Free</text>
      <text x="185" y="136" font-size="11" fill="#4CAF50" font-weight="bold">Faster ✓</text>
      <text x="355" y="136" font-size="11" fill="#999">Slower</text>
    </g>
  </svg>`,

  // Infographic: Retirement Phases
  retirementPhases: `<svg viewBox="0 0 600 350" xmlns="http://www.w3.org/2000/svg" class="w-full">
    <!-- Background -->
    <rect width="600" height="350" fill="#F5F5F5"/>
    
    <!-- Title -->
    <text x="300" y="30" font-size="24" font-weight="bold" text-anchor="middle" fill="#333">Retirement Planning Timeline</text>
    
    <!-- Timeline -->
    <line x1="80" y1="100" x2="520" y2="100" stroke="#999" stroke-width="3"/>
    
    <!-- Phase 1: Accumulation -->
    <g transform="translate(80, 100)">
      <circle r="12" fill="#4CAF50" stroke="#2E7D32" stroke-width="2"/>
      <text x="0" y="35" font-size="13" font-weight="bold" text-anchor="middle" fill="#2E7D32">Age 25-65</text>
      
      <g transform="translate(-60, 60)">
        <rect width="120" height="140" fill="#E8F5E9" stroke="#4CAF50" stroke-width="2" rx="6"/>
        <text x="60" y="20" font-size="13" font-weight="bold" text-anchor="middle" fill="#2E7D32">Accumulation</text>
        <text x="60" y="40" font-size="11" text-anchor="middle" fill="#333">• Save & Invest</text>
        <text x="60" y="55" font-size="11" text-anchor="middle" fill="#333">• Compound Growth</text>
        <text x="60" y="70" font-size="11" text-anchor="middle" fill="#333">• Higher Risk OK</text>
        <text x="60" y="85" font-size="11" text-anchor="middle" fill="#333">• Increase Returns</text>
        <text x="60" y="100" font-size="11" text-anchor="middle" fill="#333">• Reinvest Dividends</text>
        <text x="60" y="130" font-size="12" font-weight="bold" text-anchor="middle" fill="#2E7D32">Strategy: Growth</text>
      </g>
    </g>
    
    <!-- Phase 2: Transition -->
    <g transform="translate(300, 100)">
      <circle r="12" fill="#FF9800" stroke="#E65100" stroke-width="2"/>
      <text x="0" y="35" font-size="13" font-weight="bold" text-anchor="middle" fill="#E65100">Age 65</text>
      
      <g transform="translate(-60, 60)">
        <rect width="120" height="140" fill="#FFF3E0" stroke="#FF9800" stroke-width="2" rx="6"/>
        <text x="60" y="20" font-size="13" font-weight="bold" text-anchor="middle" fill="#E65100">Transition</text>
        <text x="60" y="40" font-size="11" text-anchor="middle" fill="#333">• Shift to Income</text>
        <text x="60" y="55" font-size="11" text-anchor="middle" fill="#333">• Lower Risk</text>
        <text x="60" y="70" font-size="11" text-anchor="middle" fill="#333">• Preserve Capital</text>
        <text x="60" y="85" font-size="11" text-anchor="middle" fill="#333">• Plan Withdrawals</text>
        <text x="60" y="100" font-size="11" text-anchor="middle" fill="#333">• Review Timeline</text>
        <text x="60" y="130" font-size="12" font-weight="bold" text-anchor="middle" fill="#E65100">Strategy: Balance</text>
      </g>
    </g>
    
    <!-- Phase 3: Decumulation -->
    <g transform="translate(520, 100)">
      <circle r="12" fill="#2196F3" stroke="#1565C0" stroke-width="2"/>
      <text x="0" y="35" font-size="13" font-weight="bold" text-anchor="middle" fill="#1565C0">Age 65+</text>
      
      <g transform="translate(-60, 60)">
        <rect width="120" height="140" fill="#E3F2FD" stroke="#2196F3" stroke-width="2" rx="6"/>
        <text x="60" y="20" font-size="13" font-weight="bold" text-anchor="middle" fill="#1565C0">Decumulation</text>
        <text x="60" y="40" font-size="11" text-anchor="middle" fill="#333">• Generate Income</text>
        <text x="60" y="55" font-size="11" text-anchor="middle" fill="#333">• Protect Capital</text>
        <text x="60" y="70" font-size="11" text-anchor="middle" fill="#333">• Low Volatility</text>
        <text x="60" y="85" font-size="11" text-anchor="middle" fill="#333">• Monthly Withdrawals</text>
        <text x="60" y="100" font-size="11" text-anchor="middle" fill="#333">• Long-term Safety</text>
        <text x="60" y="130" font-size="12" font-weight="bold" text-anchor="middle" fill="#1565C0">Strategy: Income</text>
      </g>
    </g>
    
    <!-- Arrows -->
    <path d="M 140 100 L 220 100" fill="none" stroke="#999" stroke-width="2" marker-end="url(#arrowhead)"/>
    <path d="M 360 100 L 440 100" fill="none" stroke="#999" stroke-width="2" marker-end="url(#arrowhead)"/>
    
    <!-- Arrow marker definition -->
    <defs>
      <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
        <polygon points="0 0, 10 3, 0 6" fill="#999"/>
      </marker>
    </defs>
  </svg>`,

  // Infographic: Premium vs Free
  premiumComparison: `<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg" class="w-full">
    <!-- Background -->
    <rect width="800" height="450" fill="#F5F5F5"/>
    
    <!-- Title -->
    <text x="400" y="35" font-size="26" font-weight="bold" text-anchor="middle" fill="#333">SmartInvest: Free vs Premium</text>
    
    <!-- Free Column -->
    <g transform="translate(50, 80)">
      <rect width="300" height="350" fill="#E8E8E8" stroke="#999" stroke-width="2" rx="8"/>
      <rect width="300" height="50" fill="#BDBDBD" rx="8"/>
      
      <text x="150" y="30" font-size="20" font-weight="bold" text-anchor="middle" fill="white">📱 Free</text>
      <text x="150" y="70" font-size="14" font-weight="bold" text-anchor="middle" fill="#333">Basic Calculators</text>
      
      <!-- Features -->
      <g transform="translate(15, 90)">
        <circle cx="8" cy="8" r="4" fill="#757575"/>
        <text x="20" y="12" font-size="12" fill="#333">Compound Interest</text>
        
        <circle cx="8" cy="30" r="4" fill="#757575"/>
        <text x="20" y="34" font-size="12" fill="#333">ROI Calculator</text>
        
        <circle cx="8" cy="52" r="4" fill="#757575"/>
        <text x="20" y="56" font-size="12" fill="#333">Savings Goal Planner</text>
        
        <circle cx="8" cy="74" r="4" fill="#757575"/>
        <text x="20" y="78" font-size="12" fill="#333">Investment Tips</text>
        
        <circle cx="8" cy="96" r="4" fill="#757575"/>
        <text x="20" y="100" font-size="12" fill="#333">Mini Courses</text>
        
        <circle cx="8" cy="118" r="4" fill="#757575"/>
        <text x="20" y="122" font-size="12" fill="#333">Success Stories</text>
        
        <circle cx="8" cy="140" r="4" fill="#999"/>
        <text x="20" y="144" font-size="12" fill="#999">✗ Advanced Tools</text>
        
        <circle cx="8" cy="162" r="4" fill="#999"/>
        <text x="20" y="166" font-size="12" fill="#999">✗ Complex Analysis</text>
        
        <circle cx="8" cy="184" r="4" fill="#999"/>
        <text x="20" y="188" font-size="12" fill="#999">✗ Scenario Planning</text>
      </g>
    </g>
    
    <!-- Premium Column -->
    <g transform="translate(450, 80)">
      <rect width="300" height="350" fill="#E8F5E9" stroke="#4CAF50" stroke-width="3" rx="8"/>
      <rect width="300" height="50" fill="#4CAF50" rx="8"/>
      
      <text x="150" y="30" font-size="20" font-weight="bold" text-anchor="middle" fill="white">⭐ Premium</text>
      <text x="150" y="70" font-size="14" font-weight="bold" text-anchor="middle" fill="#2E7D32">All Features + More</text>
      
      <!-- Features -->
      <g transform="translate(15, 90)">
        <circle cx="8" cy="8" r="4" fill="#4CAF50"/>
        <text x="20" y="12" font-size="12" fill="#333">✓ All Free Tools</text>
        
        <circle cx="8" cy="30" r="4" fill="#4CAF50"/>
        <text x="20" y="34" font-size="12" fill="#333">✓ Insurance Calculator</text>
        
        <circle cx="8" cy="52" r="4" fill="#4CAF50"/>
        <text x="20" y="56" font-size="12" fill="#333">✓ Retirement Planner</text>
        
        <circle cx="8" cy="74" r="4" fill="#4CAF50"/>
        <text x="20" y="78" font-size="12" fill="#333">✓ Portfolio Risk Analysis</text>
        
        <circle cx="8" cy="96" r="4" fill="#4CAF50"/>
        <text x="20" y="100" font-size="12" fill="#333">✓ Debt Repayment</text>
        
        <circle cx="8" cy="118" r="4" fill="#4CAF50"/>
        <text x="20" y="122" font-size="12" fill="#333">✓ Tax Optimization</text>
        
        <circle cx="8" cy="140" r="4" fill="#4CAF50"/>
        <text x="20" y="144" font-size="12" fill="#333">✓ Property Investment</text>
        
        <circle cx="8" cy="162" r="4" fill="#4CAF50"/>
        <text x="20" y="166" font-size="12" fill="#333">✓ Real-life Scenarios</text>
        
        <circle cx="8" cy="184" r="4" fill="#4CAF50"/>
        <text x="20" y="188" font-size="12" fill="#333">✓ Actuarial Formulas</text>
      </g>
    </g>
  </svg>`,

  // Dashboard Visual
  dashboardOverview: `<svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" class="w-full">
    <!-- Background -->
    <defs>
      <linearGradient id="dashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#F5F5F5;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#EEEEEE;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="800" height="500" fill="url(#dashGrad)"/>
    
    <!-- Header -->
    <rect width="800" height="60" fill="#4CAF50"/>
    <text x="20" y="40" font-size="28" font-weight="bold" fill="white">SmartInvest Dashboard</text>
    
    <!-- Card 1: Total Assets -->
    <g transform="translate(30, 80)">
      <rect width="220" height="180" fill="white" stroke="#E0E0E0" stroke-width="2" rx="8"/>
      <circle cx="190" cy="20" r="20" fill="#4CAF50" opacity="0.1"/>
      <path d="M 180 15 L 190 25 L 200 15" fill="none" stroke="#4CAF50" stroke-width="2"/>
      <text x="20" y="50" font-size="13" fill="#666">Total Assets</text>
      <text x="20" y="80" font-size="24" font-weight="bold" fill="#333">KES 2.5M</text>
      <text x="20" y="110" font-size="12" fill="#4CAF50">↑ 12% this year</text>
      <line x1="20" y1="120" x2="200" y2="120" stroke="#E0E0E0" stroke-width="1"/>
      <text x="20" y="150" font-size="11" fill="#999">Portfolio Growth</text>
      <rect x="20" y="155" width="180" height="8" fill="#E0E0E0" rx="4"/>
      <rect x="20" y="155" width="135" height="8" fill="#4CAF50" rx="4"/>
    </g>
    
    <!-- Card 2: Monthly Savings -->
    <g transform="translate(280, 80)">
      <rect width="220" height="180" fill="white" stroke="#E0E0E0" stroke-width="2" rx="8"/>
      <circle cx="190" cy="20" r="20" fill="#2196F3" opacity="0.1"/>
      <path d="M 190 10 L 190 30 M 180 20 L 200 20" fill="none" stroke="#2196F3" stroke-width="2"/>
      <text x="20" y="50" font-size="13" fill="#666">Monthly Savings</text>
      <text x="20" y="80" font-size="24" font-weight="bold" fill="#333">KES 45K</text>
      <text x="20" y="110" font-size="12" fill="#2196F3">↑ 5% from last month</text>
      <line x1="20" y1="120" x2="200" y2="120" stroke="#E0E0E0" stroke-width="1"/>
      <text x="20" y="150" font-size="11" fill="#999">Savings Rate: 20%</text>
      <rect x="20" y="155" width="180" height="8" fill="#E0E0E0" rx="4"/>
      <rect x="20" y="155" width="90" height="8" fill="#2196F3" rx="4"/>
    </g>
    
    <!-- Card 3: Goals Progress -->
    <g transform="translate(530, 80)">
      <rect width="220" height="180" fill="white" stroke="#E0E0E0" stroke-width="2" rx="8"/>
      <circle cx="190" cy="20" r="20" fill="#FF9800" opacity="0.1"/>
      <path d="M 185 20 L 188 25 L 195 15" fill="none" stroke="#FF9800" stroke-width="2"/>
      <text x="20" y="50" font-size="13" fill="#666">Goals Completed</text>
      <text x="20" y="80" font-size="24" font-weight="bold" fill="#333">4 of 6</text>
      <text x="20" y="110" font-size="12" fill="#FF9800">Emergency Fund ✓</text>
      <line x1="20" y1="120" x2="200" y2="120" stroke="#E0E0E0" stroke-width="1"/>
      <text x="20" y="145" font-size="11" fill="#999">Pending: Retirement (67%)</text>
      <rect x="20" y="150" width="180" height="8" fill="#E0E0E0" rx="4"/>
      <rect x="20" y="150" width="120" height="8" fill="#FF9800" rx="4"/>
    </g>
    
    <!-- Chart -->
    <g transform="translate(30, 290)">
      <rect width="720" height="190" fill="white" stroke="#E0E0E0" stroke-width="2" rx="8"/>
      <text x="20" y="25" font-size="15" font-weight="bold" fill="#333">Portfolio Allocation</text>
      
      <!-- Pie chart -->
      <circle cx="120" cy="100" r="50" fill="none" stroke="#4CAF50" stroke-width="40" opacity="0.8"/>
      <circle cx="120" cy="100" r="50" fill="none" stroke="#2196F3" stroke-width="30" stroke-dasharray="141,314" opacity="0.8" transform="rotate(-90 120 100)"/>
      <circle cx="120" cy="100" r="50" fill="none" stroke="#FF9800" stroke-width="20" stroke-dasharray="62,314" stroke-dashoffset="-141" opacity="0.8" transform="rotate(-90 120 100)"/>
      <circle cx="120" cy="100" r="50" fill="none" stroke="#E91E63" stroke-width="15" stroke-dasharray="31,314" stroke-dashoffset="-203" opacity="0.8" transform="rotate(-90 120 100)"/>
      
      <!-- Legend -->
      <g transform="translate(200, 70)">
        <rect width="15" height="15" fill="#4CAF50"/>
        <text x="25" y="12" font-size="12" fill="#333">Stocks (45%)</text>
        
        <rect y="25" width="15" height="15" fill="#2196F3"/>
        <text x="25" y="37" font-size="12" fill="#333">Bonds (30%)</text>
        
        <rect y="50" width="15" height="15" fill="#FF9800"/>
        <text x="25" y="62" font-size="12" fill="#333">Real Estate (20%)</text>
        
        <rect y="75" width="15" height="15" fill="#E91E63"/>
        <text x="25" y="87" font-size="12" fill="#333">Alternatives (5%)</text>
      </g>
    </g>
  </svg>`
};

// Export for use in HTML
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SVGGraphics;
}
