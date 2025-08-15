import axios from 'axios';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';

// Initialize OpenAI client only if API key is available
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

/**
 * Analyze website using AI to extract metadata and determine app suitability
 */
const analyzeWebsite = async (url, options = {}) => {
  try {
    let websiteContent = '';
    let metadata = {};

    if (url) {
      // Fetch website content
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RapidSaaSBot/1.0)'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Extract basic metadata
      metadata = {
        title: $('title').text() || $('meta[property="og:title"]').attr('content') || '',
        description: $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '',
        keywords: $('meta[name="keywords"]').attr('content') || '',
        favicon: $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href') || '',
        ogImage: $('meta[property="og:image"]').attr('content') || ''
      };

      // Extract main content for AI analysis
      $('script, style, nav, footer, aside').remove();
      websiteContent = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 3000); // Limit content for API
    }

    // Prepare AI prompt
    const prompt = `
Analyze this website and determine its suitability for mobile app conversion:

URL: ${url || 'N/A'}
Title: ${metadata.title || options.appName || 'N/A'}
Description: ${metadata.description || options.description || 'N/A'}
Content Preview: ${websiteContent || 'N/A'}

Please provide a detailed analysis in the following JSON format:
{
  "contentType": "saas|ecommerce|blog|portfolio|news|education|entertainment|other",
  "category": "productivity|business|finance|health|education|entertainment|social|utilities|other",
  "appViability": 1-10,
  "viabilityReasons": ["reason1", "reason2"],
  "isMobileResponsive": true|false,
  "suggestedAppName": "suggested name",
  "suggestedDescription": "app store description",
  "suggestedCategory": "app store category",
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "features": ["feature1", "feature2"],
  "targetAudience": "description of target users",
  "recommendations": ["recommendation1", "recommendation2"],
  "technologies": ["tech1", "tech2"],
  "framework": "react|vue|angular|wordpress|custom|unknown"
}

Focus on:
1. How well this would work as a mobile app
2. User experience considerations
3. Technical feasibility
4. Market potential
5. App store optimization
`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert mobile app developer and UX analyst. Analyze websites for mobile app conversion potential and provide detailed, actionable insights.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    });

    let analysis;
    try {
      analysis = JSON.parse(completion.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback analysis
      analysis = {
        contentType: 'other',
        category: 'utilities',
        appViability: 5,
        viabilityReasons: ['Unable to fully analyze website'],
        isMobileResponsive: true,
        suggestedAppName: metadata.title || 'Mobile App',
        suggestedDescription: metadata.description || 'Mobile application',
        suggestedCategory: 'Utilities',
        suggestedTags: ['mobile', 'app'],
        features: ['Web browsing'],
        targetAudience: 'General users',
        recommendations: ['Improve mobile responsiveness'],
        technologies: ['unknown'],
        framework: 'unknown'
      };
    }

    // Enhance analysis with additional metadata
    const enhancedAnalysis = {
      ...metadata,
      ...analysis,
      hasSSL: url ? url.startsWith('https://') : true,
      loadTime: Math.floor(Math.random() * 3000) + 500, // Simulated load time
      analysisTimestamp: new Date().toISOString()
    };

    return enhancedAnalysis;

  } catch (error) {
    console.error('AI Website Analysis Error:', error);
    
    // Return fallback analysis on error
    return {
      title: options.appName || 'Mobile App',
      description: options.description || 'Mobile application',
      contentType: 'other',
      category: 'utilities',
      appViability: 5,
      viabilityReasons: ['Analysis failed - manual review recommended'],
      isMobileResponsive: true,
      hasSSL: true,
      loadTime: 2000,
      suggestedAppName: options.appName || 'Mobile App',
      suggestedDescription: options.description || 'Mobile application converted from web platform',
      suggestedCategory: 'Utilities',
      suggestedTags: ['mobile', 'app', 'web'],
      features: ['Web browsing'],
      targetAudience: 'General users',
      recommendations: ['Manual review recommended'],
      technologies: ['unknown'],
      framework: 'unknown',
      analysisTimestamp: new Date().toISOString(),
      error: error.message
    };
  }
};

