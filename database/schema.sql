-- Rapid SaaS AI Store Database Schema
-- Complete schema for global marketplace functionality

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (existing, enhanced)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Apps table (existing, enhanced)
CREATE TABLE IF NOT EXISTS apps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  url VARCHAR(500) NOT NULL,
  category VARCHAR(100),
  icon VARCHAR(500),
  screenshots TEXT[], -- Array of screenshot URLs
  app_size BIGINT, -- Size in bytes
  app_format VARCHAR(20), -- APK, IPA, etc.
  download_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'draft', -- draft, published, rejected
  downloads INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  price DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  featured BOOLEAN DEFAULT false,
  ai_analysis JSONB, -- Store AI analysis results
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Legal agreements table
CREATE TABLE IF NOT EXISTS legal_agreements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  agreement_type VARCHAR(50) NOT NULL, -- 'terms_of_service', 'revenue_sharing'
  version VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  UNIQUE(user_id, agreement_type, version)
);

-- Web ownership verification table
CREATE TABLE IF NOT EXISTS web_ownership_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  domain VARCHAR(255) NOT NULL,
  verification_method VARCHAR(50) NOT NULL, -- 'html_file', 'meta_tag', 'dns_record'
  verification_token VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, verified, failed
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, domain)
);

-- Quality assessments table
CREATE TABLE IF NOT EXISTS quality_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url VARCHAR(500) NOT NULL,
  overall_score INTEGER NOT NULL,
  technical_score INTEGER DEFAULT 0,
  content_score INTEGER DEFAULT 0,
  compliance_score INTEGER DEFAULT 0,
  passed BOOLEAN NOT NULL,
  issues TEXT[], -- Array of issues found
  recommendations JSONB, -- Structured recommendations
  assessment_data JSONB, -- Complete assessment results
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partnerships table
CREATE TABLE IF NOT EXISTS partnerships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform VARCHAR(50) NOT NULL UNIQUE, -- GOOGLE_PLAY, APPLE_APP_STORE, etc.
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, suspended
  commission_rate DECIMAL(5,4) NOT NULL, -- 0.15 for 15%
  api_endpoint VARCHAR(500),
  credentials JSONB, -- Encrypted credentials
  requirements JSONB, -- Platform requirements
  review_time VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- App submissions table
CREATE TABLE IF NOT EXISTS app_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'submitted', -- submitted, under_review, approved, rejected
  submission_id VARCHAR(255) NOT NULL, -- Platform-specific submission ID
  submission_data JSONB, -- Data sent to platform
  partner_response JSONB, -- Response from platform
  status_message TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  estimated_review_completion TIMESTAMP WITH TIME ZONE
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  language VARCHAR(10) NOT NULL DEFAULT 'en-US',
  region VARCHAR(20) NOT NULL DEFAULT 'us-east-1',
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  timezone VARCHAR(50) NOT NULL DEFAULT 'America/New_York',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Localized content table
CREATE TABLE IF NOT EXISTS localized_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_key VARCHAR(255) NOT NULL,
  language VARCHAR(10) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(content_key, language)
);

-- Global statistics table
CREATE TABLE IF NOT EXISTS global_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  total_apps INTEGER DEFAULT 0,
  total_users INTEGER DEFAULT 0,
  total_downloads BIGINT DEFAULT 0,
  total_revenue DECIMAL(15,2) DEFAULT 0,
  active_regions INTEGER DEFAULT 0,
  supported_languages INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Revenue transactions table
CREATE TABLE IF NOT EXISTS revenue_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50),
  transaction_type VARCHAR(50) NOT NULL, -- purchase, subscription, in_app
  gross_amount DECIMAL(10,2) NOT NULL,
  platform_commission DECIMAL(10,2) NOT NULL,
  rapid_tech_share DECIMAL(10,2) NOT NULL,
  web_owner_share DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  transaction_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'completed', -- pending, completed, failed, refunded
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL, -- view, download, install, uninstall
  event_data JSONB,
  ip_address INET,
  user_agent TEXT,
  country_code VARCHAR(2),
  region VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- App reviews table
CREATE TABLE IF NOT EXISTS app_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(app_id, user_id)
);

-- App categories table
CREATE TABLE IF NOT EXISTS app_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(500),
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_payment_method_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- card, bank_account, etc.
  last_four VARCHAR(4),
  brand VARCHAR(50),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- app_approved, app_rejected, revenue_received
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_apps_user_id ON apps(user_id);
CREATE INDEX IF NOT EXISTS idx_apps_category ON apps(category);
CREATE INDEX IF NOT EXISTS idx_apps_status ON apps(status);
CREATE INDEX IF NOT EXISTS idx_apps_featured ON apps(featured);
CREATE INDEX IF NOT EXISTS idx_apps_created_at ON apps(created_at);
CREATE INDEX IF NOT EXISTS idx_apps_downloads ON apps(downloads);
CREATE INDEX IF NOT EXISTS idx_apps_rating ON apps(rating);

