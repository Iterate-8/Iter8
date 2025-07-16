"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../components/AuthProvider";
import AnalyticsDashboard from "../../components/AnalyticsDashboard";
import { AnalyticsData } from "../../types/analytics";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [allFeedback, setAllFeedback] = useState<any[]>([]);
  const [selectedUrl, setSelectedUrl] = useState<string>("");
  const [loadingData, setLoadingData] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    sessionDuration: 0,
    interactions: 0,
    sentiment: 0,
    heatmapData: [],
    userJourney: []
  });

  // Fetch all feedback data for the startup
  const fetchAllFeedback = async () => {
    if (!user) return;
    
    setLoadingData(true);
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllFeedback(data || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchAllFeedback();
  }, [user]);

  // Calculate overall insights
  const overallInsights = {
    totalFeedback: allFeedback.length,
    avgSentiment: allFeedback.length > 0 
      ? Math.round(allFeedback.reduce((sum, item) => sum + (item.sentiment_score || 0), 0) / allFeedback.length * 100) / 100
      : 0,
    feedbackTypes: allFeedback.reduce((acc, item) => {
      acc[item.feedback_type || 'general'] = (acc[item.feedback_type || 'general'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    uniqueUrls: [...new Set(allFeedback.map(item => item.url))].length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 font-mono">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 font-mono">Access Denied</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-gray-400">Customer insights and feedback analysis</p>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-800">
            <div className="text-gray-400 text-sm">Total Feedback</div>
            <div className="text-2xl font-bold text-white">{overallInsights.totalFeedback}</div>
          </div>
          <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-800">
            <div className="text-gray-400 text-sm">Avg Sentiment</div>
            <div className="text-2xl font-bold text-white">{overallInsights.avgSentiment}</div>
          </div>
          <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-800">
            <div className="text-gray-400 text-sm">Unique URLs</div>
            <div className="text-2xl font-bold text-white">{overallInsights.uniqueUrls}</div>
          </div>
          <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-800">
            <div className="text-gray-400 text-sm">Feedback Types</div>
            <div className="text-2xl font-bold text-white">{Object.keys(overallInsights.feedbackTypes).length}</div>
          </div>
        </div>

        {/* URL Selector */}
        <div className="mb-8">
          <label className="block text-gray-400 text-sm mb-2">Select URL to analyze:</label>
          <select
            value={selectedUrl}
            onChange={(e) => setSelectedUrl(e.target.value)}
            className="bg-gray-900 border border-gray-600 rounded px-4 py-2 text-white font-mono"
          >
            <option value="">All URLs</option>
            {[...new Set(allFeedback.map(item => item.url))].map((url) => (
              <option key={url} value={url}>{url}</option>
            ))}
          </select>
        </div>

        {/* Analytics Dashboard for Selected URL */}
        {selectedUrl && (
          <div className="mb-8">
            <AnalyticsDashboard 
              analyticsData={analyticsData}
              currentUrl={selectedUrl}
            />
          </div>
        )}

        {/* Recent Feedback Table */}
        <div className="bg-gray-900/50 rounded-lg border border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-semibold text-white">Recent Feedback</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">URL</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Sentiment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Feedback</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {allFeedback.slice(0, 20).map((feedback, index) => (
                  <tr key={index} className="hover:bg-gray-800/50">
                    <td className="px-6 py-4 text-sm text-gray-300 font-mono truncate max-w-xs">
                      {feedback.url}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300 capitalize">
                      {feedback.feedback_type || 'general'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        feedback.sentiment_score > 2 ? 'bg-green-900 text-green-300' :
                        feedback.sentiment_score > 0 ? 'bg-yellow-900 text-yellow-300' :
                        feedback.sentiment_score > -2 ? 'bg-orange-900 text-orange-300' :
                        'bg-red-900 text-red-300'
                      }`}>
                        {feedback.sentiment_score > 0 ? '+' : ''}{feedback.sentiment_score || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300 max-w-md truncate">
                      {feedback.feedback}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 font-mono">
                      {new Date(feedback.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {loadingData && (
          <div className="text-center text-gray-400 mt-8">
            Loading data...
          </div>
        )}
      </div>
    </div>
  );
} 