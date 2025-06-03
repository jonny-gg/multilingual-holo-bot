import { config } from '@/lib/config';

interface PrometheusMetric {
  name: string;
  value: number;
  labels?: Record<string, string>;
  help?: string;
  type?: 'counter' | 'gauge' | 'histogram' | 'summary';
  timestamp?: number;
}

interface PrometheusConfig {
  endpoint: string;
  pushgateway?: string;
  protocol: string;
  port: number;
  jobName: string;
  instance: string;
  enabled: boolean;
  timeout: number;
  retries: number;
}

class PrometheusService {
  private config: PrometheusConfig;
  private metrics: Map<string, PrometheusMetric> = new Map();
  private pushInterval?: NodeJS.Timeout;
  private connectionStatus: 'connected' | 'disconnected' | 'connecting' = 'disconnected';

  constructor() {
    this.config = {
      endpoint: config.monitoring?.prometheus?.endpoint || 'localhost',
      pushgateway: config.monitoring?.prometheus?.pushgateway || 'localhost:9091',
      protocol: config.monitoring?.prometheus?.protocol || 'http',
      port: config.monitoring?.prometheus?.port || 9090,
      jobName: config.monitoring?.prometheus?.jobName || 'holo-bot-livestream',
      instance: config.monitoring?.prometheus?.instance || `holo-bot-${Date.now()}`,
      enabled: config.monitoring?.prometheus?.enabled || false, // Default disabled in dev
      timeout: config.monitoring?.prometheus?.timeout || 5000,
      retries: config.monitoring?.prometheus?.retries || 3
    };

    // Only initialize if explicitly enabled
    if (this.config.enabled) {
      this.initializeConnection();
    } else if (config.isDevelopment) {
      console.log('📊 Prometheus monitoring disabled in development mode. Set PROMETHEUS_ENABLED=true to enable.');
      // Still collect metrics locally for debugging, but don't try to push them
      this.connectionStatus = 'disconnected';
    }
  }

  private async initializeConnection(): Promise<void> {
    this.connectionStatus = 'connecting';
    try {
      // Test connection to Prometheus endpoint
      const healthCheck = await this.testConnection();
      if (healthCheck) {
        this.connectionStatus = 'connected';
        this.startMetricsPush();
        console.log(`✅ Connected to Prometheus at ${this.config.endpoint}`);
      } else {
        throw new Error('Health check failed');
      }
    } catch (error) {
      console.warn(`⚠️ Failed to connect to Prometheus: ${error}. Running in local mode.`);
      this.connectionStatus = 'disconnected';
      // Still start metrics collection for local debugging
      this.startMetricsPush();
    }
  }

