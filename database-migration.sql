-- Enhanced Supabase Schema for Iter8 - Comprehensive User Interaction Platform
-- This schema supports feedback types, session data, recordings, and analytics
-- Migration: Drop existing tables and recreate with enhanced schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS uuid-ossp";

-- DROP EXISTING TABLES (if they exist)
-- ============================================================================

-- Drop existing tables in reverse dependency order
DROP TABLE IF EXISTS analytics_summary CASCADE;
DROP TABLE IF EXISTS screen_recordings CASCADE;
DROP TABLE IF EXISTS user_actions CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- Drop existing functions and triggers
DROP FUNCTION IF EXISTS create_analytics_summary() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop existing views
DROP VIEW IF EXISTS session_overview CASCADE;
DROP VIEW IF EXISTS feedback_with_session CASCADE;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Enhanced feedback table with message types and comprehensive data
CREATE TABLE feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  url TEXT NOT NULL,
  feedback TEXT NOT NULL,
  feedback_type TEXT NOT NULL DEFAULTgeneral' CHECK (feedback_type IN ('general,bug', featureux', 'performance', accessibility, ty')),
  sentiment_score INTEGER DEFAULT 0K (sentiment_score >= -5 AND sentiment_score <= 5),
  session_duration INTEGER DEFAULT 0,
  interaction_count INTEGER DEFAULT0 user_journey JSONB DEFAULT '::jsonb,
  heatmap_data JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session data table for comprehensive session tracking
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT UNIQUE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER DEFAULT 0- in seconds
  url TEXT NOT NULL,
  user_agent TEXT,
  screen_resolution TEXT,
  device_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User actions table for detailed interaction tracking
CREATE TABLE user_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN (click', scroll', hover', 'keypress,navigation, url_change', page_load,form_submit, ouse_move', focus, lur', 'resize')),
  timestamp BIGINT NOT NULL, -- Unix timestamp
  url TEXT,
  coordinates JSONB, -- {x: number, y: number}
  element TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Screen recordings table
CREATE TABLE screen_recordings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recording_url TEXT,
  recording_blob BYTEA, -- For storing actual video data
  status TEXT NOT NULL DEFAULT 'idle CHECK (status IN (idle, ecording, paused',stopped', error')),
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER DEFAULT 0, -- in milliseconds
  metadata JSONB DEFAULT{}nb, -- {resolution: {width, height}, frameRate, quality, format}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ANALYTICS TABLES
-- ============================================================================

-- Analytics summary table
CREATE TABLE analytics_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total_actions INTEGER DEFAULT0tal_clicks INTEGER DEFAULT 0al_scrolls INTEGER DEFAULT0tal_hovers INTEGER DEFAULT 0,
  total_keypresses INTEGER DEFAULT 0,
  total_navigations INTEGER DEFAULT 0,
  session_duration INTEGER DEFAULT 0es_visited INTEGER DEFAULT 0,
  feedback_count INTEGER DEFAULT 0,
  recording_available BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Feedback indexes
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_session_id ON feedback(session_id);
CREATE INDEX idx_feedback_type ON feedback(feedback_type);
CREATE INDEX idx_feedback_created_at ON feedback(created_at);
CREATE INDEX idx_feedback_url ON feedback(url);

-- Sessions indexes
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_session_id ON sessions(session_id);
CREATE INDEX idx_sessions_created_at ON sessions(created_at);

-- User actions indexes
CREATE INDEX idx_user_actions_session_id ON user_actions(session_id);
CREATE INDEX idx_user_actions_user_id ON user_actions(user_id);
CREATE INDEX idx_user_actions_type ON user_actions(action_type);
CREATE INDEX idx_user_actions_timestamp ON user_actions(timestamp);

-- Screen recordings indexes
CREATE INDEX idx_screen_recordings_session_id ON screen_recordings(session_id);
CREATE INDEX idx_screen_recordings_user_id ON screen_recordings(user_id);
CREATE INDEX idx_screen_recordings_status ON screen_recordings(status);

