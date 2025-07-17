-- Iter8 Platform Database Migration
-- This script handles existing tables and adds analytics features

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTSpgcrypto=====================
-- FEEDBACK TABLE (Update existing or create new)
-- ============================================================================

-- Check if feedback table exists and add new columns if needed
DO $$
BEGIN
    -- Add new columns to existing feedback table if they don't exist
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name =feedback) THEN
        -- Add session_id column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = session_id') THEN
            ALTER TABLE feedback ADD COLUMN session_id TEXT;
        END IF;
        
        -- Add feedback_type column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'feedback_type') THEN
            ALTER TABLE feedback ADD COLUMN feedback_type TEXT DEFAULT general';
        END IF;
        
        -- Add sentiment_score column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = sentiment_score') THEN
            ALTER TABLE feedback ADD COLUMN sentiment_score INTEGER DEFAULT0;
        END IF;
        
        -- Add interaction_count column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = interaction_count') THEN
            ALTER TABLE feedback ADD COLUMN interaction_count INTEGER DEFAULT0;
        END IF;
        
        -- Add user_journey column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'user_journey') THEN
            ALTER TABLE feedback ADD COLUMN user_journey JSONB DEFAULT '[]'::jsonb;
        END IF;
        
        -- Add heatmap_data column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'heatmap_data') THEN
            ALTER TABLE feedback ADD COLUMN heatmap_data JSONB DEFAULT '[]'::jsonb;
        END IF;
        
        -- Add updated_at column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = updated_at') THEN
            ALTER TABLE feedback ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
        
        RAISE NOTICEUpdated existing feedback table with new columns';
    ELSE
        -- Create new feedback table
        CREATE TABLE feedback (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            session_id TEXT NOT NULL,
            url TEXT NOT NULL,
            feedback TEXT NOT NULL,
            feedback_type TEXT NOT NULL DEFAULT 'general             CHECK (feedback_type IN ('general,bug', featureux', 'performance', accessibility', 'security')),
            sentiment_score INTEGER DEFAULT 0             CHECK (sentiment_score >= -5 AND sentiment_score <= 5),
            interaction_count INTEGER DEFAULT 0,
            user_journey JSONB DEFAULT '[]'::jsonb,
            heatmap_data JSONB DEFAULT '[]'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created new feedback table;    END IF;
END $$;

-- ============================================================================
-- SESSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT UNIQUE NOT NULL,
    start_url TEXT NOT NULL,
    end_url TEXT,
    duration_seconds INTEGER DEFAULT0page_views INTEGER DEFAULT 0,
    interactions_count INTEGER DEFAULT 0  device_info JSONB DEFAULT '{}'::jsonb,
    browser_info JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- USER_ACTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL 
        CHECK (action_type IN (click', scroll', 'input, avigation,hover', 'focus', 'blur')),
    element_selector TEXT,
    element_text TEXT,
    page_url TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    coordinates JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT {}'::jsonb
);

