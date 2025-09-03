"use client";

import React, { useState, useEffect, useRef } from "react";
import { AnalyticsData, SessionData } from "../types/analytics";
import { AnalyticsService } from "../lib/analyticsService";
import RecordingControls from "./RecordingControls";
import ProfileDropdown from "./ProfileDropdown";

interface EmbedCanvasProps {
  onUrlChange?: (url: string) => void;
  onAnalyticsUpdate?: (data: AnalyticsData) => void;
  onSessionData?: (sessionData: SessionData) => void;
  onShowRecording?: () => void;
}

const EmbedCanvas: React.FC<EmbedCanvasProps> = ({ 
  onUrlChange, 
  onAnalyticsUpdate,
  onSessionData,
  onShowRecording
}) => {
  const [url, setUrl] = useState<string>("");
  const [submittedUrl, setSubmittedUrl] = useState<string>("");
  const [currentUrl, setCurrentUrl] = useState<string>("");

  const [showRecordingViewer, setShowRecordingViewer] = useState(false);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [editingUrl, setEditingUrl] = useState<string>("");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Analytics service instance
  const analyticsService = useRef(new AnalyticsService(`session_${Date.now()}`));

  // Set iframe as recording target when it's available
  useEffect(() => {
    if (iframeRef.current) {
      analyticsService.current.setRecordingTarget(iframeRef.current);
    }
  }, [submittedUrl, analyticsService]);

  // Track user interactions with enhanced logging
  const trackInteraction = React.useCallback((type: string, data?: Record<string, unknown>, coordinates?: { x: number; y: number }) => {
    // Log to analytics service
    analyticsService.current.logCustomAction(type, data, coordinates);

    // Update analytics silently
    if (onAnalyticsUpdate) {
      const currentAnalytics = analyticsService.current.getCurrentAnalytics();
      onAnalyticsUpdate(currentAnalytics);
    }
  }, [analyticsService, onAnalyticsUpdate]);



  // Track clicks with enhanced logging
  const handleClick = (e: React.MouseEvent) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      trackInteraction('click', { x: Math.round(x), y: Math.round(y) }, { x: e.clientX, y: e.clientY });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      // Ensure the URL has a protocol
      let processedUrl = url.trim();
      if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
        processedUrl = 'https://' + processedUrl;
      }
      setSubmittedUrl(processedUrl);
      setCurrentUrl(processedUrl);
      onUrlChange?.(processedUrl);
      
      // Update analytics service with new URL
      analyticsService.current.updateCurrentUrl(processedUrl);
      
      // Track URL submission with enhanced logging
      trackInteraction('url_submit', { url: processedUrl });
    }
  };

  const handleBack = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.history.back();
      trackInteraction('navigation', { action: 'back' });
    }
  };

  const handleForward = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.history.forward();
      trackInteraction('navigation', { action: 'forward' });
    }
  };

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
      trackInteraction('navigation', { action: 'refresh' });
    }
  };

  // Handle iframe navigation
  useEffect(() => {
    if (submittedUrl && iframeRef.current) {
      const iframe = iframeRef.current;
      
      const handleLoad = () => {
        try {
          // Update current URL when iframe loads
          if (iframe.contentWindow?.location.href) {
            const newUrl = iframe.contentWindow.location.href;
            setCurrentUrl(newUrl);
            onUrlChange?.(newUrl);
            analyticsService.current.updateCurrentUrl(newUrl);
            trackInteraction('page_load', { url: newUrl });
          }
        } catch {
          // Cross-origin restrictions
        }
      };

      iframe.addEventListener('load', handleLoad);
      return () => iframe.removeEventListener('load', handleLoad);
    }
  }, [submittedUrl, onUrlChange, analyticsService, trackInteraction]);

  // Create a proxy URL that forces same-window navigation
  const getProxyUrl = (originalUrl: string) => {
    // For now, we'll use the original URL and rely on sandbox settings
    // In a production environment, you might want to use a proxy service
    return originalUrl;
  };

  // Handle showing recording viewer
  const handleShowRecording = () => {
    setShowRecordingViewer(true);
    onShowRecording?.();
  };

  // Handle returning to website
  const handleReturnToWebsite = () => {
    setShowRecordingViewer(false);
  };

  // Handle URL editing
  const handleUrlEdit = () => {
    setIsEditingUrl(true);
    setEditingUrl(currentUrl);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUrl.trim()) {
      const processedUrl = editingUrl.startsWith('http') ? editingUrl : `https://${editingUrl}`;
      setSubmittedUrl(processedUrl);
      setCurrentUrl(processedUrl);
      onUrlChange?.(processedUrl);
      analyticsService.current.updateCurrentUrl(processedUrl);
      trackInteraction('url_change', { url: processedUrl });
    }
    setIsEditingUrl(false);
  };

  const handleUrlCancel = () => {
    setIsEditingUrl(false);
    setEditingUrl(currentUrl);
  };

  return (
    <div 
      ref={canvasRef}
      className="w-full h-full bg-white border border-brand-200 relative rounded-lg flex items-center justify-center"
      onClick={handleClick}
    >
      <div 
        className="w-full h-full bg-white rounded-lg relative"
        style={{
          border: '1px solid rgba(173, 133, 255, 0.3)',
          boxShadow: '0 0 8px rgba(176, 123, 255, 0.25), 0 0 16px rgba(139, 92, 246, 0.15), inset 0 0 2px rgba(176, 123, 255, 0.15)',
          filter: 'drop-shadow(0 0 2px rgba(176, 123, 255, 0.35))'
        }}
      >
        {!submittedUrl ? (
          // Browser-like Interface
          <div className="w-full h-full flex flex-col">
            {/* Browser Navbar */}
            <div className="bg-white border-b border-brand-200 flex items-center px-4 gap-2">
              {/* Navigation Controls */}
              <div className="flex items-center gap-1">
                <button
                  className="p-2 bg-white text-foreground font-sans text-sm rounded-lg border border-brand-300 hover:bg-brand-50 transition-all duration-200 hover:scale-105 disabled:opacity-50"
                  title="Go Back"
                  disabled
                >
                  ←
                </button>
                <button
                  className="p-2 bg-white text-foreground font-sans text-sm rounded-lg border border-brand-300 hover:bg-brand-50 transition-all duration-200 hover:scale-105 disabled:opacity-50"
                  title="Go Forward"
                  disabled
                >
                  →
                </button>
                <button
                  className="p-2 bg-white text-foreground font-sans text-sm rounded-lg border border-brand-300 hover:bg-brand-50 transition-all duration-200 hover:scale-105 disabled:opacity-50"
                  title="Refresh"
                  disabled
                >
                  ↻
                </button>
              </div>
              
              {/* URL Bar */}
              <div className="flex-1 mx-4">
                <form onSubmit={handleSubmit} className="w-full relative">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter website URL (e.g., https://example.com)"
                    className="w-full bg-white text-foreground font-sans text-sm px-3 pr-20 rounded-lg border border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-400 placeholder-foreground/40"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!url.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <circle cx="11" cy="11" r="7" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </button>
                </form>
              </div>
              {/* Profile Dropdown */}
              <div className="ml-4">
                <ProfileDropdown />
              </div>
            </div>
            
            {/* Browser Content Area */}
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="font-mono font-light text-foreground animate-pulse" style={{
                  fontSize: '8rem',
                  lineHeight: '1',
                  textShadow: '0 0 20px rgba(192, 192, 192, 0.8), 0 0 40px rgba(192, 192, 192, 0.4), 0 0 60px rgba(192, 192, 192, 0.2)',
                  filter: 'drop-shadow(0 0 10px rgba(192, 192, 192, 0.6))'
                }}>∞</div>
                <h2 className="text-foreground font-mono text-xl mb-2">Welcome to Iter8</h2>
                <p className="text-gray-400 font-mono text-sm mb-6">Enter a URL above to start browsing and recording</p>
                <div className="text-xs text-gray-50 font-mono space-y-1">
                  <div>Click the navigation buttons to browse</div>
                  <div>Use the URL bar to navigate to any website</div>
                  <div>Your session will be automatically recorded</div>
                </div>
              </div>
            </div>
          </div>
        ) : showRecordingViewer ? (
          // Recording Viewer Mode
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="bg-background p-8 rounded-lg border border-gray-700 w-full max-w-md text-center">
              <h2 className="text-gray-300 font-mono text-xl mb-4">Recording Viewer Active</h2>
              <p className="text-gray-400 font-mono mb-6">The recording viewer is now open in a separate modal.</p>
              <button
                onClick={handleReturnToWebsite}
                className="px-4 py-2 bg-foreground/10 text-foreground font-mono rounded border border-black/10 dark:border-white/10 hover:bg-foreground/20 transition-colors"
              >
                Return to Website
              </button>
            </div>
          </div>
        ) : (
          // Embedded Website with Navigation
          <div className="w-full h-full relative">
            {/* Top Navigation Bar */}
            <div className="absolute top-0 left-0 right-0 z-20 bg-background border-b border-black/10 dark:border-white/10 h-12">
              <div className="flex items-center justify-between px-4 py-2 h-full">
                {/* Left: Navigation Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBack}
                    className="p-2 bg-background text-foreground font-mono text-sm rounded-lg border border-black/10 dark:border-white/10 hover:bg-foreground/10 transition-all duration-200 hover:scale-105"
                    title="Go Back"
                  >
                    ←
                  </button>
                  <button
                    onClick={handleForward}
                    className="p-2 bg-background text-foreground font-mono text-sm rounded-lg border border-black/10 dark:border-white/10 hover:bg-foreground/10 transition-all duration-200 hover:scale-105"
                    title="Go Forward"
                  >
                    →
                  </button>
                  <button
                    onClick={handleRefresh}
                    className="p-2 bg-background text-foreground font-mono text-sm rounded-lg border border-black/10 dark:border-white/10 hover:bg-foreground/10 transition-all duration-200 hover:scale-105"
                    title="Refresh"
                  >
                    ↻
                  </button>
                </div>
                
                {/* Center: URL Display */}
                <div className="flex-1 mx-4">
                  {isEditingUrl ? (
                    <form onSubmit={handleUrlSubmit} className="max-w-md mx-auto">
                      <input
                        type="text"
                        value={editingUrl}
                        onChange={(e) => setEditingUrl(e.target.value)}
                        onBlur={handleUrlCancel}
                        className="w-full bg-white text-foreground font-sans text-xs px-3 rounded-lg border border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-400"
                        autoFocus
                      />
                    </form>
                  ) : (
                    <div 
                      className="bg-white text-foreground font-sans text-xs px-3 rounded-lg border border-brand-300 truncate max-w-md mx-auto cursor-pointer hover:bg-brand-50 transition-colors"
                      onClick={handleUrlEdit}
                      title="Click to edit URL"
                    >
                      {currentUrl}
                    </div>
                  )}
                </div>
                
                {/* Right: Recording Controls */}
                <div className="flex items-center gap-2">
                  <RecordingControls
                    analyticsService={analyticsService.current}
                    onSessionData={onSessionData}
                    onAnalyticsUpdate={onAnalyticsUpdate}
                    isNavbar={true}
                    onShowRecording={handleShowRecording}
                  />
                </div>
              </div>
            </div>
            
            {/* Iframe with Navigation Support */}
            <iframe
              ref={iframeRef}
              src={getProxyUrl(submittedUrl)}
              title="Startup Website Preview"
              className="absolute top-12 left-0 right-0 bottom-0 border-0 bg-white w-full h-full"
              style={{ height: 'calc(100% - 48px)' }}
              allow="fullscreen"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation allow-top-navigation-by-user-activation"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default EmbedCanvas; 