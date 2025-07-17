import { AnalyticsData, SessionData, ScreenRecordingData, UserActionType } from '../types/analytics';
import { ScreenRecordingService } from './screenRecording';
import { UserActionLogger } from './userActionLogger';

export class AnalyticsService {
  private sessionId: string;
  private screenRecordingService: ScreenRecordingService;
  private userActionLogger: UserActionLogger;
  private isRecording: boolean = false;
  private sessionData: SessionData;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.screenRecordingService = new ScreenRecordingService(sessionId);
    this.userActionLogger = new UserActionLogger(sessionId);
    
    this.sessionData = {
      sessionId,
      startTime: Date.now(),
      duration: 0,
      userActions: [],
      analytics: {
        sessionDuration: 0,
        interactions: 0,
        sentiment: 0,
        heatmapData: [],
        userJourney: [],
        userActions: []
      }
    };
  }

  /**
   * Start analytics tracking (both screen recording and user actions)
   */
  async startTracking(): Promise<void> {
    try {
      // Start user action logging
      this.userActionLogger.startLogging();
      
      // Start screen recording if supported
      if (ScreenRecordingService.isSupported()) {
        try {
          await this.screenRecordingService.startRecording();
          this.isRecording = true;
          console.log('Analytics tracking started with screen recording');
        } catch {
          console.warn('Screen recording not available, continuing with action logging only');
        }
      } else {
        console.log('Screen recording not supported, continuing with action logging only');
      }
    } catch (error) {
      console.error('Failed to start analytics tracking:', error);
      throw error;
    }
  }

  /**
   * Stop analytics tracking
   */
  async stopTracking(): Promise<SessionData> {
    try {
      // Stop user action logging
      this.userActionLogger.stopLogging();
      
      // Stop screen recording if active
      let screenRecordingData: ScreenRecordingData | null = null;
      if (this.isRecording) {
        screenRecordingData = await this.screenRecordingService.stopRecording();
        this.isRecording = false;
      } else {
        // Force remove indicator even if not recording (safety cleanup)
        this.screenRecordingService.forceRemoveIndicator();
      }

      // Compile final session data
      const finalSessionData = this.compileSessionData(screenRecordingData);
      
      console.log('Analytics tracking stopped');
      return finalSessionData;
    } catch (error) {
      console.error('Failed to stop analytics tracking:', error);
      // Force cleanup on error
      this.screenRecordingService.forceRemoveIndicator();
      throw error;
    }
  }

  /**
   * Pause analytics tracking
   */
  pauseTracking(): void {
    this.userActionLogger.stopLogging();
    if (this.isRecording) {
      this.screenRecordingService.pauseRecording();
    }
  }

  /**
   * Resume analytics tracking
   */
  resumeTracking(): void {
    this.userActionLogger.startLogging();
    if (this.isRecording) {
      this.screenRecordingService.resumeRecording();
    }
  }

  /**
   * Update current URL for context
   */
  updateCurrentUrl(url: string): void {
    this.userActionLogger.setCurrentUrl(url);
  }

  /**
   * Set the target element for screen recording
   */
  setRecordingTarget(element: HTMLElement): void {
    this.screenRecordingService.setTargetElement(element);
  }

  /**
   * Log a custom user action
   */
  logCustomAction(
    type: string,
    data?: Record<string, unknown>,
    coordinates?: { x: number; y: number },
    element?: string
  ): void {
    this.userActionLogger.logAction(type as UserActionType, data, coordinates, element);
  }

  /**
   * Get current analytics data
   */
  getCurrentAnalytics(): AnalyticsData {
    const analytics = this.userActionLogger.getAnalyticsData();
    
    if (this.isRecording) {
      const recordingData = this.screenRecordingService.getCurrentRecording();
      if (recordingData) {
        analytics.screenRecording = recordingData;
      }
    }

    return analytics;
  }

  /**
   * Get current session data
   */
  getCurrentSessionData(): SessionData {
    return this.userActionLogger.getSessionData();
  }

  /**
   * Get screen recording status
   */
  getRecordingStatus(): string {
    return this.screenRecordingService.getRecordingStatus();
  }

  /**
   * Check if screen recording is supported
   */
  isScreenRecordingSupported(): boolean {
    return ScreenRecordingService.isSupported();
  }

  /**
   * Get available recording formats
   */
  getSupportedRecordingFormats(): string[] {
    return ScreenRecordingService.getSupportedFormats();
  }

  /**
   * Export session data as JSON
   */
  exportSessionData(): string {
    return this.userActionLogger.exportSessionData();
  }

  /**
   * Clear all tracked data
   */
  clearData(): void {
    this.userActionLogger.clearActions();
  }

  /**
   * Force cleanup of all resources
   */
  forceCleanup(): void {
    this.screenRecordingService.forceRemoveIndicator();
    this.userActionLogger.stopLogging();
  }

  /**
   * Compile final session data
   */
  private compileSessionData(screenRecordingData?: ScreenRecordingData | null): SessionData {
    const sessionData = this.userActionLogger.getSessionData();
    
    // Add screen recording data if available
    if (screenRecordingData) {
      sessionData.screenRecording = screenRecordingData;
    }

    // Update final analytics
    sessionData.analytics = this.getCurrentAnalytics();
    
    return sessionData;
  }

  /**
   * Get session statistics
   */
  getSessionStats() {
    const actions = this.userActionLogger.getUserActions();
    const sessionData = this.userActionLogger.getSessionData();
    
    const actionTypes = actions.reduce((acc, action) => {
      acc[action.type] = (acc[action.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalActions: actions.length,
      sessionDuration: sessionData.duration,
      actionTypes,
      hasScreenRecording: this.isRecording,
      recordingStatus: this.getRecordingStatus()
    };
  }
} 