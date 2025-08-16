import express from 'express';
import { analyzeWebsite, generateAppAssets, categorizeApp, generateDescription } from '../services/aiAnalyzer.js';
import { generateIcon, generateSplashScreen } from '../services/iconGenerator.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/ai/analyze-website
// @desc    AI-powered website analysis
// @access  Public
router.post('/analyze-website', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const analysis = await analyzeWebsite(url);

    res.json({
      success: true,
      analysis: {
        metadata: {
          title: analysis.title,
          description: analysis.description,
          keywords: analysis.keywords,
          favicon: analysis.favicon,
          ogImage: analysis.ogImage
        },
        content: {
          type: analysis.contentType, // 'saas', 'ecommerce', 'blog', 'portfolio', etc.
          category: analysis.category,
          features: analysis.features,
          targetAudience: analysis.targetAudience
        },
        technical: {
          isMobileResponsive: analysis.isMobileResponsive,
          hasSSL: analysis.hasSSL,
          loadTime: analysis.loadTime,
          technologies: analysis.technologies,
          framework: analysis.framework
        },
        suitability: {
          appViability: analysis.appViability, // Score 1-10
          reasons: analysis.viabilityReasons,
          recommendations: analysis.recommendations
        },
        generated: {
          suggestedAppName: analysis.suggestedAppName,
          suggestedDescription: analysis.suggestedDescription,
          suggestedCategory: analysis.suggestedCategory,
          suggestedTags: analysis.suggestedTags
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Website Analysis Error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze website', 
      message: error.message 
    });
  }
});

// @route   POST /api/ai/generate-assets
// @desc    Generate app assets using AI
// @access  Public
router.post('/generate-assets', async (req, res) => {
  try {
    const { 
      appName, 
      description, 
      category, 
      style = 'modern',
      colorScheme = 'auto',
      iconType = 'logo'
    } = req.body;

    if (!appName) {
      return res.status(400).json({ error: 'App name is required' });
    }

    // Generate app icon
    const iconResult = await generateIcon({
      appName,
      description,
      category,
      style,
      colorScheme,
      iconType,
      sizes: ['512x512', '192x192', '144x144', '96x96', '72x72', '48x48']
    });

    // Generate splash screens
    const splashResult = await generateSplashScreen({
      appName,
      iconUrl: iconResult.mainIcon,
      colorScheme,
      style,
      theme: colorScheme === 'dark' ? 'dark' : 'light',
      orientations: ['portrait', 'landscape'],
      devices: ['phone', 'tablet']
    });

    // Generate app store assets
    const storeAssets = await generateAppAssets({
      appName,
      description,
      category,
      iconUrl: iconResult.mainIcon
    });

    res.json({
      success: true,
      assets: {
        icons: {
          main: iconResult.mainIcon,
          sizes: iconResult.allSizes,
          adaptive: iconResult.adaptiveIcon, // For Android
          rounded: iconResult.roundedIcon // For iOS
        },
        splashScreens: {
          portrait: splashResult.portrait,
          landscape: splashResult.landscape,
          devices: splashResult.byDevice
        },
        storeAssets: {
          screenshots: storeAssets.screenshots,
          featureGraphic: storeAssets.featureGraphic,
          banners: storeAssets.banners,
          promotional: storeAssets.promotional
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          style: style,
          colorScheme: colorScheme,
          totalAssets: (iconResult.allSizes?.length || 0) + (splashResult.portrait?.length || 0) + (splashResult.landscape?.length || 0)
        }
      }
    });

  } catch (error) {
    console.error('AI Asset Generation Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate assets', 
      message: error.message 
    });
  }
});

