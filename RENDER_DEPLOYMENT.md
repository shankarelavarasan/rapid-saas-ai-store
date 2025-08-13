# Render.com Deployment Guide

## Quick Deploy to Render

### Option 1: One-Click Deploy

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/shankarelavarasan/rapid-saas-ai-store)

### Option 2: Manual Setup

1. **Fork or Clone the Repository**
   ```bash
   git clone https://github.com/shankarelavarasan/rapid-saas-ai-store.git
   cd rapid-saas-ai-store
   ```

2. **Create a New Web Service on Render**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select `rapid-saas-ai-store`

3. **Configure the Service**
   - **Name**: `rapid-saas-ai-store`
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

4. **Set Environment Variables**
   Add these environment variables in Render dashboard:

   ```env
   NODE_ENV=production
   PORT=3000
   
   # Supabase Configuration
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # AI Services
   OPENAI_API_KEY=your_openai_api_key
   GEMINI_API_KEY=your_gemini_api_key
   
   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   
   # JWT
   JWT_SECRET=your_jwt_secret_key
   
   # Stripe (Optional)
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for the build and deployment to complete
   - Your app will be available at `https://your-service-name.onrender.com`

## Post-Deployment Setup

1. **Update Frontend URLs**
   - Update `FRONTEND_URL` in environment variables to your Render URL
   - Update any hardcoded URLs in the frontend

2. **Configure Supabase**
   - Add your Render URL to Supabase allowed origins
   - Update redirect URLs for authentication

3. **Test the Application**
   - Visit your deployed URL
   - Test user registration/login
   - Test app generation functionality
   - Verify file uploads work

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check build logs in Render dashboard
   - Ensure all dependencies are in `package.json`
   - Verify Node.js version compatibility

2. **Environment Variables**
   - Double-check all required environment variables are set
   - Ensure no trailing spaces in variable values
   - Verify API keys are valid

3. **Database Connection**
   - Verify Supabase URL and keys
   - Check Supabase project is active
   - Ensure database tables are created

4. **File Upload Issues**
   - Verify Cloudinary credentials
   - Check file size limits
   - Ensure proper CORS configuration

### Performance Optimization

1. **Enable Compression**
   - Already configured in `server.js`

2. **Static File Caching**
   - Configured with appropriate cache headers

3. **Database Optimization**
   - Use connection pooling (configured)
   - Implement proper indexing in Supabase

## Monitoring

- Use Render's built-in monitoring
- Set up health checks (already configured)
- Monitor logs for errors
- Set up alerts for downtime

## Scaling

- Render automatically scales based on traffic
- Consider upgrading to paid plans for better performance
- Monitor resource usage in dashboard

## Support

If you encounter issues:
1. Check Render documentation
2. Review application logs
3. Verify environment configuration
4. Contact support if needed

---

**Live Demo**: https://rapid-saas-ai-store.onrender.com
**Repository**: https://github.com/shankarelavarasan/rapid-saas-ai-store