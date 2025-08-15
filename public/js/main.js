// Main JavaScript for Rapid SaaS AI Store

// Configuration
const CONFIG = {
  API_BASE_URL: window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : 'https://your-render-backend.onrender.com/api',
  DEMO_VIDEO_URL: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  ANIMATION_DURATION: 300
};

// Global state
let currentUser = null;
let conversionInProgress = false;

// DOM Elements
const elements = {
  navbar: document.getElementById('navbar'),
  navToggle: document.getElementById('nav-toggle'),
  navMenu: document.getElementById('nav-menu'),
  startConversionBtn: document.getElementById('start-conversion'),
  watchDemoBtn: document.getElementById('watch-demo'),
  convertForm: document.getElementById('convert-form'),
  saasUrlInput: document.getElementById('saas-url'),
  conversionStatus: document.getElementById('conversion-status'),
  demoModal: document.getElementById('demo-modal'),
  demoVideo: document.getElementById('demo-video'),
  appSearch: document.getElementById('app-search'),
  appsGrid: document.getElementById('apps-grid'),
  loadMoreAppsBtn: document.getElementById('load-more-apps')
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

function initializeApp() {
  setupEventListeners();
  initializeAnimations();
  setupNavigation();
  loadFeaturedApps();
  checkAuthStatus();
}

// Event Listeners
function setupEventListeners() {
  // Navigation
  if (elements.navToggle) {
    elements.navToggle.addEventListener('click', toggleMobileMenu);
  }

  // Hero buttons
  if (elements.startConversionBtn) {
    elements.startConversionBtn.addEventListener('click', scrollToConversion);
  }

  if (elements.watchDemoBtn) {
    elements.watchDemoBtn.addEventListener('click', openDemoModal);
  }

  // Conversion form
  if (elements.convertForm) {
    elements.convertForm.addEventListener('submit', handleConversion);
  }

  // Demo modal
  if (elements.demoModal) {
    const closeBtn = elements.demoModal.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeDemoModal);
    }
        
    elements.demoModal.addEventListener('click', function(e) {
      if (e.target === elements.demoModal) {
        closeDemoModal();
      }
    });
  }

  // App search
  if (elements.appSearch) {
    elements.appSearch.addEventListener('input', debounce(handleAppSearch, 300));
  }

  // Filter buttons
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', handleCategoryFilter);
  });

  // Load more apps
  if (elements.loadMoreAppsBtn) {
    elements.loadMoreAppsBtn.addEventListener('click', loadMoreApps);
  }

  // Smooth scrolling for navigation links
  const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
  navLinks.forEach(link => {
    link.addEventListener('click', handleSmoothScroll);
  });

  // Window events
  window.addEventListener('scroll', handleScroll);
  window.addEventListener('resize', handleResize);
}

// Navigation Functions
function toggleMobileMenu() {
  if (elements.navMenu && elements.navToggle) {
    elements.navMenu.classList.toggle('active');
    elements.navToggle.classList.toggle('active');
  }
}

function setupNavigation() {
  // Close mobile menu when clicking on links
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (elements.navMenu && elements.navToggle) {
        elements.navMenu.classList.remove('active');
        elements.navToggle.classList.remove('active');
      }
    });
  });
}

function handleScroll() {
  // Navbar scroll effect
  if (elements.navbar) {
    if (window.scrollY > 50) {
      elements.navbar.classList.add('scrolled');
    } else {
      elements.navbar.classList.remove('scrolled');
    }
  }

  // Update active navigation link
  updateActiveNavLink();
}

function updateActiveNavLink() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    
  let current = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    if (window.scrollY >= sectionTop - 200) {
      current = section.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });
}

function handleSmoothScroll(e) {
  e.preventDefault();
  const targetId = e.target.getAttribute('href');
  const targetSection = document.querySelector(targetId);
    
  if (targetSection) {
    const offsetTop = targetSection.offsetTop - 80; // Account for fixed navbar
    window.scrollTo({
      top: offsetTop,
      behavior: 'smooth'
    });
  }
}

