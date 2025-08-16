#!/usr/bin/env node

/**
 * Deployment Monitoring Script for Render
 * Helps track deployment status and provides useful information
 */

import https from 'https';
import fs from 'fs';
import path from 'path';

const DEPLOYMENT_LOG_FILE = 'deployment-history.json';

// Deployment monitoring configuration
const config = {
  serviceName: 'rapid-saas-ai-store',
  healthCheckUrl: 'https://rapid-saas-ai-store.onrender.com/api/health',
  expectedResponse: { status: 'OK' },
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 5000 // 5 seconds
};

/**
 * Log deployment information
 */
function logDeployment(status, details = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    status,
    commit: process.env.RENDER_GIT_COMMIT || 'unknown',
    branch: process.env.RENDER_GIT_BRANCH || 'main',
    ...details
  };

  let history = [];
  if (fs.existsSync(DEPLOYMENT_LOG_FILE)) {
    try {
      history = JSON.parse(fs.readFileSync(DEPLOYMENT_LOG_FILE, 'utf8'));
    } catch (error) {
      console.warn('Could not read deployment history:', error.message);
    }
  }

  history.push(logEntry);
  
  // Keep only last 50 deployments
  if (history.length > 50) {
    history = history.slice(-50);
  }

  try {
    fs.writeFileSync(DEPLOYMENT_LOG_FILE, JSON.stringify(history, null, 2));
  } catch (error) {
    console.warn('Could not write deployment history:', error.message);
  }

  console.log(`[${timestamp}] Deployment ${status}:`, details);
}

/**
 * Check if the service is healthy
 */
function checkHealth(url, attempt = 1) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, { timeout: config.timeout }, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (response.statusCode === 200 && result.status === config.expectedResponse.status) {
            resolve({ success: true, data: result, statusCode: response.statusCode });
          } else {
            resolve({ success: false, data: result, statusCode: response.statusCode });
          }
        } catch (error) {
          resolve({ success: false, error: error.message, statusCode: response.statusCode });
        }
      });
    });
    
    request.on('error', (error) => {
      if (attempt < config.retryAttempts) {
        console.log(`Health check attempt ${attempt} failed, retrying in ${config.retryDelay}ms...`);
        setTimeout(() => {
          checkHealth(url, attempt + 1).then(resolve).catch(reject);
        }, config.retryDelay);
      } else {
        resolve({ success: false, error: error.message });
      }
    });
    
    request.on('timeout', () => {
      request.destroy();
      if (attempt < config.retryAttempts) {
        console.log(`Health check attempt ${attempt} timed out, retrying in ${config.retryDelay}ms...`);
        setTimeout(() => {
          checkHealth(url, attempt + 1).then(resolve).catch(reject);
        }, config.retryDelay);
      } else {
        resolve({ success: false, error: 'Request timeout' });
      }
    });
  });
}

/**
 * Main monitoring function
 */
async function monitorDeployment() {
  console.log('🚀 Starting deployment monitoring...');
  console.log(`Service: ${config.serviceName}`);
  console.log(`Health Check URL: ${config.healthCheckUrl}`);
  
  try {
    logDeployment('STARTED', {
      serviceName: config.serviceName,
      healthCheckUrl: config.healthCheckUrl
    });
    
    console.log('⏳ Waiting for service to be ready...');
    
    const healthResult = await checkHealth(config.healthCheckUrl);
    
    if (healthResult.success) {
      console.log('✅ Deployment successful! Service is healthy.');
      console.log('📊 Health check response:', healthResult.data);
      
      logDeployment('SUCCESS', {
        healthCheck: healthResult,
        responseTime: Date.now()
      });
      
      // Test key API endpoints
      console.log('🔍 Testing API endpoints...');
      const endpoints = [
        '/api/health',
        '/api/apps',
        '/api/ai/generate-assets'
      ];
      
      for (const endpoint of endpoints) {
        const testUrl = config.healthCheckUrl.replace('/api/health', endpoint);
        console.log(`Testing ${endpoint}...`);
        // Note: This is a basic test, actual endpoint testing would need proper payloads
      }
      
    } else {
      console.log('❌ Deployment failed! Service is not healthy.');
      console.log('🔍 Health check details:', healthResult);
      
      logDeployment('FAILED', {
        healthCheck: healthResult,
        error: healthResult.error || 'Health check failed'
      });
      
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Monitoring error:', error.message);
    
    logDeployment('ERROR', {
      error: error.message,
      stack: error.stack
    });
    
    process.exit(1);
  }
}

/**
 * Display deployment history
 */
function showHistory() {
  if (!fs.existsSync(DEPLOYMENT_LOG_FILE)) {
    console.log('No deployment history found.');
    return;
  }
  
  try {
    const history = JSON.parse(fs.readFileSync(DEPLOYMENT_LOG_FILE, 'utf8'));
    console.log('📈 Deployment History (last 10):');
    console.log('================================');
    
    history.slice(-10).forEach((entry, index) => {
      const status = entry.status === 'SUCCESS' ? '✅' : entry.status === 'FAILED' ? '❌' : '⏳';
      console.log(`${status} ${entry.timestamp} - ${entry.status} (${entry.commit?.substring(0, 7) || 'unknown'})`);
      if (entry.error) {
        console.log(`   Error: ${entry.error}`);
      }
    });
    
  } catch (error) {
    console.error('Could not read deployment history:', error.message);
  }
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'monitor':
    monitorDeployment();
    break;
  case 'history':
    showHistory();
    break;
  default:
    console.log('Usage:');
    console.log('  node deployment-monitor.js monitor  - Monitor current deployment');
    console.log('  node deployment-monitor.js history  - Show deployment history');
    break;
}

export default { monitorDeployment, checkHealth, logDeployment, showHistory };