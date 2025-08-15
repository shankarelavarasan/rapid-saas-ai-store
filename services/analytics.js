import { supabase } from './database.js';

/**
 * Analytics Service
 * Handles app usage tracking, revenue analytics, and user engagement metrics
 */

/**
 * Get dashboard analytics for a user
 * @param {string} userId - User ID
 * @param {Object} options - Query options (timeRange, etc.)
 * @returns {Object} Dashboard analytics data
 */
const getAnalytics = async (userId, options = {}) => {
  try {
    const { timeRange = '30d' } = options;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
    case '7d':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(endDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(endDate.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(endDate.getDate() - 30);
    }

    // Get user's apps
    const { data: apps, error: appsError } = await supabase
      .from('apps')
      .select('id, name, created_at')
      .eq('user_id', userId);

    if (appsError) {
      throw appsError;
    }

    const appIds = apps.map(app => app.id);

    // Get analytics events
    const { data: events, error: eventsError } = await supabase
      .from('analytics_events')
      .select('*')
      .in('app_id', appIds)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (eventsError) {
      console.error('Analytics events error:', eventsError);
      // Continue with empty events if table doesn't exist
    }

    // Get revenue data
    const { data: revenue, error: revenueError } = await supabase
      .from('revenue_transactions')
      .select('*')
      .in('app_id', appIds)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (revenueError) {
      console.error('Revenue data error:', revenueError);
      // Continue with empty revenue if table doesn't exist
    }

    // Calculate metrics
    const totalApps = apps.length;
    const totalDownloads = (events || []).filter(e => e.event_type === 'download').length;
    const totalRevenue = (revenue || []).reduce((sum, r) => sum + (r.amount || 0), 0);
    const activeApps = [...new Set((events || []).map(e => e.app_id))].length;

    // Calculate daily metrics for charts
    const dailyMetrics = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayStart = new Date(d);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const dayEvents = (events || []).filter(e => {
        const eventDate = new Date(e.created_at);
        return eventDate >= dayStart && eventDate <= dayEnd;
      });

      const dayRevenue = (revenue || []).filter(r => {
        const revenueDate = new Date(r.created_at);
        return revenueDate >= dayStart && revenueDate <= dayEnd;
      });

      dailyMetrics.push({
        date: dayStart.toISOString().split('T')[0],
        downloads: dayEvents.filter(e => e.event_type === 'download').length,
        views: dayEvents.filter(e => e.event_type === 'view').length,
        revenue: dayRevenue.reduce((sum, r) => sum + (r.amount || 0), 0)
      });
    }

    // Top performing apps
    const appMetrics = apps.map(app => {
      const appEvents = (events || []).filter(e => e.app_id === app.id);
      const appRevenue = (revenue || []).filter(r => r.app_id === app.id);
      
      return {
        id: app.id,
        name: app.name,
        downloads: appEvents.filter(e => e.event_type === 'download').length,
        views: appEvents.filter(e => e.event_type === 'view').length,
        revenue: appRevenue.reduce((sum, r) => sum + (r.amount || 0), 0),
        created_at: app.created_at
      };
    }).sort((a, b) => b.downloads - a.downloads);

    return {
      summary: {
        totalApps,
        totalDownloads,
        totalRevenue,
        activeApps,
        timeRange
      },
      dailyMetrics,
      topApps: appMetrics.slice(0, 10),
      apps: appMetrics
    };

  } catch (error) {
    console.error('Error getting analytics:', error);
    throw error;
  }
};

/**
 * Record an analytics event
 * @param {Object} eventData - Event data
 * @returns {Object} Created event
 */
const recordEvent = async (eventData) => {
  try {
    const {
      app_id,
      event_type,
      user_id = null,
      session_id = null,
      metadata = {},
      ip_address = null,
      user_agent = null
    } = eventData;

    // Validate required fields
    if (!app_id || !event_type) {
      throw new Error('app_id and event_type are required');
    }

    const event = {
      app_id,
      event_type,
      user_id,
      session_id,
      metadata,
      ip_address,
      user_agent,
      created_at: new Date().toISOString()
    };

    // Try to insert into analytics_events table
    const { data, error } = await supabase
      .from('analytics_events')
      .insert([event])
      .select()
      .single();

    if (error) {
      console.error('Error recording analytics event:', error);
      // Return a mock event if table doesn't exist
      return {
        id: Date.now().toString(),
        ...event
      };
    }

    return data;

  } catch (error) {
    console.error('Error recording event:', error);
    // Return a mock event for demo purposes
    return {
      id: Date.now().toString(),
      ...eventData,
      created_at: new Date().toISOString()
    };
  }
};

/**
 * Get revenue data for apps
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Object} Revenue analytics
 */
