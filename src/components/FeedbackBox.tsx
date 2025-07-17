"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";
import { AnalyticsData } from "../types/analytics";

interface FeedbackBoxProps {
  currentUrl?: string;
  analyticsData?: AnalyticsData;
  onAnalyticsUpdate?: (data: AnalyticsData) => void;
}

const FeedbackBox: React.FC<FeedbackBoxProps> = ({ 
  currentUrl = "", 
  analyticsData,
  onAnalyticsUpdate 
}) => {
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [sentiment, setSentiment] = useState(0);
  const [feedbackType, setFeedbackType] = useState<string>("general");
  const { user } = useAuth();

  // Simple sentiment analysis
  const analyzeSentiment = (text: string): number => {
    const positiveWords = ['good', 'great', 'excellent', 'love', 'amazing', 'perfect', 'awesome', 'fantastic', 'wonderful', 'best'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'frustrating', 'confusing', 'broken', 'useless'];
    
    const words = text.toLowerCase().split(/\s+/);
    let score = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });
    
    return Math.max(-5, Math.min(5, score));
  };

  // Track feedback interactions
  useEffect(() => {
    if (onAnalyticsUpdate && analyticsData) {
      onAnalyticsUpdate({
        ...analyticsData,
        interactions: analyticsData.interactions + 1
      });
    }
  }, [feedback]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim() || !user) return;

    setLoading(true);
    setMessage("");

    // Analyze sentiment
    const sentimentScore = analyzeSentiment(feedback);
    setSentiment(sentimentScore);

    try {
      const { error } = await supabase
        .from('feedback')
        .insert([
          {
            user_id: user.id,
            url: currentUrl,
            feedback: feedback.trim(),
            sentiment_score: sentimentScore,
            feedback_type: feedbackType,
            session_duration: analyticsData?.sessionDuration || 0,
            interaction_count: analyticsData?.interactions || 0,
            user_journey: analyticsData?.userJourney || [],
            created_at: new Date().toISOString(),
          }
        ]);

      if (error) throw error;

      setFeedback("");
      setMessage("Feedback submitted successfully!");
      
      // Update analytics with sentiment
      if (onAnalyticsUpdate && analyticsData) {
        onAnalyticsUpdate({
          ...analyticsData,
          sentiment: sentimentScore
        });
      }
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(""), 3000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Feedback Type Selector */}
      <div className="flex gap-2 text-xs">
        {['general', 'bug', 'feature', 'ux'].map((type) => (
          <button
            key={type}
            onClick={() => setFeedbackType(type)}
            className={`px-3 py-1 rounded border font-mono transition-colors ${
              feedbackType === type
                ? 'bg-foreground/10 border-black/10 dark:border-white/10 text-foreground'
                : 'bg-background border-black/10 dark:border-white/10 text-foreground hover:bg-foreground/5'
            }`}
          >
            {type === 'ux' ? 'UX' : type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Enhanced Feedback Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
        <div className="relative">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share your thoughts, report issues, or suggest improvements..."
            rows={4}
            disabled={loading}
            className="resize-none rounded-md border border-black/10 dark:border-white/10 bg-transparent p-4 pb-8 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 min-h-[100px] leading-relaxed w-full pr-16"
          />
          
          {/* Send Button positioned at bottom right of textarea */}
          <button
            type="submit"
            disabled={loading || !feedback.trim()}
            className="absolute bottom-3 right-3 p-1.5 rounded-md bg-background text-foreground border border-black/10 dark:border-white/10 font-mono transition-all disabled:opacity-50 isabled:cursor-not-allowed hover:bg-foreground/10 flex items-center justify-center"
          >
            {loading ? (
              <div className="w-3 h-3 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg 
                className="w-3 h-3" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 10l7-7m0 0l7 7m-7-7v18" 
                />
              </svg>
            )}
          </button>
        </div>
        
        {/* Sentiment Indicator */}
        {feedback && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">Sentiment:</span>
            <div className="flex gap-1">
              {[-2, -1, 0, 1, 2].map((level) => (
                <div
                  key={level}
                  className={`w-2 h-2 rounded-full ${
                    sentiment >= level ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
            <span className="text-gray-400 font-mono">
              {sentiment > 0 ? '+' : ''}{sentiment}
            </span>
          </div>
        )}
        
        {message && (
          <div className="text-sm font-mono text-center p-2 rounded bg-gray-800 border border-gray-600">
            {message}
          </div>
        )}
      </form>
    </div>
  );
};

export default FeedbackBox; 