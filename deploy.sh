#!/bin/bash

# Zero-downtime deployment script
# Usage: ./deploy.sh

set -e  # Exit on any error

echo "🚀 Starting deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if git is available
if ! command -v git &> /dev/null; then
    print_error "Git is not installed or not in PATH"
    exit 1
fi

# Pull latest changes
print_status "Pulling latest changes from git..."
git pull origin main

if [ $? -ne 0 ]; then
    print_error "Failed to pull latest changes"
    exit 1
fi

# Install dependencies
print_status "Installing dependencies..."
npm ci

if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies"
    exit 1
fi

# Run build
print_status "Building application..."
npm run build

if [ $? -ne 0 ]; then
    print_error "Build failed"
    exit 1
fi

# Check if PM2 is available
if command -v pm2 &> /dev/null; then
    print_status "Reloading application with PM2..."
    pm2 reload app
    
    if [ $? -eq 0 ]; then
        print_status "✅ PM2 reload successful"
    else
        print_warning "PM2 reload failed, trying restart..."
        pm2 restart app
    fi
    
# Check if systemctl is available
elif command -v systemctl &> /dev/null; then
    print_status "Restarting application with systemctl..."
    sudo systemctl restart app
    
    if [ $? -eq 0 ]; then
        print_status "✅ systemctl restart successful"
    else
        print_error "systemctl restart failed"
        exit 1
    fi
    
else
    print_warning "Neither PM2 nor systemctl found. Please restart your application manually."
    print_status "You can run: npm run start:prod"
fi

# Health check
print_status "Performing health check..."
sleep 5  # Wait for app to start

if command -v curl &> /dev/null; then
    HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
    
    if [ "$HEALTH_RESPONSE" = "200" ]; then
        print_status "✅ Health check passed"
    else
        print_warning "Health check returned status: $HEALTH_RESPONSE"
    fi
else
    print_warning "curl not available, skipping health check"
fi

print_status "🎉 Deployment completed successfully!"
print_status "Application is running at: http://localhost:3000"
print_status "Health check: http://localhost:3000/health"

echo ""
echo "📊 Quick status check:"
if command -v pm2 &> /dev/null; then
    pm2 status app
elif command -v systemctl &> /dev/null; then
    systemctl status app --no-pager -l
fi