const getRevenueData = async (userId, options = {}) => {
  try {
    const { timeRange = '30d', appId = null } = options;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
    case '7d':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(endDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(endDate.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(endDate.getDate() - 30);
    }

    // Get user's apps
    let appsQuery = supabase
      .from('apps')
      .select('id, name')
      .eq('user_id', userId);

    if (appId) {
      appsQuery = appsQuery.eq('id', appId);
    }

    const { data: apps, error: appsError } = await appsQuery;

    if (appsError) {
      throw appsError;
    }

    const appIds = apps.map(app => app.id);

    // Get revenue transactions
    const { data: transactions, error: revenueError } = await supabase
      .from('revenue_transactions')
      .select('*')
      .in('app_id', appIds)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (revenueError) {
      console.error('Revenue data error:', revenueError);
      // Return mock data if table doesn't exist
      return {
        totalRevenue: 0,
        transactions: [],
        dailyRevenue: [],
        revenueByApp: [],
        revenueBreakdown: {
          webOwner: 0,
          rapidTech: 0,
          storeCommission: 0
        }
      };
    }

    // Calculate metrics
    const totalRevenue = (transactions || []).reduce((sum, t) => sum + (t.amount || 0), 0);

    // Daily revenue
    const dailyRevenue = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayStart = new Date(d);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const dayTransactions = (transactions || []).filter(t => {
        const transactionDate = new Date(t.created_at);
        return transactionDate >= dayStart && transactionDate <= dayEnd;
      });

      dailyRevenue.push({
        date: dayStart.toISOString().split('T')[0],
        revenue: dayTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
        transactions: dayTransactions.length
      });
    }

    // Revenue by app
    const revenueByApp = apps.map(app => {
      const appTransactions = (transactions || []).filter(t => t.app_id === app.id);
      return {
        appId: app.id,
        appName: app.name,
        revenue: appTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
        transactions: appTransactions.length
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // Revenue breakdown (based on revenue split configuration)
    const webOwnerPercentage = parseFloat(process.env.WEB_OWNER_PERCENTAGE) || 70;
    const rapidTechPercentage = parseFloat(process.env.RAPID_TECH_PERCENTAGE) || 15;
    const storeCommissionPercentage = parseFloat(process.env.STORE_COMMISSION_PERCENTAGE) || 15;

    const revenueBreakdown = {
      webOwner: (totalRevenue * webOwnerPercentage) / 100,
      rapidTech: (totalRevenue * rapidTechPercentage) / 100,
      storeCommission: (totalRevenue * storeCommissionPercentage) / 100
    };

    return {
      totalRevenue,
      transactions: transactions || [],
      dailyRevenue,
      revenueByApp,
      revenueBreakdown,
      timeRange
    };

  } catch (error) {
    console.error('Error getting revenue data:', error);
    throw error;
  }
};

/**
 * Get app-specific analytics
 * @param {string} appId - App ID
 * @param {string} userId - User ID (for authorization)
 * @param {Object} options - Query options
 * @returns {Object} App analytics
 */
const getAppAnalytics = async (appId, userId, options = {}) => {
  try {
    const { timeRange = '30d' } = options;
    
    // Verify app ownership
    const { data: app, error: appError } = await supabase
      .from('apps')
      .select('*')
      .eq('id', appId)
      .eq('user_id', userId)
      .single();

    if (appError || !app) {
      throw new Error('App not found or access denied');
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
    case '7d':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(endDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(endDate.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(endDate.getDate() - 30);
    }

    // Get analytics events for this app
    const { data: events, error: eventsError } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('app_id', appId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (eventsError) {
      console.error('App analytics events error:', eventsError);
    }

    // Get revenue data for this app
    const { data: revenue, error: revenueError } = await supabase
      .from('revenue_transactions')
      .select('*')
      .eq('app_id', appId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (revenueError) {
      console.error('App revenue error:', revenueError);
    }

    // Calculate metrics
    const totalViews = (events || []).filter(e => e.event_type === 'view').length;
    const totalDownloads = (events || []).filter(e => e.event_type === 'download').length;
    const totalRevenue = (revenue || []).reduce((sum, r) => sum + (r.amount || 0), 0);
    const uniqueUsers = [...new Set((events || []).filter(e => e.user_id).map(e => e.user_id))].length;

    // Daily metrics
    const dailyMetrics = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayStart = new Date(d);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const dayEvents = (events || []).filter(e => {
        const eventDate = new Date(e.created_at);
        return eventDate >= dayStart && eventDate <= dayEnd;
      });

      const dayRevenue = (revenue || []).filter(r => {
        const revenueDate = new Date(r.created_at);
        return revenueDate >= dayStart && revenueDate <= dayEnd;
      });

      dailyMetrics.push({
        date: dayStart.toISOString().split('T')[0],
        views: dayEvents.filter(e => e.event_type === 'view').length,
        downloads: dayEvents.filter(e => e.event_type === 'download').length,
        revenue: dayRevenue.reduce((sum, r) => sum + (r.amount || 0), 0)
      });
    }

    return {
      app,
      summary: {
        totalViews,
        totalDownloads,
        totalRevenue,
        uniqueUsers,
        conversionRate: totalViews > 0 ? (totalDownloads / totalViews * 100).toFixed(2) : 0
      },
      dailyMetrics,
      recentEvents: (events || []).slice(0, 50),
      recentTransactions: (revenue || []).slice(0, 20)
    };

  } catch (error) {
    console.error('Error getting app analytics:', error);
    throw error;
  }
};

export {
  getAnalytics,
  recordEvent,
  getRevenueData,
  getAppAnalytics
};