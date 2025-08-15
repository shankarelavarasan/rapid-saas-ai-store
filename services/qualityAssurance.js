import axios from 'axios';
import * as cheerio from 'cheerio';
import { supabase } from './database.js';

/**
 * Quality Assurance Service
 * Handles automated testing, compliance checking, and app quality validation
 */

/**
 * App quality criteria and scoring
 */
const QUALITY_CRITERIA = {
  TECHNICAL: {
    mobileResponsive: { weight: 20, required: true },
    loadTime: { weight: 15, required: true },
    httpsEnabled: { weight: 10, required: true },
    validHTML: { weight: 10, required: false },
    noErrors: { weight: 15, required: true }
  },
  CONTENT: {
    hasTitle: { weight: 5, required: true },
    hasDescription: { weight: 5, required: true },
    hasIcon: { weight: 5, required: false },
    contentQuality: { weight: 10, required: false }
  },
  COMPLIANCE: {
    noMaliciousContent: { weight: 25, required: true },
    privacyPolicy: { weight: 10, required: false },
    termsOfService: { weight: 5, required: false },
    appropriateContent: { weight: 15, required: true }
  }
};

/**
 * Perform comprehensive quality assessment
 */
const performQualityAssessment = async (url, appData = {}) => {
  try {
    console.log(`Starting quality assessment for: ${url}`);
    
    const assessment = {
      url,
      timestamp: new Date().toISOString(),
      scores: {},
      issues: [],
      recommendations: [],
      overallScore: 0,
      passed: false
    };

    // Technical Assessment
    const technicalResults = await assessTechnicalQuality(url);
    assessment.scores.technical = technicalResults;

    // Content Assessment
    const contentResults = await assessContentQuality(url, appData);
    assessment.scores.content = contentResults;

    // Compliance Assessment
    const complianceResults = await assessCompliance(url);
    assessment.scores.compliance = complianceResults;

    // Calculate overall score
    assessment.overallScore = calculateOverallScore(assessment.scores);
    assessment.passed = assessment.overallScore >= 70; // 70% minimum

    // Generate recommendations
    assessment.recommendations = generateRecommendations(assessment.scores);

    // Store assessment results
    await storeAssessmentResults(assessment);

    return assessment;

  } catch (error) {
    console.error('Quality Assessment Error:', error);
    throw new Error(`Quality assessment failed: ${error.message}`);
  }
};

/**
 * Assess technical quality aspects
 */
const assessTechnicalQuality = async (url) => {
  const results = {
    score: 0,
    details: {},
    issues: []
  };

  try {
    const startTime = Date.now();
    
    // Fetch website with timeout
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RapidSaaSQA/1.0)'
      },
      validateStatus: (status) => status < 500 // Accept redirects and client errors
    });

    const loadTime = Date.now() - startTime;
    const $ = cheerio.load(response.data);

    // Check HTTPS
    const httpsEnabled = url.startsWith('https://');
    results.details.httpsEnabled = httpsEnabled;
    if (!httpsEnabled) {
      results.issues.push('Website does not use HTTPS encryption');
    }

    // Check load time
    results.details.loadTime = loadTime;
    const loadTimeGood = loadTime < 3000; // 3 seconds
    if (!loadTimeGood) {
      results.issues.push(`Slow load time: ${loadTime}ms (should be < 3000ms)`);
    }

    // Check mobile responsiveness
    const viewport = $('meta[name="viewport"]').attr('content');
    const hasViewport = !!viewport;
    const responsiveCSS = response.data.includes('@media') || response.data.includes('responsive');
    const mobileResponsive = hasViewport && responsiveCSS;
    results.details.mobileResponsive = mobileResponsive;
    if (!mobileResponsive) {
      results.issues.push('Website may not be mobile responsive');
    }

    // Check for JavaScript errors (basic check)
    const hasConsoleErrors = response.data.includes('console.error') || 
                           response.data.includes('throw new Error');
    results.details.noErrors = !hasConsoleErrors;
    if (hasConsoleErrors) {
      results.issues.push('Potential JavaScript errors detected');
    }

    // Basic HTML validation
    const hasDoctype = response.data.trim().toLowerCase().startsWith('<!doctype');
    const hasTitle = $('title').length > 0;
    const hasLang = $('html').attr('lang');
    const validHTML = hasDoctype && hasTitle && hasLang;
    results.details.validHTML = validHTML;
    if (!validHTML) {
      results.issues.push('HTML structure issues detected');
    }

    // Calculate technical score
    let score = 0;
    if (httpsEnabled) score += QUALITY_CRITERIA.TECHNICAL.httpsEnabled.weight;
    if (loadTimeGood) score += QUALITY_CRITERIA.TECHNICAL.loadTime.weight;
    if (mobileResponsive) score += QUALITY_CRITERIA.TECHNICAL.mobileResponsive.weight;
    if (!hasConsoleErrors) score += QUALITY_CRITERIA.TECHNICAL.noErrors.weight;
    if (validHTML) score += QUALITY_CRITERIA.TECHNICAL.validHTML.weight;

    results.score = score;
    return results;

  } catch (error) {
    results.issues.push(`Technical assessment failed: ${error.message}`);
    return results;
  }
};

