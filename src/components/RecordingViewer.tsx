"use client";

import React, { useState } from 'react';
import { SessionData } from '../types/analytics';

interface RecordingViewerProps {
  sessionData: SessionData | null;
  isVisible: boolean;
  onClose: () => void;
}

const RecordingViewer: React.FC<RecordingViewerProps> = ({
  sessionData,
  isVisible,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'actions'>('video');

  if (!isVisible || !sessionData) return null;

  console.log('RecordingViewer props:', { isVisible, sessionData: !!sessionData });
  console.log('Screen recording data:', sessionData?.screenRecording);

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-brand-200 rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col my-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-brand-200">
          <h2 className="text-foreground font-sans text-lg">Recording Viewer</h2>
          <button
            onClick={onClose}
            className="text-foreground/60 hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-brand-200">
          <button
            onClick={() => setActiveTab('video')}
            className={`px-4 py-2 text-sm font-mono transition-colors ${
              activeTab === 'video' 
                ? 'text-foreground border-b-2 border-brand-600' 
                : 'text-foreground/70 hover:text-foreground'
            }`}
          >
            📹 Video Recording
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`px-4 py-2 text-sm font-mono transition-colors ${
              activeTab === 'actions' 
                ? 'text-foreground border-b-2 border-brand-600' 
                : 'text-foreground/70 hover:text-foreground'
            }`}
          >
            📊 User Actions ({sessionData.userActions.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'video' && sessionData.screenRecording && (
            <div className="h-full flex flex-col">
              <div className="mb-4">
                <h3 className="text-foreground font-mono mb-2">Screen Recording</h3>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div className="bg-brand-50 p-3 rounded border border-brand-200">
                    <span className="text-foreground/70">Status:</span>
                    <span className="ml-2 text-foreground">{sessionData.screenRecording.status}</span>
                  </div>
                  <div className="bg-brand-50 p-3 rounded border border-brand-200">
                    <span className="text-foreground/70">Duration:</span>
                    <span className="ml-2 text-foreground">{formatDuration(sessionData.screenRecording.duration)}</span>
                  </div>
                  <div className="bg-brand-50 p-3 rounded border border-brand-200">
                    <span className="text-foreground/70">Resolution:</span>
                    <span className="ml-2 text-foreground">
                      {sessionData.screenRecording.metadata.resolution.width} x {sessionData.screenRecording.metadata.resolution.height}
                    </span>
                  </div>
                  <div className="bg-brand-50 p-3 rounded border border-brand-200">
                    <span className="text-foreground/70">Format:</span>
                    <span className="ml-2 text-foreground">{sessionData.screenRecording.metadata.format}</span>
                  </div>
                </div>
              </div>
              
              {sessionData.screenRecording.recordingUrl ? (
                <div className="flex-1 bg-brand-50 rounded border border-brand-200 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-foreground font-mono text-sm">Video Recording</h4>
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = sessionData.screenRecording.recordingUrl!;
                        link.download = `recording-${sessionData.sessionId}-${new Date(sessionData.screenRecording.startTime).toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="px-3 py-1.5 bg-brand-600 text-white text-xs rounded-lg border border-brand-500 hover:opacity-90 transition-all duration-200 hover:scale-105 flex items-center gap-1"
                      title="Download Video"
                    >
                      💾 Download
                    </button>
                  </div>
                  <video
                    controls
                    className="w-full h-full rounded"
                    src={sessionData.screenRecording.recordingUrl}
                    autoPlay={false}
                    onError={(e) => {
                      console.error('Video playback error:', e);
                    }}
                    onLoadStart={() => {
                      console.log('Video loading started');
                    }}
                    onCanPlay={() => {
                      console.log('Video can play');
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                  <div className="mt-2 text-xs text-foreground/70">
                    Video URL: {sessionData.screenRecording.recordingUrl}
                  </div>
                </div>
              ) : (
                <div className="flex-1 bg-brand-50 rounded border border-brand-200 p-8 flex items-center justify-center">
                  <div className="text-center text-foreground/70">
                    <div className="text-4xl mb-4">📹</div>
                    <div className="text-lg mb-2">No video recording available</div>
                    <div className="text-sm">The recording may not have been saved properly</div>
                    <div className="text-xs mt-2">
                      Recording status: {sessionData.screenRecording.status}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="space-y-2">
              {sessionData.userActions.map((action) => (
                <div
                  key={action.id}
                  className="bg-brand-50 border border-brand-200 rounded p-3 text-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs text-white ${
                        action.type === 'click' ? 'bg-blue-500' :
                        action.type === 'scroll' ? 'bg-green-500' :
                        action.type === 'hover' ? 'bg-yellow-500' :
                        action.type === 'keypress' ? 'bg-purple-500' :
                        action.type === 'navigation' ? 'bg-red-500' :
                        'bg-gray-500'
                      }`}>
                        {action.type}
                      </span>
                      <span className="text-foreground/70 font-mono">
                        {formatTimestamp(action.timestamp)}
                      </span>
                    </div>
                    {action.coordinates && (
                      <span className="text-foreground/50 text-xs">
                        ({action.coordinates.x}, {action.coordinates.y})
                      </span>
                    )}
                  </div>
                  
                  {action.url && (
                    <div className="text-foreground/70 text-xs mb-1">
                      URL: {action.url}
                    </div>
                  )}
                  
                  {action.element && (
                    <div className="text-foreground/70 text-xs mb-1">
                      Element: {action.element}
                    </div>
                  )}
                  
                  {action.data && Object.keys(action.data).length > 0 && (
                    <div className="text-foreground/70 text-xs">
                      <details>
                        <summary className="cursor-pointer hover:text-foreground">
                          Data
                        </summary>
                        <pre className="mt-1 text-foreground/60 overflow-x-auto">
                          {JSON.stringify(action.data, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecordingViewer; 