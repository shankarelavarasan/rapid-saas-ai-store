// Main JavaScript for Rapid SaaS AI Store

// Configuration
const CONFIG = {
  API_BASE_URL: window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : 'https://your-render-backend.onrender.com/api',
  DEMO_VIDEO_URL: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  ANIMATION_DURATION: 300,
  DEMO_MODE: window.location.hostname.includes('github.io') || window.location.hostname === 'localhost'
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
  appsGrid: document.getElementById('apps-container'),
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
    const appsUrl = new URL('./data/store-apps.json', window.location.href).toString();
    const response = await fetch(appsUrl);
    const data = await response.json();
        
    if (data.success && data.apps) {
      appStoreState.apps = data.apps;
      filterAndDisplayApps();
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
      description: 'Advanced project management and team collaboration',
      icon: 'assets/demo-app-1.png',
      rating: 4.8,
      downloads: 12000,
      category: 'productivity',
      developer: 'ProductivityCorp',
      price: 'Free'
    },
    {
      id: 'demo-2',
      name: 'FinanceTracker',
      description: 'Personal finance management and expense tracking',
      icon: 'assets/demo-app-2.png',
      rating: 4.6,
      downloads: 8500,
      category: 'finance',
      developer: 'MoneyWise Solutions',
      price: 'Free'
    },
    {
      id: 'demo-3',
      name: 'LearnHub',
      description: 'Online learning platform with interactive courses',
      icon: 'assets/demo-app-3.png',
      rating: 4.9,
      downloads: 21000,
      category: 'education',
      developer: 'EduTech Corp',
      price: 'Freemium'
    }
  ];
    
  appStoreState.apps = demoApps;
  filterAndDisplayApps();
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
        <div class="app-header">
            <img src="${app.icon || 'assets/default-app-icon.png'}" alt="${app.name}" class="app-icon" onerror="this.src='assets/default-app-icon.png'">
            <div class="app-info">
                <h3>${app.name}</h3>
                <p>${app.description}</p>
                <div class="app-rating">
                    <span class="stars">${generateStars(app.rating || 4.5)}</span>
                    <span class="rating-text">${app.rating || 4.5} (${formatNumber(app.downloads || 0)})</span>
                </div>
            </div>
        </div>
        <div class="app-actions">
            <button class="btn btn-primary" onclick="downloadApp('${app.id}')">
                <i class="fas fa-download"></i>
                ${app.price || 'Free'}
            </button>
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
                    <img src="assets/screenshot-1.png" alt="Screenshot 1">
                <img src="assets/screenshot-2.png" alt="Screenshot 2">
                <img src="assets/screenshot-3.png" alt="Screenshot 3">
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

// App Store State (declared in app-store.js)
// appStoreState is imported from app-store.js

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
  
  // Initialize app store functionality
  initializeAppStore();
}

// Initialize App Store
function initializeAppStore() {
    setupSearchFunctionality();
    setupCategoryFilters();
    setupSortFunctionality();
    setupLoadMore();
}

// Setup Search Functionality
function setupSearchFunctionality() {
    const searchInput = document.getElementById('app-search');
    const searchBtn = document.getElementById('search-btn');
    
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                appStoreState.searchQuery = this.value.toLowerCase();
                filterAndDisplayApps();
            }, 300);
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            if (searchInput) {
                appStoreState.searchQuery = searchInput.value.toLowerCase();
                filterAndDisplayApps();
            }
        });
    }
}

// Setup Category Filters
function setupCategoryFilters() {
    const categoryItems = document.querySelectorAll('.category-item');
    
    categoryItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items
            categoryItems.forEach(cat => cat.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Update state and filter
            appStoreState.currentCategory = this.dataset.category;
            appStoreState.currentPage = 1;
            filterAndDisplayApps();
            
            // Update section title
            updateSectionTitle();
        });
    });
}

// Setup Sort Functionality
function setupSortFunctionality() {
    const sortSelect = document.getElementById('sort-select');
    
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            appStoreState.currentSort = this.value;
            appStoreState.currentPage = 1;
            filterAndDisplayApps();
        });
    }
}

// Setup Load More
function setupLoadMore() {
    const loadMoreBtn = document.getElementById('load-more-btn');
    
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            appStoreState.currentPage++;
            displayApps(false); // false means append, not replace
        });
    }
}

