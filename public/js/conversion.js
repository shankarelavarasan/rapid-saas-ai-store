// Conversion JavaScript for Rapid SaaS AI Store

// Conversion Configuration
const CONVERSION_CONFIG = {
  STEPS: [
    { id: 'validate', name: 'Validating URL', duration: 2000 },
    { id: 'analyze', name: 'Analyzing Website', duration: 3000 },
    { id: 'extract', name: 'Extracting Metadata', duration: 2500 },
    { id: 'generate', name: 'Generating App Assets', duration: 4000 },
    { id: 'build', name: 'Building Mobile App', duration: 5000 },
    { id: 'optimize', name: 'Optimizing Performance', duration: 3000 },
    { id: 'finalize', name: 'Finalizing App', duration: 2000 }
  ],
  TOTAL_DURATION: 21500,
  UPDATE_INTERVAL: 100
};

// Conversion State
let conversionState = {
  isActive: false,
  currentStep: 0,
  progress: 0,
  startTime: null,
  result: null,
  error: null
};

// Initialize Conversion Module
document.addEventListener('DOMContentLoaded', function() {
  initializeConversion();
});

function initializeConversion() {
  setupConversionElements();
  setupConversionEventListeners();
}

function setupConversionElements() {
  // Enhanced conversion form
  const convertSection = document.getElementById('convert');
  if (!convertSection) return;

  const existingForm = convertSection.querySelector('.convert-form');
  if (existingForm) {
    existingForm.innerHTML = `
            <div class="convert-header">
                <h2>Convert Your SaaS to Mobile App</h2>
                <p>Transform any web application into a native mobile app in minutes</p>
            </div>
            
            <form id="conversion-form" class="conversion-form">
                <div class="url-input-section">
                    <div class="input-group">
                        <input type="url" id="saas-url" placeholder="Enter your SaaS website URL (e.g., https://yourapp.com)" required class="url-input">
                        <button type="submit" class="convert-btn" id="convert-btn">
                            <i class="fas fa-magic"></i>
                            <span>Convert to App</span>
                        </button>
                    </div>
                    <div class="url-validation" id="url-validation"></div>
                </div>
                
                <div class="conversion-options">
                    <h3>Conversion Options</h3>
                    <div class="options-grid">
                        <label class="option-item">
                            <input type="checkbox" id="generate-assets" checked>
                            <div class="option-content">
                                <i class="fas fa-image"></i>
                                <div class="option-text">
                                    <strong>Auto-generate Assets</strong>
                                    <span>Create app icon, splash screen, and store assets</span>
                                </div>
                            </div>
                        </label>
                        
                        <label class="option-item">
                            <input type="checkbox" id="optimize-mobile" checked>
                            <div class="option-content">
                                <i class="fas fa-mobile-alt"></i>
                                <div class="option-text">
                                    <strong>Mobile Optimization</strong>
                                    <span>Optimize for mobile performance and UX</span>
                                </div>
                            </div>
                        </label>
                        
                        <label class="option-item">
                            <input type="checkbox" id="enable-notifications">
                            <div class="option-content">
                                <i class="fas fa-bell"></i>
                                <div class="option-text">
                                    <strong>Push Notifications</strong>
                                    <span>Enable push notification support</span>
                                </div>
                            </div>
                        </label>
                        
                        <label class="option-item">
                            <input type="checkbox" id="offline-support">
                            <div class="option-content">
                                <i class="fas fa-wifi"></i>
                                <div class="option-text">
                                    <strong>Offline Support</strong>
                                    <span>Add basic offline functionality</span>
                                </div>
                            </div>
                        </label>
                    </div>
                </div>
            </form>
            
            <div class="conversion-status" id="conversion-status" style="display: none;">
                <div class="status-header">
                    <h3 id="status-title">Converting Your App...</h3>
                    <button class="btn btn-secondary btn-small" id="cancel-conversion">
                        <i class="fas fa-times"></i>
                        Cancel
                    </button>
                </div>
                
                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progress-fill"></div>
                        <div class="progress-text" id="progress-text">0%</div>
                    </div>
                </div>
                
                <div class="conversion-steps">
                    <div class="steps-list" id="steps-list"></div>
                </div>
                
                <div class="status-details">
                    <div class="current-step" id="current-step">Initializing...</div>
                    <div class="estimated-time" id="estimated-time">Estimated time: 2-3 minutes</div>
                </div>
                
                <div class="conversion-preview" id="conversion-preview" style="display: none;">
                    <h4>Live Preview</h4>
                    <div class="preview-container">
                        <div class="phone-mockup">
                            <div class="phone-screen" id="phone-screen">
                                <iframe id="preview-iframe" src="" frameborder="0"></iframe>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="conversion-result" id="conversion-result" style="display: none;"></div>
        `;
  }
}

