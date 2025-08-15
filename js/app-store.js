// App Store JavaScript for Rapid SaaS AI Store

// App Store Configuration
const APP_STORE_CONFIG = {
  APPS_PER_PAGE: 12,
  SEARCH_DEBOUNCE: 300,
  CATEGORIES: [
    { id: 'all', name: 'All Apps', icon: 'fas fa-th' },
    { id: 'productivity', name: 'Productivity', icon: 'fas fa-tasks' },
    { id: 'business', name: 'Business', icon: 'fas fa-briefcase' },
    { id: 'finance', name: 'Finance', icon: 'fas fa-chart-line' },
    { id: 'education', name: 'Education', icon: 'fas fa-graduation-cap' },
    { id: 'health', name: 'Health & Fitness', icon: 'fas fa-heartbeat' },
    { id: 'social', name: 'Social', icon: 'fas fa-users' },
    { id: 'entertainment', name: 'Entertainment', icon: 'fas fa-play' },
    { id: 'utilities', name: 'Utilities', icon: 'fas fa-tools' },
    { id: 'travel', name: 'Travel', icon: 'fas fa-plane' }
  ],
  SORT_OPTIONS: [
    { value: 'featured', label: 'Featured' },
    { value: 'newest', label: 'Newest' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'downloads', label: 'Most Downloaded' },
    { value: 'name', label: 'Name A-Z' }
  ]
};

// App Store State
let appStoreState = {
  currentPage: 1,
  currentCategory: 'all',
  currentSort: 'featured',
  searchQuery: '',
  apps: [],
  filteredApps: [],
  loading: false,
  hasMore: true
};

// Initialize App Store
document.addEventListener('DOMContentLoaded', function() {
  if (window.location.pathname.includes('store') || document.getElementById('app-store-page')) {
    initializeAppStore();
  }
});

function initializeAppStore() {
  setupAppStoreElements();
  setupAppStoreEventListeners();
  renderCategories();
  renderSortOptions();
  loadApps();
}

