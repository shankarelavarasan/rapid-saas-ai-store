import axios from 'axios';
import { supabase } from './database.js';

/**
 * Global Scaling Service
 * Handles internationalization, multi-region deployment, and global marketplace features
 */

/**
 * Supported regions and their configurations
 */
const GLOBAL_REGIONS = {
  'us-east-1': {
    name: 'US East (N. Virginia)',
    country: 'United States',
    continent: 'North America',
    currency: 'USD',
    languages: ['en-US', 'es-US'],
    timezone: 'America/New_York',
    cdnEndpoint: 'https://cdn-us-east.rapidtech.com',
    apiEndpoint: 'https://api-us-east.rapidtech.com',
    active: true
  },
  'eu-west-1': {
    name: 'EU West (Ireland)',
    country: 'Ireland',
    continent: 'Europe',
    currency: 'EUR',
    languages: ['en-GB', 'de-DE', 'fr-FR', 'es-ES', 'it-IT'],
    timezone: 'Europe/Dublin',
    cdnEndpoint: 'https://cdn-eu-west.rapidtech.com',
    apiEndpoint: 'https://api-eu-west.rapidtech.com',
    active: true
  },
  'ap-southeast-1': {
    name: 'Asia Pacific (Singapore)',
    country: 'Singapore',
    continent: 'Asia',
    currency: 'USD',
    languages: ['en-SG', 'zh-CN', 'ja-JP', 'ko-KR'],
    timezone: 'Asia/Singapore',
    cdnEndpoint: 'https://cdn-ap-southeast.rapidtech.com',
    apiEndpoint: 'https://api-ap-southeast.rapidtech.com',
    active: true
  },
  'ap-south-1': {
    name: 'Asia Pacific (Mumbai)',
    country: 'India',
    continent: 'Asia',
    currency: 'INR',
    languages: ['en-IN', 'hi-IN'],
    timezone: 'Asia/Kolkata',
    cdnEndpoint: 'https://cdn-ap-south.rapidtech.com',
    apiEndpoint: 'https://api-ap-south.rapidtech.com',
    active: true
  },
  'sa-east-1': {
    name: 'South America (São Paulo)',
    country: 'Brazil',
    continent: 'South America',
    currency: 'BRL',
    languages: ['pt-BR', 'es-AR'],
    timezone: 'America/Sao_Paulo',
    cdnEndpoint: 'https://cdn-sa-east.rapidtech.com',
    apiEndpoint: 'https://api-sa-east.rapidtech.com',
    active: false
  }
};

/**
 * Supported languages and their configurations
 */
const SUPPORTED_LANGUAGES = {
  'en-US': {
    name: 'English (US)',
    nativeName: 'English',
    direction: 'ltr',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    numberFormat: '1,234.56',
    regions: ['us-east-1', 'ap-southeast-1']
  },
  'en-GB': {
    name: 'English (UK)',
    nativeName: 'English',
    direction: 'ltr',
    currency: 'GBP',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: '1,234.56',
    regions: ['eu-west-1']
  },
  'es-ES': {
    name: 'Spanish (Spain)',
    nativeName: 'Español',
    direction: 'ltr',
    currency: 'EUR',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: '1.234,56',
    regions: ['eu-west-1']
  },
  'es-US': {
    name: 'Spanish (US)',
    nativeName: 'Español',
    direction: 'ltr',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    numberFormat: '1,234.56',
    regions: ['us-east-1']
  },
  'de-DE': {
    name: 'German',
    nativeName: 'Deutsch',
    direction: 'ltr',
    currency: 'EUR',
    dateFormat: 'DD.MM.YYYY',
    numberFormat: '1.234,56',
    regions: ['eu-west-1']
  },
  'fr-FR': {
    name: 'French',
    nativeName: 'Français',
    direction: 'ltr',
    currency: 'EUR',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: '1 234,56',
    regions: ['eu-west-1']
  },
  'zh-CN': {
    name: 'Chinese (Simplified)',
    nativeName: '简体中文',
    direction: 'ltr',
    currency: 'CNY',
    dateFormat: 'YYYY/MM/DD',
    numberFormat: '1,234.56',
    regions: ['ap-southeast-1']
  },
  'ja-JP': {
    name: 'Japanese',
    nativeName: '日本語',
    direction: 'ltr',
    currency: 'JPY',
    dateFormat: 'YYYY/MM/DD',
    numberFormat: '1,234',
    regions: ['ap-southeast-1']
  },
  'ko-KR': {
    name: 'Korean',
    nativeName: '한국어',
    direction: 'ltr',
    currency: 'KRW',
    dateFormat: 'YYYY.MM.DD',
    numberFormat: '1,234',
    regions: ['ap-southeast-1']
  },
  'hi-IN': {
    name: 'Hindi',
    nativeName: 'हिन्दी',
    direction: 'ltr',
    currency: 'INR',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: '1,23,456.78',
    regions: ['ap-south-1']
  },
  'pt-BR': {
    name: 'Portuguese (Brazil)',
    nativeName: 'Português',
    direction: 'ltr',
    currency: 'BRL',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: '1.234,56',
    regions: ['sa-east-1']
  }
};