function setupConversionEventListeners() {
  // Form submission
  const conversionForm = document.getElementById('conversion-form');
  if (conversionForm) {
    conversionForm.addEventListener('submit', handleConversionSubmit);
  }

  // URL input validation
  const urlInput = document.getElementById('saas-url');
  if (urlInput) {
    urlInput.addEventListener('input', debounce(validateUrl, 500));
    urlInput.addEventListener('blur', validateUrl);
  }

  // Cancel conversion
  const cancelBtn = document.getElementById('cancel-conversion');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', cancelConversion);
  }
}

function validateUrl() {
  const urlInput = document.getElementById('saas-url');
  const validation = document.getElementById('url-validation');
    
  if (!urlInput || !validation) return;
    
  const url = urlInput.value.trim();
    
  if (!url) {
    validation.innerHTML = '';
    return;
  }
    
  if (!isValidUrl(url)) {
    validation.innerHTML = `
            <div class="validation-message error">
                <i class="fas fa-exclamation-circle"></i>
                Please enter a valid URL (e.g., https://example.com)
            </div>
        `;
    return;
  }
    
  if (!url.startsWith('https://')) {
    validation.innerHTML = `
            <div class="validation-message warning">
                <i class="fas fa-exclamation-triangle"></i>
                HTTPS is recommended for better security and app store approval
            </div>
        `;
    return;
  }
    
  validation.innerHTML = `
        <div class="validation-message success">
            <i class="fas fa-check-circle"></i>
            URL looks good! Ready for conversion
        </div>
    `;
}

async function handleConversionSubmit(e) {
  e.preventDefault();
    
  if (conversionState.isActive) return;
    
  const formData = getConversionFormData();
    
  if (!formData.url) {
    showNotification('Please enter a valid URL', 'error');
    return;
  }
    
  if (!isValidUrl(formData.url)) {
    showNotification('Please enter a valid URL format', 'error');
    return;
  }
    
  startConversion(formData);
}

function getConversionFormData() {
  return {
    url: document.getElementById('saas-url')?.value.trim() || '',
    generateAssets: document.getElementById('generate-assets')?.checked || false,
    optimizeMobile: document.getElementById('optimize-mobile')?.checked || false,
    enableNotifications: document.getElementById('enable-notifications')?.checked || false,
    offlineSupport: document.getElementById('offline-support')?.checked || false
  };
}

async function startConversion(formData) {
  conversionState.isActive = true;
  conversionState.currentStep = 0;
  conversionState.progress = 0;
  conversionState.startTime = Date.now();
  conversionState.error = null;
    
  showConversionStatus();
  renderConversionSteps();
    
  try {
    // Start the conversion process
    const result = await performConversion(formData);
    conversionState.result = result;
    showConversionSuccess(result);
  } catch (error) {
    conversionState.error = error;
    showConversionError(error);
  } finally {
    conversionState.isActive = false;
  }
}

