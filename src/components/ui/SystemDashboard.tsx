import React, { useState, useEffect } from 'react';
import { config } from '@/lib/config';
import { prometheusService } from '@/services/prometheus';
import { 
  Server, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Database,
  Zap,
  Users,
  Clock
} from 'lucide-react';

interface SystemHealthCheck {
  name: string;
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  message: string;
  details?: string;
}

interface DeploymentReadiness {
  score: number;
  maxScore: number;
  checks: SystemHealthCheck[];
  recommendations: string[];
}

export default function SystemDashboard() {
  const [healthChecks, setHealthChecks] = useState<SystemHealthCheck[]>([]);
  const [readiness, setReadiness] = useState<DeploymentReadiness>({
    score: 0,
    maxScore: 0,
    checks: [],
    recommendations: []
  });
  const [systemMetrics, setSystemMetrics] = useState({
    uptime: 0,
    memoryUsage: 0,
    activeConnections: 0,
    totalRequests: 0
  });

  useEffect(() => {
    const performHealthChecks = async () => {
      const checks: SystemHealthCheck[] = [];
      let score = 0;
      const maxScore = 10;
      const recommendations: string[] = [];

      // 1. Prometheus Connection
      const prometheusStatus = prometheusService.getConnectionStatus();
      if (prometheusStatus === 'connected') {
        checks.push({
          name: 'Prometheus Monitoring',
          status: 'healthy',
          message: 'Connected to OpenStack Prometheus',
          details: `${config.monitoring.prometheus.endpoint}`
        });
        score += 2;
      } else {
        checks.push({
          name: 'Prometheus Monitoring',
          status: 'warning',
          message: 'Prometheus connection issue',
          details: `Status: ${prometheusStatus}`
        });
        recommendations.push('Verify OpenStack Prometheus endpoint accessibility');
      }

      // 2. Environment Configuration
      const hasApiKeys = config.apiKeys.openai || config.apiKeys.anthropic || config.apiKeys.elevenlabs;
      if (hasApiKeys) {
        checks.push({
          name: 'API Configuration',
          status: 'healthy',
          message: 'API keys configured',
          details: 'Ready for AI services'
        });
        score += 1;
      } else {
        checks.push({
          name: 'API Configuration',
          status: 'warning',
          message: 'No API keys configured',
          details: 'Running in demo mode'
        });
        recommendations.push('Configure OpenAI, Anthropic, or ElevenLabs API keys for production');
      }

      // 3. MCP Server Readiness
      const mcpServersReady = Object.values(config.mcpServers).some(url => 
        !url.includes('localhost')
      );
      if (mcpServersReady) {
        checks.push({
          name: 'MCP Servers',
          status: 'healthy',
          message: 'Production MCP endpoints configured',
          details: 'PIAPI, Screenpipe, Mem0, Lara ready'
        });
        score += 2;
      } else {
        checks.push({
          name: 'MCP Servers',
          status: 'warning',
          message: 'Using localhost endpoints',
          details: 'Deploy MCP servers for production'
        });
        recommendations.push('Deploy MCP servers to production endpoints');
      }

      // 4. Security Configuration
      const hasSecureSecrets = config.security.jwtSecret !== 'dev-secret-key' && 
                              config.security.sessionSecret !== 'dev-session-secret';
      if (hasSecureSecrets && config.isProduction) {
        checks.push({
          name: 'Security',
          status: 'healthy',
          message: 'Production security configured',
          details: 'JWT and session secrets set'
        });
        score += 2;
      } else {
        checks.push({
          name: 'Security',
          status: config.isDevelopment ? 'warning' : 'error',
          message: 'Development security settings',
          details: 'Update secrets for production'
        });
        if (config.isProduction) {
          recommendations.push('Set secure JWT_SECRET and SESSION_SECRET for production');
        }
      }

      // 5. Streaming Configuration
      const streamingOptimal = config.streaming.quality === '1080p' && 
                              config.streaming.bitrate >= 4000 &&
                              config.streaming.fps >= 30;
      if (streamingOptimal) {
        checks.push({
          name: 'Streaming Quality',
          status: 'healthy',
          message: 'Optimal streaming configuration',
          details: `${config.streaming.quality} @ ${config.streaming.fps}fps`
        });
        score += 1;
      } else {
        checks.push({
          name: 'Streaming Quality',
          status: 'warning',
          message: 'Streaming settings suboptimal',
          details: 'Consider upgrading quality settings'
        });
        recommendations.push('Optimize streaming settings for better quality');
      }

      // 6. Avatar and Language Support
      const multiLanguageReady = config.avatar.language && config.avatar.voice;
      if (multiLanguageReady) {
        checks.push({
          name: 'Multilingual Support',
          status: 'healthy',
          message: 'Avatar language configuration ready',
          details: `Default: ${config.avatar.language}`
        });
        score += 1;
      } else {
        checks.push({
          name: 'Multilingual Support',
          status: 'warning',
          message: 'Avatar language settings incomplete',
          details: 'Configure default language and voice'
        });
        recommendations.push('Configure default avatar language and voice settings');
      }

      // 7. Demo Mode Status
      if (!config.demoMode && config.isProduction) {
        checks.push({
          name: 'Production Mode',
          status: 'healthy',
          message: 'Running in production mode',
          details: 'Demo mode disabled'
        });
        score += 1;
      } else {
        checks.push({
          name: 'Production Mode',
          status: config.isDevelopment ? 'warning' : 'error',
          message: 'Demo mode active',
          details: 'Disable for production deployment'
        });
        if (config.isProduction) {
          recommendations.push('Disable DEMO_MODE for production deployment');
        }
      }

      setHealthChecks(checks);
      setReadiness({
        score,
        maxScore,
        checks,
        recommendations
      });
    };

    // Update system metrics
    const updateSystemMetrics = () => {
      const metrics = prometheusService.getAllMetrics();
      const memoryMetric = metrics.find(m => m.name.includes('memory'));
      const uptimeMetric = metrics.find(m => m.name.includes('uptime'));
      
      setSystemMetrics({
        uptime: uptimeMetric?.value || 0,
        memoryUsage: memoryMetric?.value || 0,
        activeConnections: Math.floor(Math.random() * 100), // Mock data
        totalRequests: Math.floor(Math.random() * 1000) // Mock data
      });
    };

    performHealthChecks();
    updateSystemMetrics();

    const interval = setInterval(() => {
      performHealthChecks();
      updateSystemMetrics();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: SystemHealthCheck['status']) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-400" />;
      default: return <Activity className="w-5 h-5 text-gray-400" />;
    }
  };

  const getReadinessColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          Holographic Digital Human System
        </h1>
        <p className="text-gray-400">
          Production Readiness Dashboard
        </p>
      </div>

      {/* Overall Health Score */}
      <div className="bg-gradient-to-r from-black/40 to-black/20 rounded-xl p-6 border border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Server className="w-6 h-6" />
            Deployment Readiness
          </h2>
          <div className={`text-3xl font-bold ${getReadinessColor(readiness.score, readiness.maxScore)}`}>
            {readiness.score}/{readiness.maxScore}
          </div>
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              (readiness.score / readiness.maxScore) >= 0.8 ? 'bg-green-400' :
              (readiness.score / readiness.maxScore) >= 0.6 ? 'bg-yellow-400' : 'bg-red-400'
            }`}
            style={{ width: `${(readiness.score / readiness.maxScore) * 100}%` }}
          />
        </div>
        
        <div className="text-sm text-gray-400">
          {Math.round((readiness.score / readiness.maxScore) * 100)}% ready for production deployment
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-black/30 rounded-lg p-4 border border-gray-600">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-400">Uptime</span>
          </div>
          <div className="text-xl font-bold text-white">
            {formatUptime(systemMetrics.uptime)}
          </div>
        </div>
        
        <div className="bg-black/30 rounded-lg p-4 border border-gray-600">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-400">Memory</span>
          </div>
          <div className="text-xl font-bold text-white">
            {formatBytes(systemMetrics.memoryUsage)}
          </div>
        </div>
        
        <div className="bg-black/30 rounded-lg p-4 border border-gray-600">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-gray-400">Connections</span>
          </div>
          <div className="text-xl font-bold text-white">
            {systemMetrics.activeConnections}
          </div>
        </div>
        
        <div className="bg-black/30 rounded-lg p-4 border border-gray-600">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-gray-400">Requests</span>
          </div>
          <div className="text-xl font-bold text-white">
            {systemMetrics.totalRequests.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Health Checks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-black/30 rounded-xl p-6 border border-gray-600">
          <h3 className="text-lg font-semibold text-white mb-4">System Health Checks</h3>
          <div className="space-y-3">
            {healthChecks.map((check, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-black/20 rounded-lg">
                {getStatusIcon(check.status)}
                <div className="flex-1">
                  <div className="font-medium text-white">{check.name}</div>
                  <div className="text-sm text-gray-400">{check.message}</div>
                  {check.details && (
                    <div className="text-xs text-gray-500 mt-1">{check.details}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-black/30 rounded-xl p-6 border border-gray-600">
          <h3 className="text-lg font-semibold text-white mb-4">Recommendations</h3>
          {readiness.recommendations.length > 0 ? (
            <div className="space-y-3">
              {readiness.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-black/20 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-300">{rec}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-green-400">
              <div className="text-center">
                <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                <div className="text-sm">All systems ready for production!</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
