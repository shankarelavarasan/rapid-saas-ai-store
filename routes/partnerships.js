import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { 
  initializePartnership,
  submitAppToPartner,
  checkSubmissionStatus,
  getActivePartnerships,
  getAppSubmissionHistory,
  calculateRevenueShare,
  PARTNER_PLATFORMS
} from '../services/partnershipService.js';

const router = express.Router();

/**
 * GET /api/partnerships/platforms
 * Get available partner platforms
 */
router.get('/platforms', (req, res) => {
  try {
    const platforms = Object.entries(PARTNER_PLATFORMS).map(([key, config]) => ({
      id: key,
      name: config.name,
      commissionRate: config.commissionRate,
      requirements: config.requirements,
      reviewTime: config.reviewTime,
      active: config.active
    }));

    res.json({
      success: true,
      data: {
        platforms,
        count: platforms.length,
        active: platforms.filter(p => p.active).length
      }
    });

  } catch (error) {
    console.error('Get Platforms Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve platforms'
    });
  }
});

/**
 * POST /api/partnerships/initialize
 * Initialize partnership with a platform
 */
router.post('/initialize', authenticateToken, async (req, res) => {
  try {
    const { platform, credentials } = req.body;

    if (!platform || !credentials) {
      return res.status(400).json({
        success: false,
        error: 'Platform and credentials are required'
      });
    }

    if (!PARTNER_PLATFORMS[platform]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid platform'
      });
    }

    const partnership = await initializePartnership(platform, credentials);

    res.json({
      success: true,
      data: {
        partnership: {
          id: partnership.id,
          platform: partnership.platform,
          name: partnership.name,
          status: partnership.status,
          commissionRate: partnership.commission_rate,
          reviewTime: partnership.review_time,
          createdAt: partnership.created_at
        },
        message: `Partnership with ${partnership.name} initialized successfully`
      }
    });

  } catch (error) {
    console.error('Initialize Partnership Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize partnership',
      details: error.message
    });
  }
});

/**
 * GET /api/partnerships/active
 * Get all active partnerships
 */
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const partnerships = await getActivePartnerships();

    const formattedPartnerships = partnerships.map(p => ({
      id: p.id,
      platform: p.platform,
      name: p.name,
      status: p.status,
      commissionRate: p.commission_rate,
      reviewTime: p.review_time,
      createdAt: p.created_at,
      lastSync: p.last_sync
    }));

    res.json({
      success: true,
      data: {
        partnerships: formattedPartnerships,
        count: formattedPartnerships.length
      }
    });

  } catch (error) {
    console.error('Get Active Partnerships Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve partnerships'
    });
  }
});

/**
 * POST /api/partnerships/submit-app
 * Submit app to partner platform
 */
router.post('/submit-app', authenticateToken, async (req, res) => {
  try {
    const { appId, platform, submissionData } = req.body;

    if (!appId || !platform || !submissionData) {
      return res.status(400).json({
        success: false,
        error: 'App ID, platform, and submission data are required'
      });
    }

    // Validate platform
    if (!PARTNER_PLATFORMS[platform]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid platform'
      });
    }

    const submission = await submitAppToPartner(appId, platform, submissionData);

    res.json({
      success: true,
      data: {
        submission: {
          id: submission.id,
          appId: submission.app_id,
          platform: submission.platform,
          status: submission.status,
          submissionId: submission.submission_id,
          submittedAt: submission.submitted_at,
          estimatedCompletion: submission.estimated_review_completion
        },
        message: `App submitted to ${platform} successfully`
      }
    });

  } catch (error) {
    console.error('Submit App Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit app',
      details: error.message
    });
  }
});

/**
 * GET /api/partnerships/submission-status/:submissionId
 * Check submission status
 */
router.get('/submission-status/:submissionId', authenticateToken, async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission = await checkSubmissionStatus(submissionId);

    res.json({
      success: true,
      data: {
        submission: {
          id: submission.id,
          appId: submission.app_id,
          platform: submission.platform,
          status: submission.status,
          submissionId: submission.submission_id,
          statusMessage: submission.status_message,
          submittedAt: submission.submitted_at,
          updatedAt: submission.updated_at,
          estimatedCompletion: submission.estimated_review_completion
        }
      }
    });

  } catch (error) {
    console.error('Check Submission Status Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check submission status',
      details: error.message
    });
  }
});

