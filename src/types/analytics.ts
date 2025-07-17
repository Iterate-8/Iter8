export interface AnalyticsData {
  sessionDuration: number;
  interactions: number;
  sentiment: number;
  heatmapData: HeatmapPoint[];
  userJourney: UserJourneyStep[];
  screenRecording?: ScreenRecordingData;
  userActions: UserAction[];
}

export interface HeatmapPoint {
  x: number;
  y: number;
  timestamp: number;
  intensity: number;
}

export interface UserJourneyStep {
  type: string;
  timestamp: number;
  url: string;
  data?: Record<string, unknown>;
}

// Enhanced user action logging
export interface UserAction {
  id: string;
  type: UserActionType;
  timestamp: number;
  url: string;
  coordinates?: { x: number; y: number };
  element?: string;
  data?: Record<string, unknown>;
  sessionId: string;
}

export type UserActionType = 
  | 'click'
  | 'scroll'
  | 'hover'
  | 'keypress'
  | 'navigation'
  | 'url_change'
  | 'page_load'
  | 'form_submit'
  | 'mouse_move'
  | 'focus'
  | 'blur'
  | 'resize';

// Screen recording types
export interface ScreenRecordingData {
  sessionId: string;
  startTime: number;
  endTime?: number;
  duration: number;
  recordingUrl?: string;
  status: RecordingStatus;
  metadata: RecordingMetadata;
}

export type RecordingStatus = 'idle' | 'recording' | 'paused' | 'stopped' | 'error';

export interface RecordingMetadata {
  resolution: { width: number; height: number };
  frameRate: number;
  quality: 'low' | 'medium' | 'high';
  format: 'webm' | 'mp4';
}

// Session management
export interface SessionData {
  sessionId: string;
  startTime: number;
  endTime?: number;
  duration: number;
  userActions: UserAction[];
  screenRecording?: ScreenRecordingData;
  analytics: AnalyticsData;
} 