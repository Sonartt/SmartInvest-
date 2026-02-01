// ========== PERFORMANCE OPTIMIZATION MODULE ==========
// Web Workers, Caching, Lazy Loading
// Created: January 29, 2026

/**
 * Calculation Cache Manager
 */
class CalculationCache {
  constructor(maxSize = 100, ttl = 3600000) { // 1 hour TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  generateKey(functionName, params) {
    return `${functionName}:${JSON.stringify(params)}`;
  }

  set(functionName, params, result) {
    const key = this.generateKey(functionName, params);
    
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      result,
      timestamp: Date.now()
    });
  }

  get(functionName, params) {
    const key = this.generateKey(functionName, params);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    // Check if expired
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.result;
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

// Global cache instance
const calculationCache = new CalculationCache();

/**
 * Cached calculation wrapper
 */
function cachedCalculation(functionName, calculationFunction, params) {
  // Check cache first
  const cached = calculationCache.get(functionName, params);
  if (cached) {
    console.log(`Cache hit for ${functionName}`);
    return cached;
  }
  
  // Calculate and cache
  const result = calculationFunction(...Object.values(params));
  calculationCache.set(functionName, params, result);
  
  return result;
}

/**
 * Web Worker for Heavy Calculations
 */
class CalculationWorker {
  constructor() {
    this.worker = null;
    this.workerCode = `
      // Worker code for heavy calculations
      self.onmessage = function(e) {
        const { type, data } = e.data;
        
        try {
          let result;
          
          switch(type) {
            case 'monteCarlo':
              result = runMonteCarloSimulation(data);
              break;
            case 'optimization':
              result = runPortfolioOptimization(data);
              break;
            case 'amortization':
              result = generateAmortizationSchedule(data);
              break;
            default:
              throw new Error('Unknown calculation type');
          }
          
          self.postMessage({ success: true, result });
        } catch (error) {
          self.postMessage({ success: false, error: error.message });
        }
      };
      
      function runMonteCarloSimulation(data) {
        const { initial, annualReturn, stdDev, years, simulations } = data;
        const results = [];
        
        for (let sim = 0; sim < simulations; sim++) {
          let value = initial;
          
          for (let year = 0; year < years; year++) {
            const u1 = Math.random();
            const u2 = Math.random();
            const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
            const yearReturn = annualReturn / 100 + (stdDev / 100) * z;
            value *= (1 + yearReturn);
          }
          
          results.push(value);
        }
        
        results.sort((a, b) => a - b);
        
        const median = results[Math.floor(simulations / 2)];
        const percentile10 = results[Math.floor(simulations * 0.10)];
        const percentile90 = results[Math.floor(simulations * 0.90)];
        const mean = results.reduce((a, b) => a + b, 0) / simulations;
        
        return {
          results,
          mean,
          median,
          percentile10,
          percentile90,
          bestCase: results[simulations - 1],
          worstCase: results[0]
        };
      }
      
      function runPortfolioOptimization(data) {
        // Simplified optimization algorithm
        const { assets, riskFreeRate } = data;
        const n = assets.length;
        const frontier = [];
        
        for (let targetReturn = 5; targetReturn <= 20; targetReturn += 1) {
          let weights = new Array(n).fill(1 / n);
          
          for (let iter = 0; iter < 100; iter++) {
            const portfolioReturn = weights.reduce((sum, w, i) => sum + w * assets[i].return, 0);
            if (Math.abs(portfolioReturn - targetReturn) < 0.1) break;
            
            const adjustment = (targetReturn - portfolioReturn) / n;
            weights = weights.map((w, i) => Math.max(0, w + adjustment / assets[i].return));
            
            const sum = weights.reduce((a, b) => a + b, 0);
            weights = weights.map(w => w / sum);
          }
          
          let variance = 0;
          for (let i = 0; i < n; i++) {
            variance += weights[i] * weights[i] * assets[i].stdDev * assets[i].stdDev;
          }
          const risk = Math.sqrt(variance);
          
          frontier.push({
            expectedReturn: targetReturn,
            risk,
            sharpe: (targetReturn - riskFreeRate) / risk,
            weights
          });
        }
        
        return frontier;
      }
      
      function generateAmortizationSchedule(data) {
        const { principal, rate, years } = data;
        const monthlyRate = rate / 100 / 12;
        const months = years * 12;
        const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                        (Math.pow(1 + monthlyRate, months) - 1);
        
        let balance = principal;
        const schedule = [];
        
        for (let month = 1; month <= months; month++) {
          const interest = balance * monthlyRate;
          const principalPayment = payment - interest;
          balance -= principalPayment;
          
          schedule.push({
            month,
            payment,
            principal: principalPayment,
            interest,
            balance: Math.max(0, balance)
          });
        }
        
        return schedule;
      }
    `;
  }

  initialize() {
    const blob = new Blob([this.workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    this.worker = new Worker(workerUrl);
    return this;
  }

  calculate(type, data) {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        this.initialize();
      }

      const timeout = setTimeout(() => {
        reject(new Error('Calculation timeout'));
      }, 30000); // 30 second timeout

      this.worker.onmessage = (e) => {
        clearTimeout(timeout);
        if (e.data.success) {
          resolve(e.data.result);
        } else {
          reject(new Error(e.data.error));
        }
      };

      this.worker.onerror = (error) => {
        clearTimeout(timeout);
        reject(error);
      };

      this.worker.postMessage({ type, data });
    });
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

// Global worker instance
let globalWorker = null;

function getCalculationWorker() {
  if (!globalWorker) {
    globalWorker = new CalculationWorker().initialize();
  }
  return globalWorker;
}

/**
 * Lazy Loading Module Manager
 */
class ModuleLoader {
  constructor() {
    this.modules = new Map();
    this.loading = new Map();
  }

  async loadModule(moduleName, moduleUrl) {
    // Check if already loaded
    if (this.modules.has(moduleName)) {
      return this.modules.get(moduleName);
    }

    // Check if currently loading
    if (this.loading.has(moduleName)) {
      return this.loading.get(moduleName);
    }

    // Load module
    const loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = moduleUrl;
      script.async = true;

      script.onload = () => {
        const module = window[moduleName];
        this.modules.set(moduleName, module);
        this.loading.delete(moduleName);
        resolve(module);
      };

      script.onerror = () => {
        this.loading.delete(moduleName);
        reject(new Error(`Failed to load module: ${moduleName}`));
      };

      document.head.appendChild(script);
    });

    this.loading.set(moduleName, loadPromise);
    return loadPromise;
  }

  async loadCalculatorModule(category) {
    const moduleMap = {
      'advanced': '/tools/calculator_advanced.js',
      'visualization': '/tools/calculator_visualization.js',
      'export': '/tools/calculator_export.js'
    };

    if (!moduleMap[category]) {
      throw new Error(`Unknown calculator module: ${category}`);
    }

    return this.loadModule(category, moduleMap[category]);
  }

  isLoaded(moduleName) {
    return this.modules.has(moduleName);
  }
}