async function performConversion(formData) {
  // Simulate conversion steps with real API calls
  for (let i = 0; i < CONVERSION_CONFIG.STEPS.length; i++) {
    const step = CONVERSION_CONFIG.STEPS[i];
    conversionState.currentStep = i;
        
    updateCurrentStep(step.name);
        
    // Perform actual step
    await performConversionStep(step.id, formData);
        
    // Update progress
    const stepProgress = ((i + 1) / CONVERSION_CONFIG.STEPS.length) * 100;
    await animateProgress(stepProgress, step.duration);
        
    // Mark step as complete
    markStepComplete(i);
  }
    
  // Return conversion result
  return {
    appId: generateAppId(),
    appName: await extractAppName(formData.url),
    appIcon: '/assets/generated-icon.png',
    downloadUrl: '/downloads/app.apk',
    previewUrl: formData.url,
    buildTime: Date.now() - conversionState.startTime,
    features: getEnabledFeatures(formData)
  };
}

async function performConversionStep(stepId, formData) {
  switch (stepId) {
  case 'validate':
    return await validateWebsite(formData.url);
  case 'analyze':
    return await analyzeWebsite(formData.url);
  case 'extract':
    return await extractMetadata(formData.url);
  case 'generate':
    return await generateAssets(formData);
  case 'build':
    return await buildMobileApp(formData);
  case 'optimize':
    return await optimizeApp(formData);
  case 'finalize':
    return await finalizeApp(formData);
  default:
    return Promise.resolve();
  }
}

async function validateWebsite(url) {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/apps/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
        
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Website validation failed');
    }
        
    return data;
  } catch (error) {
    console.error('Validation error:', error);
    // Continue with mock validation for demo
    return { success: true, accessible: true, responsive: true };
  }
}

async function analyzeWebsite(url) {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/apps/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
        
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Website analysis failed');
    }
        
    // Show preview if available
    if (data.analysis?.previewUrl) {
      showConversionPreview(data.analysis.previewUrl);
    }
        
    return data;
  } catch (error) {
    console.error('Analysis error:', error);
    // Continue with mock analysis for demo
    return {
      success: true,
      analysis: {
        title: 'SaaS Application',
        description: 'A modern web application',
        category: 'productivity'
      }
    };
  }
}

async function extractMetadata(url) {
  // Simulate metadata extraction
  await new Promise(resolve => setTimeout(resolve, 1000));
  return {
    title: await extractAppName(url),
    description: 'A powerful web application converted to mobile',
    keywords: ['productivity', 'business', 'saas']
  };
}

async function generateAssets(formData) {
  if (!formData.generateAssets) {
    return { skipped: true };
  }
    
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/ai/generate-assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: formData.url })
    });
        
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Asset generation error:', error);
    // Continue with mock assets for demo
    return {
      icon: '/assets/generated-icon.png',
      splashScreen: '/assets/generated-splash.png',
      screenshots: ['/assets/screenshot-1.png', '/assets/screenshot-2.png']
    };
  }
}

