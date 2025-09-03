"use client";

import React, { useState, useEffect } from 'react';
import { SessionData } from '../types/analytics';

interface RecordingHistoryProps {
  isVisible: boolean;
  onClose: () => void;
  onViewRecording: (sessionData: SessionData) => void;
}

const RecordingHistory: React.FC<RecordingHistoryProps> = ({
  isVisible,
  onClose,
  onViewRecording
}) => {
  const [recordings, setRecordings] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isVisible) {
      loadRecordings();
    }
  }, [isVisible]);

  const loadRecordings = async () => {
    setLoading(true);
    try {
      // Load recordings from localStorage
      const storedRecordings = localStorage.getItem('iter8_recordings');
      if (storedRecordings) {
        const parsedRecordings = JSON.parse(storedRecordings);
        setRecordings(parsedRecordings);
      }
    } catch (error) {
      console.error('Failed to load recordings:', error);
    }
    setLoading(false);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const deleteRecording = (sessionId: string) => {
    const updatedRecordings = recordings.filter(r => r.sessionId !== sessionId);
    setRecordings(updatedRecordings);
    localStorage.setItem('iter8_recordings', JSON.stringify(updatedRecordings));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-brand-200 rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-brand-200">
          <h2 className="text-foreground font-sans text-lg">Recording History</h2>
          <button
            onClick={onClose}
            className="text-foreground/60 hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-foreground/70 font-sans">Loading recordings...</div>
            </div>
          ) : recordings.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-foreground/70">
                <div className="text-4xl mb-4">📚</div>
                <div className="text-lg mb-2">No recordings found</div>
                <div className="text-sm">Start recording to see your history here</div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {recordings.map((recording) => (
                <div
                  key={recording.sessionId}
                  className="bg-brand-50 border border-brand-200 rounded-lg p-4 hover:bg-brand-100 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <div className="text-foreground font-mono text-sm">
                          Session {recording.sessionId.slice(-8)}
                        </div>
                        <div className="text-foreground/70 text-xs">
                          {formatDate(recording.startTime)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-foreground/70 text-xs">
                        {formatDuration(recording.duration)}
                      </span>
                      <span className="text-foreground/70 text-xs">
                        {recording.userActions.length} actions
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-foreground/70 mb-3">
                    <div>Duration: {formatDuration(recording.duration)}</div>
                    <div>Actions: {recording.userActions.length}</div>
                    <div>Screen Recording: {recording.screenRecording ? 'Yes' : 'No'}</div>
                    <div>Status: {recording.screenRecording?.status || 'N/A'}</div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewRecording(recording)}
                      className="px-3 py-1.5 bg-brand-600 text-white text-xs rounded border border-brand-500/50 hover:opacity-90 transition-all duration-200"
                    >
                      📹 View
                    </button>
                    <button
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(recording, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `recording-${recording.sessionId.slice(-8)}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="px-3 py-1.5 bg-foreground/10 text-foreground text-xs rounded border border-brand-300 hover:bg-foreground/20 transition-all duration-200"
                    >
                      💾 Download
                    </button>
                    <button
                      onClick={() => deleteRecording(recording.sessionId)}
                      className="px-3 py-1.5 bg-red-600/80 text-white text-xs rounded border border-red-500/50 hover:bg-red-600 transition-all duration-200"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecordingHistory; 