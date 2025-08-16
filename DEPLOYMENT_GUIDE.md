# 🚀 Native Node.js Deployment Guide

This guide covers various deployment options for the Rapid SaaS AI Store without Docker.

## 📋 Prerequisites

- Node.js 18-22 installed
- npm package manager
- Environment variables configured
- Health check endpoint: `/health`

## 🔧 Production Configuration

### Required Environment Variables
```bash
NODE_ENV=production
PORT=3000  # or platform-specific port
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
# ... other API keys
```

### Build Commands
```bash
npm ci
npm run build
```

### Start Commands
```bash
# Development
npm run dev

# Production
npm run start:prod
```

## 🌐 Deployment Options

### 1. Render (Recommended)

**Setup:**
1. New Web Service → Connect GitHub repository
2. **Build Command:** `npm ci && npm run build`
3. **Start Command:** `npm run start:prod`
4. **Health Check:** `/health`
5. **Auto-deploy:** ON

**Environment Variables:**
Set all required variables in Render Dashboard → Environment tab.

### 2. Railway

**Setup:**
1. Connect GitHub repository
2. **Start Command:** `npm run start:prod`
3. **Port:** Auto-detected
4. Set environment variables in Railway dashboard
5. Auto-deploy on git push

### 3. Fly.io (Native)

**Setup:**
```bash
fly launch
# Set internal port: 3000
# No Dockerfile needed for Node.js runtime
fly deploy
```

### 4. AWS Elastic Beanstalk

**Setup:**
1. **Platform:** Node.js 18/20
2. **Build:** `npm ci && npm run build`
3. **Start:** from `npm start`
4. Upload source code (no .ebextensions needed)

### 5. Vercel (API/SSR only)

**Note:** For long-running servers, use Render/Railway instead.

**Setup:**
```json
// vercel.json
{
  "functions": {
    "server.js": {
      "runtime": "nodejs18.x"
    }
  }
}
```

## 🖥️ VPS/VM Deployment

### Option A: PM2 (Recommended)

**Installation:**
```bash
npm install -g pm2
```

**Deployment:**
```bash
# Clone and setup
git clone <repository>
cd app
npm ci
npm run build

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Auto-start on boot
```

**Management:**
```bash
pm2 status
pm2 logs app
pm2 restart app
pm2 reload app  # Zero-downtime restart
pm2 stop app
```

### Option B: systemd (Ubuntu)

**Installation:**
```bash
# Copy service file
sudo cp app.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable app
sudo systemctl start app
```

**Management:**
```bash
sudo systemctl status app
sudo systemctl restart app
sudo journalctl -u app -f  # View logs
```

## 🔄 Reverse Proxy (Nginx)

**Installation:**
```bash
sudo apt update
sudo apt install nginx
```

**Configuration:**
```bash
# Copy nginx config
sudo cp nginx-app.conf /etc/nginx/sites-available/app
sudo ln -s /etc/nginx/sites-available/app /etc/nginx/sites-enabled/app
sudo nginx -t
sudo systemctl reload nginx
```

**SSL with Certbot:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## 🔄 Zero-Downtime Deployment

**Quick Roll Script:**
```bash
#!/bin/bash
git pull origin main
npm ci
npm run build
pm2 reload app  # or: sudo systemctl restart app
echo "✅ Deployment completed!"
```

## 📊 Database & Migrations

**Prisma (if used):**
```bash
npx prisma migrate deploy
npx prisma generate
```

**PostgreSQL/MySQL:**
- Use pooled connections (e.g., pgbouncer)
- Set `DATABASE_URL` environment variable
- Run migrations before app start

## 📁 Static Assets

**Express Configuration:**
```javascript
app.use(express.static('dist'));
app.use(express.static('public'));
```

**Build Output:**
- Add `/dist`, `/build` to `.gitignore`
- Ensure build command runs on deployment
- Use CDN for production assets (optional)

## ⚠️ Common Pitfalls

### ❌ Avoid These:
- Hardcoding PORT to 3000 only
- Binding to localhost instead of 0.0.0.0
- Using privileged ports (<1024)
- Missing environment variables
- Incorrect CORS configuration

### ✅ Best Practices:
- Always use `process.env.PORT`
- Bind to `0.0.0.0` for public access
- Set proper CORS origins
- Use HTTPS in production
- Configure proper logging
- Set up health checks
- Use process managers (PM2/systemd)

## 🔍 Monitoring & Logs

**PM2 Monitoring:**
```bash
pm2 monit
pm2 logs app --lines 100
```

**systemd Logs:**
```bash
journalctl -u app -f
journalctl -u app --since "1 hour ago"
```

**Health Check:**
```bash
curl http://localhost:3000/health
# Should return: {"status":"OK","timestamp":"..."}
```

## 🚀 Quick Start Commands

**Local Development:**
```bash
git clone <repository>
cd app
npm install
cp .env.example .env
# Edit .env with your values
npm run dev
```

**Production Deployment:**
```bash
# VPS/VM
git clone <repository>
cd app
npm ci
npm run build
npm run start:prod

# Or with PM2
pm2 start ecosystem.config.js
```

---

**✅ All deployment options are ready!** Choose the platform that best fits your needs.