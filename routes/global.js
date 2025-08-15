import express from 'express';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { 
  detectUserRegion,
  getLocalizedContent,
  convertCurrency,
  formatCurrency,
  getRegionalStorePreferences,
  storeUserPreferences,
  getUserPreferences,
  getGlobalMarketplaceStats,
  GLOBAL_REGIONS,
  SUPPORTED_LANGUAGES,
  EXCHANGE_RATES
} from '../services/globalScaling.js';

const router = express.Router();

/**
 * GET /api/global/detect-region
 * Detect user's region and language preferences
 */
router.get('/detect-region', optionalAuth, async (req, res) => {
  try {
    const regionInfo = await detectUserRegion(req);

    res.json({
      success: true,
      data: {
        region: regionInfo.region,
        countryCode: regionInfo.countryCode,
        preferredLanguage: regionInfo.preferredLanguage,
        regionConfig: {
          name: regionInfo.regionConfig.name,
          country: regionInfo.regionConfig.country,
          continent: regionInfo.regionConfig.continent,
          currency: regionInfo.regionConfig.currency,
          languages: regionInfo.regionConfig.languages,
          timezone: regionInfo.regionConfig.timezone
        },
        languageConfig: {
          name: regionInfo.languageConfig.name,
          nativeName: regionInfo.languageConfig.nativeName,
          direction: regionInfo.languageConfig.direction,
          currency: regionInfo.languageConfig.currency,
          dateFormat: regionInfo.languageConfig.dateFormat,
          numberFormat: regionInfo.languageConfig.numberFormat
        }
      }
    });

  } catch (error) {
    console.error('Detect Region Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to detect region'
    });
  }
});

/**
 * GET /api/global/regions
 * Get all available regions
 */
router.get('/regions', (req, res) => {
  try {
    const regions = Object.entries(GLOBAL_REGIONS).map(([key, config]) => ({
      id: key,
      name: config.name,
      country: config.country,
      continent: config.continent,
      currency: config.currency,
      languages: config.languages,
      timezone: config.timezone,
      active: config.active
    }));

    res.json({
      success: true,
      data: {
        regions,
        count: regions.length,
        active: regions.filter(r => r.active).length
      }
    });

  } catch (error) {
    console.error('Get Regions Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve regions'
    });
  }
});

/**
 * GET /api/global/languages
 * Get all supported languages
 */
router.get('/languages', (req, res) => {
  try {
    const languages = Object.entries(SUPPORTED_LANGUAGES).map(([key, config]) => ({
      code: key,
      name: config.name,
      nativeName: config.nativeName,
      direction: config.direction,
      currency: config.currency,
      dateFormat: config.dateFormat,
      numberFormat: config.numberFormat,
      regions: config.regions
    }));

    res.json({
      success: true,
      data: {
        languages,
        count: languages.length
      }
    });

  } catch (error) {
    console.error('Get Languages Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve languages'
    });
  }
});

/**
 * GET /api/global/content/:key
 * Get localized content
 */
router.get('/content/:key', optionalAuth, async (req, res) => {
  try {
    const { key } = req.params;
    const { language = 'en-US', region = 'us-east-1' } = req.query;

    const content = await getLocalizedContent(key, language, region);

    res.json({
      success: true,
      data: {
        key,
        content,
        language,
        region
      }
    });

  } catch (error) {
    console.error('Get Localized Content Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve localized content'
    });
  }
});

/**
 * POST /api/global/content/batch
 * Get multiple localized content items
 */
router.post('/content/batch', optionalAuth, async (req, res) => {
  try {
    const { keys, language = 'en-US', region = 'us-east-1' } = req.body;

    if (!keys || !Array.isArray(keys)) {
      return res.status(400).json({
        success: false,
        error: 'Keys array is required'
      });
    }

    if (keys.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 50 keys allowed per batch'
      });
    }

    const content = {};
    for (const key of keys) {
      content[key] = await getLocalizedContent(key, language, region);
    }

    res.json({
      success: true,
      data: {
        content,
        language,
        region,
        count: Object.keys(content).length
      }
    });

  } catch (error) {
    console.error('Get Batch Localized Content Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve localized content'
    });
  }
});

/**
 * POST /api/global/convert-currency
 * Convert currency amounts
 */
router.post('/convert-currency', (req, res) => {
  try {
    const { amount, fromCurrency, toCurrency, format = false, language = 'en-US' } = req.body;

    if (!amount || !fromCurrency || !toCurrency) {
      return res.status(400).json({
        success: false,
        error: 'Amount, fromCurrency, and toCurrency are required'
      });
    }

    if (amount < 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be positive'
      });
    }

    const convertedAmount = convertCurrency(amount, fromCurrency, toCurrency);
    const formattedAmount = format ? formatCurrency(convertedAmount, toCurrency, language) : convertedAmount;

    res.json({
      success: true,
      data: {
        originalAmount: amount,
        convertedAmount,
        formattedAmount: format ? formattedAmount : undefined,
        fromCurrency,
        toCurrency,
        exchangeRate: EXCHANGE_RATES[toCurrency] / EXCHANGE_RATES[fromCurrency]
      }
    });

  } catch (error) {
    console.error('Convert Currency Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to convert currency',
      details: error.message
    });
  }
});