/**
 * Assess content quality
 */
const assessContentQuality = async (url, appData) => {
  const results = {
    score: 0,
    details: {},
    issues: []
  };

  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RapidSaaSQA/1.0)'
      }
    });

    const $ = cheerio.load(response.data);

    // Check title
    const title = $('title').text() || $('meta[property="og:title"]').attr('content') || '';
    const hasTitle = title.length > 0;
    results.details.title = title;
    results.details.hasTitle = hasTitle;
    if (!hasTitle) {
      results.issues.push('Missing or empty page title');
    }

    // Check description
    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || '';
    const hasDescription = description.length > 0;
    results.details.description = description;
    results.details.hasDescription = hasDescription;
    if (!hasDescription) {
      results.issues.push('Missing meta description');
    }

    // Check for icon/favicon
    const favicon = $('link[rel="icon"]').attr('href') || 
                   $('link[rel="shortcut icon"]').attr('href') || 
                   $('link[rel="apple-touch-icon"]').attr('href');
    const hasIcon = !!favicon;
    results.details.hasIcon = hasIcon;
    if (!hasIcon) {
      results.issues.push('Missing favicon or app icon');
    }

    // Content quality assessment
    $('script, style, nav, footer').remove();
    const textContent = $('body').text().replace(/\s+/g, ' ').trim();
    const contentLength = textContent.length;
    const contentQuality = contentLength > 100; // Minimum content threshold
    results.details.contentQuality = contentQuality;
    results.details.contentLength = contentLength;
    if (!contentQuality) {
      results.issues.push('Insufficient content detected');
    }

    // Calculate content score
    let score = 0;
    if (hasTitle) score += QUALITY_CRITERIA.CONTENT.hasTitle.weight;
    if (hasDescription) score += QUALITY_CRITERIA.CONTENT.hasDescription.weight;
    if (hasIcon) score += QUALITY_CRITERIA.CONTENT.hasIcon.weight;
    if (contentQuality) score += QUALITY_CRITERIA.CONTENT.contentQuality.weight;

    results.score = score;
    return results;

  } catch (error) {
    results.issues.push(`Content assessment failed: ${error.message}`);
    return results;
  }
};

/**
 * Assess compliance and safety
 */
const assessCompliance = async (url) => {
  const results = {
    score: 0,
    details: {},
    issues: []
  };

  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RapidSaaSQA/1.0)'
      }
    });

    const $ = cheerio.load(response.data);
    const content = response.data.toLowerCase();

    // Check for malicious content indicators
    const maliciousKeywords = [
      'malware', 'virus', 'phishing', 'scam', 'hack', 'crack',
      'illegal', 'piracy', 'warez', 'torrent'
    ];
    const hasMaliciousContent = maliciousKeywords.some(keyword => 
      content.includes(keyword)
    );
    results.details.noMaliciousContent = !hasMaliciousContent;
    if (hasMaliciousContent) {
      results.issues.push('Potentially malicious content detected');
    }

    // Check for privacy policy
    const privacyLinks = $('a[href*="privacy"], a[href*="Privacy"]');
    const hasPrivacyPolicy = privacyLinks.length > 0 || content.includes('privacy policy');
    results.details.privacyPolicy = hasPrivacyPolicy;
    if (!hasPrivacyPolicy) {
      results.issues.push('Privacy policy not found');
    }

    // Check for terms of service
    const termsLinks = $('a[href*="terms"], a[href*="Terms"]');
    const hasTermsOfService = termsLinks.length > 0 || content.includes('terms of service');
    results.details.termsOfService = hasTermsOfService;
    if (!hasTermsOfService) {
      results.issues.push('Terms of service not found');
    }

    // Check content appropriateness
    const inappropriateKeywords = [
      'adult', 'gambling', 'casino', 'porn', 'xxx', 'sex',
      'violence', 'weapon', 'drug', 'alcohol'
    ];
    const hasInappropriateContent = inappropriateKeywords.some(keyword => 
      content.includes(keyword)
    );
    results.details.appropriateContent = !hasInappropriateContent;
    if (hasInappropriateContent) {
      results.issues.push('Potentially inappropriate content detected');
    }

    // Calculate compliance score
    let score = 0;
    if (!hasMaliciousContent) score += QUALITY_CRITERIA.COMPLIANCE.noMaliciousContent.weight;
    if (hasPrivacyPolicy) score += QUALITY_CRITERIA.COMPLIANCE.privacyPolicy.weight;
    if (hasTermsOfService) score += QUALITY_CRITERIA.COMPLIANCE.termsOfService.weight;
    if (!hasInappropriateContent) score += QUALITY_CRITERIA.COMPLIANCE.appropriateContent.weight;

    results.score = score;
    return results;

  } catch (error) {
    results.issues.push(`Compliance assessment failed: ${error.message}`);
    return results;
  }
};

/**
 * Calculate overall quality score
 */
