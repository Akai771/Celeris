# Celeris WebRTC Signaling Server

Production-ready WebSocket signaling server for Celeris P2P file transfer application.

## Features

- ✅ **Production Ready** - Supports HTTP, HTTPS/WSS, and reverse proxy mode
- 🚀 **App Platform Optimized** - Ready for DigitalOcean App Platform deployment
- 🔒 **Secure** - SSL/TLS support with Let's Encrypt or automatic via App Platform
- 🌍 **CORS Protected** - Configurable allowed origins
- 📊 **Health Checks** - Built-in `/health` endpoint for monitoring
- 🔄 **Auto-restart** - Works with PM2 and App Platform
- 📝 **Detailed Logging** - Debug mode and connection tracking
- ⚡ **Rate Limiting** - Per-IP connection limits to prevent abuse

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start server in development mode
npm run dev
```

Server runs on `ws://localhost:8080`

### Production - DigitalOcean App Platform (Recommended)

See **[DEPLOYMENT-APP-PLATFORM.md](./DEPLOYMENT-APP-PLATFORM.md)** for step-by-step guide.

**Why App Platform?**
- 5 minutes setup
- $5/month (cheaper than Droplet)
- Automatic SSL/HTTPS
- Zero-downtime deployments
- Auto-scaling and monitoring

### Production - DigitalOcean Droplet

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for Droplet deployment with Nginx or direct HTTPS.

## Deployment Options Comparison

| Method | Cost | Setup Time | SSL | Best For |
|--------|------|------------|-----|----------|
| **App Platform** | $5/mo | 5 min | Auto ✅ | Most users |
| Droplet + Nginx | $6/mo | 30 min | Manual | Advanced users |
| Droplet Direct | $6/mo | 45 min | Manual | Full control |

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | No |
| `PORT` | Server port | `8080` | No |
| `DEBUG` | Enable debug logging | `true` in dev | No |
| `ALLOWED_ORIGINS` | Comma-separated allowed origins | localhost | Yes (prod) |
| `SSL_CERT_PATH` | Path to SSL certificate | - | Yes (prod) |
| `SSL_KEY_PATH` | Path to SSL private key | - | Yes (prod) |
| `MAX_CONNECTIONS_PER_IP` | Rate limit per IP | `10` | No |

## API Endpoints

### WebSocket
- **URL**: `ws://localhost:8080` (dev) or `wss://your-domain.com` (prod)
- **Protocol**: WebSocket

### HTTP Endpoints

#### Health Check
```
GET /health
```

Response:
```json
{
  "status": "ok",
  "uptime": 12345,
  "connections": 5,
  "environment": "production"
}
```

#### Root
```
GET /
```

Response:
```
WebRTC Signaling Server is running
```

## WebSocket Message Types

### Client → Server

**Register (Create Connection)**
```json
{
  "type": "register",
  "connectionId": "abc123"
}
```

**Join (Join Existing Connection)**
```json
{
  "type": "join",
  "connectionId": "abc123"
}
```

**Offer**
```json
{
  "type": "offer",
  "connectionId": "abc123",
  "offer": { "sdp": "...", "type": "offer" }
}
```

**Answer**
```json
{
  "type": "answer",
  "connectionId": "abc123",
  "answer": { "sdp": "...", "type": "answer" }
}
```

**ICE Candidate**
```json
{
  "type": "candidate",
  "connectionId": "abc123",
  "candidate": { "candidate": "...", "sdpMid": "...", "sdpMLineIndex": 0 }
}
```

### Server → Client

**Welcome**
```json
{
  "type": "welcome",
  "message": "Connected to signaling server",
  "clientId": "xyz789"
}
```

**Registered**
```json
{
  "type": "registered",
  "connectionId": "abc123"
}
```

**Joined**
```json
{
  "type": "joined",
  "connectionId": "abc123"
}
```

**Peer Joined**
```json
{
  "type": "peer-joined",
  "connectionId": "abc123"
}
```

**Peer Disconnected**
```json
{
  "type": "peer-disconnected",
  "connectionId": "abc123"
}
```

**Error**
```json
{
  "type": "error",
  "message": "Error description"
}
```

## Security Features

### Rate Limiting
- Limits connections per IP address
- Configurable via `MAX_CONNECTIONS_PER_IP`
- Prevents DoS attacks

### CORS Protection
- Validates origin headers
- Only allows configured domains in production
- Rejects unauthorized origins with 403

### SSL/TLS
- Supports HTTPS and WSS in production
- Integrates with Let's Encrypt certificates
- Automatic certificate loading

## Monitoring

### PM2 Commands
```bash
# View logs
pm2 logs celeris-signaling

# Monitor resource usage
pm2 monit

# Restart server
pm2 restart celeris-signaling

# View status
pm2 status
```

### Health Check
```bash
# From server
curl http://localhost:8080/health

# From external
curl https://signaling.yourdomain.com/health
```

## Troubleshooting

### Server won't start
1. Check if port is already in use: `lsof -i :8080`
2. Verify SSL certificate paths (production)
3. Check logs: `pm2 logs celeris-signaling`

### Connections are rejected
1. Verify `ALLOWED_ORIGINS` includes your frontend domain
2. Check CORS settings in browser console
3. Ensure firewall allows WebSocket traffic

### SSL errors
1. Verify certificate files exist and are readable
2. Check certificate hasn't expired: `openssl x509 -in cert.pem -noout -dates`
3. Ensure PM2 has permission to read certificate files

## Performance Tips

1. **Use Nginx reverse proxy** - Handle SSL/TLS at Nginx level
2. **Monitor connections** - Track active connections via health endpoint
3. **Adjust rate limits** - Based on your user base
4. **Use PM2 cluster mode** - For higher traffic (advanced)
5. **Enable compression** - For signaling messages (if needed)

## License

ISC

## Support

For issues and questions, please check [DEPLOYMENT.md](./DEPLOYMENT.md) or create an issue in the repository.
