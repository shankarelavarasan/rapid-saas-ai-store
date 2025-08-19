import express from 'express';
import { GooglePlayConsoleService } from '../services/googlePlayConsole.js';
import { generateAPKFile } from '../services/appGenerator.js';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();
const googlePlayService = new GooglePlayConsoleService();

// Store user sessions temporarily (in production, use Redis or database)
const userSessions = new Map();

/**
 * Initiate OAuth authorization flow
 */
router.get('/authorize', (req, res) => {
    try {
        const authUrl = googlePlayService.getAuthorizationUrl();
        
        res.json({
            success: true,
            authorizationUrl: authUrl,
            message: 'Please authorize your Google Play Developer account'
        });

    } catch (error) {
        console.error('Authorization initiation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to initiate authorization'
        });
    }
});

/**
 * Handle OAuth callback
 */
router.get('/oauth/callback', async (req, res) => {
    try {
        const { code, state } = req.query;

        if (!code) {
            return res.status(400).json({
                success: false,
                error: 'Authorization code not provided'
            });
        }

        // Exchange code for tokens
        const tokenResult = await googlePlayService.exchangeCodeForTokens(code);
        
        if (!tokenResult.success) {
            return res.status(401).json({
                success: false,
                error: 'Failed to exchange authorization code'
            });
        }

        // Generate session ID and store tokens
        const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        userSessions.set(sessionId, {
            tokens: tokenResult.tokens,
            authorizedAt: new Date(),
            expiresAt: new Date(tokenResult.tokens.expiry_date)
        });

        // Redirect to success page with session ID
        res.redirect(`/publish.html?authorized=true&session=${sessionId}`);

    } catch (error) {
        console.error('OAuth callback error:', error);
        res.redirect('/publish.html?error=authorization_failed');
    }
});

/**
 * Validate user authorization status
 */
router.post('/validate-authorization', async (req, res) => {
    try {
        const { sessionId, packageName } = req.body;

        if (!sessionId || !packageName) {
            return res.status(400).json({
                success: false,
                error: 'Session ID and package name are required'
            });
        }

        const session = userSessions.get(sessionId);
        if (!session) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired session'
            });
        }

        // Check if tokens are still valid
        if (new Date() > session.expiresAt) {
            userSessions.delete(sessionId);
            return res.status(401).json({
                success: false,
                error: 'Authorization expired, please re-authorize'
            });
        }

        // Initialize API with stored tokens
        await googlePlayService.initializeWithTokens(session.tokens);
        
        // Validate package name access
        const validationResult = await googlePlayService.validateCredentials(packageName);
        
        if (!validationResult.success) {
            return res.status(403).json({
                success: false,
                error: 'No access to the specified package name or invalid developer account'
            });
        }

        res.json({
            success: true,
            message: 'Authorization validated successfully',
            packageName: packageName,
            developerAccount: validationResult.developerAccount
        });

    } catch (error) {
        console.error('Authorization validation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to validate authorization'
        });
    }
});

/**
 * Publish app to Google Play Console using OAuth session
 */
router.post('/publish', async (req, res) => {
    try {
        const { 
            sessionId,
            packageName, 
            appName, 
            appDescription, 
            websiteUrl,
            iconUrl,
            track = 'internal' // Default to internal testing
        } = req.body;

        // Validate required fields
        if (!sessionId || !packageName || !appName || !websiteUrl) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: sessionId, packageName, appName, websiteUrl'
            });
        }

        // Validate session
        const session = userSessions.get(sessionId);
        if (!session) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired session. Please re-authorize.'
            });
        }

        // Check if tokens are still valid
        if (new Date() > session.expiresAt) {
            userSessions.delete(sessionId);
            return res.status(401).json({
                success: false,
                error: 'Authorization expired. Please re-authorize.'
            });
        }

        // Initialize Google Play Console API with stored tokens
        await googlePlayService.initializeWithTokens(session.tokens);

        // Generate APK file
        const apkResult = await generateAPKFile({
            appName,
            packageName,
            websiteUrl,
            iconUrl
        });

        if (!apkResult.success) {
            return res.status(500).json({
                success: false,
                error: 'Failed to generate APK file'
            });
        }

        // Publish to Google Play Console
        const publishResult = await googlePlayService.publishApp({
            packageName,
            apkPath: apkResult.apkPath,
            appName,
            appDescription: appDescription || `Mobile app for ${appName}`,
            track
        });

        // Clean up temporary APK file
        try {
            await fs.unlink(apkResult.apkPath);
        } catch (cleanupError) {
            console.warn('Failed to clean up temporary APK file:', cleanupError);
        }

        if (!publishResult.success) {
            return res.status(500).json({
                success: false,
                error: publishResult.error || 'Failed to publish app'
            });
        }

        res.json({
            success: true,
            message: 'App published successfully to your Google Play Console',
            editId: publishResult.editId,
            track: track,
            packageName: packageName,
            developerConsoleUrl: `https://play.google.com/console/u/0/developers/${publishResult.developerId}/app/${packageName}`
        });

    } catch (error) {
        console.error('App publishing error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to publish app'
        });
    }
});

/**
 * Direct publish to Google Play Console
 * This is the core "one-click" publishing functionality
 */
