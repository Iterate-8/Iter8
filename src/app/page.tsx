"use client";

import { useAuth } from "../components/AuthProvider";
import FeedbackBox from "../components/FeedbackBox";
import EmbedCanvas from "../components/EmbedCanvas";
import Logo from "../components/Logo";
import AuthPage from "../components/AuthPage";
import ProfileDropdown from "../components/ProfileDropdown";
import { useState, useEffect } from "react";
import { AnalyticsData } from "../types/analytics";

export default function Home() {
  const { user, loading } = useAuth();
  const [currentUrl, setCurrentUrl] = useState("");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    sessionDuration: 0,
    interactions: 0,
    sentiment: 0,
    heatmapData: [],
    userJourney: []
  });

  // Track session duration silently in background
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setAnalyticsData(prev => ({
        ...prev,
        sessionDuration: Math.floor((Date.now() - startTime) / 1000)
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle analytics updates silently
  const handleAnalyticsUpdate = (data: AnalyticsData) => {
    setAnalyticsData(data);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <Logo />
          <div className="mt-4 text-gray-400 font-mono">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Left: Feedback Only - Clean Interface for End Users */}
      <aside className="w-1/3 min-w-[320px] max-w-md flex flex-col border-r border-black/10 dark:border-white/10 p-6">
        {/* Logo at top */}
        <div className="mb-8">
          <Logo />
        </div>
        
        {/* Feedback at bottom - KEEPING EXISTING POSITION */}
        <div className="flex-1 flex flex-col justify-end">
          <FeedbackBox 
            currentUrl={currentUrl} 
            analyticsData={analyticsData}
            onAnalyticsUpdate={handleAnalyticsUpdate}
          />
        </div>
      </aside>
      
      {/* Right: Embedded Canvas */}
      <main className="flex-1 flex items-stretch relative">
        {/* Profile Dropdown - Top Right - KEEPING EXISTING POSITION */}
        <div className="absolute top-4 right-4 z-50">
          <ProfileDropdown />
        </div>
        
        <EmbedCanvas 
          onUrlChange={setCurrentUrl} 
          onAnalyticsUpdate={handleAnalyticsUpdate}
        />
      </main>
    </div>
  );
}
