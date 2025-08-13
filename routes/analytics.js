const express = require('express');
const router = express.Router();
const { getAnalytics, recordEvent, getRevenueData } = require('../services/analytics');
const { auth } = require('../middleware/auth');

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard analytics for user
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeRange = '30d' } = req.query;

    const analytics = await getAnalytics(userId, {
      timeRange,
      includeApps: true,
      includeRevenue: true,
      includeUsers: true
    });

    res.json({
      success: true,
      analytics: {
        overview: {
          totalApps: analytics.totalApps,
          totalDownloads: analytics.totalDownloads,
          totalRevenue: analytics.totalRevenue,
          activeUsers: analytics.activeUsers,
          conversionRate: analytics.conversionRate
        },
        charts: {
          downloadsOverTime: analytics.downloadsChart,
          revenueOverTime: analytics.revenueChart,
          userGrowth: analytics.userGrowthChart,
          topApps: analytics.topApps
        },
        metrics: {
          averageRating: analytics.averageRating,
          retentionRate: analytics.retentionRate,
          churnRate: analytics.churnRate,
          lifetimeValue: analytics.lifetimeValue
        }
      },
      timeRange,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dashboard Analytics Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analytics', 
      message: error.message 
    });
  }
});

// @route   GET /api/analytics/apps/:appId
// @desc    Get analytics for specific app
// @access  Private
router.get('/apps/:appId', auth, async (req, res) => {
  try {
    const { appId } = req.params;
    const userId = req.user.id;
    const { timeRange = '30d' } = req.query;

    const appAnalytics = await getAnalytics(userId, {
      appId,
      timeRange,
      detailed: true
    });

    res.json({
      success: true,
      appAnalytics: {
        overview: {
          downloads: appAnalytics.downloads,
          activeUsers: appAnalytics.activeUsers,
          revenue: appAnalytics.revenue,
          rating: appAnalytics.rating,
          reviews: appAnalytics.reviews
        },
        engagement: {
          sessionDuration: appAnalytics.sessionDuration,
          screenViews: appAnalytics.screenViews,
          crashRate: appAnalytics.crashRate,
          loadTime: appAnalytics.loadTime
        },
        demographics: {
          countries: appAnalytics.countries,
          devices: appAnalytics.devices,
          osVersions: appAnalytics.osVersions,
          ageGroups: appAnalytics.ageGroups
        },
        conversion: {
          funnelData: appAnalytics.funnelData,
          conversionRate: appAnalytics.conversionRate,
          dropOffPoints: appAnalytics.dropOffPoints
        }
      },
      timeRange,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('App Analytics Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch app analytics', 
      message: error.message 
    });
  }
});

// @route   GET /api/analytics/revenue
// @desc    Get detailed revenue analytics
// @access  Private
router.get('/revenue', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeRange = '30d', breakdown = 'daily' } = req.query;

    const revenueData = await getRevenueData(userId, {
      timeRange,
      breakdown
    });

    res.json({
      success: true,
      revenue: {
        summary: {
          totalRevenue: revenueData.totalRevenue,
          netRevenue: revenueData.netRevenue, // After store commissions
          rapidTechShare: revenueData.rapidTechShare, // 15%
          ownerShare: revenueData.ownerShare, // 70%
          storeCommission: revenueData.storeCommission, // 15%
          pendingPayouts: revenueData.pendingPayouts
        },
        breakdown: revenueData.breakdown,
        byApp: revenueData.byApp,
        byStore: revenueData.byStore,
        transactions: revenueData.recentTransactions,
        projections: {
          nextMonth: revenueData.projectedRevenue,
          growthRate: revenueData.growthRate
        }
      },
      timeRange,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Revenue Analytics Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch revenue analytics', 
      message: error.message 
    });
  }
});

// @route   POST /api/analytics/events
// @desc    Record analytics event
// @access  Public (for app usage tracking)
router.post('/events', async (req, res) => {
  try {
    const { 
      appId, 
      eventType, 
      eventData, 
      userId, 
      sessionId,
      deviceInfo,
      timestamp 
    } = req.body;

    if (!appId || !eventType) {
      return res.status(400).json({ 
        error: 'App ID and event type are required' 
      });
    }

    const event = {
      app_id: appId,
      event_type: eventType,
      event_data: eventData || {},
      user_id: userId,
      session_id: sessionId,
      device_info: deviceInfo || {},
      timestamp: timestamp || new Date().toISOString(),
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    };

    await recordEvent(event);

    res.json({
      success: true,
      message: 'Event recorded successfully'
    });

  } catch (error) {
    console.error('Record Event Error:', error);
    res.status(500).json({ 
      error: 'Failed to record event', 
      message: error.message 
    });
  }
});

// @route   GET /api/analytics/export
// @desc    Export analytics data
// @access  Private
router.get('/export', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      format = 'csv', 
      timeRange = '30d', 
      dataType = 'all' 
    } = req.query;

    if (!['csv', 'json', 'xlsx'].includes(format)) {
      return res.status(400).json({ 
        error: 'Invalid format. Supported: csv, json, xlsx' 
      });
    }

    const exportData = await getAnalytics(userId, {
      timeRange,
      export: true,
      dataType,
      format
    });

    // Set appropriate headers for file download
    const filename = `analytics-${userId}-${timeRange}-${Date.now()}.${format}`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
    } else if (format === 'xlsx') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    res.send(exportData);

  } catch (error) {
    console.error('Export Analytics Error:', error);
    res.status(500).json({ 
      error: 'Failed to export analytics', 
      message: error.message 
    });
  }
});

// @route   GET /api/analytics/realtime
// @desc    Get real-time analytics
// @access  Private
router.get('/realtime', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { appId } = req.query;

    const realtimeData = await getAnalytics(userId, {
      realtime: true,
      appId
    });

    res.json({
      success: true,
      realtime: {
        activeUsers: realtimeData.activeUsers,
        currentSessions: realtimeData.currentSessions,
        recentEvents: realtimeData.recentEvents,
        liveDownloads: realtimeData.liveDownloads,
        serverStatus: realtimeData.serverStatus,
        errorRate: realtimeData.errorRate
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Realtime Analytics Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch realtime analytics', 
      message: error.message 
    });
  }
});

// @route   GET /api/analytics/compare
// @desc    Compare analytics between time periods or apps
// @access  Private
router.get('/compare', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      compareType = 'time', // 'time' or 'apps'
      period1,
      period2,
      app1,
      app2
    } = req.query;

    let comparisonData;

    if (compareType === 'time') {
      comparisonData = await getAnalytics(userId, {
        compare: true,
        period1,
        period2
      });
    } else if (compareType === 'apps') {
      comparisonData = await getAnalytics(userId, {
        compareApps: true,
        app1,
        app2
      });
    } else {
      return res.status(400).json({ 
        error: 'Invalid compare type. Use "time" or "apps"' 
      });
    }

    res.json({
      success: true,
      comparison: comparisonData,
      compareType,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Compare Analytics Error:', error);
    res.status(500).json({ 
      error: 'Failed to compare analytics', 
      message: error.message 
    });
  }
});

module.exports = router;