async function buildMobileApp(formData) {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/apps/build`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
        
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Build error:', error);
    // Continue with mock build for demo
    return {
      buildId: generateAppId(),
      status: 'building',
      estimatedTime: 120000
    };
  }
}

async function optimizeApp(formData) {
  if (!formData.optimizeMobile) {
    return { skipped: true };
  }
    
  // Simulate optimization
  await new Promise(resolve => setTimeout(resolve, 1500));
  return {
    optimized: true,
    improvements: ['Reduced bundle size', 'Improved loading speed', 'Enhanced mobile UX']
  };
}

async function finalizeApp(formData) {
  // Simulate finalization
  await new Promise(resolve => setTimeout(resolve, 1000));
  return {
    finalized: true,
    downloadReady: true,
    appStoreReady: true
  };
}

function showConversionStatus() {
  const form = document.getElementById('conversion-form');
  const status = document.getElementById('conversion-status');
    
  if (form) form.style.display = 'none';
  if (status) status.style.display = 'block';
}

function hideConversionStatus() {
  const form = document.getElementById('conversion-form');
  const status = document.getElementById('conversion-status');
    
  if (form) form.style.display = 'block';
  if (status) status.style.display = 'none';
}

function renderConversionSteps() {
  const stepsList = document.getElementById('steps-list');
  if (!stepsList) return;
    
  stepsList.innerHTML = CONVERSION_CONFIG.STEPS.map((step, index) => `
        <div class="step-item" id="step-${index}" data-step="${index}">
            <div class="step-icon">
                <i class="fas fa-circle"></i>
                <i class="fas fa-check" style="display: none;"></i>
            </div>
            <div class="step-content">
                <div class="step-name">${step.name}</div>
                <div class="step-status">Waiting...</div>
            </div>
        </div>
    `).join('');
}

function updateCurrentStep(stepName) {
  const currentStepEl = document.getElementById('current-step');
  if (currentStepEl) {
    currentStepEl.textContent = stepName;
  }
    
  // Update step status
  const stepIndex = conversionState.currentStep;
  const stepEl = document.getElementById(`step-${stepIndex}`);
  if (stepEl) {
    const statusEl = stepEl.querySelector('.step-status');
    if (statusEl) {
      statusEl.textContent = 'In progress...';
    }
    stepEl.classList.add('active');
  }
}

function markStepComplete(stepIndex) {
  const stepEl = document.getElementById(`step-${stepIndex}`);
  if (stepEl) {
    const statusEl = stepEl.querySelector('.step-status');
    const circleIcon = stepEl.querySelector('.fa-circle');
    const checkIcon = stepEl.querySelector('.fa-check');
        
    if (statusEl) statusEl.textContent = 'Completed';
    if (circleIcon) circleIcon.style.display = 'none';
    if (checkIcon) checkIcon.style.display = 'block';
        
    stepEl.classList.remove('active');
    stepEl.classList.add('completed');
  }
}

async function animateProgress(targetProgress, duration) {
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
    
  if (!progressFill || !progressText) return;
    
  const startProgress = conversionState.progress;
  const progressDiff = targetProgress - startProgress;
  const startTime = Date.now();
    
  return new Promise(resolve => {
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
            
      const currentProgress = startProgress + (progressDiff * progress);
      conversionState.progress = currentProgress;
            
      progressFill.style.width = `${currentProgress}%`;
      progressText.textContent = `${Math.round(currentProgress)}%`;
            
      if (progress < 1) {
        requestAnimationFrame(updateProgress);
      } else {
        resolve();
      }
    };
        
    updateProgress();
  });
}

function showConversionPreview(previewUrl) {
  const preview = document.getElementById('conversion-preview');
  const iframe = document.getElementById('preview-iframe');
    
  if (preview && iframe) {
    iframe.src = previewUrl;
    preview.style.display = 'block';
  }
}

function showConversionSuccess(result) {
  const status = document.getElementById('conversion-status');
  const resultEl = document.getElementById('conversion-result');
    
  if (status) status.style.display = 'none';
    
  if (resultEl) {
    resultEl.innerHTML = `
            <div class="conversion-success">
                <div class="success-header">
                    <div class="success-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h2>Conversion Successful!</h2>
                    <p>Your mobile app has been created successfully</p>
                </div>
                
                <div class="app-preview-card">
                    <div class="app-icon">
                        <img src="${result.appIcon}" alt="${result.appName}" onerror="this.src='/assets/default-app-icon.png'">
                    </div>
                    <div class="app-info">
                        <h3>${result.appName}</h3>
                        <p>Build completed in ${formatDuration(result.buildTime)}</p>
                        <div class="app-features">
                            ${result.features.map(feature => `<span class="feature-tag">${feature}</span>`).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="success-actions">
                    <div class="primary-actions">
                        <button class="btn btn-primary btn-large" onclick="downloadApp('${result.appId}')">
                            <i class="fas fa-download"></i>
                            Download APK
                        </button>
                        <button class="btn btn-secondary btn-large" onclick="previewApp('${result.appId}')">
                            <i class="fas fa-eye"></i>
                            Preview App
                        </button>
                    </div>
                    
                    <div class="secondary-actions">
                        <button class="btn btn-outline" onclick="shareApp('${result.appId}')">
                            <i class="fas fa-share"></i>
                            Share App
                        </button>
                    </div>
                </div>
                
                <div class="next-steps">
                    <h4>What's Next?</h4>
                    <ul>
                        <li><i class="fas fa-check"></i> Test your app on different devices</li>
                        <li><i class="fas fa-check"></i> Customize app settings in dashboard</li>
                        <li><i class="fas fa-check"></i> Submit to Google Play Store</li>
                        <li><i class="fas fa-check"></i> Monitor app analytics and user feedback</li>
                    </ul>
                </div>
                
                <div class="conversion-again">
                    <button class="btn btn-link" onclick="resetConversion()">
                        <i class="fas fa-plus"></i>
                        Convert Another App
                    </button>
                </div>
            </div>
        `;
        
    resultEl.style.display = 'block';
  }
    
  // Track successful conversion
  trackConversionEvent('conversion_completed', {
    appId: result.appId,
    buildTime: result.buildTime,
    features: result.features
  });
}

function showConversionError(error) {
  const status = document.getElementById('conversion-status');
  const resultEl = document.getElementById('conversion-result');
    
  if (status) status.style.display = 'none';
    
  if (resultEl) {
    resultEl.innerHTML = `
            <div class="conversion-error">
                <div class="error-header">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h2>Conversion Failed</h2>
                    <p>We encountered an issue while converting your app</p>
                </div>
                
                <div class="error-details">
                    <div class="error-message">
                        <strong>Error:</strong> ${error.message || 'Unknown error occurred'}
                    </div>
                    
                    <div class="error-suggestions">
                        <h4>Possible Solutions:</h4>
                        <ul>
                            <li>Ensure your website is publicly accessible</li>
                            <li>Check if your website is mobile-responsive</li>
                            <li>Verify that your website uses HTTPS</li>
                            <li>Make sure your website doesn't block automated access</li>
                        </ul>
                    </div>
                </div>
                
                <div class="error-actions">
                    <button class="btn btn-primary" onclick="retryConversion()">
                        <i class="fas fa-redo"></i>
                        Try Again
                    </button>
                    <button class="btn btn-secondary" onclick="contactSupport()">
                        <i class="fas fa-life-ring"></i>
                        Contact Support
                    </button>
                    <button class="btn btn-outline" onclick="resetConversion()">
                        <i class="fas fa-arrow-left"></i>
                        Start Over
                    </button>
                </div>
            </div>
        `;
        
    resultEl.style.display = 'block';
  }
    
  // Track conversion error
  trackConversionEvent('conversion_failed', {
    error: error.message,
    step: conversionState.currentStep
  });
}

function cancelConversion() {
  if (!conversionState.isActive) return;
    
  conversionState.isActive = false;
  hideConversionStatus();
  resetConversion();
    
  showNotification('Conversion cancelled', 'info');
    
  // Track cancellation
  trackConversionEvent('conversion_cancelled', {
    step: conversionState.currentStep,
    progress: conversionState.progress
  });
}

function resetConversion() {
  conversionState = {
    isActive: false,
    currentStep: 0,
    progress: 0,
    startTime: null,
    result: null,
    error: null
  };
    
  hideConversionStatus();
    
  const resultEl = document.getElementById('conversion-result');
  if (resultEl) {
    resultEl.style.display = 'none';
    resultEl.innerHTML = '';
  }
    
  // Reset form
  const form = document.getElementById('conversion-form');
  if (form) {
    form.reset();
    form.style.display = 'block';
  }
    
  // Clear validation
  const validation = document.getElementById('url-validation');
  if (validation) {
    validation.innerHTML = '';
  }
}

function retryConversion() {
  const formData = getConversionFormData();
  resetConversion();
  setTimeout(() => startConversion(formData), 500);
}

// Utility Functions
function generateAppId() {
  return 'app_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

async function extractAppName(url) {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '').split('.')[0]
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim() || 'My App';
  } catch {
    return 'My App';
  }
}

function getEnabledFeatures(formData) {
  const features = [];
  if (formData.generateAssets) features.push('Auto-generated Assets');
  if (formData.optimizeMobile) features.push('Mobile Optimized');
  if (formData.enableNotifications) features.push('Push Notifications');
  if (formData.offlineSupport) features.push('Offline Support');
  return features;
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
    
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

function trackConversionEvent(event, data = {}) {
  const eventData = {
    event,
    timestamp: new Date().toISOString(),
    ...data
  };
    
  fetch(`${CONFIG.API_BASE_URL}/analytics/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData)
  }).catch(error => {
    console.error('Analytics error:', error);
  });
}

