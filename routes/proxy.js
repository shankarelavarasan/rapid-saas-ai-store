import express from 'express';
import https from 'https';
import http from 'http';
import { URL } from 'url';

const router = express.Router();

// SSRF protection - allowed hosts
const ALLOWED_HOSTS = [
  'trae.ai',
  'github.io',
  'vercel.app',
  'jsonplaceholder.typicode.com',
  'httpbin.org'
];

// Block private/internal IPs
const BLOCKED_IPS = [
  '127.0.0.1',
  'localhost',
  '169.254.169.254', // AWS metadata
  '10.0.0.0/8',
  '172.16.0.0/12',
  '192.168.0.0/16'
];

// Check if host is allowed
function isHostAllowed(hostname) {
  return ALLOWED_HOSTS.some(allowedHost => 
    hostname === allowedHost || hostname.endsWith('.' + allowedHost)
  );
}

// Check if IP is blocked
function isIPBlocked(hostname) {
  return BLOCKED_IPS.some(blockedIP => {
    if (blockedIP.includes('/')) {
      // CIDR range check (simplified)
      return false; // For now, just check exact matches
    }
    return hostname === blockedIP;
  });
}

// @route   GET /api/proxy/health
// @desc    Proxy health check
// @access  Public
router.get('/health', (req, res) => {
  res.set('x-proxy', 'alive');
  res.status(200).json({ status: 'ok', proxy: 'alive' });
});

// @route   GET /api/proxy/fetch
// @desc    Proxy fetch requests to avoid CORS
// @access  Public
router.get('/fetch', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    let targetUrl;
    try {
      targetUrl = new URL(decodeURIComponent(url));
    } catch (error) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Security checks
    if (targetUrl.protocol !== 'https:') {
      return res.status(400).json({ error: 'Only HTTPS URLs are allowed' });
    }

    if (isIPBlocked(targetUrl.hostname)) {
      return res.status(400).json({ error: 'Access to this host is blocked' });
    }

    if (!isHostAllowed(targetUrl.hostname)) {
      return res.status(400).json({ error: 'Host not in allowlist' });
    }

    // Make the request
    const protocol = targetUrl.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: targetUrl.hostname,
      port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
      path: targetUrl.pathname + targetUrl.search,
      method: 'GET',
      timeout: 20000, // 20s timeout
      headers: {
        'User-Agent': 'Rapid-SaaS-AI-Store-Proxy/1.0',
        'Accept': 'application/json, text/html, */*'
      }
    };

    const proxyReq = protocol.request(options, (proxyRes) => {
      // Set CORS headers
      res.set({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'X-Proxy': 'ok'
      });

      // Remove sensitive headers
      const filteredHeaders = { ...proxyRes.headers };
      delete filteredHeaders['set-cookie'];
      delete filteredHeaders['cookie'];
      
      // Set response headers
      Object.keys(filteredHeaders).forEach(key => {
        res.set(key, filteredHeaders[key]);
      });

      res.status(proxyRes.statusCode);
      
      let data = '';
      let dataSize = 0;
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB limit

      proxyRes.on('data', (chunk) => {
        dataSize += chunk.length;
        if (dataSize > MAX_SIZE) {
          proxyRes.destroy();
          return res.status(413).json({ error: 'Response too large' });
        }
        data += chunk;
      });

      proxyRes.on('end', () => {
        try {
          // Try to parse as JSON first
          const jsonData = JSON.parse(data);
          res.json(jsonData);
        } catch (e) {
          // If not JSON, send as text
          res.send(data);
        }
      });
    });

    proxyReq.on('error', (error) => {
      console.error('Proxy request error:', error);
      res.status(500).json({ error: 'Proxy request failed' });
    });

    proxyReq.on('timeout', () => {
      proxyReq.destroy();
      res.status(408).json({ error: 'Request timeout' });
    });

    proxyReq.end();

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Internal proxy error' });
  }
});

export default router;