export interface AnalyticsData {
  sessionDuration: number;
  interactions: number;
  sentiment: number;
  heatmapData: any[];
  userJourney: any[];
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
  data?: any;
} 