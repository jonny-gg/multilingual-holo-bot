# 🤖 Holographic Digital Human Livestreaming System
## Production Deployment Guide with OpenStack Prometheus Integration

### Overview
This system provides a comprehensive holographic digital human livestreaming platform with integrated Prometheus monitoring for OpenStack environments.

### 🏗️ Architecture Components

#### Core Services
- **Holographic Avatar System**: 3D real-time avatar with facial expressions and lip-sync
- **PIAPI MCP Server**: Multi-modal AI generation (text, image, video)
- **Screenpipe MCP**: Real-time motion capture and action recognition
- **Mem0 MCP**: Persistent personality memory and context management
- **Lara MCP**: 12-language lip-sync and voice synthesis

#### Monitoring Stack
- **OpenStack Prometheus**: `prometheus.openstack.svc.oss-as-central-5.com`
- **Metrics Collection**: Real-time performance, streaming, and system health
- **Production Dashboard**: System readiness and health monitoring

### 🚀 Quick Start

#### 1. Environment Setup
```bash
# Clone the repository
git clone <repository-url>
cd multilingual-holo-bot

# Copy environment configuration
cp .env.example .env.production

# Configure production variables
nano .env.production
```

#### 2. Production Environment Variables
```env
# === Production Configuration ===
NODE_ENV=production
DEMO_MODE=false

# === OpenStack Prometheus Integration ===
PROMETHEUS_ENABLED=true
PROMETHEUS_ENDPOINT=prometheus.openstack.svc.oss-as-central-5.com
PROMETHEUS_PUSHGATEWAY_URL=https://prometheus.openstack.svc.oss-as-central-5.com:9091
PROMETHEUS_PROTOCOL=https
PROMETHEUS_PORT=9090
PROMETHEUS_JOB_NAME=holo-bot-livestream
PROMETHEUS_INSTANCE=holo-bot-prod
PROMETHEUS_SCRAPE_INTERVAL=15
PROMETHEUS_TIMEOUT=5000
PROMETHEUS_RETRIES=3

# === Security (REQUIRED) ===
JWT_SECRET=your_secure_jwt_secret_here
SESSION_SECRET=your_secure_session_secret_here

# === AI Service API Keys ===
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# === MCP Server Endpoints (Production) ===
PIAPI_MCP_URL=wss://piapi.yourdomain.com
SCREENPIPE_MCP_URL=wss://screenpipe.yourdomain.com
MEM0_MCP_URL=wss://mem0.yourdomain.com
LARA_MCP_URL=wss://lara.yourdomain.com

# === Streaming Configuration ===
STREAM_QUALITY=1080p
STREAM_BITRATE=4000
STREAM_FPS=30
```

#### 3. Docker Deployment
```bash
# Build and deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f holo-bot-app
```

#### 4. Kubernetes Deployment (Alternative)
```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# Check deployment status
kubectl get pods -n holo-bot
kubectl logs -f deployment/holo-bot-app -n holo-bot
```

### 📊 Prometheus Monitoring Integration

#### Metrics Available
- **Streaming Metrics**: Viewer count, duration, quality, FPS
- **Avatar Metrics**: Lip-sync latency, motion capture performance
- **Chat Metrics**: Message count, response time, language distribution
- **System Metrics**: Memory usage, CPU usage, uptime, errors
- **MCP Service Metrics**: Connection status, request latency, error rates

#### Prometheus Configuration
The system automatically registers with your OpenStack Prometheus instance:
- **Scrape Endpoint**: `http://your-domain/api/metrics`
- **Push Gateway**: `prometheus.openstack.svc.oss-as-central-5.com:9091`
- **Job Name**: `holo-bot-livestream`
- **Scrape Interval**: 15 seconds

#### Sample Prometheus Queries
```promql
# Average streaming FPS
rate(holo_bot_streaming_fps[5m])

# Current viewer count
holo_bot_viewers_current

# Memory usage percentage
(holo_bot_memory_usage_bytes / holo_bot_memory_total_bytes) * 100

# Error rate
rate(holo_bot_errors_total[5m])

# Avatar lip-sync latency
histogram_quantile(0.95, holo_bot_avatar_lip_sync_latency_ms)
```

### 🔧 System Health Monitoring

#### Health Check Endpoints
- **Health**: `GET /api/health`
- **Metrics**: `GET /api/metrics`
- **Ready**: `GET /api/ready`

#### Production Readiness Checklist
- [ ] OpenStack Prometheus connection established
- [ ] All MCP servers deployed and accessible
- [ ] API keys configured for AI services
- [ ] Security secrets updated from development defaults
- [ ] Streaming quality optimized (1080p, 30fps, 4000kbps)
- [ ] SSL/TLS certificates configured
- [ ] Load balancer configured for high availability
- [ ] Backup and disaster recovery plan in place

### 🛠️ Troubleshooting

#### Common Issues

**Prometheus Connection Failed**
```bash
# Check network connectivity
curl -k https://prometheus.openstack.svc.oss-as-central-5.com:9090/api/v1/query?query=up

# Verify pushgateway
curl -k https://prometheus.openstack.svc.oss-as-central-5.com:9091/metrics

# Check application logs
docker logs holo-bot-app
```

**MCP Server Connection Issues**
```bash
# Test WebSocket connections
wscat -c wss://piapi.yourdomain.com
wscat -c wss://screenpipe.yourdomain.com
wscat -c wss://mem0.yourdomain.com
wscat -c wss://lara.yourdomain.com

# Check service discovery
nslookup piapi.yourdomain.com
```

**Performance Issues**
```bash
# Monitor resource usage
docker stats holo-bot-app

# Check system metrics
curl http://localhost:3000/api/health

# View performance dashboard
# Navigate to System tab in application
```

### 📈 Scaling and Performance

#### Horizontal Scaling
```yaml
# Kubernetes HPA example
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: holo-bot-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: holo-bot-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

#### Load Balancing
```nginx
# nginx.conf example
upstream holo_bot_backend {
    least_conn;
    server holo-bot-app-1:3000 max_fails=3 fail_timeout=30s;
    server holo-bot-app-2:3000 max_fails=3 fail_timeout=30s;
    server holo-bot-app-3:3000 max_fails=3 fail_timeout=30s;
}

server {
    listen 443 ssl http2;
    server_name holo-bot.yourdomain.com;
    
    location / {
        proxy_pass http://holo_bot_backend;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $http_host;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 🔐 Security Best Practices

#### SSL/TLS Configuration
- Use Let's Encrypt for automatic certificate management
- Configure HSTS headers
- Implement proper CORS policies
- Use secure JWT secrets (256-bit minimum)

#### Network Security
- Implement firewall rules for service communication
- Use VPN for MCP server communication
- Configure proper ingress rules
- Enable DDoS protection

#### Monitoring Security
- Secure Prometheus endpoints with authentication
- Use encrypted communication with push gateway
- Implement proper access controls for metrics data
- Regular security audits and updates

### 📞 Support and Maintenance

#### Monitoring Dashboards
- **System Dashboard**: Built-in production readiness monitoring
- **Prometheus Metrics**: Integration with existing OpenStack monitoring
- **Application Logs**: Centralized logging for debugging

#### Maintenance Schedule
- **Daily**: Automated health checks and alerts
- **Weekly**: Performance optimization and resource analysis  
- **Monthly**: Security updates and dependency upgrades
- **Quarterly**: Full system audit and capacity planning

For technical support and advanced configuration, refer to the system documentation or contact the development team.
