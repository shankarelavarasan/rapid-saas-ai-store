import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { 
  performQualityAssessment,
  getAssessmentHistory,
  validateAppStoreCompliance
} from '../services/qualityAssurance.js';

const router = express.Router();

/**
 * POST /api/quality/assess
 * Perform quality assessment on a URL
 */
router.post('/assess', authenticateToken, async (req, res) => {
  try {
    const { url, appData } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format'
      });
    }

    console.log(`Starting quality assessment for: ${url}`);
    const assessment = await performQualityAssessment(url, appData);

    res.json({
      success: true,
      data: {
        assessment,
        summary: {
          overallScore: assessment.overallScore,
          passed: assessment.passed,
          totalIssues: assessment.scores.technical?.issues?.length + 
                      assessment.scores.content?.issues?.length + 
                      assessment.scores.compliance?.issues?.length || 0,
          recommendationsCount: assessment.recommendations?.length || 0
        }
      }
    });

  } catch (error) {
    console.error('Quality Assessment Error:', error);
    res.status(500).json({
      success: false,
      error: 'Quality assessment failed',
      details: error.message
    });
  }
});

/**
 * GET /api/quality/history/:url
 * Get assessment history for a URL
 */
router.get('/history/:url', authenticateToken, async (req, res) => {
  try {
    const { url } = req.params;
    const { limit = 10 } = req.query;

    const decodedUrl = decodeURIComponent(url);
    const history = await getAssessmentHistory(decodedUrl, parseInt(limit));

    res.json({
      success: true,
      data: {
        url: decodedUrl,
        history,
        count: history.length
      }
    });

  } catch (error) {
    console.error('Get Assessment History Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve assessment history',
      details: error.message
    });
  }
});

/**
 * POST /api/quality/validate-compliance
 * Validate app store compliance
 */
router.post('/validate-compliance', authenticateToken, async (req, res) => {
  try {
    const { appData } = req.body;

    if (!appData) {
      return res.status(400).json({
        success: false,
        error: 'App data is required'
      });
    }

    const compliance = await validateAppStoreCompliance(appData);

    res.json({
      success: true,
      data: {
        compliance,
        summary: {
          googlePlayPassed: compliance.googlePlay.passed,
          appleAppStorePassed: compliance.appleAppStore.passed,
          totalIssues: compliance.googlePlay.issues.length + compliance.appleAppStore.issues.length
        }
      }
    });

  } catch (error) {
    console.error('Validate Compliance Error:', error);
    res.status(500).json({
      success: false,
      error: 'Compliance validation failed',
      details: error.message
    });
  }
});

/**
 * GET /api/quality/criteria
 * Get quality assessment criteria
 */
router.get('/criteria', (req, res) => {
  try {
    const { QUALITY_CRITERIA } = require('../services/qualityAssurance.js');
    
    res.json({
      success: true,
      data: {
        criteria: QUALITY_CRITERIA,
        description: {
          technical: 'Technical aspects like mobile responsiveness, load time, HTTPS, and error checking',
          content: 'Content quality including title, description, icon, and content adequacy',
          compliance: 'Safety and compliance checks for malicious content and legal requirements'
        },
        scoring: {
          minimum: 70,
          maximum: 100,
          description: 'Apps need a minimum score of 70% to pass quality assessment'
        }
      }
    });

  } catch (error) {
    console.error('Get Quality Criteria Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve quality criteria'
    });
  }
});

/**
 * POST /api/quality/batch-assess
 * Perform batch quality assessment on multiple URLs
 */
router.post('/batch-assess', authenticateToken, async (req, res) => {
  try {
    const { urls, appDataList } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'URLs array is required'
      });
    }

    if (urls.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 10 URLs allowed per batch'
      });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < urls.length; i++) {
      try {
        const url = urls[i];
        const appData = appDataList?.[i] || {};
        
        // Validate URL
        new URL(url);
        
        const assessment = await performQualityAssessment(url, appData);
        results.push({
          url,
          assessment,
          index: i
        });
      } catch (error) {
        errors.push({
          url: urls[i],
          error: error.message,
          index: i
        });
      }
    }

    res.json({
      success: true,
      data: {
        results,
        errors,
        summary: {
          total: urls.length,
          successful: results.length,
          failed: errors.length,
          averageScore: results.length > 0 ? 
            Math.round(results.reduce((sum, r) => sum + r.assessment.overallScore, 0) / results.length) : 0
        }
      }
    });

  } catch (error) {
    console.error('Batch Quality Assessment Error:', error);
    res.status(500).json({
      success: false,
      error: 'Batch quality assessment failed',
      details: error.message
    });
  }
});

// @route   POST /api/quality/scan
// @desc    Quick quality scan with Lighthouse/HTML checks
// @access  Public
router.post('/scan', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Mock quality scan results
    const scanResults = {
      score: Math.floor(Math.random() * 30) + 70, // 70-100 score
      issues: [
        {
          id: 'performance',
          severity: 'medium',
          desc: 'Page load time could be improved'
        },
        {
          id: 'accessibility',
          severity: 'low',
          desc: 'Some images missing alt text'
        },
        {
          id: 'seo',
          severity: 'low',
          desc: 'Meta description could be more descriptive'
        }
      ],
      lighthouse: {
        performance: Math.floor(Math.random() * 20) + 80,
        accessibility: Math.floor(Math.random() * 15) + 85,
        bestPractices: Math.floor(Math.random() * 10) + 90,
        seo: Math.floor(Math.random() * 25) + 75
      },
      htmlChecks: {
        validHtml: true,
        hasTitle: true,
        hasMetaDescription: true,
        responsiveDesign: true
      },
      scannedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      score: scanResults.score,
      issues: scanResults.issues,
      lighthouse: scanResults.lighthouse,
      htmlChecks: scanResults.htmlChecks,
      scannedAt: scanResults.scannedAt
    });

  } catch (error) {
    console.error('Quality Scan Error:', error);
    res.status(500).json({ 
      error: 'Quality scan failed', 
      message: error.message 
    });
  }
});

export default router;