CREATE INDEX IF NOT EXISTS idx_legal_agreements_user_id ON legal_agreements(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_agreements_type ON legal_agreements(agreement_type);

CREATE INDEX IF NOT EXISTS idx_quality_assessments_url ON quality_assessments(url);
CREATE INDEX IF NOT EXISTS idx_quality_assessments_created_at ON quality_assessments(created_at);

CREATE INDEX IF NOT EXISTS idx_app_submissions_app_id ON app_submissions(app_id);
CREATE INDEX IF NOT EXISTS idx_app_submissions_platform ON app_submissions(platform);
CREATE INDEX IF NOT EXISTS idx_app_submissions_status ON app_submissions(status);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_localized_content_key_lang ON localized_content(content_key, language);

CREATE INDEX IF NOT EXISTS idx_revenue_transactions_app_id ON revenue_transactions(app_id);
CREATE INDEX IF NOT EXISTS idx_revenue_transactions_user_id ON revenue_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_revenue_transactions_created_at ON revenue_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_analytics_events_app_id ON analytics_events(app_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

CREATE INDEX IF NOT EXISTS idx_app_reviews_app_id ON app_reviews(app_id);
CREATE INDEX IF NOT EXISTS idx_app_reviews_user_id ON app_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_app_reviews_rating ON app_reviews(rating);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Insert default app categories
INSERT INTO app_categories (name, description, sort_order) VALUES
('Productivity', 'Apps that help increase productivity and efficiency', 1),
('Business', 'Business and enterprise applications', 2),
('Finance', 'Financial and accounting applications', 3),
('Education', 'Educational and learning applications', 4),
('Healthcare', 'Health and medical applications', 5),
('Communication', 'Communication and collaboration tools', 6),
('Development', 'Developer tools and IDEs', 7),
('Design', 'Design and creative applications', 8),
('Marketing', 'Marketing and analytics tools', 9),
('E-commerce', 'Online store and shopping applications', 10),
('CRM', 'Customer relationship management', 11),
('Project Management', 'Project and task management tools', 12),
('AI & Machine Learning', 'AI-powered applications and tools', 13),
('Data Analytics', 'Data analysis and visualization tools', 14),
('Security', 'Security and privacy applications', 15)
ON CONFLICT (name) DO NOTHING;

-- Insert default localized content (English)
INSERT INTO localized_content (content_key, language, content) VALUES
('app.title', 'en-US', 'Rapid SaaS AI Store'),
('app.description', 'en-US', 'Convert any SaaS or IDE into a mobile app instantly'),
('nav.home', 'en-US', 'Home'),
('nav.store', 'en-US', 'App Store'),
('nav.convert', 'en-US', 'Convert'),
('nav.publish', 'en-US', 'Publish'),
('button.convert', 'en-US', 'Convert to App'),
('button.download', 'en-US', 'Download'),
('button.publish', 'en-US', 'Publish to Store'),
('status.converting', 'en-US', 'Converting...'),
('status.ready', 'en-US', 'Ready'),
('status.error', 'en-US', 'Error'),
('message.success', 'en-US', 'Success!'),
('message.error', 'en-US', 'An error occurred'),
('placeholder.url', 'en-US', 'Enter website URL'),
('placeholder.search', 'en-US', 'Search apps...')
ON CONFLICT (content_key, language) DO NOTHING;

-- Insert initial global stats
INSERT INTO global_stats (total_apps, total_users, total_downloads, total_revenue, active_regions, supported_languages)
VALUES (0, 0, 0, 0.00, 4, 11)
ON CONFLICT DO NOTHING;

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_apps_updated_at BEFORE UPDATE ON apps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_submissions_updated_at BEFORE UPDATE ON app_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_localized_content_updated_at BEFORE UPDATE ON localized_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_reviews_updated_at BEFORE UPDATE ON app_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update app ratings
CREATE OR REPLACE FUNCTION update_app_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE apps SET 
        rating = (
            SELECT COALESCE(AVG(rating), 0) 
            FROM app_reviews 
            WHERE app_id = COALESCE(NEW.app_id, OLD.app_id)
        ),
        rating_count = (
            SELECT COUNT(*) 
            FROM app_reviews 
            WHERE app_id = COALESCE(NEW.app_id, OLD.app_id)
        )
    WHERE id = COALESCE(NEW.app_id, OLD.app_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create trigger to automatically update app ratings
CREATE TRIGGER update_app_rating_trigger
    AFTER INSERT OR UPDATE OR DELETE ON app_reviews
    FOR EACH ROW EXECUTE FUNCTION update_app_rating();

COMMIT;