// Filter and Display Apps
function filterAndDisplayApps() {
    let filtered = [...appStoreState.apps];
    
    // Filter by category
    if (appStoreState.currentCategory !== 'all') {
        filtered = filtered.filter(app => {
            // Map new categories to existing ones
            const categoryMap = {
                'ide': ['productivity', 'business'],
                'saas': ['business', 'productivity'],
                'app': ['productivity', 'finance', 'education'],
                'webapp': ['business', 'social'],
                'software': ['productivity', 'utilities'],
                'plugin': ['utilities', 'productivity']
            };
            
            if (categoryMap[appStoreState.currentCategory]) {
                return categoryMap[appStoreState.currentCategory].includes(app.category);
            }
            
            return app.category === appStoreState.currentCategory;
        });
    }
    
    // Filter by search query
    if (appStoreState.searchQuery) {
        filtered = filtered.filter(app => 
            app.name.toLowerCase().includes(appStoreState.searchQuery) ||
            app.description.toLowerCase().includes(appStoreState.searchQuery) ||
            app.category.toLowerCase().includes(appStoreState.searchQuery)
        );
    }
    
    // Sort apps
    filtered = sortApps(filtered);
    
    appStoreState.filteredApps = filtered;
    appStoreState.currentPage = 1;
    displayApps(true); // true means replace
}

// Sort Apps
function sortApps(apps) {
    switch (appStoreState.currentSort) {
        case 'rating':
            return apps.sort((a, b) => b.rating - a.rating);
        case 'downloads':
            return apps.sort((a, b) => b.downloads - a.downloads);
        case 'newest':
            return apps.sort((a, b) => new Date(b.updated || 0) - new Date(a.updated || 0));
        case 'name':
            return apps.sort((a, b) => a.name.localeCompare(b.name));
        case 'featured':
        default:
            return apps.sort((a, b) => (b.featured || 0) - (a.featured || 0));
    }
}

// Display Apps
function displayApps(replace = true) {
    const container = document.getElementById('apps-container');
    const loadMoreContainer = document.getElementById('load-more-container');
    
    if (!container) return;
    
    const startIndex = (appStoreState.currentPage - 1) * appStoreState.appsPerPage;
    const endIndex = startIndex + appStoreState.appsPerPage;
    const appsToShow = appStoreState.filteredApps.slice(startIndex, endIndex);
    
    if (replace) {
        container.innerHTML = '';
    }
    
    appsToShow.forEach(app => {
        const appCard = createAppCard(app);
        container.appendChild(appCard);
    });
    
    // Show/hide load more button
    if (loadMoreContainer) {
        const hasMore = endIndex < appStoreState.filteredApps.length;
        loadMoreContainer.style.display = hasMore ? 'block' : 'none';
    }
    
    // Update apps count
    updateAppsCount();
}

// Update Section Title
function updateSectionTitle() {
    const title = document.getElementById('apps-title');
    if (title) {
        const categoryNames = {
            'all': 'Featured Apps',
            'ide': 'IDE Applications',
            'saas': 'SaaS Applications',
            'app': 'Mobile Apps',
            'webapp': 'Web Applications',
            'software': 'Software Tools',
            'plugin': 'Plugins & Addons'
        };
        
        title.textContent = categoryNames[appStoreState.currentCategory] || 'Featured Apps';
    }
}

// Update Apps Count
function updateAppsCount() {
    const countElement = document.getElementById('apps-count');
    if (countElement) {
        const count = appStoreState.filteredApps.length;
        countElement.textContent = `${count} app${count !== 1 ? 's' : ''}`;
    }
}

// Download App Function
function downloadApp(appId) {
    const app = appStoreState.apps.find(a => a.id === appId);
    if (app) {
        // In a real app, this would handle the download
        alert(`Downloading ${app.name}...\n\nThis would redirect to the app download or conversion process.`);
        
        // You could redirect to conversion page
        // window.location.href = `convert.html?app=${appId}`;
    }
}

// Export functions for global access
window.installApp = installApp;
window.previewApp = previewApp;
window.downloadApp = downloadApp;
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

// Global function to handle Get Started button click
function loadApps() {
  console.log('loadApps() called - navigating to apps section');
  try {
    // Navigate to app store section
    const appsSection = document.getElementById('apps');
    if (appsSection) {
      appsSection.scrollIntoView({ behavior: 'smooth' });
      console.log('Scrolled to apps section');
    } else {
      console.warn('Apps section not found');
    }
    
    // Load featured apps if not already loaded
    loadFeaturedApps();
    console.log('Featured apps loading initiated');
  } catch (error) {
    console.error('Error in loadApps():', error);
  }
}

// Service Worker registration removed to prevent errors
// Uncomment and add sw.js file if PWA capabilities are needed
// For PWA support, add service worker registration here