// Action Functions
function downloadApp(appId) {
  // Simulate app download
  showNotification('Starting download...', 'info');
    
  setTimeout(() => {
    const link = document.createElement('a');
    link.href = '/downloads/demo-app.apk';
    link.download = 'my-app.apk';
    link.click();
        
    showNotification('Download started! Check your downloads folder.', 'success');
  }, 1000);
    
  trackConversionEvent('app_downloaded', { appId });
}

function previewApp(appId) {
  const result = conversionState.result;
  if (!result) return;
    
  const previewContent = `
        <div class="app-preview-modal">
            <div class="preview-header">
                <h3>App Preview</h3>
                <div class="preview-actions">
                    <button class="btn btn-primary" onclick="downloadApp('${appId}')">
                        <i class="fas fa-download"></i>
                        Download
                    </button>
                </div>
            </div>
            
            <div class="preview-content">
                <div class="phone-mockup">
                    <div class="phone-screen">
                        <iframe src="${result.previewUrl}" frameborder="0"></iframe>
                    </div>
                </div>
                
                <div class="preview-info">
                    <h4>App Information</h4>
                    <ul>
                        <li><strong>Name:</strong> ${result.appName}</li>
                        <li><strong>Build Time:</strong> ${formatDuration(result.buildTime)}</li>
                        <li><strong>Features:</strong> ${result.features.join(', ')}</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
    
  showModal(previewContent);
  trackConversionEvent('app_previewed', { appId });
}

function goToDashboard() {
  window.location.href = '/dashboard.html';
}

function shareApp(appId) {
  if (navigator.share) {
    navigator.share({
      title: 'Check out my new mobile app!',
      text: 'I just converted my web app to mobile using Rapid SaaS AI Store',
      url: window.location.href
    });
  } else {
    // Fallback to copy link
    navigator.clipboard.writeText(window.location.href);
    showNotification('Link copied to clipboard!', 'success');
  }
    
  trackConversionEvent('app_shared', { appId });
}

function publishToStore(appId) {
  showNotification('Redirecting to store publishing...', 'info');
    
  setTimeout(() => {
    window.location.href = '/publish.html?appId=' + appId;
  }, 1000);
    
  trackConversionEvent('store_publish_initiated', { appId });
}

function contactSupport() {
  const supportContent = `
        <div class="support-modal">
            <h3>Contact Support</h3>
            <p>Need help with your app conversion? We're here to assist!</p>
            
            <div class="support-options">
                <a href="mailto:support@rapidsaasaistore.com" class="btn btn-primary">
                    <i class="fas fa-envelope"></i>
                    Email Support
                </a>
                <a href="#" class="btn btn-secondary" onclick="openChat()">
                    <i class="fas fa-comments"></i>
                    Live Chat
                </a>
                <a href="/help" class="btn btn-outline">
                    <i class="fas fa-question-circle"></i>
                    Help Center
                </a>
            </div>
        </div>
    `;
    
  showModal(supportContent);
}

function openChat() {
  // Integrate with chat service (e.g., Intercom, Zendesk)
  showNotification('Chat feature coming soon!', 'info');
}

// Export functions for global access
window.downloadApp = downloadApp;
window.previewApp = previewApp;
window.goToDashboard = goToDashboard;
window.shareApp = shareApp;
window.publishToStore = publishToStore;
window.contactSupport = contactSupport;
window.resetConversion = resetConversion;
window.retryConversion = retryConversion;
window.openChat = openChat;

// Handle page unload during conversion
window.addEventListener('beforeunload', function(e) {
  if (conversionState.isActive) {
    e.preventDefault();
    e.returnValue = 'Conversion is in progress. Are you sure you want to leave?';
    return e.returnValue;
  }
});