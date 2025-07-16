"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthProvider";
import { supabase } from "../lib/supabase";

const ProfileDropdown: React.FC = () => {
  const { user } = useAuth();
  const [feedbackCount, setFeedbackCount] = useState<number>(0);
  const [isHovered, setIsHovered] = useState(false);

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

  if (!user) return null;

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Profile Icon - Always Visible */}
      <div className="w-8 h-8 bg-background rounded-full flex items-center justify-center cursor-pointer border border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        <span className="text-gray-300 font-mono text-sm">
          {user.email?.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Horizontal Profile Display - Only on Hover */}
      {isHovered && (
        <div className="absolute top-0 right-10 flex items-center gap-4 bg-gray-900 px-4 py-2 rounded-lg border border-gray-700 shadow-lg z-50">
          {/* Account Info */}
          <div className="text-gray-400 font-mono text-sm">
            Account: <span className="text-gray-200">{user.email}</span>
          </div>
          
          {/* Divider */}
          <div className="text-gray-600">|</div>
          
          {/* Feedback Count */}
          <div className="text-gray-400 font-mono text-sm">
            Feedback: <span className="text-gray-200">{feedbackCount}</span>
          </div>
          
          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="text-gray-400 font-mono text-sm hover:text-gray-200 transition-colors"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown; 