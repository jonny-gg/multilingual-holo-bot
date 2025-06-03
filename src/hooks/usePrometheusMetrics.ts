import { useEffect, useRef } from 'react';
import { prometheusService } from '@/services/prometheus';
import { config } from '@/lib/config';

interface MetricsData {
  // Performance metrics
  performance: {
    fps: number;
    latency: number;
    connectionQuality: string;
  };
  
  // Streaming metrics
  streaming: {
    viewerCount: number;
    isLive: boolean;
    duration: number;
    language: string;
    quality: string;
  };
  
  // Chat metrics
  chat: {
    messagesReceived: number;
    messagesProcessed: number;
    aiResponseTime: number;
    language: string;
  };
  
  // System metrics
  system: {
    memoryUsage: number;
    cpuUsage: number;
    errorCount: number;
    warningCount: number;
    uptime: number;
  };
  
  // Avatar metrics
  avatar: {
    animationsFPS: number;
    emotionChanges: number;
    lipSyncLatency: number;
    motionCaptureLatency: number;
  };
}

export function usePrometheusMetrics() {
  const metricsInterval = useRef<NodeJS.Timeout | null>(null);
  const startTime = useRef<number>(Date.now());
  // const lastMetrics = useRef<Partial<MetricsData>>({}); // Commented out as it's not used
  
  // Record performance metrics
  const recordPerformanceMetrics = (metrics: MetricsData['performance']) => {
    if (config.monitoring.prometheus.enabled) {
      prometheusService.recordPerformanceMetrics(metrics);
    }
  };
  
  // Record streaming metrics
  const recordStreamingMetrics = (metrics: MetricsData['streaming']) => {
    if (config.monitoring.prometheus.enabled) {
      prometheusService.recordStreamingMetrics(metrics);
    }
  };
  
  // Record chat metrics
  const recordChatMetrics = (metrics: MetricsData['chat']) => {
    if (config.monitoring.prometheus.enabled) {
      prometheusService.recordChatMetrics(metrics);
    }
  };
  
  // Record avatar metrics
  const recordAvatarMetrics = (metrics: MetricsData['avatar']) => {
    if (config.monitoring.prometheus.enabled) {
      prometheusService.recordAvatarMetrics(metrics);
    }
  };
  
  // Record system metrics
  const recordSystemMetrics = (metrics: MetricsData['system']) => {
    if (config.monitoring.prometheus.enabled) {
      prometheusService.recordSystemMetrics(metrics);
    }
  };
  
  // Record MCP service metrics
  const recordMCPMetrics = (service: string, metrics: {
    requestCount: number;
    errorCount: number;
    responseTime: number;
    isHealthy: boolean;
  }) => {
    if (config.monitoring.prometheus.enabled) {
      prometheusService.recordMCPMetrics(service, metrics);
    }
  };
  
  // Get browser performance metrics
  const getBrowserMetrics = () => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const memory = (performance as { memory?: { usedJSHeapSize?: number } }).memory;
      return {
        memoryUsage: memory ? memory.usedJSHeapSize || 0 : 0,
        cpuUsage: 0, // Can't get real CPU usage in browser
        uptime: Math.floor((Date.now() - startTime.current) / 1000),
      };
    }
    return {
      memoryUsage: 0,
      cpuUsage: 0,
      uptime: Math.floor((Date.now() - startTime.current) / 1000),
    };
  };
  
  // Start automatic metrics collection
  const startMetricsCollection = () => {
    if (!config.monitoring.prometheus.enabled) return;
    
    metricsInterval.current = setInterval(() => {
      // Collect and record basic system metrics
      const browserMetrics = getBrowserMetrics();
      recordSystemMetrics({
        ...browserMetrics,
        errorCount: 0, // Will be updated by error handlers
        warningCount: 0, // Will be updated by warning handlers
      });
      
      // Record application health
      prometheusService.setGauge('holo_bot_health', 1, {
        instance: config.monitoring.prometheus.instance,
        version: process.env.npm_package_version || '1.0.0'
      });
      
    }, config.monitoring.prometheus.scrapeInterval * 1000);
  };
  
  // Stop metrics collection
  const stopMetricsCollection = () => {
    if (metricsInterval.current) {
      clearInterval(metricsInterval.current);
      metricsInterval.current = null;
    }
  };
  
  // Get current metrics summary
  const getMetricsSummary = () => {
    return prometheusService.getAllMetrics();
  };
  
  // Export metrics in Prometheus format
  const exportMetrics = () => {
    return prometheusService.exportMetrics();
  };
  
  // Initialize metrics collection on mount
  useEffect(() => {
    if (config.monitoring.prometheus.enabled) {
      startMetricsCollection();
      
      // Record startup metrics
      prometheusService.incrementCounter('holo_bot_startup_total', 1, {
        instance: config.monitoring.prometheus.instance
      });
      
      prometheusService.setGauge('holo_bot_startup_timestamp', Date.now(), {
        instance: config.monitoring.prometheus.instance
      });
    }
    
    return () => {
      stopMetricsCollection();
      prometheusService.stop();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  return {
    recordPerformanceMetrics,
    recordStreamingMetrics,
    recordChatMetrics,
    recordAvatarMetrics,
    recordSystemMetrics,
    recordMCPMetrics,
    getMetricsSummary,
    exportMetrics,
    startMetricsCollection,
    stopMetricsCollection,
    
    // Prometheus service access for advanced usage
    prometheusService,
  };
}
