// TypeScript interfaces for the enhanced Supabase database schema

export interface Database {
  public: {
    Tables: {
      feedback: {
        Row: FeedbackRow;
        Insert: FeedbackInsert;
        Update: FeedbackUpdate;
      };
      sessions: {
        Row: SessionRow;
        Insert: SessionInsert;
        Update: SessionUpdate;
      };
      user_actions: {
        Row: UserActionRow;
        Insert: UserActionInsert;
        Update: UserActionUpdate;
      };
      screen_recordings: {
        Row: ScreenRecordingRow;
        Insert: ScreenRecordingInsert;
        Update: ScreenRecordingUpdate;
      };
      analytics_summary: {
        Row: AnalyticsSummaryRow;
        Insert: AnalyticsSummaryInsert;
        Update: AnalyticsSummaryUpdate;
      };
    };
    Views: {
      session_overview: {
        Row: SessionOverviewRow;
      };
      feedback_with_session: {
        Row: FeedbackWithSessionRow;
      };
    };
  };
}

// ============================================================================
// CORE TABLE TYPES
// ============================================================================

export interface FeedbackRow {
  id: string;
  user_id: string;
  session_id: string;
  url: string;
  feedback: string;
  feedback_type: 'general' | 'bug' | 'feature' | 'ux' | 'performance' | 'accessibility' | 'security';
  sentiment_score: number;
  session_duration: number;
  interaction_count: number;
  user_journey: any;
  heatmap_data: any;
  created_at: string;
  updated_at: string;
}

export interface FeedbackInsert {
  id?: string;
  user_id: string;
  session_id: string;
  url: string;
  feedback: string;
  feedback_type?: 'general' | 'bug' | 'feature' | 'ux' | 'performance' | 'accessibility' | 'security';
  sentiment_score?: number;
  session_duration?: number;
  interaction_count?: number;
  user_journey?: any;
  heatmap_data?: any;
  created_at?: string;
  updated_at?: string;
}

export interface FeedbackUpdate {
  id?: string;
  user_id?: string;
  session_id?: string;
  url?: string;
  feedback?: string;
  feedback_type?: 'general' | 'bug' | 'feature' | 'ux' | 'performance' | 'accessibility' | 'security';
  sentiment_score?: number;
  session_duration?: number;
  interaction_count?: number;
  user_journey?: any;
  heatmap_data?: any;
  created_at?: string;
  updated_at?: string;
}

export interface SessionRow {
  id: string;
  user_id: string;
  session_id: string;
  start_time: string;
  end_time: string | null;
  duration: number;
  url: string;
  user_agent: string | null;
  screen_resolution: string | null;
  device_type: string | null;
  created_at: string;
}

export interface SessionInsert {
  id?: string;
  user_id: string;
  session_id: string;
  start_time?: string;
  end_time?: string | null;
  duration?: number;
  url: string;
  user_agent?: string | null;
  screen_resolution?: string | null;
  device_type?: string | null;
  created_at?: string;
}

export interface SessionUpdate {
  id?: string;
  user_id?: string;
  session_id?: string;
  start_time?: string;
  end_time?: string | null;
  duration?: number;
  url?: string;
  user_agent?: string | null;
  screen_resolution?: string | null;
  device_type?: string | null;
  created_at?: string;
}

export interface UserActionRow {
  id: string;
  session_id: string;
  user_id: string;
  action_type: 'click' | 'scroll' | 'hover' | 'keypress' | 'navigation' | 'url_change' | 'page_load' | 'form_submit' | 'mouse_move' | 'focus' | 'blur' | 'resize';
  timestamp: number;
  url: string | null;
  coordinates: any | null;
  element: string | null;
  data: any;
  created_at: string;
}

export interface UserActionInsert {
  id?: string;
  session_id: string;
  user_id: string;
  action_type: 'click' | 'scroll' | 'hover' | 'keypress' | 'navigation' | 'url_change' | 'page_load' | 'form_submit' | 'mouse_move' | 'focus' | 'blur' | 'resize';
  timestamp: number;
  url?: string | null;
  coordinates?: any | null;
  element?: string | null;
  data?: any;
  created_at?: string;
}