router.post('/publish-to-play-store', async (req, res) => {
  try {
    const {
      url,
      appName,
      description,
      serviceAccountKey,
      packageName,
      track = 'internal', // internal, alpha, beta, production
      category = 'productivity'
    } = req.body;

    // Validate required fields
    if (!url || !appName || !serviceAccountKey || !packageName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: url, appName, serviceAccountKey, packageName'
      });
    }

    // Step 1: Validate credentials first
    const credentialValidation = await googlePlayConsoleService.validateCredentials(
      serviceAccountKey, 
      packageName
    );
    
    if (!credentialValidation.valid) {
      return res.status(400).json({
        success: false,
        error: `Invalid credentials: ${credentialValidation.error}`
      });
    }

    // Step 2: Generate the mobile app package
    const appOptions = {
      url,
      appName,
      description,
      category,
      targetPlatforms: ['android']
    };

    const appPackage = await createWebViewApp(appOptions);
    
    // Step 3: Generate temporary APK file (will be deleted after upload)
    const timestamp = Date.now();
    const tempApkFilename = `temp_${packageName}_${timestamp}.apk`;
    const tempApkPath = path.join(process.cwd(), 'downloads', tempApkFilename);
    
    await generateAPKFile(appPackage, tempApkPath);

    // Step 4: Publish directly to Google Play Console
    const publishResult = await googlePlayConsoleService.publishApp({
      serviceAccountKey,
      packageName,
      apkFilePath: tempApkPath,
      appTitle: appName,
      shortDescription: description.substring(0, 80), // Play Store limit
      fullDescription: description,
      track
    });

    // Step 5: Clean up temporary file (security measure)
    try {
      await fs.unlink(tempApkPath);
      console.log(`Temporary APK file deleted: ${tempApkPath}`);
    } catch (cleanupError) {
      console.warn('Failed to delete temporary APK:', cleanupError.message);
    }

    if (publishResult.success) {
      res.json({
        success: true,
        publishId: publishResult.publishId,
        versionCode: publishResult.versionCode,
        track: publishResult.track,
        status: 'published',
        consoleUrl: publishResult.consoleUrl,
        message: 'App successfully published to Google Play Console',
        timeline: {
          submitted: new Date().toISOString(),
          estimatedReview: '1-3 business days',
          estimatedLive: '2-4 business days'
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: publishResult.error
      });
    }

  } catch (error) {
    console.error('Publishing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to publish app to Google Play Store'
    });
  }
});

/**
 * Get publishing status
 */
router.get('/status/:sessionId/:packageName', async (req, res) => {
    try {
        const { sessionId, packageName } = req.params;

        const session = userSessions.get(sessionId);
        if (!session) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired session'
            });
        }

        // Check if tokens are still valid
        if (new Date() > session.expiresAt) {
            userSessions.delete(sessionId);
            return res.status(401).json({
                success: false,
                error: 'Authorization expired'
            });
        }

        // Initialize API with stored tokens
        await googlePlayService.initializeWithTokens(session.tokens);
        
        // Get app status
        const statusResult = await googlePlayService.getAppStatus(packageName);
        
        res.json({
            success: true,
            status: statusResult
        });

    } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check app status'
        });
    }
});

/**
 * Get onboarding guide for Google Play Console OAuth setup
 */
router.get('/onboarding-guide', (req, res) => {
    res.json({
        success: true,
        guide: {
            title: 'Google Play Developer Authorization Guide',
            subtitle: 'Secure OAuth-based publishing workflow',
            steps: [
                {
                    step: 1,
                    title: 'Google Play Developer Account Required',
                    description: 'You must have an active Google Play Developer account to use our publishing service',
                    requirements: [
                        'Active Google Play Developer account ($25 one-time fee)',
                        'Published at least one app (or have publishing permissions)',
                        'Valid Google account with developer access'
                    ],
                    note: 'This requirement serves as our primary security filter - only legitimate developers can authorize our platform'
                },
                {
                    step: 2,
                    title: 'One-Click Authorization',
                    description: 'Click "Authorize with Google Play" to connect your developer account',
                    process: [
                        'You\'ll be redirected to Google\'s secure OAuth screen',
                        'Sign in with your Google Play Developer account',
                        'Grant our platform permission to publish on your behalf',
                        'You\'ll be redirected back with authorization confirmed'
                    ]
                },
                {
                    step: 3,
                    title: 'Secure Publishing',
                    description: 'Once authorized, you can publish apps directly to your Play Console',
                    benefits: [
                        'No manual file downloads or uploads',
                        'Apps appear directly in your Play Console',
                        'Full control over your developer account',
                        'Revoke access anytime from your Google account settings'
                    ]
                },
                {
                    step: 4,
                    title: 'Google\'s Review Process',
                    description: 'All published apps go through Google\'s standard review process',
                    security: [
                        'Google reviews all apps before they go live',
                        'Your developer account reputation is maintained',
                        'Standard Play Store policies apply',
                        'You retain full ownership and control'
                    ]
                }
            ],
            security: {
                title: 'Why This Model is Secure',
                points: [
                    'Only verified Google Play Developers can use our service',
                    'We never see your passwords - OAuth handles authentication',
                    'You can revoke our access anytime from your Google account',
                    'All apps go through Google\'s rigorous review process',
                    'Your developer account and reputation remain under your control'
                ]
            },
            troubleshooting: {
                'Not a Google Play Developer': 'You must have an active Google Play Developer account to authorize our platform',
                'Authorization failed': 'Make sure you\'re signed in to the correct Google account with developer access',
                'Access denied': 'Ensure your Google Play Developer account is in good standing and has publishing permissions'
            }
        }
    });
});

export default router;