/**
 * Currency exchange rates (in production, fetch from real API)
 */
const EXCHANGE_RATES = {
  USD: 1.0,
  EUR: 0.85,
  GBP: 0.73,
  JPY: 110.0,
  CNY: 6.45,
  INR: 74.5,
  KRW: 1180.0,
  BRL: 5.2
};

/**
 * Detect user's region based on IP or headers
 */
const detectUserRegion = async (req) => {
  try {
    // Get IP address
    const ip = req.headers['x-forwarded-for'] || 
              req.headers['x-real-ip'] || 
              req.connection.remoteAddress || 
              req.socket.remoteAddress ||
              '127.0.0.1';

    // Get country from headers (Cloudflare, AWS CloudFront, etc.)
    const countryCode = req.headers['cf-ipcountry'] || 
                       req.headers['cloudfront-viewer-country'] ||
                       req.headers['x-country-code'];

    // Get language preference
    const acceptLanguage = req.headers['accept-language'] || 'en-US';
    const preferredLanguage = parseAcceptLanguage(acceptLanguage);

    // Determine best region
    const region = determineOptimalRegion(countryCode, preferredLanguage, ip);
    
    return {
      ip,
      countryCode,
      preferredLanguage,
      region,
      regionConfig: GLOBAL_REGIONS[region],
      languageConfig: SUPPORTED_LANGUAGES[preferredLanguage]
    };

  } catch (error) {
    console.error('Region Detection Error:', error);
    // Default to US East
    return {
      ip: '127.0.0.1',
      countryCode: 'US',
      preferredLanguage: 'en-US',
      region: 'us-east-1',
      regionConfig: GLOBAL_REGIONS['us-east-1'],
      languageConfig: SUPPORTED_LANGUAGES['en-US']
    };
  }
};

/**
 * Parse Accept-Language header
 */
const parseAcceptLanguage = (acceptLanguage) => {
  try {
    const languages = acceptLanguage
      .split(',')
      .map(lang => {
        const [code, quality = '1'] = lang.trim().split(';q=');
        return {
          code: code.trim(),
          quality: parseFloat(quality)
        };
      })
      .sort((a, b) => b.quality - a.quality);

    // Find best supported language
    for (const lang of languages) {
      if (SUPPORTED_LANGUAGES[lang.code]) {
        return lang.code;
      }
      
      // Try language without region (e.g., 'en' instead of 'en-GB')
      const baseLanguage = lang.code.split('-')[0];
      const supportedVariant = Object.keys(SUPPORTED_LANGUAGES)
        .find(key => key.startsWith(baseLanguage + '-'));
      
      if (supportedVariant) {
        return supportedVariant;
      }
    }

    return 'en-US'; // Default
  } catch (error) {
    return 'en-US';
  }
};

/**
 * Determine optimal region based on location and preferences
 */
const determineOptimalRegion = (countryCode, language, ip) => {
  // Country to region mapping
  const countryRegionMap = {
    'US': 'us-east-1',
    'CA': 'us-east-1',
    'MX': 'us-east-1',
    'GB': 'eu-west-1',
    'IE': 'eu-west-1',
    'DE': 'eu-west-1',
    'FR': 'eu-west-1',
    'ES': 'eu-west-1',
    'IT': 'eu-west-1',
    'NL': 'eu-west-1',
    'SG': 'ap-southeast-1',
    'MY': 'ap-southeast-1',
    'TH': 'ap-southeast-1',
    'ID': 'ap-southeast-1',
    'PH': 'ap-southeast-1',
    'CN': 'ap-southeast-1',
    'JP': 'ap-southeast-1',
    'KR': 'ap-southeast-1',
    'IN': 'ap-south-1',
    'BD': 'ap-south-1',
    'LK': 'ap-south-1',
    'BR': 'sa-east-1',
    'AR': 'sa-east-1',
    'CL': 'sa-east-1',
    'CO': 'sa-east-1'
  };

  // Get region by country
  let region = countryRegionMap[countryCode];
  
  // If no country mapping, use language preference
  if (!region && language) {
    const languageConfig = SUPPORTED_LANGUAGES[language];
    if (languageConfig && languageConfig.regions.length > 0) {
      region = languageConfig.regions[0];
    }
  }

  // Ensure region is active
  if (!region || !GLOBAL_REGIONS[region]?.active) {
    region = 'us-east-1'; // Default fallback
  }

  return region;
};

/**
 * Get localized content for user
 */
const getLocalizedContent = async (contentKey, language = 'en-US', region = 'us-east-1') => {
  try {
    // Try to get from database first
    const { data, error } = await supabase
      .from('localized_content')
      .select('*')
      .eq('content_key', contentKey)
      .eq('language', language)
      .single();

    if (!error && data) {
      return data.content;
    }

    // Fallback to English if not found
    if (language !== 'en-US') {
      const { data: fallback } = await supabase
        .from('localized_content')
        .select('*')
        .eq('content_key', contentKey)
        .eq('language', 'en-US')
        .single();

      if (fallback) {
        return fallback.content;
      }
    }

    // Return default content if nothing found
    return getDefaultContent(contentKey);

  } catch (error) {
    console.error('Get Localized Content Error:', error);
    return getDefaultContent(contentKey);
  }
};

