import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Cloudinary storage configuration
 */
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'rapid-saas-store',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico'],
    transformation: [
      { quality: 'auto' },
      { fetch_format: 'auto' }
    ]
  }
});

/**
 * Multer configuration for file uploads
 */
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    files: 10 // Maximum 10 files per upload
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg|ico/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

/**
 * Upload single file
 */
const uploadSingle = upload.single('file');

/**
 * Upload multiple files
 */
const uploadMultiple = upload.array('files', 10);

/**
 * Upload app icon with optimization
 */
const uploadAppIcon = async (file, options = {}) => {
  try {
    const {
      appId,
      sizes = [512, 256, 128, 64, 32],
      format = 'png'
    } = options;

    const results = [];

    // Upload original
    const originalUpload = await cloudinary.uploader.upload(file.path || file.buffer, {
      folder: `rapid-saas-store/apps/${appId}/icons`,
      public_id: 'icon_original',
      resource_type: 'image',
      overwrite: true
    });

    results.push({
      size: 'original',
      url: originalUpload.secure_url,
      publicId: originalUpload.public_id
    });

    // Generate different sizes
    for (const size of sizes) {
      const resizedUpload = await cloudinary.uploader.upload(file.path || file.buffer, {
        folder: `rapid-saas-store/apps/${appId}/icons`,
        public_id: `icon_${size}x${size}`,
        resource_type: 'image',
        transformation: [
          { width: size, height: size, crop: 'fill' },
          { quality: 'auto' },
          { format: format }
        ],
        overwrite: true
      });

      results.push({
        size: `${size}x${size}`,
        url: resizedUpload.secure_url,
        publicId: resizedUpload.public_id
      });
    }

    return {
      success: true,
      icons: results
    };
  } catch (error) {
    console.error('Upload App Icon Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Upload app screenshots
 */
const uploadScreenshots = async (files, options = {}) => {
  try {
    const {
      appId,
      deviceType = 'mobile',
      optimize = true
    } = options;

    const results = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      let transformation = [];
      
      if (optimize) {
        transformation = [
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ];

        // Device-specific optimizations
        if (deviceType === 'mobile') {
          transformation.push({ width: 1080, height: 1920, crop: 'limit' });
        } else if (deviceType === 'tablet') {
          transformation.push({ width: 1536, height: 2048, crop: 'limit' });
        }
      }

      const upload = await cloudinary.uploader.upload(file.path || file.buffer, {
        folder: `rapid-saas-store/apps/${appId}/screenshots`,
        public_id: `screenshot_${i + 1}`,
        resource_type: 'image',
        transformation,
        overwrite: true
      });

      results.push({
        index: i + 1,
        url: upload.secure_url,
        publicId: upload.public_id,
        width: upload.width,
        height: upload.height,
        format: upload.format,
        size: upload.bytes
      });
    }

    return {
      success: true,
      screenshots: results
    };
  } catch (error) {
    console.error('Upload Screenshots Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Upload feature graphic for app stores
 */
const uploadFeatureGraphic = async (file, options = {}) => {
  try {
    const {
      appId,
      storeType = 'play_store' // play_store, app_store, both
    } = options;

    const results = [];

    // Play Store feature graphic (1024x500)
    if (storeType === 'play_store' || storeType === 'both') {
      const playStoreUpload = await cloudinary.uploader.upload(file.path || file.buffer, {
        folder: `rapid-saas-store/apps/${appId}/graphics`,
        public_id: 'feature_graphic_play_store',
        resource_type: 'image',
        transformation: [
          { width: 1024, height: 500, crop: 'fill' },
          { quality: 'auto' },
          { format: 'jpg' }
        ],
        overwrite: true
      });

      results.push({
        store: 'play_store',
        dimensions: '1024x500',
        url: playStoreUpload.secure_url,
        publicId: playStoreUpload.public_id
      });
    }

    // App Store feature graphic (1200x630)
    if (storeType === 'app_store' || storeType === 'both') {
      const appStoreUpload = await cloudinary.uploader.upload(file.path || file.buffer, {
        folder: `rapid-saas-store/apps/${appId}/graphics`,
        public_id: 'feature_graphic_app_store',
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 630, crop: 'fill' },
          { quality: 'auto' },
          { format: 'jpg' }
        ],
        overwrite: true
      });

      results.push({
        store: 'app_store',
        dimensions: '1200x630',
        url: appStoreUpload.secure_url,
        publicId: appStoreUpload.public_id
      });
    }

    return {
      success: true,
      graphics: results
    };
  } catch (error) {
    console.error('Upload Feature Graphic Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Generate and upload app assets from URL
 */
const generateAssetsFromUrl = async (url, options = {}) => {
  try {
    const {
      appId,
      appName,
      generateIcon = true,
      generateScreenshots = true,
      screenshotCount = 3
    } = options;

    const results = {
      icon: null,
      screenshots: [],
      favicon: null
    };

    // Try to get favicon first
    try {
      const faviconUrl = `${new URL(url).origin}/favicon.ico`;
      const faviconUpload = await cloudinary.uploader.upload(faviconUrl, {
        folder: `rapid-saas-store/apps/${appId}/assets`,
        public_id: 'favicon',
        resource_type: 'image',
        transformation: [
          { width: 512, height: 512, crop: 'fill' },
          { quality: 'auto' },
          { format: 'png' }
        ],
        overwrite: true
      });

      results.favicon = {
        url: faviconUpload.secure_url,
        publicId: faviconUpload.public_id
      };
    } catch (faviconError) {
      console.log('Favicon not found or failed to upload:', faviconError.message);
    }

    // Generate default icon if needed
    if (generateIcon && !results.favicon) {
      const iconText = appName.substring(0, 2).toUpperCase();
      const iconUpload = await cloudinary.uploader.upload(`data:image/svg+xml;base64,${Buffer.from(`
        <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
          <rect width="512" height="512" fill="#007AFF" rx="64"/>
          <text x="256" y="320" font-family="Arial, sans-serif" font-size="200" font-weight="bold" text-anchor="middle" fill="white">${iconText}</text>
        </svg>
      `).toString('base64')}`, {
        folder: `rapid-saas-store/apps/${appId}/assets`,
        public_id: 'generated_icon',
        resource_type: 'image',
        overwrite: true
      });

      results.icon = {
        url: iconUpload.secure_url,
        publicId: iconUpload.public_id,
        generated: true
      };
    }

    return {
      success: true,
      assets: results
    };
  } catch (error) {
    console.error('Generate Assets Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete file from Cloudinary
 */
const deleteFile = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return {
      success: result.result === 'ok',
      result
    };
  } catch (error) {
    console.error('Delete File Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete all app assets
 */
const deleteAppAssets = async (appId) => {
  try {
    // Delete entire app folder
    const result = await cloudinary.api.delete_resources_by_prefix(
      `rapid-saas-store/apps/${appId}/`
    );

    return {
      success: true,
      deletedCount: Object.keys(result.deleted).length,
      result
    };
  } catch (error) {
    console.error('Delete App Assets Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get file info from Cloudinary
 */
const getFileInfo = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId);
    return {
      success: true,
      fileInfo: result
    };
  } catch (error) {
    console.error('Get File Info Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Generate optimized images for different devices
 */
const generateResponsiveImages = async (publicId, options = {}) => {
  try {
    const {
      sizes = [320, 640, 768, 1024, 1280, 1920],
      format = 'auto',
      quality = 'auto'
    } = options;

    const responsiveImages = [];

    for (const size of sizes) {
      const url = cloudinary.url(publicId, {
        width: size,
        crop: 'scale',
        quality,
        format
      });

      responsiveImages.push({
        width: size,
        url,
        srcset: `${url} ${size}w`
      });
    }

    return {
      success: true,
      responsiveImages
    };
  } catch (error) {
    console.error('Generate Responsive Images Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Middleware for handling file upload errors
 */
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Maximum is 10 files.'
      });
    }
  }

  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      success: false,
      error: 'Only image files are allowed!'
    });
  }

  return res.status(500).json({
    success: false,
    error: 'File upload failed.'
  });
};

export {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadAppIcon,
  uploadScreenshots,
  uploadFeatureGraphic,
  generateAssetsFromUrl,
  deleteFile,
  deleteAppAssets,
  getFileInfo,
  generateResponsiveImages,
  handleUploadError,
  cloudinary
};