import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client only if environment variables are available
let supabase = null;
let supabaseAdmin = null;

if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
}

if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * User Management Functions
 */

// Create new user
const createUser = async (userData) => {
  try {
    // If Supabase is not configured, return mock user data for development
    if (!supabaseAdmin) {
      console.log('Supabase not configured, returning mock user data');
      return {
        id: 'demo-user-' + Date.now(),
        ...userData,
        created_at: new Date().toISOString()
      };
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Create User Error:', error);
    throw new Error(`Failed to create user: ${error.message}`);
  }
};

// Get user by email
const getUserByEmail = async (email) => {
  try {
    // If Supabase is not configured, return mock user data for development
    if (!supabaseAdmin) {
      console.log('Supabase not configured, returning mock user data');
      return {
        id: 'demo-user',
        email: email,
        created_at: new Date().toISOString()
      };
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data;
  } catch (error) {
    console.error('Get User By Email Error:', error);
    throw new Error(`Failed to get user: ${error.message}`);
  }
};

// Get user by ID
const getUserById = async (id) => {
  try {
    // If Supabase is not configured, return mock user data for development
    if (!supabaseAdmin) {
      console.log('Supabase not configured, returning mock user data');
      return {
        id: id,
        email: 'demo@example.com',
        created_at: new Date().toISOString()
      };
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Get User By ID Error:', error);
    throw new Error(`Failed to get user: ${error.message}`);
  }
};

// Update user
const updateUser = async (id, updateData) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Update User Error:', error);
    throw new Error(`Failed to update user: ${error.message}`);
  }
};

/**
 * App Management Functions
 */

// Create new app
const createApp = async (appData) => {
  try {
    // If Supabase is not configured, return mock app data for development
    if (!supabaseAdmin) {
      console.log('Supabase not configured, returning mock app data');
      return {
        id: 'demo-app-' + Date.now(),
        ...appData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    const { data, error } = await supabaseAdmin
      .from('apps')
      .insert([appData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Create App Error:', error);
    throw new Error(`Failed to create app: ${error.message}`);
  }
};

// Get apps with filtering and pagination
const getApps = async (options = {}) => {
  try {
    const {
      userId,
      page = 1,
      limit = 10,
      category,
      status,
      search,
      publicOnly = false
    } = options;

    // If Supabase is not configured, return mock app data for development
    if (!supabaseAdmin) {
      console.log('Supabase not configured, returning mock apps data');
      return {
        data: [
          {
            id: 'demo-app-1',
            name: 'Demo App',
            description: 'A demo application',
            category: 'productivity',
            status: 'published',
            created_at: new Date().toISOString()
          }
        ],
        count: 1
      };
    }

    let query = supabaseAdmin
      .from('apps')
      .select('*, users(name, email)', { count: 'exact' });

    // Apply filters
    if (userId && !publicOnly) {
      query = query.eq('user_id', userId);
    }

    if (publicOnly) {
      query = query.eq('is_public', true);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Order by creation date (newest first)
    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0
    };
  } catch (error) {
    console.error('Get Apps Error:', error);
    throw new Error(`Failed to get apps: ${error.message}`);
  }
};

// Get app by ID
const getAppById = async (id, userId = null) => {
  try {
    let query = supabaseAdmin
      .from('apps')
      .select('*, users(name, email)')
      .eq('id', id);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Get App By ID Error:', error);
    throw new Error(`Failed to get app: ${error.message}`);
  }
};

// Update app
const updateApp = async (id, userId, updateData) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('apps')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Update App Error:', error);
    throw new Error(`Failed to update app: ${error.message}`);
  }
};

// Delete app
const deleteApp = async (id, userId) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('apps')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Delete App Error:', error);
    throw new Error(`Failed to delete app: ${error.message}`);
  }
};

/**
 * Analytics Functions
 */

// Record analytics event
const recordEvent = async (eventData) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('analytics_events')
      .insert([eventData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Record Event Error:', error);
    throw new Error(`Failed to record event: ${error.message}`);
  }
};

// Get analytics data
const getAnalyticsData = async (userId, options = {}) => {
  try {
    const {
      appId,
      timeRange = '30d',
      eventType,
      groupBy = 'day'
    } = options;

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

    let query = supabaseAdmin
      .from('analytics_events')
      .select('*, apps!inner(user_id)')
      .eq('apps.user_id', userId)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());

    if (appId) {
      query = query.eq('app_id', appId);
    }

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    query = query.order('timestamp', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get Analytics Data Error:', error);
    throw new Error(`Failed to get analytics data: ${error.message}`);
  }
};

/**
 * Revenue Functions
 */

// Record revenue transaction
const recordRevenue = async (revenueData) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('revenue_transactions')
      .insert([revenueData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Record Revenue Error:', error);
    throw new Error(`Failed to record revenue: ${error.message}`);
  }
};

// Get revenue data
const getRevenueData = async (userId, options = {}) => {
  try {
    const { timeRange = '30d', appId } = options;

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

    let query = supabaseAdmin
      .from('revenue_transactions')
      .select('*, apps!inner(user_id)')
      .eq('apps.user_id', userId)
      .gte('transaction_date', startDate.toISOString())
      .lte('transaction_date', endDate.toISOString());

    if (appId) {
      query = query.eq('app_id', appId);
    }

    query = query.order('transaction_date', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get Revenue Data Error:', error);
    throw new Error(`Failed to get revenue data: ${error.message}`);
  }
};

/**
 * File Storage Functions
 */

// Upload file to Supabase Storage
const uploadFile = async (bucket, filePath, fileBuffer, options = {}) => {
  try {
    // If Supabase is not configured, return mock data for development
    if (!supabaseAdmin) {
      console.log('Supabase not configured, returning mock file upload data');
      return {
        path: filePath,
        fullPath: `${bucket}/${filePath}`,
        publicUrl: `/assets/mock-${filePath}`
      };
    }

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType: options.contentType,
        cacheControl: options.cacheControl || '3600',
        upsert: options.upsert || false
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      path: data.path,
      fullPath: data.fullPath,
      publicUrl: urlData.publicUrl
    };
  } catch (error) {
    console.error('Upload File Error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

// Delete file from Supabase Storage
const deleteFile = async (bucket, filePath) => {
  try {
    // If Supabase is not configured, return mock data for development
    if (!supabaseAdmin) {
      console.log('Supabase not configured, returning mock file deletion data');
      return { success: true };
    }

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([filePath]);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Delete File Error:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

export {
  // User functions
  createUser,
  getUserByEmail,
  getUserById,
  updateUser,
  
  // App functions
  createApp,
  getApps,
  getAppById,
  updateApp,
  deleteApp,
  
  // Analytics functions
  recordEvent,
  getAnalyticsData,
  
  // Revenue functions
  recordRevenue,
  getRevenueData,
  
  // File storage functions
  uploadFile,
  deleteFile,
  
  // Direct client access (for advanced operations)
  supabase,
  supabaseAdmin
};