function scrollToConversion() {
  const convertSection = document.getElementById('convert');
  if (convertSection) {
    const offsetTop = convertSection.offsetTop - 80;
    window.scrollTo({
      top: offsetTop,
      behavior: 'smooth'
    });
        
    // Focus on URL input after scroll
    setTimeout(() => {
      if (elements.saasUrlInput) {
        elements.saasUrlInput.focus();
      }
    }, 500);
  }
}

// Demo Modal Functions
function openDemoModal() {
  if (elements.demoModal && elements.demoVideo) {
    elements.demoVideo.src = CONFIG.DEMO_VIDEO_URL;
    elements.demoModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
}

function closeDemoModal() {
  if (elements.demoModal && elements.demoVideo) {
    elements.demoModal.style.display = 'none';
    elements.demoVideo.src = '';
    document.body.style.overflow = 'auto';
  }
}

// Conversion Functions
async function handleConversion(e) {
  e.preventDefault();
    
  if (conversionInProgress) return;
    
  const url = elements.saasUrlInput.value.trim();
  const generateAssets = document.getElementById('generate-assets').checked;
  const optimizeMobile = document.getElementById('optimize-mobile').checked;
    
  if (!url) {
    showNotification('Please enter a valid URL', 'error');
    return;
  }
    
  if (!isValidUrl(url)) {
    showNotification('Please enter a valid URL format', 'error');
    return;
  }
    
  conversionInProgress = true;
  showConversionStatus('Analyzing your website...');
    
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/apps/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url,
        generateAssets,
        optimizeMobile
      })
    });
        
    const data = await response.json();
        
    if (data.success) {
      updateConversionStatus('Generating app assets...', 40);
            
      // Simulate app generation process
      setTimeout(() => {
        updateConversionStatus('Creating mobile app...', 70);
                
        setTimeout(() => {
          updateConversionStatus('Finalizing...', 90);
                    
          setTimeout(() => {
            showConversionSuccess(data.analysis);
          }, 1000);
        }, 1500);
      }, 2000);
    } else {
      throw new Error(data.error || 'Conversion failed');
    }
  } catch (error) {
    console.error('Conversion error:', error);
    showNotification(error.message || 'Conversion failed. Please try again.', 'error');
    hideConversionStatus();
  } finally {
    conversionInProgress = false;
  }
}

function showConversionStatus(message) {
  if (elements.conversionStatus) {
    const statusText = elements.conversionStatus.querySelector('.status-text');
    if (statusText) {
      statusText.textContent = message;
    }
    elements.conversionStatus.style.display = 'block';
    updateConversionProgress(20);
  }
}

function updateConversionStatus(message, progress) {
  if (elements.conversionStatus) {
    const statusText = elements.conversionStatus.querySelector('.status-text');
    if (statusText) {
      statusText.textContent = message;
    }
    updateConversionProgress(progress);
  }
}

function updateConversionProgress(percentage) {
  const progressFill = document.querySelector('.progress-fill');
  if (progressFill) {
    progressFill.style.width = `${percentage}%`;
  }
}

function hideConversionStatus() {
  if (elements.conversionStatus) {
    elements.conversionStatus.style.display = 'none';
    updateConversionProgress(0);
  }
}

function showConversionSuccess(analysis) {
  hideConversionStatus();
    
  // Create success modal or redirect to dashboard
  const successMessage = `
        <div class="conversion-success">
            <div class="success-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <h3>Conversion Successful!</h3>
            <p>Your app "${analysis.suggestedAppName}" has been created successfully.</p>
            <div class="success-actions">
                <button class="btn btn-primary" onclick="window.location.href='/dashboard.html'">View Dashboard</button>
                <button class="btn btn-secondary" onclick="location.reload()">Convert Another</button>
            </div>
        </div>
    `;
    
  showModal(successMessage);
}