// @route   POST /api/ai/categorize
// @desc    AI-powered app categorization
// @access  Public
router.post('/categorize', async (req, res) => {
  try {
    const { appName, description, url, features } = req.body;

    if (!appName && !description && !url) {
      return res.status(400).json({ 
        error: 'At least one of appName, description, or url is required' 
      });
    }

    const categorization = await categorizeApp({
      appName,
      description,
      url,
      features
    });

    res.json({
      success: true,
      categorization: {
        primary: {
          category: categorization.primaryCategory,
          confidence: categorization.primaryConfidence,
          reasoning: categorization.primaryReasoning
        },
        secondary: categorization.secondaryCategories,
        tags: categorization.suggestedTags,
        audience: {
          target: categorization.targetAudience,
          ageGroup: categorization.ageGroup,
          demographics: categorization.demographics
        },
        stores: {
          playStore: {
            category: categorization.playStoreCategory,
            contentRating: categorization.contentRating
          },
          appStore: {
            category: categorization.appStoreCategory,
            ageRating: categorization.ageRating
          }
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Categorization Error:', error);
    res.status(500).json({ 
      error: 'Failed to categorize app', 
      message: error.message 
    });
  }
});

// @route   POST /api/ai/generate-description
// @desc    Generate app store description using AI
// @access  Private
router.post('/generate-description', auth, async (req, res) => {
  try {
    const { 
      appName, 
      url, 
      features, 
      targetAudience,
      tone = 'professional',
      length = 'medium',
      includeKeywords = true
    } = req.body;

    if (!appName) {
      return res.status(400).json({ error: 'App name is required' });
    }

    const descriptions = await generateDescription({
      appName,
      url,
      features,
      targetAudience,
      tone,
      length,
      includeKeywords
    });

    res.json({
      success: true,
      descriptions: {
        short: descriptions.short, // For app stores (80 chars)
        medium: descriptions.medium, // For listings (160 chars)
        long: descriptions.long, // Full description (4000 chars)
        playStore: descriptions.playStore, // Optimized for Google Play
        appStore: descriptions.appStore, // Optimized for Apple App Store
        promotional: descriptions.promotional // Marketing copy
      },
      metadata: {
        tone: tone,
        length: length,
        keywordsIncluded: includeKeywords,
        generatedAt: new Date().toISOString()
      },
      seo: {
        keywords: descriptions.extractedKeywords,
        readabilityScore: descriptions.readabilityScore,
        sentimentScore: descriptions.sentimentScore
      }
    });

  } catch (error) {
    console.error('AI Description Generation Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate description', 
      message: error.message 
    });
  }
});

// @route   POST /api/ai/optimize-listing
// @desc    AI-powered app store listing optimization
// @access  Private
router.post('/optimize-listing', auth, async (req, res) => {
  try {
    const { 
      appName, 
      currentDescription, 
      category, 
      targetKeywords,
      competitorApps,
      targetStore = 'both' // 'playstore', 'appstore', or 'both'
    } = req.body;

    if (!appName || !currentDescription) {
      return res.status(400).json({ 
        error: 'App name and current description are required' 
      });
    }

    // Analyze current listing
    const currentAnalysis = await analyzeWebsite(null, {
      appName,
      description: currentDescription,
      category
    });

    // Generate optimized versions
    const optimizations = await generateAppAssets({
      appName,
      description: currentDescription,
      category,
      targetKeywords,
      competitorApps,
      optimize: true,
      targetStore
    });

    res.json({
      success: true,
      optimization: {
        current: {
          score: currentAnalysis.seoScore,
          issues: currentAnalysis.issues,
          strengths: currentAnalysis.strengths
        },
        optimized: {
          title: optimizations.optimizedTitle,
          shortDescription: optimizations.optimizedShortDesc,
          longDescription: optimizations.optimizedLongDesc,
          keywords: optimizations.optimizedKeywords,
          score: optimizations.projectedScore
        },
        improvements: {
          keywordDensity: optimizations.keywordImprovements,
          readability: optimizations.readabilityImprovements,
          competitiveAdvantage: optimizations.competitiveAdvantages
        },
        recommendations: optimizations.recommendations
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Listing Optimization Error:', error);
    res.status(500).json({ 
      error: 'Failed to optimize listing', 
      message: error.message 
    });
  }
});

// @route   POST /api/ai/smart-search
// @desc    AI-powered smart search for app store
// @access  Public
router.post('/smart-search', async (req, res) => {
  try {
    const { 
      query, 
      filters = {},
      limit = 20,
      offset = 0,
      sortBy = 'relevance'
    } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Use AI to understand search intent and expand query
    const searchResults = await analyzeWebsite(null, {
      searchQuery: query,
      filters,
      limit,
      offset,
      sortBy,
      smartSearch: true
    });

    res.json({
      success: true,
      search: {
        originalQuery: query,
        expandedQuery: searchResults.expandedQuery,
        intent: searchResults.searchIntent,
        results: searchResults.apps,
        suggestions: searchResults.suggestions,
        filters: searchResults.appliedFilters,
        pagination: {
          total: searchResults.total,
          limit: limit,
          offset: offset,
          hasMore: searchResults.hasMore
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Smart Search Error:', error);
    res.status(500).json({ 
      error: 'Failed to perform smart search', 
      message: error.message 
    });
  }
});

// @route   GET /api/ai/suggestions
// @desc    Get AI-powered suggestions for app improvement
// @access  Private
router.get('/suggestions/:appId', auth, async (req, res) => {
  try {
    const { appId } = req.params;
    const userId = req.user.id;

    // Get app data and analytics
    const suggestions = await generateAppAssets(null, {
      appId,
      userId,
      generateSuggestions: true
    });

    res.json({
      success: true,
      suggestions: {
        performance: suggestions.performanceSuggestions,
        marketing: suggestions.marketingSuggestions,
        features: suggestions.featureSuggestions,
        monetization: suggestions.monetizationSuggestions,
        userExperience: suggestions.uxSuggestions
      },
      priority: suggestions.priorityOrder,
      estimatedImpact: suggestions.estimatedImpact,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Suggestions Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate suggestions', 
      message: error.message 
    });
  }
});

export default router;