function setupAppStoreElements() {
  // Create app store structure if not exists
  const appStoreContainer = document.getElementById('app-store-container');
  if (!appStoreContainer) return;

  appStoreContainer.innerHTML = `
        <div class="app-store-header">
            <div class="container">
                <h1>App Store</h1>
                <p>Discover amazing SaaS applications converted to mobile apps</p>
                
                <div class="search-section">
                    <div class="search-container">
                        <input type="text" id="app-store-search" placeholder="Search apps, categories, or features..." class="search-input">
                        <button class="search-btn">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                    <div class="ai-suggestions" id="ai-suggestions"></div>
                </div>
            </div>
        </div>
        
        <div class="app-store-filters">
            <div class="container">
                <div class="filter-row">
                    <div class="categories-filter">
                        <h3>Categories</h3>
                        <div class="categories-grid" id="categories-grid"></div>
                    </div>
                    
                    <div class="sort-filter">
                        <label for="sort-select">Sort by:</label>
                        <select id="sort-select" class="sort-select"></select>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="app-store-content">
            <div class="container">
                <div class="apps-section">
                    <div class="section-header">
                        <h2 id="section-title">Featured Apps</h2>
                        <span class="apps-count" id="apps-count">0 apps</span>
                    </div>
                    
                    <div class="apps-grid" id="store-apps-grid"></div>
                    
                    <div class="loading-spinner" id="loading-spinner" style="display: none;">
                        <div class="spinner"></div>
                        <p>Loading apps...</p>
                    </div>
                    
                    <div class="load-more-section" id="load-more-section">
                        <button class="btn btn-secondary" id="load-more-store-apps">Load More Apps</button>
                    </div>
                    
                    <div class="no-apps-message" id="no-apps-message" style="display: none;">
                        <div class="no-apps-content">
                            <i class="fas fa-search fa-3x"></i>
                            <h3>No apps found</h3>
                            <p>Try adjusting your search or filter criteria</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function setupAppStoreEventListeners() {
  // Search functionality
  const searchInput = document.getElementById('app-store-search');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(handleStoreSearch, APP_STORE_CONFIG.SEARCH_DEBOUNCE));
    searchInput.addEventListener('focus', showAISuggestions);
    searchInput.addEventListener('blur', hideAISuggestions);
  }

  // Sort functionality
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', handleSortChange);
  }

  // Load more functionality
  const loadMoreBtn = document.getElementById('load-more-store-apps');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', loadMoreStoreApps);
  }

  // Infinite scroll
  window.addEventListener('scroll', handleInfiniteScroll);
}

function renderCategories() {
  const categoriesGrid = document.getElementById('categories-grid');
  if (!categoriesGrid) return;

  categoriesGrid.innerHTML = '';
    
  APP_STORE_CONFIG.CATEGORIES.forEach(category => {
    const categoryBtn = document.createElement('button');
    categoryBtn.className = `category-btn ${category.id === appStoreState.currentCategory ? 'active' : ''}`;
    categoryBtn.setAttribute('data-category', category.id);
    categoryBtn.innerHTML = `
            <i class="${category.icon}"></i>
            <span>${category.name}</span>
        `;
        
    categoryBtn.addEventListener('click', () => handleCategoryChange(category.id));
    categoriesGrid.appendChild(categoryBtn);
  });
}

function renderSortOptions() {
  const sortSelect = document.getElementById('sort-select');
  if (!sortSelect) return;

  sortSelect.innerHTML = '';
    
  APP_STORE_CONFIG.SORT_OPTIONS.forEach(option => {
    const optionElement = document.createElement('option');
    optionElement.value = option.value;
    optionElement.textContent = option.label;
    optionElement.selected = option.value === appStoreState.currentSort;
    sortSelect.appendChild(optionElement);
  });
}

async function loadApps(reset = false) {
  if (appStoreState.loading) return;
    
  appStoreState.loading = true;
  showLoadingSpinner();
    
  if (reset) {
    appStoreState.currentPage = 1;
    appStoreState.apps = [];
    appStoreState.hasMore = true;
  }
    
  try {
    const params = new URLSearchParams({
      page: appStoreState.currentPage,
      limit: APP_STORE_CONFIG.APPS_PER_PAGE,
      category: appStoreState.currentCategory !== 'all' ? appStoreState.currentCategory : '',
      sort: appStoreState.currentSort,
      search: appStoreState.searchQuery
    });
        
    const appsUrl = new URL('./data/store-apps.json', window.location.href).toString();
    const response = await fetch(appsUrl);
    const data = await response.json();
        
    if (data.success) {
      if (reset) {
        appStoreState.apps = data.apps || [];
      } else {
        appStoreState.apps = [...appStoreState.apps, ...(data.apps || [])];
      }
            
      appStoreState.hasMore = data.hasMore || false;
      renderStoreApps();
      updateAppsCount();
    } else {
      throw new Error(data.error || 'Failed to load apps');
    }
  } catch (error) {
    console.error('Error loading apps:', error);
    if (appStoreState.apps.length === 0) {
      loadDemoStoreApps();
    }
    showNotification('Failed to load apps. Showing demo apps.', 'warning');
  } finally {
    appStoreState.loading = false;
    hideLoadingSpinner();
  }
}

function loadDemoStoreApps() {
  const demoApps = [
    {
      id: 'demo-1',
      name: 'TaskFlow Pro',
      description: 'Advanced project management and team collaboration platform',
      longDescription: 'TaskFlow Pro is a comprehensive project management solution that helps teams collaborate effectively, track progress, and deliver projects on time.',
      icon: '/assets/demo-app-1.png',
      screenshots: ['/assets/screenshot-1.png', '/assets/screenshot-2.png'],
      rating: 4.8,
      downloads: 12500,
      category: 'productivity',
      developer: 'TaskFlow Inc.',
      version: '2.1.0',
      size: '15.2 MB',
      features: ['Real-time collaboration', 'Gantt charts', 'Time tracking', 'File sharing'],
      price: 'Free with premium features'
    },
    {
      id: 'demo-2',
      name: 'FinanceTracker',
      description: 'Personal finance management and expense tracking',
      longDescription: 'Take control of your finances with FinanceTracker. Track expenses, set budgets, and achieve your financial goals.',
      icon: '/assets/demo-app-2.png',
      screenshots: ['/assets/screenshot-3.png', '/assets/screenshot-4.png'],
      rating: 4.6,
      downloads: 8500,
      category: 'finance',
      developer: 'MoneyWise Solutions',
      version: '1.8.3',
      size: '12.8 MB',
      features: ['Expense tracking', 'Budget planning', 'Investment tracking', 'Reports'],
      price: 'Free'
    },
    {
      id: 'demo-3',
      name: 'LearnHub',
      description: 'Online learning platform with interactive courses',
      longDescription: 'Expand your knowledge with LearnHub\'s extensive library of interactive courses and expert-led tutorials.',
      icon: '/assets/demo-app-3.png',
      screenshots: ['/assets/screenshot-5.png', '/assets/screenshot-6.png'],
      rating: 4.9,
      downloads: 21000,
      category: 'education',
      developer: 'EduTech Corp',
      version: '3.2.1',
      size: '28.5 MB',
      features: ['Video courses', 'Interactive quizzes', 'Certificates', 'Offline mode'],
      price: 'Freemium'
    },
    {
      id: 'demo-4',
      name: 'HealthSync',
      description: 'Comprehensive health and fitness tracking',
      longDescription: 'Monitor your health metrics, track workouts, and maintain a healthy lifestyle with HealthSync.',
      icon: '/assets/demo-app-4.png',
      screenshots: ['/assets/screenshot-7.png', '/assets/screenshot-8.png'],
      rating: 4.7,
      downloads: 15800,
      category: 'health',
      developer: 'WellnessTech',
      version: '2.5.0',
      size: '22.1 MB',
      features: ['Activity tracking', 'Nutrition logging', 'Sleep monitoring', 'Health insights'],
      price: 'Free with ads'
    },
    {
      id: 'demo-5',
      name: 'SocialConnect',
      description: 'Professional networking and collaboration',
      longDescription: 'Build meaningful professional connections and collaborate with industry experts using SocialConnect.',
      icon: '/assets/demo-app-5.png',
      screenshots: ['/assets/screenshot-9.png', '/assets/screenshot-10.png'],
      rating: 4.4,
      downloads: 9200,
      category: 'social',
      developer: 'NetworkPro Ltd',
      version: '1.9.2',
      size: '18.7 MB',
      features: ['Professional profiles', 'Messaging', 'Event networking', 'Industry insights'],
      price: 'Free'
    },
    {
      id: 'demo-6',
      name: 'TravelPlanner',
      description: 'Smart travel planning and booking assistant',
      longDescription: 'Plan your perfect trip with AI-powered recommendations, booking assistance, and travel guides.',
      icon: '/assets/demo-app-6.png',
      screenshots: ['/assets/screenshot-11.png', '/assets/screenshot-12.png'],
      rating: 4.5,
      downloads: 11300,
      category: 'travel',
      developer: 'Wanderlust Apps',
      version: '2.0.5',
      size: '25.3 MB',
      features: ['Trip planning', 'Hotel booking', 'Flight search', 'Local guides'],
      price: 'Free'
    }
  ];
    
  appStoreState.apps = demoApps;
  renderStoreApps();
  updateAppsCount();
}

function renderStoreApps() {
  const appsGrid = document.getElementById('store-apps-grid');
  const noAppsMessage = document.getElementById('no-apps-message');
  const loadMoreSection = document.getElementById('load-more-section');
    
  if (!appsGrid) return;
    
  if (appStoreState.currentPage === 1) {
    appsGrid.innerHTML = '';
  }
    
  if (appStoreState.apps.length === 0) {
    if (noAppsMessage) noAppsMessage.style.display = 'block';
    if (loadMoreSection) loadMoreSection.style.display = 'none';
    return;
  }
    
  if (noAppsMessage) noAppsMessage.style.display = 'none';
    
  appStoreState.apps.forEach(app => {
    if (!document.querySelector(`[data-app-id="${app.id}"]`)) {
      const appCard = createStoreAppCard(app);
      appsGrid.appendChild(appCard);
    }
  });
    
  // Update load more button
  if (loadMoreSection) {
    loadMoreSection.style.display = appStoreState.hasMore ? 'block' : 'none';
  }
}

function createStoreAppCard(app) {
  const card = document.createElement('div');
  card.className = 'store-app-card';
  card.setAttribute('data-app-id', app.id);
  card.setAttribute('data-category', app.category || 'other');
    
  card.innerHTML = `
        <div class="app-card-header">
            <div class="app-icon">
                <img src="${app.icon || 'assets/default-app-icon.png'}" alt="${app.name}" onerror="this.src='assets/default-app-icon.png'">
            </div>
            <div class="app-basic-info">
                <h3 class="app-name">${app.name}</h3>
                <p class="app-developer">${app.developer || 'Unknown Developer'}</p>
                <div class="app-rating">
                    <div class="stars">
                        ${generateStars(app.rating || 4.5)}
                    </div>
                    <span class="rating-text">${app.rating || 4.5}</span>
                </div>
            </div>
        </div>
        
        <div class="app-card-body">
            <p class="app-description">${app.description}</p>
            
            <div class="app-stats">
                <div class="stat">
                    <i class="fas fa-download"></i>
                    <span>${formatNumber(app.downloads || 0)} downloads</span>
                </div>
                <div class="stat">
                    <i class="fas fa-tag"></i>
                    <span>${app.price || 'Free'}</span>
                </div>
                <div class="stat">
                    <i class="fas fa-hdd"></i>
                    <span>${app.size || 'Unknown size'}</span>
                </div>
            </div>
            
            <div class="app-features">
                ${(app.features || []).slice(0, 3).map(feature => `<span class="feature-tag">${feature}</span>`).join('')}
            </div>
        </div>
        
        <div class="app-card-footer">
            <button class="btn btn-primary" onclick="installStoreApp('${app.id}')">
                <i class="fas fa-download"></i>
                Install
            </button>
            <button class="btn btn-secondary" onclick="previewStoreApp('${app.id}')">
                <i class="fas fa-eye"></i>
                Preview
            </button>
            <button class="btn btn-icon" onclick="toggleAppFavorite('${app.id}')" title="Add to favorites">
                <i class="far fa-heart"></i>
            </button>
        </div>
    `;
    
  // Add click handler for app details
  card.addEventListener('click', (e) => {
    if (!e.target.closest('button')) {
      showAppDetails(app);
    }
  });
    
  return card;
}

function handleStoreSearch(e) {
  appStoreState.searchQuery = e.target.value.toLowerCase().trim();
  appStoreState.currentPage = 1;
  loadApps(true);
  updateSectionTitle();
}

function handleCategoryChange(categoryId) {
  appStoreState.currentCategory = categoryId;
  appStoreState.currentPage = 1;
    
  // Update active category button
  const categoryBtns = document.querySelectorAll('.category-btn');
  categoryBtns.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-category') === categoryId);
  });
    
  loadApps(true);
  updateSectionTitle();
}

function handleSortChange(e) {
  appStoreState.currentSort = e.target.value;
  appStoreState.currentPage = 1;
  loadApps(true);
}

function loadMoreStoreApps() {
  if (!appStoreState.hasMore || appStoreState.loading) return;
    
  appStoreState.currentPage++;
  loadApps();
}

function handleInfiniteScroll() {
  if (appStoreState.loading || !appStoreState.hasMore) return;
    
  const scrollPosition = window.innerHeight + window.scrollY;
  const documentHeight = document.documentElement.offsetHeight;
    
  if (scrollPosition >= documentHeight - 1000) {
    loadMoreStoreApps();
  }
}

function updateAppsCount() {
  const appsCount = document.getElementById('apps-count');
  if (appsCount) {
    const count = appStoreState.apps.length;
    appsCount.textContent = `${count} app${count !== 1 ? 's' : ''}`;
  }
}

function updateSectionTitle() {
  const sectionTitle = document.getElementById('section-title');
  if (!sectionTitle) return;
    
  let title = 'Featured Apps';
    
  if (appStoreState.searchQuery) {
    title = `Search Results for "${appStoreState.searchQuery}"`;
  } else if (appStoreState.currentCategory !== 'all') {
    const category = APP_STORE_CONFIG.CATEGORIES.find(cat => cat.id === appStoreState.currentCategory);
    title = category ? category.name : 'Apps';
  }
    
  sectionTitle.textContent = title;
}

function showLoadingSpinner() {
  const spinner = document.getElementById('loading-spinner');
  if (spinner) {
    spinner.style.display = 'block';
  }
}

function hideLoadingSpinner() {
  const spinner = document.getElementById('loading-spinner');
  if (spinner) {
    spinner.style.display = 'none';
  }
}

// AI Suggestions
function showAISuggestions() {
  const suggestions = document.getElementById('ai-suggestions');
  if (!suggestions) return;
    
  const aiSuggestions = [
    'Project management tools',
    'Finance tracking apps',
    'Educational platforms',
    'Health and fitness trackers',
    'Social networking apps',
    'Travel planning tools'
  ];
    
  suggestions.innerHTML = aiSuggestions.map(suggestion => 
    `<div class="ai-suggestion" onclick="selectAISuggestion('${suggestion}')">
            <i class="fas fa-lightbulb"></i>
            <span>${suggestion}</span>
        </div>`
  ).join('');
    
  suggestions.style.display = 'block';
}

function hideAISuggestions() {
  setTimeout(() => {
    const suggestions = document.getElementById('ai-suggestions');
    if (suggestions) {
      suggestions.style.display = 'none';
    }
  }, 200);
}

function selectAISuggestion(suggestion) {
  const searchInput = document.getElementById('app-store-search');
  if (searchInput) {
    searchInput.value = suggestion;
    handleStoreSearch({ target: searchInput });
  }
  hideAISuggestions();
}

// App Actions
function installStoreApp(appId) {
  // Track installation
  trackAppEvent('install_clicked', appId);
    
  // Show installation modal
  const app = appStoreState.apps.find(a => a.id === appId);
  if (!app) return;
    
  const installContent = `
        <div class="install-modal">
            <div class="install-header">
                <img src="${app.icon || 'assets/default-app-icon.png'}" alt="${app.name}" class="install-icon">
                <div class="install-info">
                    <h3>${app.name}</h3>
                    <p>by ${app.developer || 'Unknown Developer'}</p>
                </div>
            </div>
            
            <div class="install-options">
                <h4>Choose your platform:</h4>
                <div class="platform-buttons">
                    <button class="btn btn-primary platform-btn" onclick="redirectToStore('android', '${appId}')">
                        <i class="fab fa-google-play"></i>
                        Google Play Store
                    </button>
                    <button class="btn btn-primary platform-btn" onclick="redirectToStore('ios', '${appId}')">
                        <i class="fab fa-app-store-ios"></i>
                        Apple App Store
                    </button>
                    <button class="btn btn-secondary platform-btn" onclick="redirectToStore('web', '${appId}')">
                        <i class="fas fa-globe"></i>
                        Open Web Version
                    </button>
                </div>
            </div>
            
            <div class="install-note">
                <p><i class="fas fa-info-circle"></i> You'll be redirected to the official app store for installation.</p>
            </div>
        </div>
    `;
    
  showModal(installContent);
}

function previewStoreApp(appId) {
  const app = appStoreState.apps.find(a => a.id === appId);
  if (!app) return;
    
  showAppDetails(app);
}

function showAppDetails(app) {
  const detailsContent = `
        <div class="app-details">
            <div class="app-details-header">
                <img src="${app.icon || 'assets/default-app-icon.png'}" alt="${app.name}" class="details-icon">
                <div class="details-info">
                    <h2>${app.name}</h2>
                    <p class="developer">by ${app.developer || 'Unknown Developer'}</p>
                    <div class="rating-section">
                        <div class="stars">${generateStars(app.rating || 4.5)}</div>
                        <span class="rating-text">${app.rating || 4.5} (${formatNumber(app.downloads || 0)} downloads)</span>
                    </div>
                    <div class="app-meta">
                        <span class="version">Version ${app.version || '1.0.0'}</span>
                        <span class="size">${app.size || 'Unknown size'}</span>
                        <span class="price">${app.price || 'Free'}</span>
                    </div>
                </div>
                <div class="details-actions">
                    <button class="btn btn-primary btn-large" onclick="installStoreApp('${app.id}')">
                        <i class="fas fa-download"></i>
                        Install
                    </button>
                    <button class="btn btn-icon" onclick="toggleAppFavorite('${app.id}')" title="Add to favorites">
                        <i class="far fa-heart"></i>
                    </button>
                </div>
            </div>
            
            <div class="app-details-body">
                <div class="screenshots-section">
                    <h3>Screenshots</h3>
                    <div class="screenshots-grid">
                        ${(app.screenshots || ['/assets/screenshot-1.png', '/assets/screenshot-2.png']).map(screenshot => 
    `<img src="${screenshot}" alt="Screenshot" class="screenshot" onclick="openScreenshot('${screenshot}')"`
  ).join('')}
                    </div>
                </div>
                
                <div class="description-section">
                    <h3>About this app</h3>
                    <p>${app.longDescription || app.description}</p>
                </div>
                
                <div class="features-section">
                    <h3>Key Features</h3>
                    <ul class="features-list">
                        ${(app.features || []).map(feature => `<li><i class="fas fa-check"></i> ${feature}</li>`).join('')}
                    </ul>
                </div>
            </div>
        </div>
    `;
    
  showModal(detailsContent);
  trackAppEvent('details_viewed', app.id);
}

function toggleAppFavorite(appId) {
  // Toggle favorite status
  const favorites = JSON.parse(localStorage.getItem('favoriteApps') || '[]');
  const index = favorites.indexOf(appId);
    
  if (index > -1) {
    favorites.splice(index, 1);
    showNotification('Removed from favorites', 'info');
  } else {
    favorites.push(appId);
    showNotification('Added to favorites', 'success');
  }
    
  localStorage.setItem('favoriteApps', JSON.stringify(favorites));
  updateFavoriteButtons();
}

function updateFavoriteButtons() {
  const favorites = JSON.parse(localStorage.getItem('favoriteApps') || '[]');
    
  document.querySelectorAll('[onclick*="toggleAppFavorite"]').forEach(btn => {
    const appId = btn.getAttribute('onclick').match(/'([^']+)'/)[1];
    const icon = btn.querySelector('i');
        
    if (favorites.includes(appId)) {
      icon.className = 'fas fa-heart';
      btn.classList.add('favorited');
    } else {
      icon.className = 'far fa-heart';
      btn.classList.remove('favorited');
    }
  });
}

function redirectToStore(platform, appId) {
  const app = appStoreState.apps.find(a => a.id === appId);
  if (!app) return;
    
  let url;
  switch (platform) {
  case 'android':
    url = `https://play.google.com/store/search?q=${encodeURIComponent(app.name)}`;
    break;
  case 'ios':
    url = `https://apps.apple.com/search?term=${encodeURIComponent(app.name)}`;
    break;
  case 'web':
    url = app.webUrl || '#';
    break;
  default:
    return;
  }
    
  trackAppEvent('store_redirect', appId, { platform });
  window.open(url, '_blank');
  closeModal(document.querySelector('.modal'));
}

function openScreenshot(screenshotUrl) {
  const screenshotContent = `
        <div class="screenshot-viewer">
            <img src="${screenshotUrl}" alt="Screenshot" class="full-screenshot">
        </div>
    `;
    
  showModal(screenshotContent);
}

// Analytics
function trackAppEvent(event, appId, data = {}) {
  // Track app-related events for analytics
  const eventData = {
    event,
    appId,
    timestamp: new Date().toISOString(),
    ...data
  };
    
  // Send to analytics service
  fetch(`${CONFIG.API_BASE_URL}/analytics/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(eventData)
  }).catch(error => {
    console.error('Analytics error:', error);
  });
}

// Export functions for global access
window.installStoreApp = installStoreApp;
window.previewStoreApp = previewStoreApp;
window.toggleAppFavorite = toggleAppFavorite;
window.redirectToStore = redirectToStore;
window.selectAISuggestion = selectAISuggestion;
window.openScreenshot = openScreenshot;

// Initialize favorites on load
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(updateFavoriteButtons, 1000);
});