-- Analytics indexes
CREATE INDEX idx_analytics_summary_session_id ON analytics_summary(session_id);
CREATE INDEX idx_analytics_summary_user_id ON analytics_summary(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE screen_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_summary ENABLE ROW LEVEL SECURITY;

-- Feedback policies
CREATE POLICYUsers can insert their own feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback" ON feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICYUsers can update their own feedback" ON feedback
  FOR UPDATE USING (auth.uid() = user_id);

-- Sessions policies
CREATE POLICYUsers can insert their own sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own sessions" ON sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICYUsers can update their own sessions" ON sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- User actions policies
CREATE POLICYUsers can insert their own actions ON user_actions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own actions ON user_actions
  FOR SELECT USING (auth.uid() = user_id);

-- Screen recordings policies
CREATE POLICYUsers can insert their own recordings ON screen_recordings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own recordings ON screen_recordings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICYUsers can update their own recordings ON screen_recordings
  FOR UPDATE USING (auth.uid() = user_id);

-- Analytics policies
CREATE POLICYUsers can insert their own analytics ON analytics_summary
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own analytics ON analytics_summary
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICYUsers can update their own analytics ON analytics_summary
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_summary_updated_at BEFORE UPDATE ON analytics_summary
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create analytics summary
CREATE OR REPLACE FUNCTION create_analytics_summary()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO analytics_summary (
        session_id,
        user_id,
        total_actions,
        total_clicks,
        total_scrolls,
        total_hovers,
        total_keypresses,
        total_navigations,
        session_duration,
        pages_visited,
        feedback_count,
        recording_available
    )
    VALUES (
        NEW.session_id,
        NEW.user_id,
        (SELECT COUNT(*) FROM user_actions WHERE session_id = NEW.session_id),
        (SELECT COUNT(*) FROM user_actions WHERE session_id = NEW.session_id AND action_type =click'),
        (SELECT COUNT(*) FROM user_actions WHERE session_id = NEW.session_id AND action_type = scroll'),
        (SELECT COUNT(*) FROM user_actions WHERE session_id = NEW.session_id AND action_type =hover'),
        (SELECT COUNT(*) FROM user_actions WHERE session_id = NEW.session_id AND action_type = 'keypress'),
        (SELECT COUNT(*) FROM user_actions WHERE session_id = NEW.session_id AND action_type = 'navigation'),
        NEW.duration,
        (SELECT COUNT(DISTINCT url) FROM user_actions WHERE session_id = NEW.session_id),
        (SELECT COUNT(*) FROM feedback WHERE session_id = NEW.session_id),
        (SELECT EXISTS(SELECT 1 FROM screen_recordings WHERE session_id = NEW.session_id AND status = stopped'))
    )
    ON CONFLICT (session_id) DO UPDATE SET
        total_actions = EXCLUDED.total_actions,
        total_clicks = EXCLUDED.total_clicks,
        total_scrolls = EXCLUDED.total_scrolls,
        total_hovers = EXCLUDED.total_hovers,
        total_keypresses = EXCLUDED.total_keypresses,
        total_navigations = EXCLUDED.total_navigations,
        session_duration = EXCLUDED.session_duration,
        pages_visited = EXCLUDED.pages_visited,
        feedback_count = EXCLUDED.feedback_count,
        recording_available = EXCLUDED.recording_available,
        updated_at = NOW();
   
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to create analytics summary when session ends
CREATE TRIGGER create_analytics_summary_trigger AFTER UPDATE ON sessions
    FOR EACH ROW WHEN (OLD.end_time IS NULL AND NEW.end_time IS NOT NULL)
    EXECUTE FUNCTION create_analytics_summary();

-- ============================================================================
-- VIEWS FOR EASY QUERYING
-- ============================================================================

-- Comprehensive session view
CREATE VIEW session_overview AS
SELECT
    s.id,
    s.session_id,
    s.user_id,
    s.url,
    s.start_time,
    s.end_time,
    s.duration,
    s.user_agent,
    s.screen_resolution,
    s.device_type,
    COUNT(ua.id) as total_actions,
    COUNT(f.id) as feedback_count,
    COUNT(sr.id) as recording_count,
    as_sum.total_clicks,
    as_sum.total_scrolls,
    as_sum.total_hovers,
    as_sum.total_keypresses,
    as_sum.total_navigations,
    as_sum.pages_visited,
    as_sum.recording_available
FROM sessions s
LEFT JOIN user_actions ua ON s.session_id = ua.session_id
LEFT JOIN feedback f ON s.session_id = f.session_id
LEFT JOIN screen_recordings sr ON s.session_id = sr.session_id
LEFT JOIN analytics_summary as_sum ON s.session_id = as_sum.session_id
GROUP BY s.id, s.session_id, s.user_id, s.url, s.start_time, s.end_time, s.duration,
         s.user_agent, s.screen_resolution, s.device_type, as_sum.total_clicks,
         as_sum.total_scrolls, as_sum.total_hovers, as_sum.total_keypresses,
         as_sum.total_navigations, as_sum.pages_visited, as_sum.recording_available;

-- Feedback with session data view
CREATE VIEW feedback_with_session AS
SELECT
    f.*,
    s.url as session_url,
    s.start_time as session_start,
    s.duration as session_duration,
    s.user_agent,
    s.screen_resolution,
    s.device_type
FROM feedback f
JOIN sessions s ON f.session_id = s.session_id;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE feedback IS Enhanced feedback table with message types and comprehensive session data';
COMMENT ON TABLE sessions ISSession tracking with comprehensive metadata';
COMMENT ON TABLE user_actions IS 'Detailed user interaction tracking';
COMMENT ON TABLE screen_recordings ISScreen recording storage and metadata';
COMMENT ON TABLE analytics_summary IS 'Aggregated analytics data for sessions';
COMMENT ON COLUMN feedback.feedback_type IS Type of feedback: general, bug, feature, ux, performance, accessibility, security';
COMMENT ON COLUMN feedback.sentiment_score IS 'Sentiment score from-5(very negative) to 5(very positive)';
COMMENT ON COLUMN user_actions.coordinates ISJSON object with x and y coordinates for click/hover events';
COMMENT ON COLUMN screen_recordings.metadata ISJSON object with resolution, frameRate, quality, and format information'; 