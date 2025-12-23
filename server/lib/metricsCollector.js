/**
 * Metrics Collector for Monitoring System Performance
 */

class MetricsCollector {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        byIntent: {
          SMALL_TALK: 0,
          SCRIPTURE_QA: 0,
          PERSONAL_SUPPORT: 0
        },
        byEmotion: {
          neutral: 0,
          sad: 0,
          angry: 0,
          anxious: 0,
          motivated: 0,
          joyful: 0,
          confused: 0
        }
      },
      latency: {
        total: 0,
        count: 0,
        min: Infinity,
        max: 0,
        byPath: {
          fast: { total: 0, count: 0 },
          full_rag: { total: 0, count: 0 }
        }
      },
      rag: {
        used: 0,
        skipped: 0,
        avgChunksRetrieved: 0,
        totalChunksRetrieved: 0
      },
      models: {
        miniLM: { calls: 0, errors: 0, totalLatency: 0 },
        mistral: { calls: 0, errors: 0, totalLatency: 0 },
        llama: { calls: 0, errors: 0, totalLatency: 0 },
        elevenlabs: { calls: 0, errors: 0, totalLatency: 0 }
      },
      cache: {
        hits: 0,
        misses: 0
      },
      errors: {
        total: 0,
        byType: {}
      }
    };

    this.startTime = Date.now();
  }

  // Record request
  recordRequest(intent, emotion, success = true) {
    this.metrics.requests.total++;
    
    if (success) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
    }

    if (intent) {
      this.metrics.requests.byIntent[intent] = (this.metrics.requests.byIntent[intent] || 0) + 1;
    }

    if (emotion) {
      this.metrics.requests.byEmotion[emotion] = (this.metrics.requests.byEmotion[emotion] || 0) + 1;
    }
  }

  // Record latency
  recordLatency(latencyMs, path = null) {
    this.metrics.latency.total += latencyMs;
    this.metrics.latency.count++;
    this.metrics.latency.min = Math.min(this.metrics.latency.min, latencyMs);
    this.metrics.latency.max = Math.max(this.metrics.latency.max, latencyMs);

    if (path) {
      const pathMetrics = this.metrics.latency.byPath[path];
      if (pathMetrics) {
        pathMetrics.total += latencyMs;
        pathMetrics.count++;
      }
    }
  }

  // Record RAG usage
  recordRAG(used, chunksRetrieved = 0) {
    if (used) {
      this.metrics.rag.used++;
      this.metrics.rag.totalChunksRetrieved += chunksRetrieved;
    } else {
      this.metrics.rag.skipped++;
    }
  }

  // Record model call
  recordModelCall(model, latencyMs, error = false) {
    const modelMetrics = this.metrics.models[model];
    if (modelMetrics) {
      modelMetrics.calls++;
      modelMetrics.totalLatency += latencyMs;
      if (error) {
        modelMetrics.errors++;
      }
    }
  }

  // Record cache hit/miss
  recordCache(hit) {
    if (hit) {
      this.metrics.cache.hits++;
    } else {
      this.metrics.cache.misses++;
    }
  }

  // Record error
  recordError(errorType, errorMessage) {
    this.metrics.errors.total++;
    this.metrics.errors.byType[errorType] = (this.metrics.errors.byType[errorType] || 0) + 1;
    console.error(`[Metrics] Error recorded: ${errorType} - ${errorMessage}`);
  }

  // Get current metrics
  getMetrics() {
    const uptime = Date.now() - this.startTime;
    const avgLatency = this.metrics.latency.count > 0
      ? (this.metrics.latency.total / this.metrics.latency.count).toFixed(2)
      : 0;

    const successRate = this.metrics.requests.total > 0
      ? ((this.metrics.requests.successful / this.metrics.requests.total) * 100).toFixed(2)
      : 0;

    const cacheHitRate = (this.metrics.cache.hits + this.metrics.cache.misses) > 0
      ? ((this.metrics.cache.hits / (this.metrics.cache.hits + this.metrics.cache.misses)) * 100).toFixed(2)
      : 0;

    const ragUsageRate = (this.metrics.rag.used + this.metrics.rag.skipped) > 0
      ? ((this.metrics.rag.used / (this.metrics.rag.used + this.metrics.rag.skipped)) * 100).toFixed(2)
      : 0;

    return {
      uptime: `${(uptime / 1000 / 60).toFixed(2)} minutes`,
      requests: {
        ...this.metrics.requests,
        successRate: `${successRate}%`
      },
      latency: {
        avg: `${avgLatency}ms`,
        min: this.metrics.latency.min === Infinity ? 0 : `${this.metrics.latency.min}ms`,
        max: `${this.metrics.latency.max}ms`,
        byPath: {
          fast: this.metrics.latency.byPath.fast.count > 0
            ? `${(this.metrics.latency.byPath.fast.total / this.metrics.latency.byPath.fast.count).toFixed(2)}ms`
            : 'N/A',
          full_rag: this.metrics.latency.byPath.full_rag.count > 0
            ? `${(this.metrics.latency.byPath.full_rag.total / this.metrics.latency.byPath.full_rag.count).toFixed(2)}ms`
            : 'N/A'
        }
      },
      rag: {
        ...this.metrics.rag,
        usageRate: `${ragUsageRate}%`,
        avgChunksRetrieved: this.metrics.rag.used > 0
          ? (this.metrics.rag.totalChunksRetrieved / this.metrics.rag.used).toFixed(2)
          : 0
      },
      models: Object.entries(this.metrics.models).reduce((acc, [model, stats]) => {
        acc[model] = {
          ...stats,
          avgLatency: stats.calls > 0 ? `${(stats.totalLatency / stats.calls).toFixed(2)}ms` : 'N/A',
          errorRate: stats.calls > 0 ? `${((stats.errors / stats.calls) * 100).toFixed(2)}%` : '0%'
        };
        return acc;
      }, {}),
      cache: {
        ...this.metrics.cache,
        hitRate: `${cacheHitRate}%`
      },
      errors: this.metrics.errors
    };
  }

  // Get summary for dashboard
  getSummary() {
    const metrics = this.getMetrics();
    
    return {
      status: metrics.requests.successRate > 95 ? 'healthy' : 'degraded',
      totalRequests: metrics.requests.total,
      successRate: metrics.requests.successRate,
      avgLatency: metrics.latency.avg,
      cacheHitRate: metrics.cache.hitRate,
      ragUsageRate: metrics.rag.usageRate,
      uptime: metrics.uptime
    };
  }

  // Reset metrics
  reset() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        byIntent: {},
        byEmotion: {}
      },
      latency: {
        total: 0,
        count: 0,
        min: Infinity,
        max: 0,
        byPath: {
          fast: { total: 0, count: 0 },
          full_rag: { total: 0, count: 0 }
        }
      },
      rag: {
        used: 0,
        skipped: 0,
        avgChunksRetrieved: 0,
        totalChunksRetrieved: 0
      },
      models: {
        miniLM: { calls: 0, errors: 0, totalLatency: 0 },
        mistral: { calls: 0, errors: 0, totalLatency: 0 },
        llama: { calls: 0, errors: 0, totalLatency: 0 },
        elevenlabs: { calls: 0, errors: 0, totalLatency: 0 }
      },
      cache: {
        hits: 0,
        misses: 0
      },
      errors: {
        total: 0,
        byType: {}
      }
    };
    this.startTime = Date.now();
    console.log('[Metrics] Reset complete');
  }

  // Export metrics to JSON
  exportMetrics() {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics()
    };
  }

  // Print metrics to console
  printMetrics() {
    const metrics = this.getMetrics();
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  📊 SYSTEM METRICS');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log(`Uptime:           ${metrics.uptime}`);
    console.log(`Total Requests:   ${metrics.requests.total}`);
    console.log(`Success Rate:     ${metrics.requests.successRate}`);
    console.log(`Avg Latency:      ${metrics.latency.avg}`);
    console.log(`Cache Hit Rate:   ${metrics.cache.hitRate}`);
    console.log(`RAG Usage:        ${metrics.rag.usageRate}`);
    console.log('\n═══════════════════════════════════════════════════════\n');
  }
}

// Singleton instance
const metricsCollector = new MetricsCollector();

// Print metrics every 5 minutes
setInterval(() => {
  metricsCollector.printMetrics();
}, 300000);

module.exports = metricsCollector;
