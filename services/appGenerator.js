import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { uploadFile } from './database.js';

/**
 * Validate URL accessibility and mobile responsiveness
 */
const validateUrl = async (url) => {
  const validation = {
    isValid: false,
    errors: [],
    warnings: [],
    metadata: {}
  };

  try {
    // Basic URL format validation
    const urlObj = new URL(url);
    
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      validation.errors.push('URL must use HTTP or HTTPS protocol');
      return validation;
    }

    // Check SSL certificate
    if (urlObj.protocol === 'http:') {
      validation.warnings.push('Website does not use HTTPS - this may cause issues in mobile apps');
    }

    // Test URL accessibility
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
      },
      validateStatus: (status) => status < 500 // Accept redirects and client errors
    });

    if (response.status >= 400) {
      validation.errors.push(`Website returned ${response.status} status code`);
      return validation;
    }

    // Parse HTML content
    const $ = cheerio.load(response.data);
    
    // Extract metadata
    validation.metadata = {
      title: $('title').text() || $('meta[property="og:title"]').attr('content') || 'Untitled',
      description: $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '',
      favicon: $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href'),
      ogImage: $('meta[property="og:image"]').attr('content'),
      viewport: $('meta[name="viewport"]').attr('content'),
      charset: $('meta[charset]').attr('charset') || 'utf-8'
    };

    // Check mobile responsiveness
    const viewport = validation.metadata.viewport;
    if (!viewport || !viewport.includes('width=device-width')) {
      validation.warnings.push('Website may not be mobile-responsive');
    }

    // Check for common SaaS indicators
    const bodyText = $('body').text().toLowerCase();
    const saasKeywords = ['dashboard', 'login', 'signup', 'account', 'subscription', 'api', 'analytics', 'admin'];
    const foundKeywords = saasKeywords.filter(keyword => bodyText.includes(keyword));
    
    if (foundKeywords.length < 2) {
      validation.warnings.push('Website may not be a SaaS application');
    }

    validation.isValid = true;
    validation.metadata.saasScore = Math.min(foundKeywords.length * 2, 10); // Score out of 10

  } catch (error) {
    console.error('URL Validation Error:', error);
    
    if (error.code === 'ENOTFOUND') {
      validation.errors.push('Website not found - please check the URL');
    } else if (error.code === 'ECONNREFUSED') {
      validation.errors.push('Connection refused - website may be down');
    } else if (error.code === 'ETIMEDOUT') {
      validation.errors.push('Request timed out - website is too slow');
    } else {
      validation.errors.push(`Failed to access website: ${error.message}`);
    }
  }

  return validation;
};

/**
 * Generate app assets (icons, splash screens, etc.)
 */
