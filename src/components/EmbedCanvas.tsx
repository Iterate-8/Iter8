"use client";

import React, { useState, useRef, useEffect } from "react";
import { AnalyticsData } from "../types/analytics";
import { AnalyticsService } from "../lib/analyticsService";
import RecordingControls from "./RecordingControls";

import { SessionData } from "../types/analytics";

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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Analytics service instance
  const [analyticsService] = useState(() => new AnalyticsService(`session_${Date.now()}`));

  // Set iframe as recording target when it's available
  useEffect(() => {
    if (iframeRef.current) {
      analyticsService.setRecordingTarget(iframeRef.current);
    }
  }, [submittedUrl, analyticsService]);

  // Track user interactions with enhanced logging
  const trackInteraction = React.useCallback((type: string, data?: Record<string, unknown>, coordinates?: { x: number; y: number }) => {
    // Log to analytics service
    analyticsService.logCustomAction(type, data, coordinates);

    // Update analytics silently
    if (onAnalyticsUpdate) {
      const currentAnalytics = analyticsService.getCurrentAnalytics();
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
      analyticsService.updateCurrentUrl(processedUrl);
      
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
            analyticsService.updateCurrentUrl(newUrl);
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

  return (
    <div 
      ref={canvasRef}
      className="w-full h-full bg-black border border-black/10 dark:border-white/10 relative rounded-lg flex items-center justify-center"
      onClick={handleClick}
    >
      <div 
        className="w-full h-full bg-background rounded-lg relative"
        style={{
          border: '1px solid rgba(192, 192, 192, 0.3)',
          boxShadow: '0 0 8px rgba(192, 192, 192, 0.8), 0 0 16px rgba(192, 192, 192, 0.4), inset 0 0 2px rgba(192, 192, 192, 0.1)',
          filter: 'drop-shadow(0 0 2px rgba(192, 192, 192, 0.6))'
        }}
      >
        {!submittedUrl ? (
          // URL Input Form
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="bg-background p-8 rounded-lg border border-gray-700 w-full max-w-md">
              <h2 className="text-gray-300 font-mono text-xl mb-4 text-center">Enter Website URL</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full p-3 bg-background border border-gray-600 rounded font-mono text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
                <button
                  type="submit"
                  className="w-full p-3 bg-gray-600 text-gray-200 font-mono rounded hover:bg-gray-500 transition-colors"
                >
                  Load Website
                </button>
              </form>
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
                className="px-4 py-2 bg-gray-600 text-gray-200 font-mono rounded hover:bg-gray-500 transition-colors"
              >
                Return to Website
              </button>
            </div>
          </div>
        ) : (
          // Embedded Website with Navigation
          <div className="w-full h-full relative">
            {/* Top Navigation Bar */}
            <div className="absolute top-0 left-0 right-0 z-20 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 h-12">
              <div className="flex items-center justify-between px-4 py-2 h-full">
                {/* Left: Navigation Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBack}
                    className="p-2 bg-gray-800/80 text-gray-300 font-mono text-sm rounded-lg border border-gray-600/50 hover:bg-gray-700/80 transition-all duration-200 hover:scale-105"
                    title="Go Back"
                  >
                    ←
                  </button>
                  <button
                    onClick={handleForward}
                    className="p-2 bg-gray-800/80 text-gray-300 font-mono text-sm rounded-lg border border-gray-600/50 hover:bg-gray-700/80 transition-all duration-200 hover:scale-105"
                    title="Go Forward"
                  >
                    →
                  </button>
                  <button
                    onClick={handleRefresh}
                    className="p-2 bg-gray-800/80 text-gray-300 font-mono text-sm rounded-lg border border-gray-600/50 hover:bg-gray-700/80 transition-all duration-200 hover:scale-105"
                    title="Refresh"
                  >
                    ↻
                  </button>
                </div>
                
                {/* Center: URL Display */}
                <div className="flex-1 mx-4">
                  <div className="bg-gray-800/80 text-gray-300 font-mono text-xs px-3 py-2 rounded-lg border border-gray-600/50 truncate max-w-md mx-auto">
                    {currentUrl}
                  </div>
                </div>
                
                {/* Right: Recording Controls */}
                <div className="flex items-center gap-2">
                  <RecordingControls
                    analyticsService={analyticsService}
                    onSessionData={onSessionData}
                    onAnalyticsUpdate={onAnalyticsUpdate}
                    isNavbar={true}
                    onShowRecording={handleShowRecording}
                  />
                  <button
                    onClick={() => {
                      setSubmittedUrl("");
                      trackInteraction('url_change');
                    }}
                    className="px-3 py-2 bg-gray-800/80 text-gray-300 font-mono text-sm rounded-lg border border-gray-600/50 hover:bg-gray-700/80 transition-all duration-200 hover:scale-105"
                  >
                    Change URL
                  </button>
                </div>
              </div>
            </div>
            
            {/* Iframe with Navigation Support */}
            <iframe
              ref={iframeRef}
              src={getProxyUrl(submittedUrl)}
              title="Startup Website Preview"
              className="absolute top-12 left-0 right-0 bottom-0 border-0 bg-gray-800 w-full h-full"
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