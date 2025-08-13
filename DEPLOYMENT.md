# 🚀 Deployment Guide

This guide covers deploying the Rapid SaaS AI Store to various platforms including Render.com and GitHub Pages.

## 📋 Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database (Supabase) set up and accessible
- [ ] API keys obtained (OpenAI, Gemini, Cloudinary, Stripe)
- [ ] Domain name configured (if using custom domain)
- [ ] SSL certificates ready (handled automatically by most platforms)

## 🌐 Deploy to Render.com

### Method 1: One-Click Deploy

1. **Fork this repository** to your GitHub account
2. **Click the Deploy to Render button** in the README
3. **Connect your GitHub account** to Render
4. **Select your forked repository**
5. **Configure environment variables** (see below)
6. **Deploy!**

### Method 2: Manual Setup

1. **Create a Render account** at [render.com](https://render.com)

2. **Create a new Web Service**
   - Connect your GitHub repository
   - Choose the branch (usually `main`)
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: `Node`

3. **Configure Environment Variables**
   ```
   NODE_ENV=production
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   OPENAI_API_KEY=sk-your_openai_key
   GEMINI_API_KEY=your_gemini_key
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   JWT_SECRET=your_jwt_secret_min_32_chars
   STRIPE_SECRET_KEY=sk_live_your_stripe_key
   STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
   ```

4. **Deploy**
   - Render will automatically build and deploy your app
   - Your app will be available at `https://your-app-name.onrender.com`

### Render Configuration Files

The project includes a `render.yaml` file that automatically configures:
- Build and start commands
- Environment variables
- Health checks
- Auto-deploy from main branch

## 📄 Deploy to GitHub Pages (Static Frontend Only)

**Note**: GitHub Pages only supports static files. For the full application, use Render or another Node.js hosting platform.

### For Static Frontend Demo:

1. **Enable GitHub Pages**
   - Go to your repository settings
   - Scroll to "Pages" section
   - Select source: "Deploy from a branch"
   - Choose branch: `main`
   - Folder: `/ (root)` or `/public`

2. **Configure for Static Hosting**
   - Create a `.nojekyll` file in the root
   - Ensure `index.html` is in the root or public folder
   - Update API endpoints to point to your backend (Render URL)

3. **Update Frontend Configuration**
   ```javascript
   // In your frontend JS files, update API base URL
   const API_BASE_URL = 'https://your-app-name.onrender.com/api';
   ```

## 🐳 Deploy with Docker

### Local Docker Build

```bash
# Build the image
docker build -t rapid-saas-ai-store .

# Run the container
docker run -p 3000:3000 --env-file .env rapid-saas-ai-store
```

### Deploy to Docker Hub

```bash
# Tag the image
docker tag rapid-saas-ai-store yourusername/rapid-saas-ai-store:latest

# Push to Docker Hub
docker push yourusername/rapid-saas-ai-store:latest
```

### Deploy to Cloud Platforms with Docker

- **Railway**: Connect GitHub repo, Railway auto-detects Dockerfile
- **DigitalOcean App Platform**: Use Docker deployment option
- **AWS ECS/Fargate**: Use the Docker image
- **Google Cloud Run**: Deploy from Docker image
- **Azure Container Instances**: Use Docker deployment

## ⚙️ Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|----------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3000` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIs...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJhbGciOiJIUzI1NiIs...` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `JWT_SECRET` | JWT signing secret | `your-secret-min-32-chars` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | - |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | - |
| `STRIPE_SECRET_KEY` | Stripe secret key | - |
| `DEMO_MODE` | Enable demo mode | `false` |

## 🔧 Post-Deployment Setup

### 1. Database Setup

- Ensure Supabase tables are created
- Run any necessary migrations
- Set up Row Level Security (RLS) policies

### 2. Domain Configuration

- Configure custom domain in Render dashboard
- Update CORS settings in server.js
- Update frontend API URLs

### 3. SSL Certificate

- Render automatically provides SSL certificates
- For custom domains, ensure DNS is properly configured

### 4. Monitoring Setup

- Enable Render's built-in monitoring
- Set up health check endpoints
- Configure error tracking (optional)

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are listed in package.json
   - Check for missing environment variables

2. **Runtime Errors**
   - Check Render logs for detailed error messages
   - Verify database connectivity
   - Ensure all API keys are valid

3. **CORS Issues**
   - Update CORS configuration in server.js
   - Add your domain to allowed origins

4. **Database Connection Issues**
   - Verify Supabase URL and keys
   - Check network connectivity
   - Ensure database is not paused (free tier)

### Debugging Commands

```bash
# Check logs in Render
# Go to your service dashboard and click "Logs"

# Local debugging
npm run dev

# Test health endpoint
curl https://your-app.onrender.com/health
```

## 📊 Performance Optimization

### For Production

1. **Enable Compression**
   - Already configured in server.js

2. **Optimize Images**
   - Use Cloudinary transformations
   - Implement lazy loading

3. **Caching**
   - Configure Redis for session storage (optional)
   - Use CDN for static assets

4. **Database Optimization**
   - Add database indexes
   - Optimize queries
   - Use connection pooling

## 🔄 Continuous Deployment

The project includes GitHub Actions workflow (`.github/workflows/deploy.yml`) that:

- Runs tests on pull requests
- Performs security audits
- Automatically deploys to Render on main branch pushes
- Builds and pushes Docker images

### Setup GitHub Actions

1. Add secrets to your GitHub repository:
   - `RENDER_SERVICE_ID`
   - `RENDER_API_KEY`
   - `DOCKERHUB_USERNAME`
   - `DOCKERHUB_TOKEN`

2. Push to main branch to trigger deployment

## 📞 Support

If you encounter issues during deployment:

1. Check the [troubleshooting section](#-troubleshooting)
2. Review Render logs for error details
3. Open an issue on GitHub
4. Contact support at support@rapidtech.com

---

**Happy Deploying! 🚀**