  private async testConnection(): Promise<boolean> {
    try {
      const url = `${this.config.protocol}://${this.config.endpoint}:${this.config.port}/api/v1/query?query=up`;
      
      // Create timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
      
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'holo-bot-livestream/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  public getConnectionStatus(): string {
    return this.connectionStatus;
  }

  // Core metric methods
  public setGauge(name: string, value: number, labels?: Record<string, string>, help?: string): void {
    this.metrics.set(name, {
      name,
      value,
      labels,
      help,
      type: 'gauge',
      timestamp: Date.now()
    });
  }

  public incrementCounter(name: string, value: number = 1, labels?: Record<string, string>, help?: string): void {
    const existing = this.metrics.get(name);
    const newValue = existing ? existing.value + value : value;
    
    this.metrics.set(name, {
      name,
      value: newValue,
      labels,
      help,
      type: 'counter',
      timestamp: Date.now()
    });
  }

  public recordHistogram(name: string, value: number, labels?: Record<string, string>, help?: string): void {
    // For simplicity, we'll record as gauge for now
    // In production, implement proper histogram buckets
    this.setGauge(`${name}_duration`, value, labels, help);
  }

  // Streaming-specific metrics
  public recordStreamingMetrics(metrics: {
    viewerCount: number;
    isLive: boolean;
    duration: number;
    language: string;
    quality: string;
  }): void {
    this.setGauge('holo_bot_viewers_current', metrics.viewerCount, {
      language: metrics.language,
      quality: metrics.quality
    });

    this.setGauge('holo_bot_stream_duration_seconds', metrics.duration, {
      language: metrics.language
    });

    this.setGauge('holo_bot_stream_active', metrics.isLive ? 1 : 0, {
      language: metrics.language
    });
  }

  // Performance metrics
  public recordPerformanceMetrics(metrics: {
    fps: number;
    latency: number;
    connectionQuality: string;
  }): void {
    this.setGauge('holo_bot_fps', metrics.fps);
    this.setGauge('holo_bot_latency_ms', metrics.latency);
    this.setGauge('holo_bot_connection_quality_score', this.getQualityScore(metrics.connectionQuality));
  }

  // MCP service metrics
  public recordMCPMetrics(service: string, metrics: {
    requestCount: number;
    errorCount: number;
    responseTime: number;
    isHealthy: boolean;
  }): void {
    this.incrementCounter('holo_bot_mcp_requests_total', metrics.requestCount, { service });
    this.incrementCounter('holo_bot_mcp_errors_total', metrics.errorCount, { service });
    this.recordHistogram('holo_bot_mcp_response_time_ms', metrics.responseTime, { service });
    this.setGauge('holo_bot_mcp_health', metrics.isHealthy ? 1 : 0, { service });
  }

  // Chat and AI metrics
  public recordChatMetrics(metrics: {
    messagesReceived: number;
    messagesProcessed: number;
    aiResponseTime: number;
    language: string;
  }): void {
    this.incrementCounter('holo_bot_chat_messages_received_total', metrics.messagesReceived, {
      language: metrics.language
    });
    this.incrementCounter('holo_bot_chat_messages_processed_total', metrics.messagesProcessed, {
      language: metrics.language
    });
    this.recordHistogram('holo_bot_ai_response_time_ms', metrics.aiResponseTime, {
      language: metrics.language
    });
  }

  // Avatar and animation metrics
  public recordAvatarMetrics(metrics: {
    animationsFPS: number;
    emotionChanges: number;
    lipSyncLatency: number;
    motionCaptureLatency: number;
  }): void {
    this.setGauge('holo_bot_avatar_animations_fps', metrics.animationsFPS);
    this.incrementCounter('holo_bot_avatar_emotion_changes_total', metrics.emotionChanges);
    this.setGauge('holo_bot_avatar_lip_sync_latency_ms', metrics.lipSyncLatency);
    this.setGauge('holo_bot_avatar_motion_capture_latency_ms', metrics.motionCaptureLatency);
  }

  // System health metrics
  public recordSystemMetrics(metrics: {
    memoryUsage: number;
    cpuUsage: number;
    errorCount: number;
    warningCount: number;
    uptime: number;
  }): void {
    this.setGauge('holo_bot_memory_usage_bytes', metrics.memoryUsage);
    this.setGauge('holo_bot_cpu_usage_percent', metrics.cpuUsage);
    this.setGauge('holo_bot_errors_total', metrics.errorCount);
    this.setGauge('holo_bot_warnings_total', metrics.warningCount);
    this.setGauge('holo_bot_uptime_seconds', metrics.uptime);
  }

  // Export metrics in Prometheus format
  public exportMetrics(): string {
    let output = '';
    
    for (const [, metric] of this.metrics) {
      if (metric.help) {
        output += `# HELP ${metric.name} ${metric.help}\n`;
      }
      if (metric.type) {
        output += `# TYPE ${metric.name} ${metric.type}\n`;
      }
      
      const labelsStr = metric.labels 
        ? Object.entries(metric.labels)
            .map(([key, value]) => `${key}="${value}"`)
            .join(',')
        : '';
      
      const metricLine = labelsStr 
        ? `${metric.name}{${labelsStr}} ${metric.value}`
        : `${metric.name} ${metric.value}`;
      
      output += `${metricLine}\n`;
    }
    
    return output;
  }

  // Push metrics to Prometheus Pushgateway
  private async pushMetrics(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      const metricsData = this.exportMetrics();
      
      // Try pushgateway first, fall back to direct push if available
      if (this.config.pushgateway) {
        const pushgatewayUrl = this.config.pushgateway.startsWith('http') 
          ? this.config.pushgateway 
          : `${this.config.protocol}://${this.config.pushgateway}`;
        
        const url = `${pushgatewayUrl}/metrics/job/${this.config.jobName}/instance/${this.config.instance}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        
        const response = await fetch(url, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'text/plain',
            'User-Agent': 'holo-bot-livestream/1.0'
          },
          body: metricsData,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.warn(`⚠️ Failed to push metrics to Prometheus pushgateway: ${response.statusText}`);
          // Update connection status but don't throw
          this.connectionStatus = 'disconnected';
        } else {
          this.connectionStatus = 'connected';
        }
      }
    } catch (error) {
      if (config.isDevelopment) {
        // Only log connection issues once to avoid spam
        if (this.connectionStatus !== 'disconnected') {
          console.log(`📊 Prometheus unavailable in development. Use PROMETHEUS_ENABLED=true to enable monitoring.`);
        }
      } else {
        console.warn(`⚠️ Error pushing metrics to Prometheus: ${error}`);
      }
      this.connectionStatus = 'disconnected';
    }
  }

  // Start periodic metrics push
  private startMetricsPush(): void {
    // Don't start pushing if disabled
    if (!this.config.enabled) {
      return;
    }

    if (this.pushInterval) {
      clearInterval(this.pushInterval);
    }

    // Push metrics every 15 seconds
    this.pushInterval = setInterval(() => {
      this.pushMetrics();
    }, 15000);

    // Initial push (delayed slightly to allow system startup)
    setTimeout(() => {
      this.pushMetrics();
    }, 2000);
  }

  // Stop metrics push
  public stop(): void {
    if (this.pushInterval) {
      clearInterval(this.pushInterval);
      this.pushInterval = undefined;
    }
  }

  // Get metrics endpoint for Prometheus scraping
  public getMetricsEndpoint(): string {
    return '/api/metrics';
  }

  // Helper method to convert connection quality to numeric score
  private getQualityScore(quality: string): number {
    switch (quality) {
      case 'excellent': return 4;
      case 'good': return 3;
      case 'poor': return 2;
      case 'disconnected': return 1;
      default: return 0;
    }
  }

  // Get all current metrics
  public getAllMetrics(): PrometheusMetric[] {
    return Array.from(this.metrics.values());
  }

  // Clear all metrics
  public clearMetrics(): void {
    this.metrics.clear();
  }

  // Get configuration
  public getConfig(): PrometheusConfig {
    return { ...this.config };
  }

  // Update configuration
  public updateConfig(newConfig: Partial<PrometheusConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.config.enabled && !this.pushInterval) {
      this.startMetricsPush();
    } else if (!this.config.enabled && this.pushInterval) {
      this.stop();
    }
  }
}

// Singleton instance
export const prometheusService = new PrometheusService();

// Export types
export type { PrometheusMetric, PrometheusConfig };