// App Store Functions
async function loadFeaturedApps() {
  try {
    // Use local JSON file for GitHub Pages compatibility
    const response = await fetch('./data/featured-apps.json');
    const data = await response.json();
        
    if (data.success && data.apps) {
      renderApps(data.apps);
    } else {
      renderDemoApps();
    }
  } catch (error) {
    console.error('Error loading featured apps:', error);
    renderDemoApps();
  }
}

function renderDemoApps() {
  const demoApps = [
    {
      id: 'demo-1',
      name: 'TaskFlow Pro',
      description: 'Project management made simple',
      icon: '/assets/demo-app-1.png',
      rating: 4.8,
      downloads: 1200,
      category: 'productivity'
    },
    {
      id: 'demo-2',
      name: 'FinanceTracker',
      description: 'Track your expenses effortlessly',
      icon: '/assets/demo-app-2.png',
      rating: 4.6,
      downloads: 850,
      category: 'finance'
    },
    {
      id: 'demo-3',
      name: 'LearnHub',
      description: 'Online learning platform',
      icon: '/assets/demo-app-3.png',
      rating: 4.9,
      downloads: 2100,
      category: 'education'
    }
  ];
    
  renderApps(demoApps);
}

function renderApps(apps) {
  if (!elements.appsGrid) return;
    
  // Clear existing demo apps
  elements.appsGrid.innerHTML = '';
    
  apps.forEach(app => {
    const appCard = createAppCard(app);
    elements.appsGrid.appendChild(appCard);
  });
}

function createAppCard(app) {
  const card = document.createElement('div');
  card.className = 'app-card';
  card.setAttribute('data-category', app.category || 'other');
    
  card.innerHTML = `
        <div class="app-icon">
            <img src="${app.icon || '/assets/default-app-icon.png'}" alt="${app.name}" onerror="this.src='/assets/default-app-icon.png'">
        </div>
        <div class="app-info">
            <h3 class="app-name">${app.name}</h3>
            <p class="app-description">${app.description}</p>
            <div class="app-rating">
                <div class="stars">
                    ${generateStars(app.rating || 4.5)}
                </div>
                <span class="rating-text">${app.rating || 4.5} (${formatNumber(app.downloads || 0)})</span>
            </div>
            <div class="app-actions">
                <button class="btn btn-primary btn-small" onclick="installApp('${app.id}')">
                    <i class="fas fa-download"></i>
                    Install
                </button>
                <button class="btn btn-secondary btn-small" onclick="previewApp('${app.id}')">
                    <i class="fas fa-eye"></i>
                    Preview
                </button>
            </div>
        </div>
    `;
    
  return card;
}

function generateStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  let starsHtml = '';
    
  for (let i = 0; i < fullStars; i++) {
    starsHtml += '<i class="fas fa-star"></i>';
  }
    
  if (hasHalfStar) {
    starsHtml += '<i class="fas fa-star-half-alt"></i>';
  }
    
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  for (let i = 0; i < emptyStars; i++) {
    starsHtml += '<i class="far fa-star"></i>';
  }
    
  return starsHtml;
}

