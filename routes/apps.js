import express from 'express';
import multer from 'multer';
import { validateUrl, generateAppAssets, createWebViewApp } from '../services/appGenerator.js';
import { analyzeWebsite } from '../services/aiAnalyzer.js';
import { uploadSingle, uploadMultiple } from '../services/fileUpload.js';
import { createApp, getApps, getAppById, updateApp, deleteApp } from '../services/database.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// @route   POST /api/apps/analyze
// @desc    Analyze a SaaS URL and extract metadata
// @access  Public
router.post('/analyze', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL format and accessibility
    const validation = await validateUrl(url);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Invalid URL', 
        details: validation.errors 
      });
    }

    // Use AI to analyze the website
    const analysis = await analyzeWebsite(url);

    res.json({
      success: true,
      url: url,
      validation: validation,
      analysis: analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('URL Analysis Error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze URL', 
      message: error.message 
    });
  }
});

// @route   POST /api/apps/generate
// @desc    Generate mobile app from SaaS URL
// @access  Private
router.post('/generate', auth, async (req, res) => {
  try {
    const { 
      url, 
      appName, 
      description, 
      category, 
      targetPlatforms,
      customIcon,
      userId 
    } = req.body;

    if (!url || !appName) {
      return res.status(400).json({ 
        error: 'URL and app name are required' 
      });
    }

    // Validate URL again
    const validation = await validateUrl(url);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Invalid URL', 
        details: validation.errors 
      });
    }

    // Generate app assets (icons, splash screens, etc.)
    const assets = await generateAppAssets({
      url,
      appName,
      description,
      customIcon
    });

    // Create WebView wrapper app
    const appPackage = await createWebViewApp({
      url,
      appName,
      description,
      category,
      targetPlatforms,
      assets
    });

    // Save app to database
    const appData = {
      user_id: userId || req.user.id,
      name: appName,
      description: description,
      original_url: url,
      category: category,
      target_platforms: targetPlatforms,
      assets: assets,
      package_info: appPackage,
      status: 'generated',
      created_at: new Date().toISOString()
    };

    const savedApp = await createApp(appData);

    res.json({
      success: true,
      message: 'App generated successfully',
      app: savedApp,
      downloadLinks: appPackage.downloadLinks
    });

  } catch (error) {
    console.error('App Generation Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate app', 
      message: error.message 
    });
  }
});

// @route   GET /api/apps
// @desc    Get all apps for authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, status } = req.query;
    const userId = req.user.id;

    const apps = await getApps({
      userId,
      page: parseInt(page),
      limit: parseInt(limit),
      category,
      status
    });

    res.json({
      success: true,
      apps: apps.data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: apps.total,
        pages: Math.ceil(apps.total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get Apps Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch apps', 
      message: error.message 
    });
  }
});

// @route   GET /api/apps/public
// @desc    Get public app store listings
// @access  Public
router.get('/public', async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search } = req.query;

    const apps = await getApps({
      page: parseInt(page),
      limit: parseInt(limit),
      category,
      search,
      publicOnly: true
    });

    res.json({
      success: true,
      apps: apps.data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: apps.total,
        pages: Math.ceil(apps.total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get Public Apps Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch public apps', 
      message: error.message 
    });
  }
});

// @route   GET /api/apps/:id
// @desc    Get specific app by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const app = await getAppById(id, userId);

    if (!app) {
      return res.status(404).json({ error: 'App not found' });
    }

    res.json({
      success: true,
      app: app
    });

  } catch (error) {
    console.error('Get App Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch app', 
      message: error.message 
    });
  }
});

// @route   PUT /api/apps/:id
// @desc    Update app
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    const updatedApp = await updateApp(id, userId, updateData);

    if (!updatedApp) {
      return res.status(404).json({ error: 'App not found' });
    }

    res.json({
      success: true,
      message: 'App updated successfully',
      app: updatedApp
    });

  } catch (error) {
    console.error('Update App Error:', error);
    res.status(500).json({ 
      error: 'Failed to update app', 
      message: error.message 
    });
  }
});

// @route   DELETE /api/apps/:id
// @desc    Delete app
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const deleted = await deleteApp(id, userId);

    if (!deleted) {
      return res.status(404).json({ error: 'App not found' });
    }

    res.json({
      success: true,
      message: 'App deleted successfully'
    });

  } catch (error) {
    console.error('Delete App Error:', error);
    res.status(500).json({ 
      error: 'Failed to delete app', 
      message: error.message 
    });
  }
});

// @route   POST /api/apps/:id/publish
// @desc    Publish app to stores
// @access  Private
router.post('/:id/publish', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { targetStores } = req.body;
    const userId = req.user.id;

    // This would integrate with actual app store APIs
    // For MVP, we'll simulate the publishing process
    
    const app = await getAppById(id, userId);
    if (!app) {
      return res.status(404).json({ error: 'App not found' });
    }

    // Update app status to publishing
    await updateApp(id, userId, { 
      status: 'publishing',
      target_stores: targetStores,
      publish_date: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'App publishing initiated',
      estimatedTime: '24-48 hours',
      targetStores: targetStores
    });

  } catch (error) {
    console.error('Publish App Error:', error);
    res.status(500).json({ 
      error: 'Failed to publish app', 
      message: error.message 
    });
  }
});

export default router;