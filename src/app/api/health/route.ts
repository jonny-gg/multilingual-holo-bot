import { NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { prometheusService } from '@/services/prometheus';

export async function GET() {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        rss: process.memoryUsage().rss
      },
      services: {
        prometheus: {
          enabled: config.monitoring.prometheus.enabled,
          status: prometheusService.getConnectionStatus(),
          endpoint: config.monitoring.prometheus.endpoint
        },
        mcpServers: {
          piapi: config.mcpServers.piapi,
          screenpipe: config.mcpServers.screenpipe,
          mem0: config.mcpServers.mem0,
          lara: config.mcpServers.lara
        }
      },
      configuration: {
        demoMode: config.demoMode,
        streaming: {
          quality: config.streaming.quality,
          bitrate: config.streaming.bitrate,
          fps: config.streaming.fps
        }
      }
    };

    // Check critical services
    const criticalChecks = [
      // Memory usage check
      process.memoryUsage().heapUsed / process.memoryUsage().heapTotal < 0.9,
      // Uptime check (should be running for at least 10 seconds)
      process.uptime() > 10
    ];

    const allHealthy = criticalChecks.every(check => check);

    return NextResponse.json(
      healthStatus,
      {
        status: allHealthy ? 200 : 503,
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        uptime: process.uptime()
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

// Support HEAD requests for simple health checks
export async function HEAD() {
  try {
    const isHealthy = process.uptime() > 10 && 
                     process.memoryUsage().heapUsed / process.memoryUsage().heapTotal < 0.9;
    
    return new NextResponse(null, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
