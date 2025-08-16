# Render Deployment Setup Guide

## Critical Environment Variables Required

The following environment variables MUST be set in the Render Dashboard for the deployment to work:

### Required Variables:
1. **NODE_ENV** = `production`
2. **PORT** = (Auto-assigned by Render)
3. **SUPABASE_URL** = Your Supabase project URL
4. **SUPABASE_ANON_KEY** = Your Supabase anonymous key
5. **SUPABASE_SERVICE_ROLE_KEY** = Your Supabase service role key
6. **OPENAI_API_KEY** = Your OpenAI API key
7. **GEMINI_API_KEY** = Your Google Gemini API key
8. **CLOUDINARY_CLOUD_NAME** = Your Cloudinary cloud name
9. **CLOUDINARY_API_KEY** = Your Cloudinary API key
10. **CLOUDINARY_API_SECRET** = Your Cloudinary API secret
11. **JWT_SECRET** = A secure random string for JWT signing
12. **STRIPE_SECRET_KEY** = Your Stripe secret key
13. **STRIPE_PUBLISHABLE_KEY** = Your Stripe publishable key

## Steps to Configure Environment Variables:

1. Go to your Render Dashboard
2. Select your `rapid-saas-ai-store` service
3. Go to the "Environment" tab
4. Add each environment variable listed above
5. Save the changes
6. Trigger a manual redeploy

## Common Issues and Solutions:

### 1. Sharp Library Issues
- Fixed by reinstalling Sharp with platform-specific configuration
- Should work correctly on Render's Linux environment

### 2. Health Check Failures
- Health check path updated to `/health`
- Ensure the service starts properly with all environment variables

### 3. Build Process
- Uses native Node.js buildpack (no Docker)
- Build command: `npm install && npm run build`
- Start command: `npm start`

## Testing Locally:

1. Ensure all environment variables are set in a `.env` file
2. Run `npm install`
3. Run `npm start`
4. Test health check: `curl http://localhost:3000/health`

## Deployment Monitoring:

Use the deployment monitor script:
```bash
node scripts/deployment-monitor.js monitor
```

## If Deployment Still Fails:

1. Check Render build logs for specific errors
2. Verify all environment variables are correctly set
3. Ensure no syntax errors in the code
4. Check for missing dependencies
5. Consider creating a minimal version without optional features