const generateAppAssets = async (options) => {
  const {
    url,
    appName,
    description,
    customIcon
  } = options;

  const assets = {
    icons: {},
    splashScreens: {},
    screenshots: [],
    metadata: {}
  };

  try {
    let browser;
    
    try {
      // Launch Puppeteer for screenshots
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      
      // Take screenshots for different devices
      const devices = [
        { name: 'mobile', width: 375, height: 667 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'desktop', width: 1920, height: 1080 }
      ];

      for (const device of devices) {
        await page.setViewport({ width: device.width, height: device.height });
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        
        const screenshot = await page.screenshot({ 
          type: 'png',
          fullPage: false
        });

        // Upload screenshot to storage
        const screenshotPath = `screenshots/${Date.now()}-${device.name}.png`;
        const uploadResult = await uploadFile('app-assets', screenshotPath, screenshot, {
          contentType: 'image/png'
        });

        assets.screenshots.push({
          device: device.name,
          width: device.width,
          height: device.height,
          url: uploadResult.publicUrl,
          path: uploadResult.path
        });
      }

      // Generate favicon if not provided
      if (!customIcon) {
        await page.setViewport({ width: 512, height: 512 });
        
        // Try to find and capture the website's favicon or logo
        const logoSelector = 'img[alt*="logo" i], .logo img, [class*="logo"] img, img[src*="logo"]';
        const logoElement = await page.$(logoSelector);
        
        if (logoElement) {
          const logoBounds = await logoElement.boundingBox();
          if (logoBounds) {
            const logoScreenshot = await page.screenshot({
              clip: logoBounds,
              type: 'png'
            });

            // Process logo to create app icon
            const processedIcon = await sharp(logoScreenshot)
              .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
              .png()
              .toBuffer();

            const iconPath = `icons/${Date.now()}-app-icon.png`;
            const iconUpload = await uploadFile('app-assets', iconPath, processedIcon, {
              contentType: 'image/png'
            });

            assets.icons.main = iconUpload.publicUrl;
          }
        }
      }

    } finally {
      if (browser) {
        await browser.close();
      }
    }

    // Generate different icon sizes if we have a main icon
    if (assets.icons.main || customIcon) {
      const iconUrl = customIcon || assets.icons.main;
      const iconResponse = await axios.get(iconUrl, { responseType: 'arraybuffer' });
      const iconBuffer = Buffer.from(iconResponse.data);

      const iconSizes = [512, 192, 144, 96, 72, 48, 36];
      
      for (const size of iconSizes) {
        const resizedIcon = await sharp(iconBuffer)
          .resize(size, size)
          .png()
          .toBuffer();

        const sizePath = `icons/${Date.now()}-${size}x${size}.png`;
        const sizeUpload = await uploadFile('app-assets', sizePath, resizedIcon, {
          contentType: 'image/png'
        });

        assets.icons[`${size}x${size}`] = sizeUpload.publicUrl;
      }
    }

    // Generate splash screens
    const splashSizes = [
      { name: 'phone-portrait', width: 375, height: 667 },
      { name: 'phone-landscape', width: 667, height: 375 },
      { name: 'tablet-portrait', width: 768, height: 1024 },
      { name: 'tablet-landscape', width: 1024, height: 768 }
    ];

    for (const splash of splashSizes) {
      // Create a simple splash screen with app name and icon
      const splashSvg = `
        <svg width="${splash.width}" height="${splash.height}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#ffffff"/>
          <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" 
                font-family="Arial, sans-serif" font-size="24" fill="#333333">
            ${appName}
          </text>
        </svg>
      `;

      const splashBuffer = Buffer.from(splashSvg);
      const splashPng = await sharp(splashBuffer)
        .png()
        .toBuffer();

      const splashPath = `splash/${Date.now()}-${splash.name}.png`;
      const splashUpload = await uploadFile('app-assets', splashPath, splashPng, {
        contentType: 'image/png'
      });

      assets.splashScreens[splash.name] = splashUpload.publicUrl;
    }

    assets.metadata = {
      generatedAt: new Date().toISOString(),
      appName,
      description,
      sourceUrl: url
    };

  } catch (error) {
    console.error('Asset Generation Error:', error);
    throw new Error(`Failed to generate app assets: ${error.message}`);
  }

  return assets;
};

/**
 * Create WebView wrapper app configuration
 */
