import { supabase } from './supabase';
import { 
  FeedbackInsert, 
  SessionInsert, 
  UserActionInsert, 
  ScreenRecordingInsert,
  AnalyticsSummaryInsert,
  FeedbackType,
  ActionType,
  RecordingStatus,
  Coordinates,
  RecordingMetadata,
  UserJourneyStep,
  HeatmapPoint
} from '../types/database';

export class DatabaseService {
  private sessionId: string;
  private userId: string;

  constructor(sessionId: string, userId: string) {
    this.sessionId = sessionId;
    this.userId = userId;
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  /**
   * Create a new session
   */
  async createSession(url: string, userAgent?: string, screenResolution?: string, deviceType?: string) {
    const sessionData: SessionInsert = {
      user_id: this.userId,
      session_id: this.sessionId,
      url,
      user_agent: userAgent || null,
      screen_resolution: screenResolution || null,
      device_type: deviceType || null,
      start_time: new Date().toISOString(),
      duration: 0
    };

    const { data, error } = await supabase
      .from('sessions')
      .insert(sessionData)
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      throw error;
    }

    return data;
  }

  /**
   * End a session
   */
  async endSession(duration: number) {
    const { data, error } = await supabase
      .from('sessions')
      .update({
        end_time: new Date().toISOString(),
        duration
      })
      .eq('session_id', this.sessionId)
      .select()
      .single();

    if (error) {
      console.error('Error ending session:', error);
      throw error;
    }

    return data;
  }

  // ============================================================================
  // USER ACTIONS
  // ============================================================================

  /**
   * Log a user action
   */
  async logUserAction(
    actionType: ActionType,
    timestamp: number,
    url?: string,
    coordinates?: Coordinates,
    element?: string,
    data?: Record<string, unknown>
  ) {
    const actionData: UserActionInsert = {
      session_id: this.sessionId,
      user_id: this.userId,
      action_type: actionType,
      timestamp,
      url: url || null,
      coordinates: coordinates || null,
      element: element || null,
      data: data || {}
    };

    const { data, error } = await supabase
      .from('user_actions')
      .insert(actionData)
      .select()
      .single();

    if (error) {
      console.error('Error logging user action:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get all user actions for a session
   */
  async getUserActions() {
    const { data, error } = await supabase
      .from('user_actions')
      .select('*')
      .eq('session_id', this.sessionId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching user actions:', error);
      throw error;
    }

    return data;
  }

  // ============================================================================
  // FEEDBACK
  // ============================================================================

  /**
   * Submit feedback with comprehensive data
   */
  async submitFeedback(
    feedback: string,
    feedbackType: FeedbackType = 'general',
    url: string,
    sessionDuration: number = 0,
    interactionCount: number = 0,
    userJourney?: UserJourneyStep[],
    heatmapData?: HeatmapPoint[]
  ) {
    // Simple sentiment analysis
    const sentimentScore = this.analyzeSentiment(feedback);

    const feedbackData: FeedbackInsert = {
      user_id: this.userId,
      session_id: this.sessionId,
      url,
      feedback,
      feedback_type: feedbackType,
      sentiment_score: sentimentScore,
      session_duration: sessionDuration,
      interaction_count: interactionCount,
      user_journey: userJourney || [],
      heatmap_data: heatmapData || []
    };

    const { data, error } = await supabase
      .from('feedback')
      .insert(feedbackData)
      .select()
      .single();

    if (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get all feedback for a session
   */
  async getSessionFeedback() {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('session_id', this.sessionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching feedback:', error);
      throw error;
    }

    return data;
  }

  // ============================================================================
  // SCREEN RECORDINGS
  // ============================================================================

  /**
   * Start a screen recording entry
   */
  async startRecording(metadata?: RecordingMetadata) {
    const recordingData: ScreenRecordingInsert = {
      session_id: this.sessionId,
      user_id: this.userId,
      status: 'recording',
      start_time: new Date().toISOString(),
      duration: 0,
      metadata: metadata || {}
    };

    const { data, error } = await supabase
      .from('screen_recordings')
      .insert(recordingData)
      .select()
      .single();

    if (error) {
      console.error('Error starting recording:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update recording with blob data and URL
   */
  async updateRecording(recordingUrl: string, duration: number, metadata?: RecordingMetadata) {
    const { data, error } = await supabase
      .from('screen_recordings')
      .update({
        recording_url: recordingUrl,
        status: 'stopped',
        end_time: new Date().toISOString(),
        duration,
        metadata: metadata || {}
      })
      .eq('session_id', this.sessionId)
      .eq('status', 'recording')
      .select()
      .single();

    if (error) {
      console.error('Error updating recording:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get recording for a session
   */
  async getSessionRecording() {
    const { data, error } = await supabase
      .from('screen_recordings')
      .select('*')
      .eq('session_id', this.sessionId)
      .eq('status', 'stopped')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching recording:', error);
      throw error;
    }

    return data;
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  /**
   * Create or update analytics summary
   */
  async updateAnalyticsSummary(
    totalActions: number,
    totalClicks: number,
    totalScrolls: number,
    totalHovers: number,
    totalKeypresses: number,
    totalNavigations: number,
    sessionDuration: number,
    pagesVisited: number,
    feedbackCount: number,
    recordingAvailable: boolean
  ) {
    const analyticsData: AnalyticsSummaryInsert = {
      session_id: this.sessionId,
      user_id: this.userId,
      total_actions: totalActions,
      total_clicks: totalClicks,
      total_scrolls: totalScrolls,
      total_hovers: totalHovers,
      total_keypresses: totalKeypresses,
      total_navigations: totalNavigations,
      session_duration: sessionDuration,
      pages_visited: pagesVisited,
      feedback_count: feedbackCount,
      recording_available: recordingAvailable
    };

    const { data, error } = await supabase
      .from('analytics_summary')
      .upsert(analyticsData, { onConflict: 'session_id' })
      .select()
      .single();

    if (error) {
      console.error('Error updating analytics summary:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get session overview with all data
   */
  async getSessionOverview() {
    const { data, error } = await supabase
      .from('session_overview')
      .select('*')
      .eq('session_id', this.sessionId)
      .single();

    if (error) {
      console.error('Error fetching session overview:', error);
      throw error;
    }

    return data;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Simple sentiment analysis
   */
  private analyzeSentiment(text: string): number {
    const positiveWords = ['good', 'great', 'excellent', 'love', 'amazing', 'perfect', 'awesome', 'fantastic', 'wonderful', 'best'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'frustrating', 'confusing', 'broken', 'useless'];
    
    const words = text.toLowerCase().split(/\s+/);
    let score = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });
    
    return Math.max(-5, Math.min(5, score));
  }

  /**
   * Get all session data as a comprehensive object
   */
  async getComprehensiveSessionData() {
    try {
      const [session, feedback, actions, recording, analytics] = await Promise.all([
        supabase.from('sessions').select('*').eq('session_id', this.sessionId).single(),
        this.getSessionFeedback(),
        this.getUserActions(),
        this.getSessionRecording(),
        supabase.from('analytics_summary').select('*').eq('session_id', this.sessionId).single()
      ]);

      return {
        session: session.data,
        feedback: feedback,
        actions: actions,
        recording: recording,
        analytics: analytics.data,
        sessionId: this.sessionId,
        userId: this.userId
      };
    } catch (error) {
      console.error('Error fetching comprehensive session data:', error);
      throw error;
    }
  }

  /**
   * Export session data as JSON
   */
  async exportSessionData(): Promise<string> {
    const data = await this.getComprehensiveSessionData();
    return JSON.stringify(data, null, 2);
  }
} 