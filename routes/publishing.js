import express from 'express';
import googlePlayConsoleService from '../services/googlePlayConsole.js';
import { generateAPKFile, generateIPAFile, createWebViewApp } from '../services/appGenerator.js';
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();

/**
 * Validate Google Play Console credentials
 */
router.post('/validate-credentials', async (req, res) => {
  try {
    const { serviceAccountKey, packageName } = req.body;
    
    if (!serviceAccountKey || !packageName) {
      return res.status(400).json({
        success: false,
        error: 'Service account key and package name are required'
      });
    }

    const validation = await googlePlayConsoleService.validateCredentials(
      serviceAccountKey, 
      packageName
    );

    res.json(validation);
  } catch (error) {
    console.error('Credential validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate credentials'
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
router.get('/status/:publishId', async (req, res) => {
  try {
    const { publishId } = req.params;
    const { serviceAccountKey, packageName } = req.query;

    if (!serviceAccountKey || !packageName) {
      return res.status(400).json({
        success: false,
        error: 'Service account key and package name are required'
      });
    }

    const status = await googlePlayConsoleService.getAppStatus(
      serviceAccountKey, 
      packageName
    );

    res.json(status);
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check publishing status'
    });
  }
});

/**
 * Get developer onboarding guide
 */
router.get('/onboarding-guide', (req, res) => {
  res.json({
    success: true,
    guide: {
      title: 'Google Play Console Setup Guide',
      steps: [
        {
          step: 1,
          title: 'Create Google Play Console Account',
          description: 'Sign up for Google Play Console with a one-time $25 registration fee',
          url: 'https://play.google.com/console/signup'
        },
        {
          step: 2,
          title: 'Create a Service Account',
          description: 'Go to Google Cloud Console and create a service account for API access',
          url: 'https://console.cloud.google.com/iam-admin/serviceaccounts'
        },
        {
          step: 3,
          title: 'Enable Google Play Developer API',
          description: 'Enable the Google Play Developer API in your Google Cloud project',
          url: 'https://console.cloud.google.com/apis/library/androidpublisher.googleapis.com'
        },
        {
          step: 4,
          title: 'Grant Permissions',
          description: 'In Play Console, grant your service account the necessary permissions',
          permissions: ['Release manager', 'View app information']
        },
        {
          step: 5,
          title: 'Download Service Account Key',
          description: 'Download the JSON key file for your service account',
          note: 'Keep this file secure and never share it publicly'
        }
      ],
      requirements: {
        playConsoleAccount: '$25 one-time fee',
        googleCloudProject: 'Free tier available',
        serviceAccount: 'Required for API access',
        packageName: 'Must be unique (e.g., com.yourcompany.appname)'
      }
    }
  });
});

export default router;