import { NextRequest, NextResponse } from 'next/server';
import { prometheusService } from '@/services/prometheus';

export async function GET() {
  try {
    // Export metrics in Prometheus format
    const metricsOutput = prometheusService.exportMetrics();
    
    return new NextResponse(metricsOutput, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error exporting metrics:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Allow external systems to push custom metrics
    const body = await request.json();
    
    if (body.metrics && Array.isArray(body.metrics)) {
      for (const metric of body.metrics) {
        if (metric.type === 'gauge') {
          prometheusService.setGauge(metric.name, metric.value, metric.labels, metric.help);
        } else if (metric.type === 'counter') {
          prometheusService.incrementCounter(metric.name, metric.value, metric.labels, metric.help);
        }
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error pushing metrics:', error);
    return NextResponse.json({ error: 'Invalid metrics format' }, { status: 400 });
  }
}
