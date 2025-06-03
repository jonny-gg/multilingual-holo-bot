// Environment configuration and validation
export const config = {
  // MCP Server URLs
  mcpServers: {
    piapi: process.env.PIAPI_MCP_URL || 'ws://localhost:8001',
    screenpipe: process.env.SCREENPIPE_MCP_URL || 'ws://localhost:8002',
    mem0: process.env.MEM0_MCP_URL || 'ws://localhost:8003',
    lara: process.env.LARA_MCP_URL || 'ws://localhost:8004',
  },

  // Demo mode for development
  demoMode: process.env.DEMO_MODE === 'true' || process.env.NODE_ENV === 'development',

  // API Keys
  apiKeys: {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    elevenlabs: process.env.ELEVENLABS_API_KEY,
  },

  // Streaming settings
  streaming: {
    quality: process.env.STREAM_QUALITY || '1080p',
    bitrate: parseInt(process.env.STREAM_BITRATE || '4000'),
    fps: parseInt(process.env.STREAM_FPS || '30'),
  },

  // Avatar defaults
  avatar: {
    model: process.env.DEFAULT_AVATAR_MODEL || 'basic_human',
    language: process.env.DEFAULT_LANGUAGE || 'en-US',
    voice: process.env.DEFAULT_VOICE || 'neutral_female',
  },

  // Security
  security: {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
    sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret',
  },

  // Development flags
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // Monitoring and observability
  monitoring: {
    prometheus: {
      enabled: process.env.PROMETHEUS_ENABLED === 'true' || false, // Disabled by default in dev
      endpoint: process.env.PROMETHEUS_ENDPOINT || (process.env.NODE_ENV === 'production' 
        ? 'prometheus.openstack.svc.oss-as-central-5.com' 
        : 'localhost'),
      pushgateway: process.env.PROMETHEUS_PUSHGATEWAY_URL || (process.env.NODE_ENV === 'production'
        ? 'prometheus.openstack.svc.oss-as-central-5.com:9091'
        : 'localhost:9091'),
      protocol: process.env.PROMETHEUS_PROTOCOL || (process.env.NODE_ENV === 'production' ? 'https' : 'http'),
      port: parseInt(process.env.PROMETHEUS_PORT || '9090'),
      jobName: process.env.PROMETHEUS_JOB_NAME || 'holo-bot-livestream',
      instance: process.env.PROMETHEUS_INSTANCE || `holo-bot-${process.env.NODE_ENV || 'dev'}`,
      scrapeInterval: parseInt(process.env.PROMETHEUS_SCRAPE_INTERVAL || '15'),
      timeout: parseInt(process.env.PROMETHEUS_TIMEOUT || '5000'),
      retries: parseInt(process.env.PROMETHEUS_RETRIES || '3'),
    },
    metrics: {
      enabled: process.env.METRICS_ENABLED === 'true' || true,
      endpoint: process.env.METRICS_ENDPOINT || '/api/metrics',
      retention: parseInt(process.env.METRICS_RETENTION_HOURS || '24'),
      batchSize: parseInt(process.env.METRICS_BATCH_SIZE || '100'),
      flushInterval: parseInt(process.env.METRICS_FLUSH_INTERVAL || '10000'),
    },
  },

} as const;

// Validation helper
export function validateConfig() {
  const errors: string[] = [];

  if (config.isProduction) {
    if (!config.apiKeys.openai) errors.push('OPENAI_API_KEY is required in production');
    if (config.security.jwtSecret === 'dev-secret-key') {
      errors.push('JWT_SECRET must be set in production');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }

  return true;
}

// Helper to get MCP server URL with fallback
export function getMCPServerUrl(service: keyof typeof config.mcpServers): string {
  return config.mcpServers[service];
}

// Helper to check if we should use mock data
export function shouldUseMockData(): boolean {
  return config.demoMode || config.isDevelopment;
}
