"use client";

import React, { useState, useEffect } from 'react';
import { AnalyticsService } from '../lib/analyticsService';
import RecordingNotification from './RecordingNotification';
import RecordingViewer from './RecordingViewer';
import RecordingHistory from './RecordingHistory';

import { SessionData } from '../types/analytics';

interface RecordingControlsProps {
  analyticsService: AnalyticsService;
  onSessionData?: (sessionData: SessionData) => void;
  onAnalyticsUpdate?: (analytics: AnalyticsData) => void;
  isNavbar?: boolean;
  onShowRecording?: () => void;
}

const RecordingControls: React.FC<RecordingControlsProps> = ({
  analyticsService,
  onSessionData,
  onAnalyticsUpdate,
  isNavbar = false,
  onShowRecording
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState('idle');
  const [sessionStats, setSessionStats] = useState<Record<string, unknown> | null>(null);

  const [showNotification, setShowNotification] = useState(false);
  const [showRecordingViewer, setShowRecordingViewer] = useState(false);
  const [showRecordingHistory, setShowRecordingHistory] = useState(false);
  const [currentSessionData, setCurrentSessionData] = useState<SessionData | null>(null);

  // Update status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (isRecording) {
        setRecordingStatus(analyticsService.getRecordingStatus());
        setSessionStats(analyticsService.getSessionStats());
        
        // Update analytics callback
        if (onAnalyticsUpdate) {
          onAnalyticsUpdate(analyticsService.getCurrentAnalytics());
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording, analyticsService, onAnalyticsUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Force cleanup when component unmounts
      analyticsService.forceCleanup();
    };
  }, [analyticsService]);

  const handleStartRecording = async () => {
    try {
      await analyticsService.startTracking();
      setIsRecording(true);
      setIsPaused(false);
      setRecordingStatus('recording');
      setShowNotification(true);
      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to start recording. Please check permissions.');
    }
  };

  const handleStopRecording = async () => {
    try {
      const sessionData = await analyticsService.stopTracking();
      setIsRecording(false);
      setIsPaused(false);
      setRecordingStatus('stopped');
      
      // Store session data for viewer
      setCurrentSessionData(sessionData);
      
      // Save to history
      saveToHistory(sessionData);
      
      // Callback with session data
      if (onSessionData) {
        onSessionData(sessionData);
      }
      
      console.log('Recording stopped');
    } catch (error) {
      console.error('Failed to stop recording:', error);
      // Force cleanup on error
      analyticsService.forceCleanup();
    }
  };

  const saveToHistory = (sessionData: SessionData) => {
    try {
      const existingRecordings = localStorage.getItem('iter8_recordings');
      const recordings = existingRecordings ? JSON.parse(existingRecordings) : [];
      recordings.push(sessionData);
      localStorage.setItem('iter8_recordings', JSON.stringify(recordings));
    } catch (error) {
      console.error('Failed to save recording to history:', error);
    }
  };

  const handlePauseRecording = () => {
    analyticsService.pauseTracking();
    setIsPaused(true);
    setRecordingStatus('paused');
  };

  const handleResumeRecording = () => {
    analyticsService.resumeTracking();
    setIsPaused(false);
    setRecordingStatus('recording');
  };

  const handleExportData = () => {
    const sessionData = analyticsService.exportSessionData();
    const blob = new Blob([sessionData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
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

  return (
    <>
      <RecordingNotification
        isVisible={showNotification}
        onClose={() => setShowNotification(false)}
      />
      <RecordingViewer
        sessionData={currentSessionData}
        isVisible={showRecordingViewer}
        onClose={() => setShowRecordingViewer(false)}
      />
      <RecordingHistory
        isVisible={showRecordingHistory}
        onClose={() => setShowRecordingHistory(false)}
        onViewRecording={(sessionData) => {
          setCurrentSessionData(sessionData);
          setShowRecordingHistory(false);
          setShowRecordingViewer(true);
        }}
      />
      {isNavbar ? (
        // Navbar Mode - Compact Design
        <div className="flex items-center gap-2">
          {/* Recording Status Indicator */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              recordingStatus === 'recording' ? 'bg-green-500 animate-pulse' :
              recordingStatus === 'paused' ? 'bg-yellow-500' :
              recordingStatus === 'stopped' ? 'bg-red-500' :
              'bg-gray-500'
            }`} />
            <span className="text-gray-300 font-mono text-xs">
              {recordingStatus === 'recording' ? 'REC' :
               recordingStatus === 'paused' ? 'PAU' :
               recordingStatus === 'stopped' ? 'STOP' :
               'IDLE'}
            </span>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-1">
            {!isRecording ? (
              <button
                onClick={handleStartRecording}
                className="px-3 py-1.5 bg-red-600/80 text-white text-xs rounded-lg border border-red-500/50 hover:bg-red-600 transition-all duration-200 hover:scale-105"
                title="Start Recording"
              >
                ●
              </button>
            ) : (
              <>
                {!isPaused ? (
                  <button
                    onClick={handlePauseRecording}
                    className="px-3 py-1.5 bg-yellow-600/80 text-white text-xs rounded-lg border border-yellow-500/50 hover:bg-yellow-600 transition-all duration-200 hover:scale-105"
                    title="Pause Recording"
                  >
                    ⏸
                  </button>
                ) : (
                  <button
                    onClick={handleResumeRecording}
                    className="px-3 py-1.5 bg-green-600/80 text-white text-xs rounded-lg border border-green-500/50 hover:bg-green-600 transition-all duration-200 hover:scale-105"
                    title="Resume Recording"
                  >
                    ▶
                  </button>
                )}
                <button
                  onClick={handleStopRecording}
                  className="px-3 py-1.5 bg-gray-600/80 text-white text-xs rounded-lg border border-gray-500/50 hover:bg-gray-600 transition-all duration-200 hover:scale-105"
                  title="Stop Recording"
                >
                  ■
                </button>
              </>
            )}
          </div>

          {/* Quick Stats */}
          {sessionStats && (
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span>{formatDuration(sessionStats.sessionDuration)}</span>
              <span>{sessionStats.totalActions}</span>
              {sessionStats.hasScreenRecording && (
                <span className="text-green-400">●</span>
              )}
            </div>
          )}

                    {/* Recording Access Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleExportData}
              className="px-2 py-1.5 bg-blue-600/80 text-white text-xs rounded-lg border border-blue-500/50 hover:bg-blue-600 transition-all duration-200 hover:scale-105"
              title="Download Session Data"
            >
              💾
            </button>
            <button
              onClick={() => {
                if (currentSessionData && onShowRecording) {
                  onShowRecording();
                } else if (currentSessionData) {
                  setShowRecordingViewer(true);
                } else {
                  console.log('No session data available');
                }
              }}
              className="px-2 py-1.5 bg-green-600/80 text-white text-xs rounded-lg border border-green-500/50 hover:bg-green-600 transition-all duration-200 hover:scale-105"
              title="View Session Recording"
              disabled={!currentSessionData}
            >
              📹
            </button>
            <button
              onClick={() => setShowRecordingHistory(true)}
              className="px-2 py-1.5 bg-purple-600/80 text-white text-xs rounded-lg border border-purple-500/50 hover:bg-purple-600 transition-all duration-200 hover:scale-105"
              title="View Recording History"
            >
              📚
            </button>
          </div>
        </div>
      ) : (
        // Floating Mode - Original Design
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-lg">
            {/* Recording Status */}
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-3 h-3 rounded-full ${
                recordingStatus === 'recording' ? 'bg-green-500 animate-pulse' :
                recordingStatus === 'paused' ? 'bg-yellow-500' :
                recordingStatus === 'stopped' ? 'bg-red-500' :
                'bg-gray-500'
              }`} />
              <span className="text-gray-300 font-mono text-sm">
                {recordingStatus === 'recording' ? 'Recording' :
                 recordingStatus === 'paused' ? 'Paused' :
                 recordingStatus === 'stopped' ? 'Stopped' :
                 'Idle'}
              </span>
            </div>

            {/* Session Stats */}
            {sessionStats && (
              <div className="mb-3 text-xs text-gray-400">
                <div>Duration: {formatDuration(sessionStats.sessionDuration)}</div>
                <div>Actions: {sessionStats.totalActions}</div>
                {sessionStats.hasScreenRecording && (
                  <div className="text-green-400">Screen Recording Active</div>
                )}
              </div>
            )}

            {/* Control Buttons */}
            <div className="flex gap-2">
              {!isRecording ? (
                <button
                  onClick={handleStartRecording}
                  className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                  title="Start Recording"
                >
                  ● Record
                </button>
              ) : (
                <>
                  {!isPaused ? (
                    <button
                      onClick={handlePauseRecording}
                      className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors"
                      title="Pause Recording"
                    >
                      ⏸ Pause
                    </button>
                  ) : (
                    <button
                      onClick={handleResumeRecording}
                      className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                      title="Resume Recording"
                    >
                      ▶ Resume
                    </button>
                  )}
                  <button
                    onClick={handleStopRecording}
                    className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                    title="Stop Recording"
                  >
                    ■ Stop
                  </button>
                </>
              )}
            </div>

            {/* Recording Access Controls */}
            <div className="mt-2 flex gap-2">
              <button
                onClick={handleExportData}
                className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                title="Download Session Data"
              >
                💾 Download
              </button>
              <button
                onClick={() => setShowRecordingViewer(true)}
                className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                title="View Session Recording"
                disabled={!currentSessionData}
              >
                📹 View
              </button>
              <button
                onClick={() => setShowRecordingHistory(true)}
                className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors"
                title="View Recording History"
              >
                📚 History
              </button>
            </div>

            {/* Detailed Stats Panel */}
            {showStats && sessionStats && (
              <div className="mt-3 p-3 bg-gray-800 rounded border border-gray-600 text-xs">
                <h4 className="text-gray-300 font-semibold mb-2">Session Statistics</h4>
                <div className="space-y-1 text-gray-400">
                  <div>Total Actions: {sessionStats.totalActions}</div>
                  <div>Session Duration: {formatDuration(sessionStats.sessionDuration)}</div>
                  <div>Screen Recording: {sessionStats.hasScreenRecording ? 'Yes' : 'No'}</div>
                  <div>Recording Status: {sessionStats.recordingStatus}</div>
                  
                  {sessionStats.actionTypes && Object.keys(sessionStats.actionTypes).length > 0 && (
                    <div className="mt-2">
                      <div className="text-gray-300 font-semibold">Action Types:</div>
                      {Object.entries(sessionStats.actionTypes).map(([type, count]) => (
                        <div key={type} className="text-gray-400">
                          {type}: {count}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default RecordingControls; 