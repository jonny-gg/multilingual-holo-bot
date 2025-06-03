import React, { useState, useEffect } from 'react';
import { usePrometheusMetrics } from '@/hooks/usePrometheusMetrics';
import { config } from '@/lib/config';
import { prometheusService } from '@/services/prometheus';
import { Activity, Database, TrendingUp, AlertTriangle, CheckCircle, Globe } from 'lucide-react';

interface MetricDisplay {
  name: string;
  value: number;
  unit: string;
  trend?: 'up' | 'down' | 'stable';
  status?: 'good' | 'warning' | 'error';
}

interface ConnectionInfo {
  status: 'connected' | 'disconnected' | 'connecting';
  endpoint: string;
  protocol: string;
  jobName: string;
  instance: string;
}

export default function PrometheusMonitor() {
  const { getMetricsSummary, exportMetrics } = usePrometheusMetrics();
  const [metrics, setMetrics] = useState<MetricDisplay[]>([]);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo>({
    status: 'disconnected',
    endpoint: '',
    protocol: 'https',
    jobName: '',
    instance: ''
  });
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Update connection info
  useEffect(() => {
    const updateConnectionInfo = () => {
      const status = prometheusService.getConnectionStatus();
      const promConfig = prometheusService.getConfig();
      
      setConnectionInfo({
        status: status as 'connected' | 'disconnected' | 'connecting',
        endpoint: promConfig.endpoint,
        protocol: promConfig.protocol,
        jobName: promConfig.jobName,
        instance: promConfig.instance
      });
    };

    updateConnectionInfo();
    const interval = setInterval(updateConnectionInfo, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update metrics display
  useEffect(() => {
    const updateMetrics = () => {
      const rawMetrics = getMetricsSummary();
      const displayMetrics: MetricDisplay[] = [];

      // Process Prometheus metrics into display format
      rawMetrics.forEach(metric => {
        let status: MetricDisplay['status'] = 'good';
        let unit = '';

        // Determine status and units based on metric name
        if (metric.name.includes('fps')) {
          unit = 'fps';
          status = metric.value >= 55 ? 'good' : metric.value >= 30 ? 'warning' : 'error';
        } else if (metric.name.includes('latency')) {
          unit = 'ms';
          status = metric.value <= 50 ? 'good' : metric.value <= 100 ? 'warning' : 'error';
        } else if (metric.name.includes('viewers')) {
          unit = '';
        } else if (metric.name.includes('memory')) {
          unit = 'MB';
          const valueMB = Math.round(metric.value / (1024 * 1024));
          displayMetrics.push({
            name: 'Memory Usage',
            value: valueMB,
            unit,
            status: valueMB > 500 ? 'warning' : 'good'
          });
          return;
        } else if (metric.name.includes('errors')) {
          unit = '';
          status = metric.value > 0 ? 'error' : 'good';
        } else if (metric.name.includes('health') || metric.name.includes('active')) {
          unit = '';
          status = metric.value === 1 ? 'good' : 'error';
        }

        displayMetrics.push({
          name: metric.name.replace(/holo_bot_|_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value: metric.value,
          unit,
          status
        });
      });

      setMetrics(displayMetrics);
      setLastUpdate(new Date());
    };

    // Update immediately and then every 5 seconds
    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, [getMetricsSummary]);

  const getStatusIcon = (status: MetricDisplay['status']) => {
    switch (status) {
      case 'good': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getConnectionStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-400 border-green-400';
      case 'connecting': return 'text-yellow-400 border-yellow-400';
      case 'disconnected': return 'text-red-400 border-red-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  const getStatusColor = (status: MetricDisplay['status']) => {
    switch (status) {
      case 'good': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Database className="w-5 h-5" />
          Prometheus Monitoring
        </h3>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            connectionInfo.status === 'connected' ? 'bg-green-400' : 
            connectionInfo.status === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'
          }`} />
          <span className={getConnectionStatusColor(connectionInfo.status).split(' ')[0]}>
            {connectionInfo.status.charAt(0).toUpperCase() + connectionInfo.status.slice(1)}
          </span>
        </div>
      </div>

      {/* OpenStack Prometheus Connection Status */}
      <div className="bg-black/30 rounded-lg p-3 border border-gray-600">
        <div className="flex items-center gap-2 mb-2">
          <Globe className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-white">OpenStack Prometheus</span>
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">Endpoint:</span>
            <span className="text-blue-400 font-mono">{connectionInfo.endpoint}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Protocol:</span>
            <span className="text-green-400">{connectionInfo.protocol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Status:</span>
            <span className={getConnectionStatusColor(connectionInfo.status).split(' ')[0]}>
              {connectionInfo.status}
            </span>
          </div>
        </div>
      </div>

      {/* Configuration Status */}
      <div className="bg-black/30 rounded-lg p-3">
        <div className="text-xs text-gray-400 mb-2">Configuration</div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Job Name:</span>
            <span className="text-green-400">{connectionInfo.jobName}</span>
          </div>
          <div className="flex justify-between">
            <span>Instance:</span>
            <span className="text-yellow-400">{connectionInfo.instance}</span>
          </div>
          <div className="flex justify-between">
            <span>Enabled:</span>
            <span className={config.monitoring.prometheus.enabled ? 'text-green-400' : 'text-red-400'}>
              {config.monitoring.prometheus.enabled ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      {config.monitoring.prometheus.enabled ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-black/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">{metric.name}</span>
                {getStatusIcon(metric.status)}
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-lg font-bold ${getStatusColor(metric.status)}`}>
                  {typeof metric.value === 'number' ? metric.value.toFixed(2) : metric.value}
                </span>
                {metric.unit && (
                  <span className="text-xs text-gray-400">{metric.unit}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-black/30 rounded-lg p-4 text-center">
          <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
          <p className="text-yellow-400 text-sm">Prometheus monitoring is disabled</p>
          <p className="text-gray-400 text-xs mt-1">
            Enable in environment variables: PROMETHEUS_ENABLED=true
          </p>
        </div>
      )}

      {/* Last Update */}
      {lastUpdate && (
        <div className="text-xs text-gray-400 text-center">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      )}

      {/* Export Metrics Button */}
      {config.monitoring.prometheus.enabled && (
        <div className="pt-2">
          <button
            onClick={() => {
              const metricsText = exportMetrics();
              const blob = new Blob([metricsText], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `holo-bot-metrics-${Date.now()}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Export Metrics
          </button>
        </div>
      )}
    </div>
  );
}