/**
 * GET /api/partnerships/app-submissions/:appId
 * Get submission history for an app
 */
router.get('/app-submissions/:appId', authenticateToken, async (req, res) => {
  try {
    const { appId } = req.params;

    const submissions = await getAppSubmissionHistory(appId);

    const formattedSubmissions = submissions.map(s => ({
      id: s.id,
      platform: s.platform,
      status: s.status,
      submissionId: s.submission_id,
      statusMessage: s.status_message,
      submittedAt: s.submitted_at,
      updatedAt: s.updated_at,
      estimatedCompletion: s.estimated_review_completion
    }));

    res.json({
      success: true,
      data: {
        appId,
        submissions: formattedSubmissions,
        count: formattedSubmissions.length,
        summary: {
          submitted: formattedSubmissions.filter(s => s.status === 'submitted').length,
          underReview: formattedSubmissions.filter(s => s.status === 'under_review').length,
          approved: formattedSubmissions.filter(s => s.status === 'approved').length,
          rejected: formattedSubmissions.filter(s => s.status === 'rejected').length
        }
      }
    });

  } catch (error) {
    console.error('Get App Submissions Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve app submissions'
    });
  }
});

/**
 * POST /api/partnerships/calculate-revenue
 * Calculate revenue share for a platform
 */
router.post('/calculate-revenue', authenticateToken, async (req, res) => {
  try {
    const { totalRevenue, platform } = req.body;

    if (!totalRevenue || !platform) {
      return res.status(400).json({
        success: false,
        error: 'Total revenue and platform are required'
      });
    }

    if (totalRevenue < 0) {
      return res.status(400).json({
        success: false,
        error: 'Total revenue must be positive'
      });
    }

    const revenueShare = calculateRevenueShare(totalRevenue, platform);

    res.json({
      success: true,
      data: {
        revenueShare,
        platform,
        currency: 'USD' // Default currency
      }
    });

  } catch (error) {
    console.error('Calculate Revenue Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate revenue share',
      details: error.message
    });
  }
});

/**
 * POST /api/partnerships/batch-submit
 * Submit app to multiple platforms
 */
router.post('/batch-submit', authenticateToken, async (req, res) => {
  try {
    const { appId, platforms, submissionData } = req.body;

    if (!appId || !platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'App ID and platforms array are required'
      });
    }

    if (platforms.length > 5) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 5 platforms allowed per batch'
      });
    }

    const results = [];
    const errors = [];

    for (const platform of platforms) {
      try {
        // Validate platform
        if (!PARTNER_PLATFORMS[platform]) {
          throw new Error(`Invalid platform: ${platform}`);
        }

        const submission = await submitAppToPartner(appId, platform, submissionData);
        results.push({
          platform,
          submission: {
            id: submission.id,
            submissionId: submission.submission_id,
            status: submission.status,
            submittedAt: submission.submitted_at
          }
        });
      } catch (error) {
        errors.push({
          platform,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: {
        appId,
        results,
        errors,
        summary: {
          total: platforms.length,
          successful: results.length,
          failed: errors.length
        }
      }
    });

  } catch (error) {
    console.error('Batch Submit Error:', error);
    res.status(500).json({
      success: false,
      error: 'Batch submission failed',
      details: error.message
    });
  }
});

/**
 * GET /api/partnerships/platform-requirements/:platform
 * Get specific platform requirements
 */
router.get('/platform-requirements/:platform', (req, res) => {
  try {
    const { platform } = req.params;

    if (!PARTNER_PLATFORMS[platform]) {
      return res.status(404).json({
        success: false,
        error: 'Platform not found'
      });
    }

    const config = PARTNER_PLATFORMS[platform];

    res.json({
      success: true,
      data: {
        platform,
        name: config.name,
        requirements: config.requirements,
        commissionRate: config.commissionRate,
        reviewTime: config.reviewTime,
        active: config.active,
        guidelines: {
          description: `Requirements for publishing to ${config.name}`,
          requiredFields: config.requirements.requiredFields,
          supportedFormats: config.requirements.supportedFormats,
          sizeLimit: {
            min: config.requirements.minAppSize,
            max: config.requirements.maxAppSize
          }
        }
      }
    });

  } catch (error) {
    console.error('Get Platform Requirements Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve platform requirements'
    });
  }
});

export default router;