export interface UserActionUpdate {
  id?: string;
  session_id?: string;
  user_id?: string;
  action_type?: 'click' | 'scroll' | 'hover' | 'keypress' | 'navigation' | 'url_change' | 'page_load' | 'form_submit' | 'mouse_move' | 'focus' | 'blur' | 'resize';
  timestamp?: number;
  url?: string | null;
  coordinates?: any | null;
  element?: string | null;
  data?: any;
  created_at?: string;
}

export interface ScreenRecordingRow {
  id: string;
  session_id: string;
  user_id: string;
  recording_url: string | null;
  recording_blob: any | null;
  status: 'idle' | 'recording' | 'paused' | 'stopped' | 'error';
  start_time: string;
  end_time: string | null;
  duration: number;
  metadata: any;
  created_at: string;
}

export interface ScreenRecordingInsert {
  id?: string;
  session_id: string;
  user_id: string;
  recording_url?: string | null;
  recording_blob?: any | null;
  status?: 'idle' | 'recording' | 'paused' | 'stopped' | 'error';
  start_time?: string;
  end_time?: string | null;
  duration?: number;
  metadata?: any;
  created_at?: string;
}

export interface ScreenRecordingUpdate {
  id?: string;
  session_id?: string;
  user_id?: string;
  recording_url?: string | null;
  recording_blob?: any | null;
  status?: 'idle' | 'recording' | 'paused' | 'stopped' | 'error';
  start_time?: string;
  end_time?: string | null;
  duration?: number;
  metadata?: any;
  created_at?: string;
}

export interface AnalyticsSummaryRow {
  id: string;
  session_id: string;
  user_id: string;
  total_actions: number;
  total_clicks: number;
  total_scrolls: number;
  total_hovers: number;
  total_keypresses: number;
  total_navigations: number;
  session_duration: number;
  pages_visited: number;
  feedback_count: number;
  recording_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsSummaryInsert {
  id?: string;
  session_id: string;
  user_id: string;
  total_actions?: number;
  total_clicks?: number;
  total_scrolls?: number;
  total_hovers?: number;
  total_keypresses?: number;
  total_navigations?: number;
  session_duration?: number;
  pages_visited?: number;
  feedback_count?: number;
  recording_available?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AnalyticsSummaryUpdate {
  id?: string;
  session_id?: string;
  user_id?: string;
  total_actions?: number;
  total_clicks?: number;
  total_scrolls?: number;
  total_hovers?: number;
  total_keypresses?: number;
  total_navigations?: number;
  session_duration?: number;
  pages_visited?: number;
  feedback_count?: number;
  recording_available?: boolean;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// VIEW TYPES
// ============================================================================

export interface SessionOverviewRow {
  id: string;
  session_id: string;
  user_id: string;
  url: string;
  start_time: string;
  end_time: string | null;
  duration: number;
  user_agent: string | null;
  screen_resolution: string | null;
  device_type: string | null;
  total_actions: number;
  feedback_count: number;
  recording_count: number;
  total_clicks: number;
  total_scrolls: number;
  total_hovers: number;
  total_keypresses: number;
  total_navigations: number;
  pages_visited: number;
  recording_available: boolean;
}

export interface FeedbackWithSessionRow extends FeedbackRow {
  session_url: string;
  session_start: string;
  session_duration: number;
  user_agent: string | null;
  screen_resolution: string | null;
  device_type: string | null;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type FeedbackType = 'general' | 'bug' | 'feature' | 'ux' | 'performance' | 'accessibility' | 'security';
export type ActionType = 'click' | 'scroll' | 'hover' | 'keypress' | 'navigation' | 'url_change' | 'page_load' | 'form_submit' | 'mouse_move' | 'focus' | 'blur' | 'resize';
export type RecordingStatus = 'idle' | 'recording' | 'paused' | 'stopped' | 'error';

export interface Coordinates {
  x: number;
  y: number;
}

export interface RecordingMetadata {
  resolution: {
    width: number;
    height: number;
  };
  frameRate: number;
  quality: 'low' | 'medium' | 'high';
  format: 'webm' | 'mp4';
}

export interface UserJourneyStep {
  type: string;
  timestamp: number;
  url: string;
  data?: Record<string, unknown>;
}

export interface HeatmapPoint {
  x: number;
  y: number;
  timestamp: number;
  intensity: number;
} 