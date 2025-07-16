"use client";

import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";

interface FeedbackBoxProps {
  currentUrl?: string;
}

const FeedbackBox: React.FC<FeedbackBoxProps> = ({ currentUrl = "" }) => {
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim() || !user) return;

    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase
        .from('feedback')
        .insert([
          {
            user_id: user.id,
            url: currentUrl,
            feedback: feedback.trim(),
            created_at: new Date().toISOString(),
          }
        ]);

      if (error) throw error;

      setFeedback("");
      setMessage("Feedback submitted successfully!");
      
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Leave your feedback here..."
        rows={4}
        disabled={loading}
        className="resize-none rounded-md border border-black/10 dark:border-white/10 bg-transparent p-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 min-h-[100px] leading-relaxed"
      />
      
      {message && (
        <div className="text-sm font-mono text-center p-2 rounded bg-gray-800 border border-gray-600">
          {message}
        </div>
      )}
      
      <button
        type="submit"
        disabled={loading || !feedback.trim()}
        className="self-end px-4 py-2 rounded-md bg-black text-white dark:bg-white dark:text-black font-mono text-sm font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Sending..." : "Send"}
      </button>
    </form>
  );
};

export default FeedbackBox; 