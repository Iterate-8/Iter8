"use client";

import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";

interface FeedbackBoxProps {
  currentUrl?: string;
}

const FeedbackBox: React.FC<FeedbackBoxProps> = ({ 
  currentUrl = "" 
}) => {
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [feedbackType, setFeedbackType] = useState<string>("general");
  const { user } = useAuth();



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim() || !user) return;

    setLoading(true);
    setMessage("");

    try {
      // Get startup name from user metadata
      let startupName = user.user_metadata?.startup_name;
      
      // If no startup name in metadata, prompt user to sign out and sign in again
      if (!startupName) {
        setMessage("Please sign out and sign in again to set your startup name");
        return;
      }
      
      console.log('Submitting feedback with data:', {
        user_id: user.id,
        startup_name: startupName,
        feedback_type: feedbackType,
        feedback: feedback.trim()
      });

      const { data, error } = await supabase
        .from('feedback')
        .insert([
          {
            user_id: user.id,
            startup_name: startupName,
            feedback_type: feedbackType,
            feedback: feedback.trim()
          }
        ])
        .select();

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Feedback submitted successfully:', data);
      setFeedback("");
      setMessage("Feedback submitted successfully!");
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(""), 3000);
    } catch (error: unknown) {
      console.error('Error submitting feedback:', error);
      
      let errorMessage = 'An unknown error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setMessage(`Error: ${errorMessage}`);
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
            className={`px-3 py-1 rounded border font-sans transition-colors ${
              feedbackType === type
                ? 'bg-brand-100 border-brand-300 text-foreground'
                : 'bg-white border-brand-300 text-foreground/70 hover:bg-brand-50'
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
            className="resize-none rounded-md border border-brand-300 bg-white p-4 pb-8 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-brand-400 min-h-[100px] leading-relaxed w-full pr-16"
          />
          
          {/* Send Button positioned at bottom right of textarea */}
          <button
            type="submit"
            disabled={loading || !feedback.trim()}
            className="absolute bottom-3 right-3 p-1.5 rounded-md bg-brand-600 text-white border border-brand-500 font-sans transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 flex items-center justify-center"
          >
            {loading ? (
              <div className="w-3 h-3 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
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
        

        
        {message && (
          <div className="text-sm font-sans text-center p-2 rounded bg-brand-100 border border-brand-300 text-foreground">
            {message}
          </div>
        )}
      </form>
    </div>
  );
};

export default FeedbackBox; 