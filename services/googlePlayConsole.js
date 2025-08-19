import { google } from 'googleapis';
import fs from 'fs/promises';
import path from 'path';

/**
 * Google Play Console API Integration Service
 * Handles direct publishing to developer's Play Store account
 */
class GooglePlayConsoleService {
  constructor() {
    this.androidpublisher = null;
    this.auth = null;
  }

  /**
   * Initialize Google Play Console API with developer credentials
   */
  async initialize(serviceAccountKey) {
    try {
      const credentials = JSON.parse(serviceAccountKey);
      
      this.auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/androidpublisher']
      });
      
      this.androidpublisher = google.androidpublisher({
        version: 'v3',
        auth: this.auth
      });
      
      return { success: true };
    } catch (error) {
      console.error('Failed to initialize Google Play Console API:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate developer's Google Play Console credentials
   */
  async validateCredentials(serviceAccountKey, packageName) {
    try {
      const initResult = await this.initialize(serviceAccountKey);
      if (!initResult.success) {
        return { valid: false, error: initResult.error };
      }

      // Test API access by getting app details
      const response = await this.androidpublisher.applications.get({
        packageName: packageName
      });

      return { 
        valid: true, 
        appInfo: {
          packageName: response.data.packageName,
          defaultLanguage: response.data.defaultLanguage
        }
      };
    } catch (error) {
      return { 
        valid: false, 
        error: `Invalid credentials or package name: ${error.message}` 
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
   * Get app status from Google Play Console
   */
  async getAppStatus(serviceAccountKey, packageName) {
    try {
      const initResult = await this.initialize(serviceAccountKey);
      if (!initResult.success) {
        return { success: false, error: initResult.error };
      }

      const response = await this.androidpublisher.applications.get({
        packageName: packageName
      });

      return {
        success: true,
        status: {
          packageName: response.data.packageName,
          defaultLanguage: response.data.defaultLanguage,
          contactEmail: response.data.contactEmail,
          contactPhone: response.data.contactPhone
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