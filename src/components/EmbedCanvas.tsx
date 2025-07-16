"use client";

import React, { useState, useRef, useEffect } from "react";
import { AnalyticsData } from "../types/analytics";

interface EmbedCanvasProps {
  onUrlChange?: (url: string) => void;
  onAnalyticsUpdate?: (data: AnalyticsData) => void;
}

const EmbedCanvas: React.FC<EmbedCanvasProps> = ({ onUrlChange, onAnalyticsUpdate }) => {
  const [url, setUrl] = useState<string>("");
  const [submittedUrl, setSubmittedUrl] = useState<string>("");
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [interactionCount, setInteractionCount] = useState(0);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [userJourney, setUserJourney] = useState<any[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Track user interactions silently in background
  const trackInteraction = (type: string, data?: any) => {
    setInteractionCount(prev => prev + 1);
    
    const interaction = {
      type,
      timestamp: Date.now(),
      url: currentUrl,
      data
    };

    setUserJourney(prev => [...prev, interaction]);

    // Update analytics silently
    if (onAnalyticsUpdate) {
      onAnalyticsUpdate({
        sessionDuration: 0, // This is managed by parent
        interactions: interactionCount + 1,
        sentiment: 0, // This is managed by parent
        heatmapData: [...heatmapData, data].filter(Boolean),
        userJourney: [...userJourney, interaction]
      });
    }
  };

  // Track mouse movements for heatmap silently
  const handleMouseMove = (e: React.MouseEvent) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const heatmapPoint = {
        x: Math.round(x),
        y: Math.round(y),
        timestamp: Date.now(),
        intensity: 1
      };

      setHeatmapData(prev => {
        const newData = [...prev, heatmapPoint];
        // Keep only last 100 points for performance
        return newData.slice(-100);
      });
    }
  };

  // Track clicks silently
  const handleClick = (e: React.MouseEvent) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      trackInteraction('click', { x: Math.round(x), y: Math.round(y) });
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
      
      // Track URL submission silently
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
            trackInteraction('page_load', { url: newUrl });
          }
        } catch {
          // Cross-origin restrictions
        }
      };

      iframe.addEventListener('load', handleLoad);
      return () => iframe.removeEventListener('load', handleLoad);
    }
  }, [submittedUrl, onUrlChange]);

  // Create a proxy URL that forces same-window navigation
  const getProxyUrl = (originalUrl: string) => {
    // For now, we'll use the original URL and rely on sandbox settings
    // In a production environment, you might want to use a proxy service
    return originalUrl;
  };

  return (
    <div 
      ref={canvasRef}
      className="w-full h-full p-12 bg-black border border-black/10 dark:border-white/10 relative rounded-lg flex items-center justify-center"
      onMouseMove={handleMouseMove}
      onClick={handleClick}
    >
      <div 
        className="w-full max-w-6xl h-full max-h-[80vh] bg-background rounded-lg relative"
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
        ) : (
          // Embedded Website with Navigation
          <div className="w-full h-full relative">
            {/* Navigation Bar */}
            <div className="absolute top-2 left-2 z-10 flex gap-2">
              <button
                onClick={handleBack}
                className="px-3 py-1 bg-gray-800 text-gray-300 font-mono text-sm rounded border border-gray-600 hover:bg-gray-700 transition-colors"
                title="Go Back"
              >
                ←
              </button>
              <button
                onClick={handleForward}
                className="px-3 py-1 bg-gray-800 text-gray-300 font-mono text-sm rounded border border-gray-600 hover:bg-gray-700 transition-colors"
                title="Go Forward"
              >
                →
              </button>
              <button
                onClick={handleRefresh}
                className="px-3 py-1 bg-gray-800 text-gray-300 font-mono text-sm rounded border border-gray-600 hover:bg-gray-700 transition-colors"
                title="Refresh"
              >
                ↻
              </button>
            </div>
            
            {/* Current URL Display */}
            <div className="absolute top-2 left-32 right-20 z-10">
              <div className="bg-gray-800 text-gray-300 font-mono text-xs px-2 py-1 rounded border border-gray-600 truncate">
                {currentUrl}
              </div>
            </div>
            
            {/* Change URL Button */}
            <button
              onClick={() => {
                setSubmittedUrl("");
                trackInteraction('url_change');
              }}
              className="absolute bottom-2 right-2 z-10 px-3 py-1 bg-gray-800 text-gray-300 font-mono text-sm rounded border border-gray-600 hover:bg-gray-700 transition-colors"
            >
              Change URL
            </button>
            
            {/* Iframe with Navigation Support */}
            <iframe
              ref={iframeRef}
              src={getProxyUrl(submittedUrl)}
              title="Startup Website Preview"
              className="w-full h-full border-0 rounded-lg bg-gray-800"
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