/**
 * Get default content for a key
 */
const getDefaultContent = (contentKey) => {
  const defaultContent = {
    'app.title': 'Rapid SaaS AI Store',
    'app.description': 'Convert any SaaS or IDE into a mobile app instantly',
    'nav.home': 'Home',
    'nav.store': 'App Store',
    'nav.convert': 'Convert',
    'nav.publish': 'Publish',
    'button.convert': 'Convert to App',
    'button.download': 'Download',
    'button.publish': 'Publish to Store',
    'status.converting': 'Converting...',
    'status.ready': 'Ready',
    'status.error': 'Error',
    'message.success': 'Success!',
    'message.error': 'An error occurred',
    'placeholder.url': 'Enter website URL',
    'placeholder.search': 'Search apps...'
  };

  return defaultContent[contentKey] || contentKey;
};

/**
 * Convert currency amount
 */
const convertCurrency = (amount, fromCurrency, toCurrency) => {
  try {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const fromRate = EXCHANGE_RATES[fromCurrency] || 1;
    const toRate = EXCHANGE_RATES[toCurrency] || 1;
    
    // Convert to USD first, then to target currency
    const usdAmount = amount / fromRate;
    const convertedAmount = usdAmount * toRate;
    
    return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    console.error('Currency Conversion Error:', error);
    return amount;
  }
};

/**
 * Format currency for display
 */
const formatCurrency = (amount, currency, language = 'en-US') => {
  try {
    const formatter = new Intl.NumberFormat(language, {
      style: 'currency',
      currency: currency
    });
    
    return formatter.format(amount);
  } catch (error) {
    // Fallback formatting
    const symbols = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CNY: '¥',
      INR: '₹',
      KRW: '₩',
      BRL: 'R$'
    };
    
    const symbol = symbols[currency] || currency;
    return `${symbol}${amount.toFixed(2)}`;
  }
};

/**
 * Get regional app store preferences
 */
const getRegionalStorePreferences = (region) => {
  const preferences = {
    'us-east-1': {
      primaryStores: ['GOOGLE_PLAY', 'APPLE_APP_STORE'],
      secondaryStores: ['AMAZON_APPSTORE'],
      paymentMethods: ['credit_card', 'paypal', 'apple_pay', 'google_pay'],
      currencies: ['USD']
    },
    'eu-west-1': {
      primaryStores: ['GOOGLE_PLAY', 'APPLE_APP_STORE'],
      secondaryStores: ['AMAZON_APPSTORE'],
      paymentMethods: ['credit_card', 'paypal', 'sepa', 'ideal'],
      currencies: ['EUR', 'GBP']
    },
    'ap-southeast-1': {
      primaryStores: ['GOOGLE_PLAY', 'APPLE_APP_STORE'],
      secondaryStores: ['SAMSUNG_GALAXY_STORE', 'HUAWEI_APPGALLERY'],
      paymentMethods: ['credit_card', 'alipay', 'wechat_pay', 'grab_pay'],
      currencies: ['USD', 'CNY', 'JPY', 'KRW']
    },
    'ap-south-1': {
      primaryStores: ['GOOGLE_PLAY', 'APPLE_APP_STORE'],
      secondaryStores: ['SAMSUNG_GALAXY_STORE'],
      paymentMethods: ['credit_card', 'upi', 'paytm', 'razorpay'],
      currencies: ['INR', 'USD']
    },
    'sa-east-1': {
      primaryStores: ['GOOGLE_PLAY', 'APPLE_APP_STORE'],
      secondaryStores: [],
      paymentMethods: ['credit_card', 'pix', 'boleto'],
      currencies: ['BRL', 'USD']
    }
  };

  return preferences[region] || preferences['us-east-1'];
};

/**
 * Store user region preferences
 */
const storeUserPreferences = async (userId, preferences) => {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert([{
        user_id: userId,
        language: preferences.language,
        region: preferences.region,
        currency: preferences.currency,
        timezone: preferences.timezone,
        updated_at: new Date().toISOString()
      }], { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Store User Preferences Error:', error);
    throw error;
  }
};

/**
 * Get user preferences
 */
const getUserPreferences = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error('Get User Preferences Error:', error);
    return null;
  }
};

/**
 * Get global marketplace statistics
 */
const getGlobalMarketplaceStats = async () => {
  try {
    const { data, error } = await supabase
      .from('global_stats')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // If no stats found, return default
    return data || {
      total_apps: 0,
      total_users: 0,
      total_downloads: 0,
      total_revenue: 0,
      active_regions: Object.keys(GLOBAL_REGIONS).filter(r => GLOBAL_REGIONS[r].active).length,
      supported_languages: Object.keys(SUPPORTED_LANGUAGES).length
    };
  } catch (error) {
    console.error('Get Global Stats Error:', error);
    return {
      total_apps: 0,
      total_users: 0,
      total_downloads: 0,
      total_revenue: 0,
      active_regions: 0,
      supported_languages: 0
    };
  }
};

export {
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
};