function handleAppSearch(e) {
  const query = e.target.value.toLowerCase().trim();
  const appCards = document.querySelectorAll('.app-card');
    
  appCards.forEach(card => {
    const appName = card.querySelector('.app-name').textContent.toLowerCase();
    const appDescription = card.querySelector('.app-description').textContent.toLowerCase();
        
    if (appName.includes(query) || appDescription.includes(query)) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

function handleCategoryFilter(e) {
  const category = e.target.getAttribute('data-category');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const appCards = document.querySelectorAll('.app-card');
    
  // Update active filter button
  filterBtns.forEach(btn => btn.classList.remove('active'));
  e.target.classList.add('active');
    
  // Filter apps
  appCards.forEach(card => {
    const appCategory = card.getAttribute('data-category');
        
    if (category === 'all' || appCategory === category) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

async function loadMoreApps() {
  // Implement pagination for apps
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/apps/public?page=2&limit=6`);
    const data = await response.json();
        
    if (data.success && data.apps) {
      data.apps.forEach(app => {
        const appCard = createAppCard(app);
        elements.appsGrid.appendChild(appCard);
      });
    }
  } catch (error) {
    console.error('Error loading more apps:', error);
    showNotification('Failed to load more apps', 'error');
  }
}

// App Actions
function installApp(appId) {
  // Redirect to app store or show installation modal
  showNotification('Redirecting to app store...', 'info');
    
  // Simulate app store redirect
  setTimeout(() => {
    window.open('https://play.google.com/store', '_blank');
  }, 1000);
}

function previewApp(appId) {
  // Show app preview modal
  const previewContent = `
        <div class="app-preview">
            <div class="preview-header">
                <h3>App Preview</h3>
                <button class="btn btn-primary" onclick="installApp('${appId}')">
                    <i class="fas fa-download"></i>
                    Install App
                </button>
            </div>
            <div class="preview-content">
                <div class="preview-screenshots">
                    <img src="/assets/screenshot-1.png" alt="Screenshot 1">
                    <img src="/assets/screenshot-2.png" alt="Screenshot 2">
                    <img src="/assets/screenshot-3.png" alt="Screenshot 3">
                </div>
                <div class="preview-info">
                    <p>This is a preview of the mobile app. Click "Install App" to download from the app store.</p>
                </div>
            </div>
        </div>
    `;
    
  showModal(previewContent);
}

// Authentication
async function checkAuthStatus() {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) return;
        
    const response = await fetch(`${CONFIG.API_BASE_URL}/users/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
        
    if (response.ok) {
      const data = await response.json();
      currentUser = data.user;
      updateUIForAuthenticatedUser();
    } else {
      localStorage.removeItem('authToken');
    }
  } catch (error) {
    console.error('Auth check error:', error);
  }
}

function updateUIForAuthenticatedUser() {
  // Update navigation to show user-specific options
  const navCta = document.querySelector('.nav-cta');
  if (navCta && currentUser) {
    navCta.textContent = 'Dashboard';
    navCta.href = '/dashboard.html';
  }
}

// Utility Functions
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
  // Add to page
  document.body.appendChild(notification);
    
  // Show notification
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
    
  // Auto hide after 5 seconds
  setTimeout(() => {
    hideNotification(notification);
  }, 5000);
    
  // Close button
  const closeBtn = notification.querySelector('.notification-close');
  closeBtn.addEventListener('click', () => {
    hideNotification(notification);
  });
}

function hideNotification(notification) {
  notification.classList.remove('show');
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, CONFIG.ANIMATION_DURATION);
}

function showModal(content) {
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
        <div class="modal-content">
            <span class="modal-close">&times;</span>
            ${content}
        </div>
    `;
    
  // Add to page
  document.body.appendChild(modal);
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
    
  // Close handlers
  const closeBtn = modal.querySelector('.modal-close');
  closeBtn.addEventListener('click', () => {
    closeModal(modal);
  });
    
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal(modal);
    }
  });
}

function closeModal(modal) {
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
  if (modal.parentNode) {
    modal.parentNode.removeChild(modal);
  }
}

function handleResize() {
  // Handle responsive behavior
  if (window.innerWidth > 768) {
    if (elements.navMenu) {
      elements.navMenu.classList.remove('active');
    }
    if (elements.navToggle) {
      elements.navToggle.classList.remove('active');
    }
  }
}

// Initialize animations
function initializeAnimations() {
  // Initialize AOS (Animate On Scroll)
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: true,
      offset: 100
    });
  }
}

// Export functions for global access
window.installApp = installApp;
window.previewApp = previewApp;
window.showNotification = showNotification;
window.showModal = showModal;
window.closeModal = closeModal;

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
  if (document.hidden) {
    // Page is hidden
    // console.log('Page hidden'); // Commented to reduce console spam
  } else {
    // Page is visible
    // console.log('Page visible'); // Commented to reduce console spam
  }
});

// Service Worker registration removed to prevent errors
// Uncomment and add sw.js file if PWA capabilities are needed