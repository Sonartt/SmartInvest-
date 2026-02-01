/**
 * SmartInvest Performance Optimization Module
 * Implements caching, database query optimization, and performance monitoring
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Cache configuration
const CACHE_CONFIG = {
  defaultTTL: 300000, // 5 minutes
  maxSize: 1000, // Maximum cache entries
  cleanupInterval: 60000 // 1 minute
};

// In-memory cache (use Redis in production)
class Cache {
  constructor() {
    this.store = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0
    };
    
    // Start cleanup interval
    this.startCleanup();
  }

  /**
   * Get value from cache
   */
  get(key) {
    const entry = this.store.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    entry.lastAccessed = Date.now();
    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key, value, ttl = CACHE_CONFIG.defaultTTL) {
    // Check size limit
    if (this.store.size >= CACHE_CONFIG.maxSize) {
      this.evictLRU();
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttl,
      lastAccessed: Date.now(),
      size: this.estimateSize(value)
    });

    this.stats.sets++;
  }

  /**
   * Delete from cache
   */
  delete(key) {
    return this.store.delete(key);
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.store.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100
      : 0;

    return {
      ...this.stats,
      size: this.store.size,
      hitRate: hitRate.toFixed(2) + '%'
    };
  }

  /**
   * Evict least recently used entry
   */
  evictLRU() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.store.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.store.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Start cleanup interval
   */
  startCleanup() {
    setInterval(() => {
      this.cleanup();
    }, CACHE_CONFIG.cleanupInterval);
  }

  /**
   * Estimate object size
   */
  estimateSize(obj) {
    try {
      return JSON.stringify(obj).length;
    } catch (err) {
      return 0;
    }
  }
}

// Global cache instance
const cache = new Cache();

/**
 * Cache Middleware Factory
 */
function createCacheMiddleware(keyPrefix = 'default', ttl = CACHE_CONFIG.defaultTTL) {
  return function cacheMiddleware(req, res, next) {
    // Generate cache key from request
    const cacheKey = `${keyPrefix}:${req.method}:${req.url}:${JSON.stringify(req.query)}`;
    const hash = crypto.createHash('md5').update(cacheKey).digest('hex');

    // Try to get from cache
    const cachedData = cache.get(hash);
    
    if (cachedData) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cachedData);
    }

    // Cache miss - intercept res.json to cache response
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      // Only cache successful responses
      if (data && data.success !== false) {
        cache.set(hash, data, ttl);
      }
      res.setHeader('X-Cache', 'MISS');
      return originalJson(data);
    };

    next();
  };
}

/**
 * File System Cache for JSON files
 */
class FileCache {
  constructor() {
    this.fileCache = new Map();
    this.fileStats = new Map();
  }

  /**
   * Read JSON file with caching
   */
  readJSON(filePath, defaultValue = {}) {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return defaultValue;
      }

      // Get file stats
      const stats = fs.statSync(filePath);
      const mtime = stats.mtime.getTime();

      // Check cache
      if (this.fileCache.has(filePath)) {
        const cached = this.fileCache.get(filePath);
        const cachedMtime = this.fileStats.get(filePath);

        // Return cached data if file hasn't changed
        if (cachedMtime === mtime) {
          return cached;
        }
      }

      // Read and parse file
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      // Update cache
      this.fileCache.set(filePath, data);
      this.fileStats.set(filePath, mtime);

      return data;
    } catch (err) {
      console.error(`Error reading ${filePath}:`, err);
      return defaultValue;
    }
  }

  /**
   * Write JSON file and invalidate cache
   */
  writeJSON(filePath, data) {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

      // Invalidate cache
      this.fileCache.delete(filePath);
      this.fileStats.delete(filePath);

      return true;
    } catch (err) {
      console.error(`Error writing ${filePath}:`, err);
      return false;
    }
  }

  /**
   * Clear cache for specific file or all files
   */
  clearCache(filePath = null) {
    if (filePath) {
      this.fileCache.delete(filePath);
      this.fileStats.delete(filePath);
    } else {
      this.fileCache.clear();
      this.fileStats.clear();
    }
  }
}

// Global file cache instance
const fileCache = new FileCache();

/**
 * Query Optimization Helper
 */
class QueryOptimizer {
  /**
   * Filter array with Map-based lookup (O(1) instead of O(n))
   */
  static filterByIds(array, ids, idField = 'id') {
    const idSet = new Set(ids);
    return array.filter(item => idSet.has(item[idField]));
  }

  /**
   * Group array by field
   */
  static groupBy(array, field) {
    return array.reduce((groups, item) => {
      const key = item[field];
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {});
  }

  /**
   * Create index (Map) from array for fast lookups
   */
  static createIndex(array, keyField = 'id') {
    const index = new Map();
    array.forEach(item => {
      index.set(item[keyField], item);
    });
    return index;
  }

  /**
   * Paginate array efficiently
   */
  static paginate(array, page = 1, pageSize = 20) {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    
    return {
      data: array.slice(start, end),
      pagination: {
        currentPage: page,
        pageSize,
        totalItems: array.length,
        totalPages: Math.ceil(array.length / pageSize),
        hasNext: end < array.length,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Sort array efficiently (in-place)
   */
  static sortBy(array, field, order = 'asc') {
    return array.sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      
      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }
}

/**
 * Performance Monitor
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = [];
    this.maxMetrics = 1000;
  }

  /**
   * Track operation performance
   */
  track(operation, duration, metadata = {}) {
    this.metrics.push({
      operation,
      duration,
      timestamp: Date.now(),
      metadata
    });

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  /**
   * Get performance statistics
   */
  getStats(operation = null) {
    let relevantMetrics = this.metrics;
    
    if (operation) {
      relevantMetrics = this.metrics.filter(m => m.operation === operation);
    }

    if (relevantMetrics.length === 0) {
      return null;
    }

    const durations = relevantMetrics.map(m => m.duration);
    const sum = durations.reduce((a, b) => a + b, 0);
    const avg = sum / durations.length;
    const sorted = durations.sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    return {
      operation: operation || 'all',
      count: relevantMetrics.length,
      avg: avg.toFixed(2),
      median: median.toFixed(2),
      min: Math.min(...durations).toFixed(2),
      max: Math.max(...durations).toFixed(2),
      p95: p95.toFixed(2),
      p99: p99.toFixed(2)
    };
  }

  /**
   * Clear metrics
   */
  clear() {
    this.metrics = [];
  }
}

// Global performance monitor
const perfMonitor = new PerformanceMonitor();

/**
 * Performance Tracking Middleware
 */
function performanceTracking(req, res, next) {
  const start = Date.now();
  const operation = `${req.method} ${req.path}`;

  res.on('finish', () => {
    const duration = Date.now() - start;
    perfMonitor.track(operation, duration, {
      status: res.statusCode,
      method: req.method,
      path: req.path
    });
  });

  next();
}

/**
 * Batch Processing Helper
 */
function processBatch(items, batchSize, processFn) {
  const batches = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  
  return Promise.all(batches.map(batch => processFn(batch)));
}

module.exports = {
  cache,
  fileCache,
  createCacheMiddleware,
  QueryOptimizer,
  perfMonitor,
  performanceTracking,
  processBatch,
  Cache,
  FileCache,
  PerformanceMonitor
};