const createWebViewApp = async (options) => {
  const {
    url,
    appName,
    description,
    category,
    targetPlatforms,
    assets
  } = options;

  const appPackage = {
    metadata: {
      name: appName,
      description,
      category,
      version: '1.0.0',
      buildNumber: 1,
      targetPlatforms
    },
    configuration: {
      webview: {
        url: url,
        userAgent: 'RapidSaaSApp/1.0',
        enableJavaScript: true,
        enableDomStorage: true,
        enableFileAccess: false,
        allowUniversalAccessFromFileURLs: false
      },
      permissions: [
        'INTERNET',
        'ACCESS_NETWORK_STATE',
        'WRITE_EXTERNAL_STORAGE'
      ],
      features: {
        pullToRefresh: true,
        swipeNavigation: true,
        offlineSupport: false,
        pushNotifications: false
      }
    },
    assets: assets,
    build: {
      android: {
        packageName: `com.rapidsaas.${appName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        versionCode: 1,
        minSdkVersion: 21,
        targetSdkVersion: 33,
        compileSdkVersion: 33
      },
      ios: {
        bundleId: `com.rapidsaas.${appName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        version: '1.0.0',
        buildNumber: '1',
        minimumOSVersion: '12.0'
      }
    }
  };

  try {
    // Generate Flutter WebView app template
    const flutterConfig = generateFlutterConfig(appPackage);
    
    // Save configuration to storage
    const configPath = `apps/${Date.now()}-${appName.toLowerCase().replace(/[^a-z0-9]/g, '')}/config.json`;
    const configBuffer = Buffer.from(JSON.stringify(appPackage, null, 2));
    
    const configUpload = await uploadFile('app-configs', configPath, configBuffer, {
      contentType: 'application/json'
    });

    appPackage.configUrl = configUpload.publicUrl;
    
    // In a real implementation, this would trigger the actual app build process
    // For MVP, we'll simulate the build process
    appPackage.downloadLinks = {
      android: `https://builds.rapidsaas.com/android/${appPackage.build.android.packageName}.apk`,
      ios: `https://builds.rapidsaas.com/ios/${appPackage.build.ios.bundleId}.ipa`,
      config: configUpload.publicUrl
    };

    appPackage.buildStatus = 'completed';
    appPackage.buildTime = new Date().toISOString();

  } catch (error) {
    console.error('WebView App Creation Error:', error);
    throw new Error(`Failed to create WebView app: ${error.message}`);
  }

  return appPackage;
};

/**
 * Generate Flutter WebView app configuration
 */
const generateFlutterConfig = (appPackage) => {
  const { metadata, configuration, build } = appPackage;

  return {
    name: metadata.name,
    description: metadata.description,
    version: metadata.version,
    environment: {
      sdk: '>=3.0.0 <4.0.0',
      flutter: '>=3.10.0'
    },
    dependencies: {
      flutter: { sdk: 'flutter' },
      webview_flutter: '^4.4.1',
      connectivity_plus: '^5.0.1',
      shared_preferences: '^2.2.2',
      url_launcher: '^6.2.1'
    },
    flutter: {
      uses_material_design: true,
      assets: Object.values(appPackage.assets.icons || {})
        .concat(Object.values(appPackage.assets.splashScreens || {}))
    },
    webview_config: {
      initial_url: configuration.webview.url,
      user_agent: configuration.webview.userAgent,
      javascript_mode: configuration.webview.enableJavaScript ? 'JavascriptMode.unrestricted' : 'JavascriptMode.disabled',
      navigation_delegate: {
        allow_navigation: true,
        url_loading_strategy: 'UrlLoadingStrategy.inAppWebView'
      }
    },
    android_config: {
      package_name: build.android.packageName,
      version_code: build.android.versionCode,
      min_sdk_version: build.android.minSdkVersion,
      target_sdk_version: build.android.targetSdkVersion,
      permissions: configuration.permissions
    },
    ios_config: {
      bundle_id: build.ios.bundleId,
      version: build.ios.version,
      build_number: build.ios.buildNumber,
      minimum_os_version: build.ios.minimumOSVersion
    }
  };
};

/**
 * Check app build status
 */
const checkBuildStatus = async (appId) => {
  // In a real implementation, this would check the actual build service
  // For MVP, we'll simulate different build statuses
  
  const statuses = ['pending', 'building', 'testing', 'completed', 'failed'];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
  
  return {
    appId,
    status: randomStatus,
    progress: randomStatus === 'completed' ? 100 : Math.floor(Math.random() * 90) + 10,
    estimatedTime: randomStatus === 'completed' ? 0 : Math.floor(Math.random() * 30) + 5,
    logs: [
      'Initializing build environment...',
      'Downloading dependencies...',
      'Compiling Flutter app...',
      'Generating app assets...',
      'Building APK/IPA files...'
    ].slice(0, randomStatus === 'completed' ? 5 : Math.floor(Math.random() * 4) + 1),
    lastUpdated: new Date().toISOString()
  };
};

export {
  validateUrl,
  generateAppAssets,
  createWebViewApp,
  generateFlutterConfig,
  checkBuildStatus
};