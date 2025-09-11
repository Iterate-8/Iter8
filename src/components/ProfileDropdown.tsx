"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthProvider";
import { supabase } from "../lib/supabase";

const ProfileDropdown: React.FC = () => {
  const { user } = useAuth();
  const [feedbackCount, setFeedbackCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchFeedbackCount = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('feedback')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      if (!error) {
        setFeedbackCount(count || 0);
      }
    } catch (error) {
      console.error('Error fetching feedback count:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      fetchFeedbackCount();
    }
  }, [user, fetchFeedbackCount]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const toggleTheme = () => {
    const root = document.documentElement;
    const next = root.classList.toggle('dark');
    try {
      localStorage.setItem('iter8_theme', next ? 'dark' : 'light');
    } catch {}
  };

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('iter8_theme');
      if (saved === 'dark') document.documentElement.classList.add('dark');
    } catch {}
  }, []);

  if (!user) return null;

  return (
    <div className="relative">
      {/* Profile Icon - Always Visible */}
      <div 
        className="w-8 h-8 bg-white rounded-full flex items-center justify-center cursor-pointer border border-brand-300 hover:bg-brand-50 transition-colors"
        onClick={toggleDropdown}
      >
        <span className="text-foreground font-sans text-sm">
          {user.email?.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Horizontal Profile Display - Toggle on Click */}
      {isOpen && (
        <div className="absolute top-0 right-10 flex items-center gap-4 bg-white px-4 py-2 rounded-lg border border-brand-200 shadow-lg z-50">
          {/* Account Info */}
          <div className="text-foreground/70 font-sans text-sm">
            Account: <span className="text-foreground">{user.email}</span>
          </div>
          
          {/* Divider */}
          <div className="text-foreground/40">|</div>
          
          {/* Feedback Count */}
          <div className="text-foreground/70 font-sans text-sm">
            Feedback: <span className="text-foreground">{feedbackCount}</span>
          </div>
          
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="text-foreground/70 font-sans text-sm hover:text-foreground transition-colors"
            title="Toggle dark mode"
          >
            🌙
          </button>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="text-foreground/70 font-sans text-sm hover:text-foreground transition-colors"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown; 