const calculateOverallScore = (scores) => {
  const totalPossible = 100; // Sum of all weights
  const actualScore = (scores.technical?.score || 0) + 
                     (scores.content?.score || 0) + 
                     (scores.compliance?.score || 0);
  
  return Math.round((actualScore / totalPossible) * 100);
};

/**
 * Generate improvement recommendations
 */
const generateRecommendations = (scores) => {
  const recommendations = [];

  // Technical recommendations
  if (scores.technical?.details) {
    const tech = scores.technical.details;
    if (!tech.httpsEnabled) {
      recommendations.push({
        category: 'Security',
        priority: 'High',
        issue: 'Enable HTTPS encryption',
        solution: 'Configure SSL certificate for your domain'
      });
    }
    if (!tech.mobileResponsive) {
      recommendations.push({
        category: 'Mobile',
        priority: 'High',
        issue: 'Improve mobile responsiveness',
        solution: 'Add viewport meta tag and responsive CSS'
      });
    }
    if (tech.loadTime > 3000) {
      recommendations.push({
        category: 'Performance',
        priority: 'Medium',
        issue: 'Optimize page load time',
        solution: 'Compress images, minify CSS/JS, use CDN'
      });
    }
  }

  // Content recommendations
  if (scores.content?.details) {
    const content = scores.content.details;
    if (!content.hasTitle) {
      recommendations.push({
        category: 'SEO',
        priority: 'High',
        issue: 'Add page title',
        solution: 'Include descriptive <title> tag'
      });
    }
    if (!content.hasDescription) {
      recommendations.push({
        category: 'SEO',
        priority: 'Medium',
        issue: 'Add meta description',
        solution: 'Include meta description tag for better SEO'
      });
    }
    if (!content.hasIcon) {
      recommendations.push({
        category: 'Branding',
        priority: 'Low',
        issue: 'Add favicon',
        solution: 'Create and link favicon for better branding'
      });
    }
  }

  // Compliance recommendations
  if (scores.compliance?.details) {
    const compliance = scores.compliance.details;
    if (!compliance.privacyPolicy) {
      recommendations.push({
        category: 'Legal',
        priority: 'Medium',
        issue: 'Add privacy policy',
        solution: 'Create and link privacy policy page'
      });
    }
    if (!compliance.termsOfService) {
      recommendations.push({
        category: 'Legal',
        priority: 'Medium',
        issue: 'Add terms of service',
        solution: 'Create and link terms of service page'
      });
    }
  }

  return recommendations;
};

/**
 * Store assessment results in database
 */
const storeAssessmentResults = async (assessment) => {
  try {
    const { data, error } = await supabase
      .from('quality_assessments')
      .insert([{
        url: assessment.url,
        overall_score: assessment.overallScore,
        technical_score: assessment.scores.technical?.score || 0,
        content_score: assessment.scores.content?.score || 0,
        compliance_score: assessment.scores.compliance?.score || 0,
        passed: assessment.passed,
        issues: assessment.scores.technical?.issues?.concat(
          assessment.scores.content?.issues || [],
          assessment.scores.compliance?.issues || []
        ) || [],
        recommendations: assessment.recommendations,
        assessment_data: assessment,
        created_at: assessment.timestamp
      }])
      .select()
      .single();

    if (error) {
      console.error('Store Assessment Error:', error);
    }

    return data;
  } catch (error) {
    console.error('Store Assessment Error:', error);
    return null;
  }
};

/**
 * Get assessment history for a URL
 */
const getAssessmentHistory = async (url, limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('quality_assessments')
      .select('*')
      .eq('url', url)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get Assessment History Error:', error);
    return [];
  }
};

/**
 * Validate app store compliance
 */
const validateAppStoreCompliance = async (appData) => {
  const compliance = {
    googlePlay: { passed: true, issues: [] },
    appleAppStore: { passed: true, issues: [] }
  };

  // Google Play Store compliance
  if (!appData.name || appData.name.length < 2) {
    compliance.googlePlay.issues.push('App name too short (minimum 2 characters)');
    compliance.googlePlay.passed = false;
  }
  if (!appData.description || appData.description.length < 80) {
    compliance.googlePlay.issues.push('Description too short (minimum 80 characters)');
    compliance.googlePlay.passed = false;
  }
  if (!appData.icon) {
    compliance.googlePlay.issues.push('App icon required');
    compliance.googlePlay.passed = false;
  }

  // Apple App Store compliance
  if (!appData.name || appData.name.length < 2 || appData.name.length > 30) {
    compliance.appleAppStore.issues.push('App name must be 2-30 characters');
    compliance.appleAppStore.passed = false;
  }
  if (!appData.description || appData.description.length < 10) {
    compliance.appleAppStore.issues.push('Description too short (minimum 10 characters)');
    compliance.appleAppStore.passed = false;
  }
  if (!appData.category) {
    compliance.appleAppStore.issues.push('App category required');
    compliance.appleAppStore.passed = false;
  }

  return compliance;
};

export {
  performQualityAssessment,
  assessTechnicalQuality,
  assessContentQuality,
  assessCompliance,
  getAssessmentHistory,
  validateAppStoreCompliance,
  QUALITY_CRITERIA
};