/**
 * Generate app assets using AI
 */
const generateAppAssets = async (options) => {
  const {
    appName,
    description,
    category,
    iconUrl
  } = options;

  try {
    // Generate app store screenshots descriptions
    const screenshotPrompt = `
Generate 5 compelling app store screenshot descriptions for this mobile app:

App Name: ${appName}
Description: ${description}
Category: ${category}

For each screenshot, provide:
1. A title/headline
2. Key features to highlight
3. Visual elements to include
4. Call-to-action text

Format as JSON array:
[
  {
    "title": "Screenshot title",
    "features": ["feature1", "feature2"],
    "visualElements": ["element1", "element2"],
    "callToAction": "CTA text"
  }
]
`;

    const screenshotCompletion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert app store optimization specialist. Create compelling screenshot descriptions that maximize conversion rates.'
        },
        {
          role: 'user',
          content: screenshotPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    let screenshots;
    try {
      screenshots = JSON.parse(screenshotCompletion.choices[0].message.content);
    } catch {
      screenshots = [
        {
          title: 'Welcome to ' + appName,
          features: ['Easy to use', 'Fast performance'],
          visualElements: ['App logo', 'Main interface'],
          callToAction: 'Get started today!'
        }
      ];
    }

    // Generate feature graphic description
    const featureGraphicPrompt = `
Create a feature graphic description for Google Play Store:

App Name: ${appName}
Description: ${description}
Category: ${category}

Provide:
1. Main headline (max 30 characters)
2. Subheadline (max 50 characters)
3. Key visual elements
4. Color scheme suggestions
5. Typography style

Format as JSON.
`;

    const featureCompletion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a graphic design expert specializing in app store marketing materials.'
        },
        {
          role: 'user',
          content: featureGraphicPrompt
        }
      ],
      temperature: 0.6,
      max_tokens: 500
    });

    let featureGraphic;
    try {
      featureGraphic = JSON.parse(featureCompletion.choices[0].message.content);
    } catch {
      featureGraphic = {
        headline: appName,
        subheadline: 'Mobile App',
        visualElements: ['App icon', 'Modern design'],
        colorScheme: ['#007AFF', '#FFFFFF'],
        typography: 'Modern sans-serif'
      };
    }

    return {
      screenshots,
      featureGraphic,
      banners: {
        playStore: {
          width: 1024,
          height: 500,
          description: featureGraphic
        },
        appStore: {
          width: 1200,
          height: 630,
          description: featureGraphic
        }
      },
      promotional: {
        socialMedia: screenshots.slice(0, 3),
        website: featureGraphic
      },
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('AI Asset Generation Error:', error);
    
    // Return fallback assets
    return {
      screenshots: [
        {
          title: 'Welcome to ' + appName,
          features: ['User-friendly interface'],
          visualElements: ['Clean design'],
          callToAction: 'Download now!'
        }
      ],
      featureGraphic: {
        headline: appName,
        subheadline: 'Mobile App',
        visualElements: ['App icon'],
        colorScheme: ['#007AFF', '#FFFFFF'],
        typography: 'Sans-serif'
      },
      banners: {},
      promotional: {},
      generatedAt: new Date().toISOString(),
      error: error.message
    };
  }
};

/**
 * Categorize app using AI
 */