const moduleLoader = new ModuleLoader();

/**
 * Debounce function for input handling
 */
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for scroll/resize events
 */
function throttle(func, limit = 100) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Batch processing for large datasets
 */
async function batchProcess(items, processFn, batchSize = 100) {
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processFn));
    results.push(...batchResults);
    
    // Allow UI to update between batches
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  
  return results;
}

/**
 * Performance monitoring
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
  }

  start(name) {
    this.metrics.set(name, {
      start: performance.now(),
      end: null,
      duration: null
    });
  }

  end(name) {
    const metric = this.metrics.get(name);
    if (metric) {
      metric.end = performance.now();
      metric.duration = metric.end - metric.start;
    }
    return metric?.duration;
  }

  getMetric(name) {
    return this.metrics.get(name);
  }

  getAllMetrics() {
    const results = {};
    this.metrics.forEach((value, key) => {
      results[key] = value.duration;
    });
    return results;
  }

  clear() {
    this.metrics.clear();
  }

  log(name) {
    const metric = this.metrics.get(name);
    if (metric && metric.duration !== null) {
      console.log(`${name}: ${metric.duration.toFixed(2)}ms`);
    }
  }
}

const perfMonitor = new PerformanceMonitor();

/**
 * Memoization decorator
 */
function memoize(fn) {
  const cache = new Map();
  
  return function(...args) {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn.apply(this, args);
    cache.set(key, result);
    
    // Limit cache size
    if (cache.size > 1000) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  };
}

/**
 * Request Animation Frame wrapper for smooth UI updates
 */
function smoothUpdate(callback) {
  requestAnimationFrame(() => {
    callback();
  });
}

/**
 * Async calculation with progress callback
 */
async function calculateWithProgress(calculationFn, progressCallback, steps = 10) {
  const stepSize = 100 / steps;
  let progress = 0;
  
  for (let i = 0; i < steps; i++) {
    await new Promise(resolve => setTimeout(resolve, 0));
    progress += stepSize;
    
    if (progressCallback) {
      progressCallback(Math.min(progress, 100));
    }
  }
  
  const result = await calculationFn();
  
  if (progressCallback) {
    progressCallback(100);
  }
  
  return result;
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CalculationCache,
    calculationCache,
    cachedCalculation,
    CalculationWorker,
    getCalculationWorker,
    ModuleLoader,
    moduleLoader,
    debounce,
    throttle,
    batchProcess,
    PerformanceMonitor,
    perfMonitor,
    memoize,
    smoothUpdate,
    calculateWithProgress
  };
}