/**
 * GET /api/global/exchange-rates
 * Get current exchange rates
 */
router.get('/exchange-rates', (req, res) => {
  try {
    const { baseCurrency = 'USD' } = req.query;

    const rates = {};
    const baseRate = EXCHANGE_RATES[baseCurrency] || 1;

    Object.entries(EXCHANGE_RATES).forEach(([currency, rate]) => {
      rates[currency] = rate / baseRate;
    });

    res.json({
      success: true,
      data: {
        baseCurrency,
        rates,
        lastUpdated: new Date().toISOString(),
        disclaimer: 'Exchange rates are for demonstration purposes only'
      }
    });

  } catch (error) {
    console.error('Get Exchange Rates Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve exchange rates'
    });
  }
});

/**
 * GET /api/global/store-preferences/:region
 * Get regional app store preferences
 */
router.get('/store-preferences/:region', (req, res) => {
  try {
    const { region } = req.params;

    if (!GLOBAL_REGIONS[region]) {
      return res.status(404).json({
        success: false,
        error: 'Region not found'
      });
    }

    const preferences = getRegionalStorePreferences(region);

    res.json({
      success: true,
      data: {
        region,
        regionName: GLOBAL_REGIONS[region].name,
        preferences
      }
    });

  } catch (error) {
    console.error('Get Store Preferences Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve store preferences'
    });
  }
});

/**
 * POST /api/global/user-preferences
 * Store user preferences
 */
router.post('/user-preferences', authenticateToken, async (req, res) => {
  try {
    const { language, region, currency, timezone } = req.body;
    const userId = req.user.id;

    if (!language || !region) {
      return res.status(400).json({
        success: false,
        error: 'Language and region are required'
      });
    }

    // Validate language and region
    if (!SUPPORTED_LANGUAGES[language]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid language'
      });
    }

    if (!GLOBAL_REGIONS[region]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid region'
      });
    }

    const preferences = {
      language,
      region,
      currency: currency || GLOBAL_REGIONS[region].currency,
      timezone: timezone || GLOBAL_REGIONS[region].timezone
    };

    const result = await storeUserPreferences(userId, preferences);

    res.json({
      success: true,
      data: {
        preferences: {
          language: result.language,
          region: result.region,
          currency: result.currency,
          timezone: result.timezone,
          updatedAt: result.updated_at
        },
        message: 'User preferences updated successfully'
      }
    });

  } catch (error) {
    console.error('Store User Preferences Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to store user preferences',
      details: error.message
    });
  }
});

/**
 * GET /api/global/user-preferences
 * Get user preferences
 */
router.get('/user-preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = await getUserPreferences(userId);

    if (!preferences) {
      // Return default preferences based on detected region
      const regionInfo = await detectUserRegion(req);
      
      return res.json({
        success: true,
        data: {
          preferences: {
            language: regionInfo.preferredLanguage,
            region: regionInfo.region,
            currency: regionInfo.regionConfig.currency,
            timezone: regionInfo.regionConfig.timezone
          },
          isDefault: true,
          message: 'Using detected preferences. Save to customize.'
        }
      });
    }

    res.json({
      success: true,
      data: {
        preferences: {
          language: preferences.language,
          region: preferences.region,
          currency: preferences.currency,
          timezone: preferences.timezone,
          updatedAt: preferences.updated_at
        },
        isDefault: false
      }
    });

  } catch (error) {
    console.error('Get User Preferences Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user preferences'
    });
  }
});

/**
 * GET /api/global/marketplace-stats
 * Get global marketplace statistics
 */
router.get('/marketplace-stats', optionalAuth, async (req, res) => {
  try {
    const stats = await getGlobalMarketplaceStats();

    res.json({
      success: true,
      data: {
        stats,
        regions: {
          total: Object.keys(GLOBAL_REGIONS).length,
          active: Object.values(GLOBAL_REGIONS).filter(r => r.active).length
        },
        languages: {
          total: Object.keys(SUPPORTED_LANGUAGES).length
        },
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Get Marketplace Stats Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve marketplace statistics'
    });
  }
});

/**
 * POST /api/global/format-data
 * Format data according to locale
 */
router.post('/format-data', (req, res) => {
  try {
    const { data, type, language = 'en-US', currency = 'USD' } = req.body;

    if (!data || !type) {
      return res.status(400).json({
        success: false,
        error: 'Data and type are required'
      });
    }

    let formattedData;

    switch (type) {
      case 'currency':
        formattedData = formatCurrency(data, currency, language);
        break;
      case 'date':
        formattedData = new Date(data).toLocaleDateString(language);
        break;
      case 'number':
        formattedData = new Intl.NumberFormat(language).format(data);
        break;
      case 'percent':
        formattedData = new Intl.NumberFormat(language, { style: 'percent' }).format(data);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid format type. Supported: currency, date, number, percent'
        });
    }

    res.json({
      success: true,
      data: {
        original: data,
        formatted: formattedData,
        type,
        language,
        currency: type === 'currency' ? currency : undefined
      }
    });

  } catch (error) {
    console.error('Format Data Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to format data',
      details: error.message
    });
  }
});

export default router;