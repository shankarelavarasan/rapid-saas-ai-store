import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

/**
 * Google Play Console API Integration Service
 * Handles OAuth-based authorization and direct publishing to Google Play Store
 */
class GooglePlayConsoleService {
  constructor() {
    this.androidpublisher = null;
    this.oauth2Client = null;
    this.credentials = {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/publishing/oauth/callback'
    };
  }

  /**
   * Generate OAuth authorization URL for Google Play Developer account
   * @returns {string} Authorization URL
   */
  getAuthorizationUrl() {
    this.oauth2Client = new google.auth.OAuth2(
      this.credentials.client_id,
      this.credentials.client_secret,
      this.credentials.redirect_uri
    );

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/androidpublisher'],
      prompt: 'consent'
    });

    return authUrl;
  }

  /**
   * Exchange authorization code for access tokens
   * @param {string} authorizationCode - Authorization code from OAuth callback
   */
  async exchangeCodeForTokens(authorizationCode) {
    try {
      if (!this.oauth2Client) {
        throw new Error('OAuth client not initialized');
      }

      const { tokens } = await this.oauth2Client.getToken(authorizationCode);
      this.oauth2Client.setCredentials(tokens);

      // Initialize Android Publisher API with OAuth credentials
      this.androidpublisher = google.androidpublisher({
        version: 'v3',
        auth: this.oauth2Client
      });

      return { 
        success: true, 
        message: 'Google Play Developer account authorized successfully',
        tokens: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expiry_date: tokens.expiry_date
        }
      };
    } catch (error) {
      console.error('Failed to exchange authorization code:', error);
      throw new Error(`OAuth authorization failed: ${error.message}`);
    }
  }

  /**
   * Initialize API with existing OAuth tokens
   * @param {Object} tokens - OAuth tokens (access_token, refresh_token, etc.)
   */
  async initializeWithTokens(tokens) {
    try {
      this.oauth2Client = new google.auth.OAuth2(
        this.credentials.client_id,
        this.credentials.client_secret,
        this.credentials.redirect_uri
      );

      this.oauth2Client.setCredentials(tokens);

      // Initialize Android Publisher API
      this.androidpublisher = google.androidpublisher({
        version: 'v3',
        auth: this.oauth2Client
      });

      return { success: true, message: 'Google Play Console API initialized with OAuth tokens' };
    } catch (error) {
      console.error('Failed to initialize with tokens:', error);
      throw new Error(`Token initialization failed: ${error.message}`);
    }
  }

  /**
   * Validate Google Play Console credentials and package access
   * @param {string} packageName - App package name
   */
  async validateCredentials(packageName) {
    try {
      if (!this.androidpublisher) {
        return {
          valid: false,
          error: 'Google Play Console API not initialized'
        };
      }

      // Try to access the app to validate permissions
      const response = await this.androidpublisher.edits.insert({
        packageName: packageName
      });

      if (response.data && response.data.id) {
        // Get developer account info if possible
        let developerAccount = null;
        try {
          const accountResponse = await this.androidpublisher.edits.get({
            packageName: packageName,
            editId: response.data.id
          });
          developerAccount = accountResponse.data;
        } catch (accountError) {
          // Account info is optional
        }

        return {
          valid: true,
          message: 'Credentials and package access validated',
          developerAccount: developerAccount
        };
      } else {
        return {
          valid: false,
          error: 'Unable to access the specified package'
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: `Validation failed: ${error.message}`
      };
    }
  }

  /**
   * Create a new edit session for app publishing
   */
  async createEdit(packageName) {
    try {
      const response = await this.androidpublisher.edits.insert({
        packageName: packageName,
        requestBody: {}
      });
      
      return { 
        success: true, 
        editId: response.data.id 
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to create edit session: ${error.message}` 
      };
    }
  }

  /**
   * Upload APK directly to Google Play Console
   */
  async uploadAPK(packageName, editId, apkFilePath) {
    try {
      const apkData = await fs.readFile(apkFilePath);
      
      const response = await this.androidpublisher.edits.apks.upload({
        packageName: packageName,
        editId: editId,
        media: {
          mimeType: 'application/vnd.android.package-archive',
          body: apkData
        }
      });
      
      return { 
        success: true, 
        versionCode: response.data.versionCode,
        sha1: response.data.binary.sha1
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to upload APK: ${error.message}` 
      };
    }
  }

  /**
   * Update app listing information
   */
  async updateListing(packageName, editId, listingData) {
    try {
      const { language = 'en-US', title, shortDescription, fullDescription } = listingData;
      
      const response = await this.androidpublisher.edits.listings.update({
        packageName: packageName,
        editId: editId,
        language: language,
        requestBody: {
          title: title,
          shortDescription: shortDescription,
          fullDescription: fullDescription
        }
      });
      
      return { success: true, listing: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to update listing: ${error.message}` 
      };
    }
  }

  /**
   * Assign APK to a track (internal, alpha, beta, production)
   */
  async assignToTrack(packageName, editId, versionCode, track = 'internal') {
    try {
      const response = await this.androidpublisher.edits.tracks.update({
        packageName: packageName,
        editId: editId,
        track: track,
        requestBody: {
          releases: [{
            versionCodes: [versionCode.toString()],
            status: 'completed'
          }]
        }
      });
      
      return { success: true, track: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to assign to track: ${error.message}` 
      };
    }
  }

  /**
   * Commit the edit session to publish changes
   */
  async commitEdit(packageName, editId) {
    try {
      const response = await this.androidpublisher.edits.commit({
        packageName: packageName,
        editId: editId
      });
      
      return { success: true, edit: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to commit edit: ${error.message}` 
      };
    }
  }

  /**
   * Complete end-to-end publishing process
   */
  async publishApp(publishData) {
    const {
      serviceAccountKey,
      packageName,
      apkFilePath,
      appTitle,
      shortDescription,
      fullDescription,
      track = 'internal'
    } = publishData;

    try {
      // Step 1: Initialize API
      const initResult = await this.initialize(serviceAccountKey);
      if (!initResult.success) {
        throw new Error(initResult.error);
      }

      // Step 2: Create edit session
      const editResult = await this.createEdit(packageName);
      if (!editResult.success) {
        throw new Error(editResult.error);
      }
      const editId = editResult.editId;

      // Step 3: Upload APK
      const uploadResult = await this.uploadAPK(packageName, editId, apkFilePath);
      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }
      const versionCode = uploadResult.versionCode;

      // Step 4: Update app listing
      const listingResult = await this.updateListing(packageName, editId, {
        title: appTitle,
        shortDescription: shortDescription,
        fullDescription: fullDescription
      });
      if (!listingResult.success) {
        console.warn('Listing update failed:', listingResult.error);
      }

      // Step 5: Assign to track
      const trackResult = await this.assignToTrack(packageName, editId, versionCode, track);
      if (!trackResult.success) {
        throw new Error(trackResult.error);
      }

      // Step 6: Commit changes
      const commitResult = await this.commitEdit(packageName, editId);
      if (!commitResult.success) {
        throw new Error(commitResult.error);
      }

      return {
        success: true,
        publishId: `${packageName}_${Date.now()}`,
        versionCode: versionCode,
        track: track,
        status: 'published',
        consoleUrl: `https://play.google.com/console/developers/${packageName}/app-bundle`,
        message: `App successfully published to ${track} track`
      };

    } catch (error) {
      console.error('Publishing failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get app publishing status
   * @param {string} packageName - App package name
   */
  async getAppStatus(packageName) {
    try {
      if (!this.androidpublisher) {
        return { 
          success: false, 
          error: 'Google Play Console API not initialized' 
        };
      }

      // Get app information
      const appResponse = await this.androidpublisher.applications.get({
        packageName: packageName
      });

      // Get latest edit information
      const editResponse = await this.androidpublisher.edits.insert({
        packageName: packageName
      });

      return {
        success: true,
        status: {
          packageName: appResponse.data.packageName,
          defaultLanguage: appResponse.data.defaultLanguage,
          editId: editResponse.data.id,
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get app status: ${error.message}`
      };
    }
  }
}

// Export singleton instance
const googlePlayConsoleService = new GooglePlayConsoleService();
export default googlePlayConsoleService;

// Export class for testing
export { GooglePlayConsoleService };