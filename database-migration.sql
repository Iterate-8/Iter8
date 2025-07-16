-- Add new analytics columns to the feedback table
ALTER TABLE feedback 
ADD COLUMN IF NOT EXISTS sentiment_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS feedback_type TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS session_duration INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS interaction_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS user_journey JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS heatmap_data JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS device_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS browser_info JSONB DEFAULT '{}'::jsonb;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_feedback_sentiment ON feedback(sentiment_score);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_session_duration ON feedback(session_duration);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);

-- Create a view for analytics insights
CREATE OR REPLACE VIEW feedback_analytics AS
SELECT 
    url,
    feedback_type,
    AVG(sentiment_score) as avg_sentiment,
    COUNT(*) as feedback_count,
    AVG(session_duration) as avg_session_duration,
    AVG(interaction_count) as avg_interactions,
    MIN(created_at) as first_feedback,
    MAX(created_at) as last_feedback
FROM feedback 
GROUP BY url, feedback_type
ORDER BY feedback_count DESC;

-- Create a function to get sentiment trends
CREATE OR REPLACE FUNCTION get_sentiment_trends(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    date DATE,
    avg_sentiment NUMERIC,
    feedback_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(created_at) as date,
        AVG(sentiment_score) as avg_sentiment,
        COUNT(*) as feedback_count
    FROM feedback 
    WHERE created_at >= NOW() - INTERVAL '1 day' * days_back
    GROUP BY DATE(created_at)
    ORDER BY date;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get user journey insights
CREATE OR REPLACE FUNCTION get_user_journey_insights()
RETURNS TABLE (
    url TEXT,
    journey_step_count INTEGER,
    avg_interactions_per_session NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        url,
        jsonb_array_length(user_journey) as journey_step_count,
        AVG(interaction_count) as avg_interactions_per_session
    FROM feedback 
    WHERE user_journey IS NOT NULL AND jsonb_array_length(user_journey) > 0
    GROUP BY url, jsonb_array_length(user_journey)
    ORDER BY avg_interactions_per_session DESC;
END;
$$ LANGUAGE plpgsql; 