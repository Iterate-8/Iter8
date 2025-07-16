"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { AnalyticsData } from "../types/analytics";

interface AnalyticsDashboardProps {
  analyticsData: AnalyticsData;
  currentUrl: string;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  analyticsData, 
  currentUrl 
}) => {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Fetch insights from database
  const fetchInsights = async () => {
    if (!currentUrl) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('url', currentUrl)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data && data.length > 0) {
        const avgSentiment = data.reduce((sum, item) => sum + (item.sentiment_score || 0), 0) / data.length;
        const feedbackTypes = data.reduce((acc, item) => {
          acc[item.feedback_type || 'general'] = (acc[item.feedback_type || 'general'] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        setInsights({
          totalFeedback: data.length,
          avgSentiment: Math.round(avgSentiment * 100) / 100,
          feedbackTypes,
          recentFeedback: data.slice(0, 5)
        });
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [currentUrl]);

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 2) return 'text-green-400';
    if (sentiment > 0) return 'text-yellow-400';
    if (sentiment > -2) return 'text-orange-400';
    return 'text-red-400';
  };

  const getSentimentIcon = (sentiment: number) => {
    if (sentiment > 2) return '😊';
    if (sentiment > 0) return '🙂';
    if (sentiment > -2) return '😐';
    return '😞';
  };

  return (
    <div className="space-y-4">
      {/* Real-time Session Data */}
      <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Live Session</h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-gray-400">Duration</div>
            <div className="text-white font-mono">
              {Math.floor(analyticsData.sessionDuration / 60)}:{(analyticsData.sessionDuration % 60).toString().padStart(2, '0')}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Interactions</div>
            <div className="text-white font-mono">{analyticsData.interactions}</div>
          </div>
          <div>
            <div className="text-gray-400">Current Sentiment</div>
            <div className={`font-mono ${getSentimentColor(analyticsData.sentiment)}`}>
              {getSentimentIcon(analyticsData.sentiment)} {analyticsData.sentiment > 0 ? '+' : ''}{analyticsData.sentiment}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Heatmap Points</div>
            <div className="text-white font-mono">{analyticsData.heatmapData.length}</div>
          </div>
        </div>
      </div>

      {/* Historical Insights */}
      {insights && (
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Historical Insights</h3>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total Feedback</span>
              <span className="text-white font-mono">{insights.totalFeedback}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Avg Sentiment</span>
              <span className={`font-mono ${getSentimentColor(insights.avgSentiment)}`}>
                {getSentimentIcon(insights.avgSentiment)} {insights.avgSentiment}
              </span>
            </div>
            
            {/* Feedback Type Distribution */}
            <div>
              <div className="text-gray-400 mb-2">Feedback Types</div>
              <div className="space-y-1">
                {Object.entries(insights.feedbackTypes).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-gray-400 capitalize">{type}</span>
                    <span className="text-white font-mono">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Journey */}
      <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">User Journey</h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Journey Steps</span>
            <span className="text-white font-mono">{analyticsData.userJourney.length}</span>
          </div>
          {analyticsData.userJourney.length > 0 && (
            <div className="max-h-20 overflow-y-auto">
              {analyticsData.userJourney.slice(-3).map((step, index) => (
                <div key={index} className="text-gray-400 font-mono text-xs">
                  {step.type}: {step.data?.url || step.data?.action || 'interaction'}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center text-gray-400 text-xs">
          Loading insights...
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard; 