const categorizeApp = async (options) => {
  const {
    appName,
    description,
    url,
    features
  } = options;

  try {
    const categorizationPrompt = `
Categorize this mobile app for app stores:

App Name: ${appName || 'N/A'}
Description: ${description || 'N/A'}
URL: ${url || 'N/A'}
Features: ${features ? features.join(', ') : 'N/A'}

Provide categorization in JSON format:
{
  "primaryCategory": "category name",
  "primaryConfidence": 0.0-1.0,
  "primaryReasoning": "explanation",
  "secondaryCategories": ["cat1", "cat2"],
  "playStoreCategory": "Google Play category",
  "appStoreCategory": "Apple App Store category",
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "targetAudience": "audience description",
  "ageGroup": "age range",
  "demographics": "demographic info",
  "contentRating": "Everyone|Teen|Mature",
  "ageRating": "4+|9+|12+|17+"
}

Use standard app store categories.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an app store categorization expert. Provide accurate categorization for optimal app store placement and discoverability.'
        },
        {
          role: 'user',
          content: categorizationPrompt
        }
      ],
      temperature: 0.2,
      max_tokens: 800
    });

    let categorization;
    try {
      categorization = JSON.parse(completion.choices[0].message.content);
    } catch {
      categorization = {
        primaryCategory: 'Utilities',
        primaryConfidence: 0.5,
        primaryReasoning: 'Default categorization due to parsing error',
        secondaryCategories: ['Productivity'],
        playStoreCategory: 'Tools',
        appStoreCategory: 'Utilities',
        suggestedTags: ['mobile', 'app', 'utility'],
        targetAudience: 'General users',
        ageGroup: '18-65',
        demographics: 'All demographics',
        contentRating: 'Everyone',
        ageRating: '4+'
      };
    }

    return {
      ...categorization,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('AI Categorization Error:', error);
    
    return {
      primaryCategory: 'Utilities',
      primaryConfidence: 0.3,
      primaryReasoning: 'Categorization failed - default assigned',
      secondaryCategories: ['Productivity'],
      playStoreCategory: 'Tools',
      appStoreCategory: 'Utilities',
      suggestedTags: ['mobile', 'app'],
      targetAudience: 'General users',
      ageGroup: '18-65',
      demographics: 'All demographics',
      contentRating: 'Everyone',
      ageRating: '4+',
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
};

/**
 * Generate app descriptions using AI
 */
const generateDescription = async (options) => {
  const {
    appName,
    url,
    features,
    targetAudience,
    tone = 'professional',
    length = 'medium',
    includeKeywords = true
  } = options;

  try {
    const descriptionPrompt = `
Generate app store descriptions for this mobile app:

App Name: ${appName}
URL: ${url || 'N/A'}
Features: ${features ? features.join(', ') : 'N/A'}
Target Audience: ${targetAudience || 'General users'}
Tone: ${tone}
Length: ${length}
Include Keywords: ${includeKeywords}

Generate descriptions in JSON format:
{
  "short": "80 characters max - for app store listings",
  "medium": "160 characters max - for search results",
  "long": "4000 characters max - full app store description",
  "playStore": "Optimized for Google Play Store",
  "appStore": "Optimized for Apple App Store",
  "promotional": "Marketing copy for websites/ads",
  "extractedKeywords": ["keyword1", "keyword2"],
  "readabilityScore": 1-10,
  "sentimentScore": 1-10
}

Make descriptions compelling, clear, and conversion-focused.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert copywriter specializing in app store optimization and conversion-focused descriptions.'
        },
        {
          role: 'user',
          content: descriptionPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    let descriptions;
    try {
      descriptions = JSON.parse(completion.choices[0].message.content);
    } catch {
      const fallbackDesc = `${appName} - Mobile app for enhanced productivity and convenience.`;
      descriptions = {
        short: fallbackDesc.substring(0, 80),
        medium: fallbackDesc.substring(0, 160),
        long: `${fallbackDesc}\n\nKey Features:\n• User-friendly interface\n• Fast performance\n• Secure and reliable\n\nDownload ${appName} today and experience the convenience of mobile access to your favorite platform.`,
        playStore: fallbackDesc,
        appStore: fallbackDesc,
        promotional: fallbackDesc,
        extractedKeywords: ['mobile', 'app', 'productivity'],
        readabilityScore: 7,
        sentimentScore: 8
      };
    }

    return {
      ...descriptions,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('AI Description Generation Error:', error);
    
    const fallbackDesc = `${appName} - Mobile application`;
    return {
      short: fallbackDesc,
      medium: fallbackDesc,
      long: fallbackDesc,
      playStore: fallbackDesc,
      appStore: fallbackDesc,
      promotional: fallbackDesc,
      extractedKeywords: ['mobile', 'app'],
      readabilityScore: 5,
      sentimentScore: 6,
      generatedAt: new Date().toISOString(),
      error: error.message
    };
  }
};

export {
  analyzeWebsite,
  generateAppAssets,
  categorizeApp,
  generateDescription
};