-- ============================================================================
-- SCREEN_RECORDINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS screen_recordings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recording_url TEXT,
    thumbnail_url TEXT,
    duration_seconds INTEGER DEFAULT 0,
    file_size_bytes BIGINT DEFAULT 0,
    recording_status TEXT DEFAULT pending        CHECK (recording_status IN ('pending, ssing', 'completed, ed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- ANALYTICS_SUMMARY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS analytics_summary (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_sessions INTEGER DEFAULT 0,
    total_feedback INTEGER DEFAULT 0
    avg_session_duration INTEGER DEFAULT 0,
    avg_sentiment_score NUMERIC(3,2) DEFAULT 0,
    top_feedback_types JSONB DEFAULT '{}'::jsonb,
    top_urls JSONB DEFAULT '{}'::jsonb,
    interaction_heatmap JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Feedback table indexes
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_session_id ON feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_url ON feedback(url);

-- Sessions table indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);

-- User actions table indexes
CREATE INDEX IF NOT EXISTS idx_user_actions_session_id ON user_actions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_user_id ON user_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_timestamp ON user_actions(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_actions_type ON user_actions(action_type);

-- Screen recordings table indexes
CREATE INDEX IF NOT EXISTS idx_screen_recordings_session_id ON screen_recordings(session_id);
CREATE INDEX IF NOT EXISTS idx_screen_recordings_user_id ON screen_recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_screen_recordings_status ON screen_recordings(recording_status);

-- Analytics summary table indexes
CREATE INDEX IF NOT EXISTS idx_analytics_summary_user_id ON analytics_summary(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_summary_date ON analytics_summary(date);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE screen_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_summary ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Feedback policies
DROP POLICY IF EXISTS "Users can view their own feedback" ON feedback;
CREATE POLICY "Users can view their own feedback" ON feedback
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTSUsers can insert their own feedback" ON feedback;
CREATE POLICYUsers can insert their own feedback" ON feedback
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTSUsers can update their own feedback" ON feedback;
CREATE POLICYUsers can update their own feedback" ON feedback
    FOR UPDATE USING (user_id = auth.uid());

-- Sessions policies
DROP POLICY IF EXISTS "Users can view their own sessions" ON sessions;
CREATE POLICY "Users can view their own sessions" ON sessions
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTSUsers can insert their own sessions" ON sessions;
CREATE POLICYUsers can insert their own sessions" ON sessions
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTSUsers can update their own sessions" ON sessions;
CREATE POLICYUsers can update their own sessions" ON sessions
    FOR UPDATE USING (user_id = auth.uid());

-- User actions policies
DROP POLICY IF EXISTS "Users can view their own actions" ON user_actions;
CREATE POLICY "Users can view their own actions ON user_actions
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTSUsers can insert their own actions" ON user_actions;
CREATE POLICYUsers can insert their own actions ON user_actions
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Screen recordings policies
DROP POLICY IF EXISTS "Users can view their own recordings ON screen_recordings;
CREATE POLICY "Users can view their own recordings ON screen_recordings
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTSUsers can insert their own recordings ON screen_recordings;
CREATE POLICYUsers can insert their own recordings ON screen_recordings
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTSUsers can update their own recordings ON screen_recordings;
CREATE POLICYUsers can update their own recordings ON screen_recordings
    FOR UPDATE USING (user_id = auth.uid());

-- Analytics summary policies
DROP POLICY IF EXISTS "Users can view their own analytics ON analytics_summary;
CREATE POLICY "Users can view their own analytics ON analytics_summary
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTSUsers can insert their own analytics ON analytics_summary;
CREATE POLICYUsers can insert their own analytics ON analytics_summary
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTSUsers can update their own analytics ON analytics_summary;
CREATE POLICYUsers can update their own analytics ON analytics_summary
    FOR UPDATE USING (user_id = auth.uid());

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_feedback_updated_at ON feedback;
CREATE TRIGGER update_feedback_updated_at
    BEFORE UPDATE ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_analytics_summary_updated_at ON analytics_summary;
CREATE TRIGGER update_analytics_summary_updated_at
    BEFORE UPDATE ON analytics_summary
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS FOR EASY QUERYING
-- ============================================================================

-- View for user dashboard data
CREATE OR REPLACE VIEW user_dashboard AS
SELECT 
    u.id as user_id,
    u.email,
    COUNT(DISTINCT f.id) as total_feedback,
    COUNT(DISTINCT s.id) as total_sessions,
    AVG(s.duration_seconds) as avg_session_duration,
    AVG(f.sentiment_score) as avg_sentiment,
    MAX(f.created_at) as last_feedback_date,
    MAX(s.created_at) as last_session_date
FROM auth.users u
LEFT JOIN feedback f ON u.id = f.user_id
LEFT JOIN sessions s ON u.id = s.user_id
GROUP BY u.id, u.email;

-- View for session analytics
CREATE OR REPLACE VIEW session_analytics AS
SELECT 
    s.session_id,
    s.user_id,
    s.start_url,
    s.end_url,
    s.duration_seconds,
    s.page_views,
    s.interactions_count,
    COUNT(f.id) as feedback_count,
    AVG(f.sentiment_score) as avg_sentiment,
    s.created_at,
    s.ended_at
FROM sessions s
LEFT JOIN feedback f ON s.session_id = f.session_id
GROUP BY s.id, s.session_id, s.user_id, s.start_url, s.end_url, s.duration_seconds, s.page_views, s.interactions_count, s.created_at, s.ended_at;

-- View for feedback insights
CREATE OR REPLACE VIEW feedback_insights AS
SELECT 
    f.feedback_type,
    COUNT(*) as count,
    AVG(f.sentiment_score) as avg_sentiment,
    AVG(f.interaction_count) as avg_interactions,
    COUNT(DISTINCT f.user_id) as unique_users,
    COUNT(DISTINCT f.session_id) as unique_sessions
FROM feedback f
GROUP BY f.feedback_type
ORDER BY count DESC;

-- ============================================================================
-- FUNCTIONS FOR ANALYTICS
-- ============================================================================

-- Function to calculate daily analytics summary
CREATE OR REPLACE FUNCTION calculate_daily_analytics(user_uuid UUID, target_date DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO analytics_summary (
        user_id, 
        date, 
        total_sessions, 
        total_feedback, 
        avg_session_duration, 
        avg_sentiment_score,
        top_feedback_types,
        top_urls,
        interaction_heatmap
    )
    SELECT 
        user_uuid,
        target_date,
        COUNT(DISTINCT s.id) as total_sessions,
        COUNT(DISTINCT f.id) as total_feedback,
        AVG(s.duration_seconds) as avg_session_duration,
        AVG(f.sentiment_score) as avg_sentiment_score,
        jsonb_object_agg(f.feedback_type, COUNT(*)) as top_feedback_types,
        jsonb_object_agg(f.url, COUNT(*)) as top_urls,
    {}onb as interaction_heatmap
    FROM sessions s
    LEFT JOIN feedback f ON s.session_id = f.session_id
    WHERE s.user_id = user_uuid 
        AND DATE(s.created_at) = target_date
    GROUP BY user_uuid, target_date
    ON CONFLICT (user_id, date) 
    DO UPDATE SET
        total_sessions = EXCLUDED.total_sessions,
        total_feedback = EXCLUDED.total_feedback,
        avg_session_duration = EXCLUDED.avg_session_duration,
        avg_sentiment_score = EXCLUDED.avg_sentiment_score,
        top_feedback_types = EXCLUDED.top_feedback_types,
        top_urls = EXCLUDED.top_urls,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get user analytics for a date range
CREATE OR REPLACE FUNCTION get_user_analytics(user_uuid UUID, start_date DATE, end_date DATE)
RETURNS TABLE (
    date DATE,
    sessions_count INTEGER,
    feedback_count INTEGER,
    avg_duration INTEGER,
    avg_sentiment NUMERIC(3,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(s.created_at) as date,
        COUNT(DISTINCT s.id) as sessions_count,
        COUNT(DISTINCT f.id) as feedback_count,
        AVG(s.duration_seconds)::INTEGER as avg_duration,
        AVG(f.sentiment_score) as avg_sentiment
    FROM sessions s
    LEFT JOIN feedback f ON s.session_id = f.session_id
    WHERE s.user_id = user_uuid 
        AND DATE(s.created_at) BETWEEN start_date AND end_date
    GROUP BY DATE(s.created_at)
    ORDER BY date;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Iter8 Platform Database Migration Completed Successfully!';
    RAISE NOTICE 'Tables created/updated: feedback, sessions, user_actions, screen_recordings, analytics_summary';
    RAISE NOTICE 'Indexes created for optimal performance';
    RAISE NOTICE 'Row Level Security enabled on all tables';
    RAISE NOTICE 'Views created: user_dashboard, session_analytics, feedback_insights';
    RAISE NOTICE Functions created: calculate_daily_analytics, get_user_analytics';
END $$; 