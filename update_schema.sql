-- Update existing feedback table to add startup_name field
-- Run this if you already have a feedback table without startup_name

-- Add startup_name column
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS startup_name VARCHAR(255);

-- Update existing records to have a default startup name
UPDATE feedback SET startup_name = 'Unknown Startup' WHERE startup_name IS NULL;

-- Make startup_name NOT NULL after updating existing records
ALTER TABLE feedback ALTER COLUMN startup_name SET NOT NULL;

-- Add index for startup_name
CREATE INDEX IF NOT EXISTS idx_feedback_startup_name ON feedback(startup_name);
-- CLI Prompt table: maps a feedback ticket to a CLI-ready prompt
CREATE TABLE IF NOT EXISTS cli_prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feedback_id UUID REFERENCES feedback(id) ON DELETE CASCADE NOT NULL,
  prompt TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cli_prompts_user ON cli_prompts(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cli_prompts_feedback ON cli_prompts(feedback_id);

-- Verify the table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'feedback' 
  AND table_schema = 'public'
ORDER BY ordinal_position; 