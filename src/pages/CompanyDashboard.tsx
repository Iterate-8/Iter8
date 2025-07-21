"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../components/AuthProvider";
import { supabase } from "../lib/supabase";
import Logo from "../components/Logo";
import ProfileDropdown from "../components/ProfileDropdown";

interface FeedbackEntry {
  id: string;
  user_id: string;
  startup_name: string;
  feedback_type: string;
  feedback: string;
  created_at: string;
}

const CompanyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [feedbackEntries, setFeedbackEntries] = useState<FeedbackEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<FeedbackEntry | null>(null);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [maximizedBox, setMaximizedBox] = useState<'entry' | 'summary' | null>(null);
  const [hiddenEntries, setHiddenEntries] = useState<Set<string>>(new Set());

  // Fetch all feedback entries
  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const { data, error } = await supabase
          .from('feedback')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching feedback:', error);
        } else {
          setFeedbackEntries(data || []);
        }
      } catch (error) {
        console.error('Error fetching feedback:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchFeedback();
    }
  }, [user]);

  // Generate AI summary for selected entry
  const generateAISummary = async (feedback: string) => {
    setSummaryLoading(true);
    try {
      // Simple AI summary generation (you can replace this with actual AI API)
      const summary = await generateSummary(feedback);
      setAiSummary(summary);
    } catch (error) {
      console.error('Error generating summary:', error);
      setAiSummary("Unable to generate summary at this time.");
    } finally {
      setSummaryLoading(false);
    }
  };

  // Simple summary generation (replace with actual AI API)
  const generateSummary = async (feedback: string): Promise<string> => {
    // This is a placeholder - replace with actual AI API call
    const words = feedback.split(' ');
    const keyPoints = words.slice(0, 20).join(' ');
    return `Summary: ${keyPoints}${words.length > 20 ? '...' : ''}`;
  };

  const handleEntryClick = (entry: FeedbackEntry) => {
    setSelectedEntry(entry);
    generateAISummary(entry.feedback);
  };

  const handleHideEntry = (entryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHiddenEntries(prev => new Set([...prev, entryId]));
    if (selectedEntry?.id === entryId) {
      setSelectedEntry(null);
      setAiSummary("");
    }
  };

  const handleCompleteEntry = (entryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHiddenEntries(prev => new Set([...prev, entryId]));
    if (selectedEntry?.id === entryId) {
      setSelectedEntry(null);
      setAiSummary("");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFeedbackTypeColor = (type: string) => {
    switch (type) {
      case 'bug': return 'text-red-400';
      case 'feature': return 'text-gray-400';
      case 'ux': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <Logo />
          <div className="mt-4 text-gray-400 font-mono">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Left: Feedback Entries Menu */}
      <aside className="w-1/3 min-w-[320px] max-w-md flex flex-col border-r border-black/10 dark:border-white/10 bg-black h-screen">
        {/* Logo at top */}
        <div className="p-6 flex-shrink-0">
          <Logo />
        </div>
        
        {/* Feedback Entries List */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-4 flex-shrink-0">
            <h2 className="text-gray-300 font-mono text-lg">Tickets</h2>
          </div>
          
          {loading ? (
            <div className="text-gray-400 font-mono text-center py-8 flex-shrink-0">Loading feedback...</div>
          ) : feedbackEntries.length === 0 ? (
            <div className="text-gray-400 font-mono text-center py-8 flex-shrink-0">No feedback entries found</div>
          ) : (
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              <div className="space-y-2 p-4">
                {feedbackEntries
                  .filter(entry => !hiddenEntries.has(entry.id))
                  .map((entry) => (
                  <div
                    key={entry.id}
                    onClick={() => handleEntryClick(entry)}
                    className={`p-4 rounded border cursor-pointer transition-colors relative ${
                      selectedEntry?.id === entry.id
                        ? 'bg-gray-300 border-gray-500 text-black'
                        : 'bg-black border-gray-700 hover:bg-gray-200 hover:text-black'
                    }`}
                    style={{
                      boxShadow: selectedEntry?.id === entry.id 
                        ? 'none'
                        : '0 0 4px rgba(192, 192, 192, 0.4), 0 0 8px rgba(192, 192, 192, 0.2)',
                      filter: selectedEntry?.id === entry.id 
                        ? 'none'
                        : 'drop-shadow(0 0 1px rgba(192, 192, 192, 0.3))'
                    }}
                  >
                    {/* Action Buttons */}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button
                        onClick={(e) => handleCompleteEntry(entry.id, e)}
                        className="p-1 rounded bg-gray-600 hover:bg-gray-500 transition-colors border border-gray-500"
                        title="Mark as complete"
                      >
                        <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => handleHideEntry(entry.id, e)}
                        className="p-1 rounded bg-gray-700 hover:bg-gray-600 transition-colors border border-gray-600"
                        title="Remove entry"
                      >
                        <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-start mb-1 pr-12">
                      <div className="text-sm text-gray-300 font-mono font-medium">
                        {entry.startup_name}
                      </div>
                      <span className="text-xs text-gray-500 font-mono">
                        {formatDate(entry.created_at)}
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className={`text-xs font-mono px-2 py-1 rounded text-[10px] ${getFeedbackTypeColor(entry.feedback_type)}`}>
                        {entry.feedback_type.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 font-mono line-clamp-2">
                      {entry.feedback.substring(0, 100)}...
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Profile dropdown at bottom */}
        <div className="p-4 border-t border-gray-800 flex-shrink-0">
          <ProfileDropdown />
        </div>
      </aside>
      
      {/* Right: Entry Details and AI Summary */}
      <main className="flex-1 flex items-center justify-center relative bg-black text-white">
        {/* Profile dropdown at top right */}
        <div className="absolute top-6 right-6 z-10">
          <ProfileDropdown />
        </div>
        
        <div className={`flex gap-16 p-8 w-full max-w-6xl ${maximizedBox ? 'justify-center' : ''}`}>
          {/* Selected Entry Details */}
          <div className={`bg-black rounded-lg border border-gray-400 p-6 text-white relative ${maximizedBox === 'entry' ? 'w-full max-w-2xl aspect-square' : maximizedBox === 'summary' ? 'hidden' : 'w-1/2 aspect-square'}`} style={{
            boxShadow: '0 0 8px rgba(192, 192, 192, 0.8), 0 0 16px rgba(192, 192, 192, 0.4)',
            filter: 'drop-shadow(0 0 2px rgba(192, 192, 192, 0.6))'
          }}>
            {/* Maximize/Minimize Button */}
            <button
              onClick={() => setMaximizedBox(maximizedBox === 'entry' ? null : 'entry')}
              className="absolute top-4 right-4 p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors"
              title={maximizedBox === 'entry' ? 'Minimize' : 'Maximize'}
            >
              {maximizedBox === 'entry' ? (
                <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />
                </svg>
              ) : (
                <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
            
            <h2 className="text-gray-200 font-mono text-xl font-medium mb-6">Entry Details</h2>
            
            {selectedEntry ? (
              <div className="h-full flex flex-col">
                <div className="space-y-6 flex-1">
                                  <div className="space-y-2">
                  <div className="text-sm text-gray-200 font-mono font-medium">
                    <span className="text-xs text-gray-200 font-mono uppercase tracking-wider">General: </span>
                    <span className="text-xs text-gray-400 font-mono tracking-wide">
                      {formatDate(selectedEntry.created_at)}
                    </span>
                  </div>
                </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-gray-200 font-mono font-medium">
                      <span className="text-xs text-gray-200 font-mono uppercase tracking-wider">Startup: </span>
                      <span className="text-sm text-gray-400 font-mono font-medium">
                        {selectedEntry.startup_name}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 mt-auto">
                  <label className="text-xs text-gray-400 font-mono uppercase tracking-wider">Feedback</label>
                  <div className="text-xs text-foreground font-mono leading-relaxed p-4 bg-black rounded-lg border border-gray-400 h-32 overflow-y-auto shadow-sm">
                    {selectedEntry.feedback}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-400 font-mono text-center py-12 text-sm">
                Select a feedback entry to view details
              </div>
            )}
          </div>

          {/* AI Summary */}
          <div className={`bg-black rounded-lg border border-gray-400 p-6 text-white relative ${maximizedBox === 'summary' ? 'w-full max-w-2xl aspect-square' : maximizedBox === 'entry' ? 'hidden' : 'w-1/2 aspect-square'}`} style={{
            boxShadow: '0 0 8px rgba(192, 192, 192, 0.8), 0 0 16px rgba(192, 192, 192, 0.4)',
            filter: 'drop-shadow(0 0 2px rgba(192, 192, 192, 0.6))'
          }}>
            {/* Maximize/Minimize Button */}
            <button
              onClick={() => setMaximizedBox(maximizedBox === 'summary' ? null : 'summary')}
              className="absolute top-4 right-4 p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors"
              title={maximizedBox === 'summary' ? 'Minimize' : 'Maximize'}
            >
              {maximizedBox === 'summary' ? (
                <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />
                </svg>
              ) : (
                <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
            
            <h2 className="text-gray-200 font-mono text-xl font-medium mb-6">AI Summary</h2>
            
            {selectedEntry ? (
              <div className="h-full flex flex-col">
                <div className="flex-1"></div>
                              <div className="text-xs text-foreground font-mono leading-relaxed p-4 bg-black rounded-lg border border-gray-400 h-32 overflow-y-auto shadow-sm">
                {summaryLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-gray-400">Generating summary...</span>
                  </div>
                ) : (
                  aiSummary || "Click on an entry to generate AI summary"
                )}
              </div>
              </div>
            ) : (
              <div className="text-gray-400 font-mono text-center py-12 text-sm">
                Select a feedback entry to generate AI summary
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CompanyDashboard; 