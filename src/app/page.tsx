"use client";

import { useAuth } from "../components/AuthProvider";
import FeedbackBox from "../components/FeedbackBox";
import EmbedCanvas from "../components/EmbedCanvas";
import Logo from "../components/Logo";
import AuthPage from "../components/AuthPage";
import ProfileDropdown from "../components/ProfileDropdown";
import SessionDataViewer from "../components/SessionDataViewer";
import RecordingViewer from "../components/RecordingViewer";
import { useState, useEffect } from "react";
import { AnalyticsData, SessionData } from "../types/analytics";

export default function Home() {
  const { user, loading } = useAuth();
  const [currentUrl, setCurrentUrl] = useState("");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    sessionDuration: 0,
    interactions: 0,
    sentiment: 0,
    heatmapData: [],
    userJourney: [],
    userActions: []
  });
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [showSessionViewer, setShowSessionViewer] = useState(false);
  const [showRecordingViewer, setShowRecordingViewer] = useState(false);
  const [currentSessionData, setCurrentSessionData] = useState<SessionData | null>(null);

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

  // Handle session data updates
  const handleSessionData = (data: SessionData) => {
    setSessionData(data);
    setCurrentSessionData(data);
    console.log('Session data received:', data);
    // Removed automatic popup - user can access recordings via buttons
  };

  // Handle showing recording viewer
  const handleShowRecording = () => {
    setShowRecordingViewer(true);
  };

  // Handle closing recording viewer
  const handleCloseRecording = () => {
    setShowRecordingViewer(false);
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
      <main className="flex-1 flex flex-col relative bg-gray-900 text-white">
        
        <div className="flex-1 w-full h-full">
          <EmbedCanvas 
            onUrlChange={setCurrentUrl} 
            onAnalyticsUpdate={handleAnalyticsUpdate}
            onSessionData={handleSessionData}
            onShowRecording={handleShowRecording}
          />
        </div>
      </main>
      
      {/* Session Data Viewer */}
      <SessionDataViewer
        sessionData={sessionData}
        isVisible={showSessionViewer}
        onClose={() => setShowSessionViewer(false)}
      />
      
      {/* Recording Viewer */}
      <RecordingViewer
        sessionData={currentSessionData}
        isVisible={showRecordingViewer}
        onClose={handleCloseRecording}
      />
    </div>
  );
}
