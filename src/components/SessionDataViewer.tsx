"use client";

import React, { useState } from 'react';
import { SessionData } from '../types/analytics';

interface SessionDataViewerProps {
  sessionData: SessionData | null;
  isVisible: boolean;
  onClose: () => void;
}

const SessionDataViewer: React.FC<SessionDataViewerProps> = ({
  sessionData,
  isVisible,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'actions' | 'recording' | 'stats'>('actions');
  const [filterType, setFilterType] = useState<string>('all');

  if (!isVisible || !sessionData) return null;

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
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

  const getActionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      click: 'bg-blue-500',
      scroll: 'bg-green-500',
      hover: 'bg-yellow-500',
      keypress: 'bg-purple-500',
      navigation: 'bg-red-500',
      url_change: 'bg-indigo-500',
      page_load: 'bg-pink-500',
      form_submit: 'bg-orange-500',
      mouse_move: 'bg-gray-500',
      focus: 'bg-teal-500',
      blur: 'bg-cyan-500',
      resize: 'bg-lime-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  const filteredActions = sessionData.userActions.filter(action => 
    filterType === 'all' || action.type === filterType
  );

  const actionTypes = [...new Set(sessionData.userActions.map(action => action.type))];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-gray-200 font-mono text-lg">Session Data Viewer</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('actions')}
            className={`px-4 py-2 text-sm font-mono transition-colors ${
              activeTab === 'actions' 
                ? 'text-gray-200 border-b-2 border-blue-500' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            User Actions ({sessionData.userActions.length})
          </button>
          {sessionData.screenRecording && (
            <button
              onClick={() => setActiveTab('recording')}
              className={`px-4 py-2 text-sm font-mono transition-colors ${
                activeTab === 'recording' 
                  ? 'text-gray-200 border-b-2 border-blue-500' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Screen Recording
            </button>
          )}
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 text-sm font-mono transition-colors ${
              activeTab === 'stats' 
                ? 'text-gray-200 border-b-2 border-blue-500' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Statistics
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'actions' && (
            <div>
              {/* Filter */}
              <div className="mb-4">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-gray-800 border border-gray-600 text-gray-200 text-sm rounded px-3 py-1"
                >
                  <option value="all">All Actions</option>
                  {actionTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Actions List */}
              <div className="space-y-2">
                {filteredActions.map((action) => (
                  <div
                    key={action.id}
                    className="bg-gray-800 border border-gray-700 rounded p-3 text-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs text-white ${getActionTypeColor(action.type)}`}>
                          {action.type}
                        </span>
                        <span className="text-gray-400 font-mono">
                          {formatTimestamp(action.timestamp)}
                        </span>
                      </div>
                      {action.coordinates && (
                        <span className="text-gray-500 text-xs">
                          ({action.coordinates.x}, {action.coordinates.y})
                        </span>
                      )}
                    </div>
                    
                    {action.url && (
                      <div className="text-gray-400 text-xs mb-1">
                        URL: {action.url}
                      </div>
                    )}
                    
                    {action.element && (
                      <div className="text-gray-400 text-xs mb-1">
                        Element: {action.element}
                      </div>
                    )}
                    
                    {action.data && Object.keys(action.data).length > 0 && (
                      <div className="text-gray-400 text-xs">
                        <details>
                          <summary className="cursor-pointer hover:text-gray-300">
                            Data
                          </summary>
                          <pre className="mt-1 text-gray-500 overflow-x-auto">
                            {JSON.stringify(action.data, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'recording' && sessionData.screenRecording && (
            <div>
              <div className="mb-4">
                <h3 className="text-gray-200 font-mono mb-2">Screen Recording</h3>
                <div className="bg-gray-800 border border-gray-700 rounded p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Status:</span>
                      <span className="ml-2 text-gray-200">{sessionData.screenRecording.status}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Duration:</span>
                      <span className="ml-2 text-gray-200">{formatDuration(sessionData.screenRecording.duration)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Resolution:</span>
                      <span className="ml-2 text-gray-200">
                        {sessionData.screenRecording.metadata.resolution.width} x {sessionData.screenRecording.metadata.resolution.height}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Format:</span>
                      <span className="ml-2 text-gray-200">{sessionData.screenRecording.metadata.format}</span>
                    </div>
                  </div>
                  
                  {sessionData.screenRecording.recordingUrl && (
                    <div className="mt-4">
                      <video
                        controls
                        className="w-full max-h-96 rounded border border-gray-600"
                        src={sessionData.screenRecording.recordingUrl}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div>
              <h3 className="text-gray-200 font-mono mb-4">Session Statistics</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-800 border border-gray-700 rounded p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">{sessionData.userActions.length}</div>
                  <div className="text-gray-400 text-sm">Total Actions</div>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">{formatDuration(sessionData.duration)}</div>
                  <div className="text-gray-400 text-sm">Session Duration</div>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-400">{actionTypes.length}</div>
                  <div className="text-gray-400 text-sm">Action Types</div>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {sessionData.screenRecording ? 'Yes' : 'No'}
                  </div>
                  <div className="text-gray-400 text-sm">Screen Recording</div>
                </div>
              </div>

              {/* Action Type Breakdown */}
              <div className="bg-gray-800 border border-gray-700 rounded p-4">
                <h4 className="text-gray-200 font-mono mb-3">Action Type Breakdown</h4>
                <div className="space-y-2">
                  {actionTypes.map(type => {
                    const count = sessionData.userActions.filter(action => action.type === type).length;
                    const percentage = ((count / sessionData.userActions.length) * 100).toFixed(1);
                    
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded ${getActionTypeColor(type)}`}></span>
                          <span className="text-gray-300 text-sm">{type}</span>
                        </div>
                        <div className="text-gray-400 text-sm">
                          {count} ({percentage}%)
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionDataViewer; 