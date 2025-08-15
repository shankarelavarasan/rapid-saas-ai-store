import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { uploadSingle } from './fileUpload.js';

/**
 * Generate app icon using AI or template-based approach
 * @param {Object} options - Icon generation options
 * @param {string} options.appName - Name of the app
 * @param {string} options.description - App description
 * @param {string} options.category - App category
 * @param {string} options.style - Icon style preference
 * @param {number} options.size - Icon size (default: 512)
 * @returns {Promise<Object>} Generated icon data
 */
async function generateIcon(options) {
  try {
    const {
      appName,
      description = '',
      category = 'utility',
      style = 'modern',
      size = 512
    } = options;

    // For now, create a simple colored square with app initial
    // In production, this would integrate with AI image generation services
    const initial = appName.charAt(0).toUpperCase();
    const colors = {
      'productivity': '#4F46E5',
      'entertainment': '#EF4444',
      'utility': '#10B981',
      'business': '#F59E0B',
      'education': '#8B5CF6',
      'health': '#06B6D4',
      'finance': '#84CC16',
      'social': '#F97316',
      'default': '#6B7280'
    };

    const backgroundColor = colors[category] || colors.default;
    
    // Create SVG icon
    const svgIcon = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="${backgroundColor}" rx="${size * 0.15}"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.4}" 
              font-weight="bold" fill="white" text-anchor="middle" dy="0.35em">
          ${initial}
        </text>
      </svg>
    `;

    // Convert SVG to PNG using Sharp
    const iconBuffer = await sharp(Buffer.from(svgIcon))
      .png()
      .toBuffer();

    // Create temporary file
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.mkdir(tempDir, { recursive: true });
    
    const tempFilePath = path.join(tempDir, `icon-${Date.now()}.png`);
    await fs.writeFile(tempFilePath, iconBuffer);

    // Upload to cloud storage
    const uploadResult = await uploadSingle(tempFilePath, {
      folder: 'app-icons',
      public_id: `icon-${appName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
    });

    // Clean up temp file
    await fs.unlink(tempFilePath).catch(() => {});

    return {
      success: true,
      iconUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      size: size,
      format: 'png',
      metadata: {
        appName,
        category,
        style,
        generatedAt: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('Icon generation error:', error);
    return {
      success: false,
      error: error.message,
      fallbackIcon: `https://via.placeholder.com/${options.size || 512}x${options.size || 512}/6B7280/FFFFFF?text=${encodeURIComponent(options.appName?.charAt(0) || 'A')}`
    };
  }
}

/**
 * Generate app splash screen
 * @param {Object} options - Splash screen generation options
 * @param {string} options.appName - Name of the app
 * @param {string} options.iconUrl - App icon URL
 * @param {string} options.category - App category
 * @param {string} options.theme - Theme preference (light/dark)
 * @param {Object} options.dimensions - Screen dimensions
 * @returns {Promise<Object>} Generated splash screen data
 */
async function generateSplashScreen(options) {
  try {
    const {
      appName,
      iconUrl,
      category = 'utility',
      theme = 'light',
      dimensions = { width: 1080, height: 1920 }
    } = options;

    const { width, height } = dimensions;
    
    // Color schemes based on theme and category
    const colorSchemes = {
      light: {
        background: '#FFFFFF',
        text: '#1F2937',
        accent: '#4F46E5'
      },
      dark: {
        background: '#111827',
        text: '#F9FAFB',
        accent: '#6366F1'
      }
    };

    const colors = colorSchemes[theme] || colorSchemes.light;
    
    // Create SVG splash screen
    const svgSplash = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colors.background};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colors.accent};stop-opacity:0.1" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="${width}" height="${height}" fill="url(#bg)"/>
        
        <!-- App Icon Placeholder -->
        <circle cx="${width/2}" cy="${height/2 - 100}" r="80" fill="${colors.accent}" opacity="0.2"/>
        <circle cx="${width/2}" cy="${height/2 - 100}" r="60" fill="${colors.accent}"/>
        <text x="${width/2}" y="${height/2 - 100}" font-family="Arial, sans-serif" 
              font-size="48" font-weight="bold" fill="white" text-anchor="middle" dy="0.35em">
          ${appName.charAt(0).toUpperCase()}
        </text>
        
        <!-- App Name -->
        <text x="${width/2}" y="${height/2 + 50}" font-family="Arial, sans-serif" 
              font-size="36" font-weight="600" fill="${colors.text}" text-anchor="middle">
          ${appName}
        </text>
        
        <!-- Loading indicator -->
        <circle cx="${width/2}" cy="${height/2 + 150}" r="3" fill="${colors.accent}">
          <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite"/>
        </circle>
        <circle cx="${width/2 + 20}" cy="${height/2 + 150}" r="3" fill="${colors.accent}">
          <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" begin="0.3s" repeatCount="indefinite"/>
        </circle>
        <circle cx="${width/2 + 40}" cy="${height/2 + 150}" r="3" fill="${colors.accent}">
          <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" begin="0.6s" repeatCount="indefinite"/>
        </circle>
      </svg>
    `;

    // Convert SVG to PNG
    const splashBuffer = await sharp(Buffer.from(svgSplash))
      .png()
      .toBuffer();

    // Create temporary file
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.mkdir(tempDir, { recursive: true });
    
    const tempFilePath = path.join(tempDir, `splash-${Date.now()}.png`);
    await fs.writeFile(tempFilePath, splashBuffer);

    // Upload to cloud storage
    const uploadResult = await uploadSingle(tempFilePath, {
      folder: 'app-splash-screens',
      public_id: `splash-${appName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
    });

    // Clean up temp file
    await fs.unlink(tempFilePath).catch(() => {});

    return {
      success: true,
      splashUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      dimensions,
      theme,
      metadata: {
        appName,
        category,
        theme,
        generatedAt: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('Splash screen generation error:', error);
    return {
      success: false,
      error: error.message,
      fallbackSplash: `https://via.placeholder.com/${options.dimensions?.width || 1080}x${options.dimensions?.height || 1920}/${theme === 'dark' ? '111827' : 'FFFFFF'}/${theme === 'dark' ? 'F9FAFB' : '1F2937'}?text=${encodeURIComponent(options.appName || 'App')}`
    };
  }
}

/**
 * Generate multiple icon sizes for different platforms
 * @param {Object} options - Icon generation options
 * @returns {Promise<Object>} Generated icons for different sizes
 */
async function generateIconSet(options) {
  const sizes = [16, 32, 48, 64, 128, 256, 512, 1024];
  const iconSet = {};
  
  try {
    for (const size of sizes) {
      const result = await generateIcon({ ...options, size });
      if (result.success) {
        iconSet[`icon_${size}`] = result.iconUrl;
      }
    }
    
    return {
      success: true,
      iconSet,
      metadata: {
        generatedAt: new Date().toISOString(),
        sizes: sizes
      }
    };
  } catch (error) {
    console.error('Icon set generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export {
  generateIcon,
  generateSplashScreen,
  generateIconSet
};