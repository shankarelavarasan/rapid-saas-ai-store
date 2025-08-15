import express from 'express';
import { body, validationResult } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { getUserById, updateUser } from '../services/database.js';
import { supabase } from '../services/database.js';

const router = express.Router();

// @route   POST /api/legal/accept-terms
// @desc    Accept terms of service and revenue sharing agreement
// @access  Private
router.post('/accept-terms', [
  auth,
  body('termsVersion').notEmpty(),
  body('revenueAgreement').isBoolean(),
  body('dataProcessing').isBoolean(),
  body('appStoreTerms').isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { termsVersion, revenueAgreement, dataProcessing, appStoreTerms } = req.body;
    const userId = req.user.id;

    // Record legal agreement
    const agreementData = {
      user_id: userId,
      terms_version: termsVersion,
      revenue_agreement: revenueAgreement,
      data_processing: dataProcessing,
      app_store_terms: appStoreTerms,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      accepted_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('legal_agreements')
      .insert([agreementData])
      .select()
      .single();

    if (error) throw error;

    // Update user status
    await updateUser(userId, {
      terms_accepted: true,
      terms_accepted_at: new Date().toISOString(),
      can_publish: revenueAgreement && dataProcessing && appStoreTerms
    });

    res.json({
      success: true,
      message: 'Legal agreements accepted successfully',
      agreement: data
    });

  } catch (error) {
    console.error('Accept Terms Error:', error);
    res.status(500).json({ 
      error: 'Failed to accept terms', 
      message: error.message 
    });
  }
});

// @route   GET /api/legal/terms
// @desc    Get current terms of service
// @access  Public
router.get('/terms', async (req, res) => {
  try {
    const terms = {
      version: '1.0.0',
      lastUpdated: '2024-01-01',
      sections: {
        revenueSharing: {
          title: 'Revenue Sharing Agreement',
          content: `
            By accepting this agreement, you acknowledge and agree to the following revenue sharing model:
            
            • Web/App Owner: 70% of net revenue
            • Rapid SaaS AI Store Platform: 15% of net revenue
            • App Store Commission (Google Play/Apple): 15% of net revenue
            
            Net revenue is calculated after payment processing fees and applicable taxes.
            Payments are processed monthly for amounts above $100 USD.
          `,
          required: true
        },
        dataProcessing: {
          title: 'Data Processing and Privacy',
          content: `
            We process your data to:
            • Convert your web application to mobile format
            • Generate app store assets and metadata
            • Handle revenue distribution
            • Provide analytics and reporting
            
            Your original application data remains your property.
            We do not store or access user data from your converted applications.
          `,
          required: true
        },
        appStoreTerms: {
          title: 'App Store Publishing Terms',
          content: `
            By publishing through our platform:
            • You confirm you own the rights to the web application
            • You authorize us to submit your app to app stores on your behalf
            • You agree to comply with Google Play and Apple App Store guidelines
            • You understand that app store approval is not guaranteed
            
            You remain the legal owner and publisher of your application.
          `,
          required: true
        },
        intellectualProperty: {
          title: 'Intellectual Property Rights',
          content: `
            • You retain all rights to your original web application
            • The converted mobile app remains your intellectual property
            • We only claim rights to the conversion technology and platform
            • You grant us limited rights to process and convert your application
          `,
          required: false
        }
      }
    };

    res.json({
      success: true,
      terms
    });

  } catch (error) {
    console.error('Get Terms Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch terms', 
      message: error.message 
    });
  }
});

// @route   GET /api/legal/user-agreements
// @desc    Get user's legal agreement history
// @access  Private
router.get('/user-agreements', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: agreements, error } = await supabase
      .from('legal_agreements')
      .select('*')
      .eq('user_id', userId)
      .order('accepted_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      agreements: agreements || []
    });

  } catch (error) {
    console.error('Get User Agreements Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch agreements', 
      message: error.message 
    });
  }
});

// @route   POST /api/legal/verify-ownership
// @desc    Verify ownership of a web application
// @access  Private
router.post('/verify-ownership', [
  auth,
  body('url').isURL(),
  body('verificationMethod').isIn(['dns', 'file', 'meta'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { url, verificationMethod } = req.body;
    const userId = req.user.id;

    // Generate verification token
    const verificationToken = `rapid-saas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Store verification request
    const verificationData = {
      user_id: userId,
      url: url,
      verification_method: verificationMethod,
      verification_token: verificationToken,
      status: 'pending',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };

    const { data, error } = await supabase
      .from('ownership_verifications')
      .insert([verificationData])
      .select()
      .single();

    if (error) throw error;

    // Provide verification instructions based on method
    let instructions = '';
    switch (verificationMethod) {
    case 'dns':
      instructions = `Add a TXT record to your domain with the value: ${verificationToken}`;
      break;
    case 'file':
      instructions = `Upload a file named 'rapid-saas-verification.txt' to your website root with content: ${verificationToken}`;
      break;
    case 'meta':
      instructions = `Add this meta tag to your website's <head> section: <meta name="rapid-saas-verification" content="${verificationToken}">`;
      break;
    }

    res.json({
      success: true,
      message: 'Verification initiated',
      verificationId: data.id,
      token: verificationToken,
      instructions,
      expiresAt: data.expires_at
    });

  } catch (error) {
    console.error('Verify Ownership Error:', error);
    res.status(500).json({ 
      error: 'Failed to initiate verification', 
      message: error.message 
    });
  }
});

// @route   POST /api/legal/check-verification
// @desc    Check ownership verification status
// @access  Private
router.post('/check-verification', [
  auth,
  body('verificationId').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { verificationId } = req.body;
    const userId = req.user.id;

    // Get verification record
    const { data: verification, error } = await supabase
      .from('ownership_verifications')
      .select('*')
      .eq('id', verificationId)
      .eq('user_id', userId)
      .single();

    if (error || !verification) {
      return res.status(404).json({ error: 'Verification not found' });
    }

    // Check if expired
    if (new Date() > new Date(verification.expires_at)) {
      return res.status(400).json({ error: 'Verification expired' });
    }

    // TODO: Implement actual verification checking logic
    // This would check DNS records, fetch files, or parse HTML meta tags
    
    res.json({
      success: true,
      verification: {
        id: verification.id,
        status: verification.status,
        url: verification.url,
        method: verification.verification_method,
        createdAt: verification.created_at,
        expiresAt: verification.expires_at
      }
    });

  } catch (error) {
    console.error('Check Verification Error:', error);
    res.status(500).json({ 
      error: 'Failed to check verification', 
      message: error.message 
    });
  }
});

export default router;