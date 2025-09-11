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
  const [activeTab, setActiveTab] = useState<'tickets' | 'research'>("tickets");
  const [feedbackEntries, setFeedbackEntries] = useState<FeedbackEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<FeedbackEntry | null>(null);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [hiddenEntries, setHiddenEntries] = useState<Set<string>>(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  // Keyboard navigation focus index for tickets
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  // AI-first view state
  const [themes, setThemes] = useState<Array<{ key: string; title: string; count: number; urgency: 'High'|'Medium'|'Low'; entries: FeedbackEntry[]; priority: number; confidence: number; segments: string[] }>>([]);
  const [selectedThemeKey, setSelectedThemeKey] = useState<string | null>(null);
  const [approvalsSent, setApprovalsSent] = useState<number>(() => {
    const v = typeof window !== 'undefined' ? localStorage.getItem('iter8_approvals_sent') : null;
    return v ? Number(v) || 0 : 0;
  });
  const [justApproved, setJustApproved] = useState<boolean>(false);

  // Research state (Clado)
  interface CladoProfileBrief {
    id?: string;
    name?: string;
    location?: string;
    location_country?: string;
    headline?: string;
    description?: string;
    linkedin_url?: string;
    picture_permalink?: string;
    connections_count?: number;
    followers_count?: number;
    is_working?: boolean;
    is_decision_maker?: boolean;
    total_experience_duration_months?: number;
    projected_total_salary?: number;
    post_count?: number;
    skills?: string[];
  }
  interface CladoResultItem {
    profile?: CladoProfileBrief;
    experience?: Array<{ title?: string; company_name?: string; start_date?: string; end_date?: string; description?: string; location?: string; }>;
    education?: Array<{ degree?: string; field_of_study?: string; school_name?: string; start_date?: string; end_date?: string; }>;
  }
  const [researchQuery, setResearchQuery] = useState<string>("");
  const [researchLimit, setResearchLimit] = useState<number>(10);
  const [researchLoading, setResearchLoading] = useState<boolean>(false);
  const [researchError, setResearchError] = useState<string>("");
  const [researchResults, setResearchResults] = useState<CladoResultItem[]>([]);
  const [selectedResearchIndex, setSelectedResearchIndex] = useState<number | null>(null);

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

  // AI summary generation using Hugging Face BART model
  const generateSummary = async (feedback: string): Promise<string> => {
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: feedback }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          return "OpenAI rate limit reached. Please wait a few minutes and try again.";
        }
        return errorData.error || `API Error: ${response.status}`;
      }

      const data = await response.json();
      if (data.error) {
        return data.error;
      }
      return data.summary || "Unable to generate summary";
    } catch (error) {
      console.error('Error generating AI summary:', error);
      return "Unable to generate summary at this time.";
    }
  };

  const handleEntryClick = (entry: FeedbackEntry) => {
    setSelectedEntry(entry);
    generateAISummary(entry.feedback);
  };

  const handleHideEntry = async (entryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('feedback')
        .delete()
        .eq('id', entryId);

      if (error) {
        console.error('Error deleting feedback entry:', error);
        alert('Failed to delete entry. Please try again.');
        return;
      }

      // Remove from local state
      setFeedbackEntries(prev => prev.filter(entry => entry.id !== entryId));
      setHiddenEntries(prev => new Set([...prev, entryId]));
      
      // Clear selection if this was the selected entry
      if (selectedEntry?.id === entryId) {
        setSelectedEntry(null);
        setAiSummary("");
      }
    } catch (error) {
      console.error('Error deleting feedback entry:', error);
      alert('Failed to delete entry. Please try again.');
    }
  };

  const handleCompleteEntry = async (entry: FeedbackEntry, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      // Build an optimized, implementation-ready CLI prompt
      const themeForEntry = themes.find(t => t.entries.some(e => e.id === entry.id));
      // Ensure we have an AI summary for the specific ticket (compute if not current)
      let summaryForEntry = '';
      if (selectedEntry?.id === entry.id && aiSummary) {
        summaryForEntry = aiSummary;
      } else {
        try {
          summaryForEntry = await generateSummary(entry.feedback);
        } catch {
          summaryForEntry = '';
        }
      }

      // Sanitize AI summary: keep only statements clearly entailed by the ticket; drop speculative lines
      const sanitizeAiSummary = (ticket: string, summary: string): string => {
        if (!summary) return '';
        const ticketLower = ticket.toLowerCase();
        const forbidden = [/^\s*(consider|maybe|could|optionally)\b/i, /search\b/i, /filter\b/i, /sort\b/i];
        const lines = summary
          .split(/\r?\n/)
          .map(l => l.replace(/^[-•]\s*/, '').trim())
          .filter(Boolean)
          .filter(l => !forbidden.some(re => re.test(l)) || ticketLower.includes('search') || ticketLower.includes('filter') || ticketLower.includes('sort'))
          .filter((l, i, arr) => arr.indexOf(l) === i);
        // Keep at most 3 concise points
        return lines.slice(0, 3).map(l => `- ${l}`).join('\n');
      };
      const cleanSummary = sanitizeAiSummary(entry.feedback, summaryForEntry);

      const commitTitleSource = (entry.feedback || '').split(/\s+/).slice(0, 8).join(' ');
      // Detect stack dynamically so the prompt doesn't assume technologies
      let stackHints = '';
      try {
        const res = await fetch('/api/stack');
        const info = await res.json();
        const parts: string[] = [];
        if (info.hasNext) parts.push(`Next.js ${info.nextVersion ?? ''}`.trim());
        if (info.hasTypeScript) parts.push('TypeScript');
        if (info.hasTailwind) parts.push(`Tailwind ${info.tailwindVersion ?? ''}`.trim());
        if (info.hasSupabase) parts.push('Supabase');
        stackHints = parts.length ? parts.join(', ') : '';
      } catch {}
      const prompt = [
        `ROLE: Senior full‑stack engineer for a Next.js 15 (App Router) + TypeScript + Tailwind v4 app using Supabase.`,
        `OBJECTIVE: Implement the exact customer request below with focused, minimal edits.`,
        `\nTICKET:`,
        `"${entry.feedback}"`,
        themeForEntry ? `\nSIGNAL: ${themeForEntry.count} similar mentions; segments: ${themeForEntry.segments.join(', ') || 'general'}; confidence: ${themeForEntry.confidence}%` : '',
        cleanSummary ? `\nAI_SUMMARY (entailed only):\n${cleanSummary}` : '',
        stackHints ? `\nCONTEXT:\n- Stack (detected): ${stackHints}` : '',
        `- Design: Figtree font, light theme; keep AA contrast and keyboard nav.`,
        `\nREQUIREMENTS:`,
        `- Implement only what the ticket specifies; avoid unrelated changes.`,
        `- Use existing components/styles; prefer theme tokens and current patterns.`,
        `- Keep edits small and readable; ensure type-safety and pass lints.`,
        `- Do not fabricate data or features not in the ticket. If ticket asks to "make up" items, create empty placeholders or minimal stubs without invented content.`,
        `\nOUTPUT:`,
        `- Code edits that satisfy the ticket.`,
        `- Commit message: chore(ui): ${entry.startup_name || 'startup'} — ${commitTitleSource}…`,
        `- Brief PR description summarizing the change.`,
        `\nACCEPTANCE:`,
        `- The described behavior works as requested.`,
        `- No TypeScript or lint errors; build succeeds.`,
        `- Visual and a11y guidelines preserved.`
      ].filter(Boolean).join('\n');

      // Store ticket -> prompt mapping
      if (user?.id) {
        await supabase
          .from('cli_prompts')
          .upsert({ user_id: user.id, feedback_id: entry.id, prompt }, { onConflict: 'feedback_id' });
      }
    } catch (err) {
      console.error('Failed to store CLI prompt for ticket:', err);
    }

    // Hide from view (mark as completed) but keep in database
    setHiddenEntries(prev => new Set([...prev, entry.id]));

    // Clear selection if this was the selected entry
    if (selectedEntry?.id === entry.id) {
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
      case 'bug': return 'text-red-500';
      case 'feature': return 'text-brand-600';
      case 'ux': return 'text-brand-500';
      default: return 'text-foreground/70';
    }
  };

  // Invoke Clado search API via our proxy route
  const performResearchSearch = async () => {
    if (!researchQuery.trim()) {
      setResearchError("Enter a search query");
      return;
    }
    setResearchLoading(true);
    setResearchError("");
    setSelectedResearchIndex(null);
    try {
      const params = new URLSearchParams();
      params.set("query", researchQuery.trim());
      if (researchLimit) params.set("limit", String(researchLimit));
      const resp = await fetch(`/api/clado/search?${params.toString()}`, { method: "GET" });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        setResearchError(err?.error || `Search failed (${resp.status})`);
        setResearchResults([]);
        return;
      }
      const data = await resp.json();
      setResearchResults(Array.isArray(data?.results) ? data.results : []);
    } catch (e) {
      setResearchError("Unexpected error performing search");
      setResearchResults([]);
    } finally {
      setResearchLoading(false);
    }
  };

  // Simple, dynamic theming by frequent phrases
  function computeThemes(entries: FeedbackEntry[]): Array<{ key: string; title: string; count: number; urgency: 'High'|'Medium'|'Low'; entries: FeedbackEntry[]; priority: number; confidence: number; segments: string[] }> {
    const stop = new Set([
      'the','a','an','and','or','but','if','in','on','to','of','for','with','is','it','this','that','there','was','were','are','be','been','being',
      'add','please','section','page','bar','area','like','would','want','see','make','have','has','had','can','could','should','would','really','just','also','from','at','as','by','we','you','they','i','me','my','our','your','their'
    ]);

    const normalize = (text: string) => text
      .toLowerCase()
      .replace(/\b([a-z])'s\b/g, '$1') // possessives -> base
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const tokenize = (text: string) => normalize(text)
      .split(' ')
      .filter(t => t && !stop.has(t) && t.length >= 3 && !/^\d+$/.test(t));

    const ngrams = (tokens: string[], n: number) => {
      const list: string[] = [];
      for (let i = 0; i <= tokens.length - n; i++) {
        list.push(tokens.slice(i, i + n).join(' '));
      }
      return list;
    };

    // Build global bigram/trigram counts per entry presence
    const phraseCounts: Record<string, number> = {};
    const perEntryPhrases: Array<{ entry: FeedbackEntry; tokens: string[]; bigrams: Set<string>; trigrams: Set<string> }> = entries.map(entry => {
      const tokens = tokenize(`${entry.feedback} ${entry.startup_name || ''}`);
      const bgs = new Set(ngrams(tokens, 2));
      const tgs = new Set(ngrams(tokens, 3));
      // count unique presence per entry
      bgs.forEach(p => { phraseCounts[p] = (phraseCounts[p] || 0) + 1; });
      tgs.forEach(p => { phraseCounts[p] = (phraseCounts[p] || 0) + 1; });
      return { entry, tokens, bigrams: bgs, trigrams: tgs };
    });

    const frequentPhrases = Object.entries(phraseCounts)
      .filter(([, c]) => c >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([p]) => p);

    // Helper: Jaccard similarity
    const jaccard = (a: string, b: string) => {
      const A = new Set(a.split(' '));
      const B = new Set(b.split(' '));
      const inter = new Set([...A].filter(x => B.has(x))).size;
      const uni = new Set([...A, ...B]).size;
      return uni === 0 ? 0 : inter / uni;
    };

    // Canonicalize similar phrases (merge near-duplicates)
    const canonical: Record<string, string> = {};
    const ordered = frequentPhrases.slice(0);
    for (let i = 0; i < ordered.length; i++) {
      const a = ordered[i];
      if (canonical[a]) continue;
      canonical[a] = a;
      for (let j = i + 1; j < ordered.length; j++) {
        const b = ordered[j];
        if (canonical[b]) continue;
        if (jaccard(a, b) >= 0.8) {
          canonical[b] = a;
        }
      }
    }

    // Assign each entry to best phrase, falling back sanely
    const themeMap: Record<string, FeedbackEntry[]> = {};
    perEntryPhrases.forEach(({ entry, tokens, bigrams, trigrams }) => {
      // Prefer most frequent trigram/bigram present
      const candidates = ordered.filter(p => (p.split(' ').length === 3 ? trigrams.has(p) : bigrams.has(p)));
      let chosen = candidates[0];
      if (!chosen) {
        // fallback: choose most common long token that appears across entries
        const unigramCounts: Record<string, number> = {};
        entries.forEach(e => tokenize(e.feedback).forEach(t => { unigramCounts[t] = (unigramCounts[t] || 0) + 1; }));
        const bestToken = tokens
          .filter(t => (unigramCounts[t] || 0) >= 3)
          .sort((a, b) => (unigramCounts[b] || 0) - (unigramCounts[a] || 0))[0];
        chosen = bestToken ? bestToken : 'other';
      }
      const key = canonical[chosen] || chosen;
      if (!themeMap[key]) themeMap[key] = [];
      themeMap[key].push(entry);
    });

    const out = Object.entries(themeMap).map(([key, list]) => {
      const count = list.length;
      const urgency: 'High' | 'Medium' | 'Low' = count >= 15 ? 'High' : count >= 7 ? 'Medium' : 'Low';
      const title = key.split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
      const segments = list.map(e => (e.startup_name || 'General').toLowerCase()).reduce((acc: Record<string, number>, s) => {
        acc[s] = (acc[s] || 0) + 1; return acc;
      }, {});
      const topSegments = Object.entries(segments).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([s]) => s);
      const priority = Math.min(100, 40 + count * 4);
      const confidence = Math.min(99, 60 + Math.min(30, count * 3));
      return { key, title, count, urgency, entries: list, priority, confidence, segments: topSegments };
    }).sort((a, b) => b.count - a.count);
    return out;
  }

  // Recompute themes whenever entries change
  useEffect(() => {
    const visible = feedbackEntries.filter(e => !hiddenEntries.has(e.id));
    const t = computeThemes(visible);
    setThemes(t);
    if (!selectedThemeKey && t[0]) setSelectedThemeKey(t[0].key);
  }, [feedbackEntries, hiddenEntries]);

  // Approve & Ship action (simulated)
  const approveTheme = (key: string) => {
    setApprovalsSent(prev => {
      const next = prev + 1;
      if (typeof window !== 'undefined') localStorage.setItem('iter8_approvals_sent', String(next));
      return next;
    });
    setJustApproved(true);
    setTimeout(()=> setJustApproved(false), 2000);
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

  const visibleEntries = feedbackEntries.filter(entry => !hiddenEntries.has(entry.id));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (visibleEntries.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = focusedIndex < visibleEntries.length - 1 ? focusedIndex + 1 : 0;
      setFocusedIndex(next);
      setSelectedEntry(visibleEntries[next]);
      generateAISummary(visibleEntries[next].feedback);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = focusedIndex > 0 ? focusedIndex - 1 : visibleEntries.length - 1;
      setFocusedIndex(prev);
      setSelectedEntry(visibleEntries[prev]);
      generateAISummary(visibleEntries[prev].feedback);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-black focus:text-white focus:px-3 focus:py-2 focus:rounded">Skip to main content</a>
      {/* Left: Feedback Entries Menu */}
      <aside className={`${isSidebarOpen ? 'w-1/3 min-w-[320px] max-w-md' : 'w-0'} overflow-hidden transition-[width] duration-200 flex flex-col border-r border-brand-200 bg-background h-screen`} aria-expanded={isSidebarOpen}>
        {/* Logo at top */}
        {isSidebarOpen && (
          <div className="p-4 flex-shrink-0 flex items-center justify-between">
            <Logo />
            <button
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Collapse sidebar"
              className="p-2 rounded border border-brand-300 hover:bg-brand-50"
            >
              ⟨
            </button>
          </div>
        )}
        
        {/* Tabs + Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Tabs */}
          <div className="px-4 pt-2 flex-shrink-0">
            <div className={`inline-flex rounded-md border border-brand-200 overflow-hidden ${isSidebarOpen ? '' : 'hidden'}` }>
              <button
                className={`px-3 py-2 text-xs font-sans ${activeTab === 'tickets' ? 'bg-brand-100 text-foreground' : 'bg-background text-foreground/70 hover:bg-brand-50'}`}
                onClick={() => setActiveTab('tickets')}
              >
                Tickets
              </button>
              <button
                className={`px-3 py-2 text-xs font-sans border-l border-brand-200 ${activeTab === 'research' ? 'bg-brand-100 text-foreground' : 'bg-background text-foreground/70 hover:bg-brand-50'}`}
                onClick={() => setActiveTab('research')}
              >
                Research
              </button>
            </div>
          </div>

          {activeTab === 'tickets' ? (
            <>
              <div className={`p-4 flex-shrink-0 ${isSidebarOpen ? '' : 'hidden'}` }>
                <h2 className="text-foreground font-sans text-lg">Tickets</h2>
              </div>
              {isSidebarOpen && (
                <>
                  {loading ? (
                    <div className="text-foreground/70 font-sans text-center py-8 flex-shrink-0">Loading feedback...</div>
                  ) : feedbackEntries.length === 0 ? (
                    <div className="text-foreground/70 font-sans text-center py-8 flex-shrink-0">No feedback entries found</div>
                  ) : (
                    <div className="flex-1 overflow-y-auto" tabIndex={0} onKeyDown={handleKeyDown} aria-label="Tickets list">
                      <div className="space-y-2 p-4">
                        {visibleEntries
                          .map((entry) => (
                          <div
                            key={entry.id}
                            onClick={() => handleEntryClick(entry)}
                            className={`p-4 rounded border cursor-pointer transition-colors relative ${
                              selectedEntry?.id === entry.id
                                ? 'bg-brand-100 border-brand-300 text-foreground'
                                : 'bg-background border-brand-200 hover:bg-brand-50'
                            }`}
                            role="button"
                            aria-pressed={selectedEntry?.id === entry.id}
                            style={{}}
                          >
                            {/* Action Buttons */}
                            <div className="absolute top-2 right-2 flex gap-1">
                              <button
                                onClick={(e) => handleCompleteEntry(entry, e)}
                                className="p-1 rounded bg-foreground/10 hover:bg-foreground/20 transition-colors border border-brand-300"
                                title="Mark as complete"
                              >
                                <svg className="w-3 h-3 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => handleHideEntry(entry.id, e)}
                                className="p-1 rounded bg-foreground/10 hover:bg-foreground/20 transition-colors border border-brand-300"
                                title="Remove entry"
                              >
                                <svg className="w-3 h-3 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                                </svg>
                              </button>
                            </div>
                            
                            <div className="flex justify-between items-start mb-1 pr-12">
                              <div className="text-sm text-foreground font-mono font-medium">
                                {entry.startup_name}
                              </div>
                              <span className="text-xs text-foreground/60 font-mono">
                                {formatDate(entry.created_at)}
                              </span>
                            </div>
                            <div className="mb-2">
                              <span className={`text-xs font-mono px-2 py-1 rounded text-[10px] ${getFeedbackTypeColor(entry.feedback_type)}`}>
                                {entry.feedback_type.toUpperCase()}
                              </span>
                            </div>
                            <div className="text-xs text-foreground/70 font-mono line-clamp-2">
                              {entry.feedback.substring(0, 100)}...
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <div className={`p-4 flex-shrink-0 ${isSidebarOpen ? '' : 'hidden'}` }>
                <h2 className="text-foreground font-sans text-lg">Research</h2>
              </div>
              <div className={`p-4 pt-0 flex-shrink-0 ${isSidebarOpen ? '' : 'hidden'}` }>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={researchQuery}
                    onChange={(e) => setResearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') performResearchSearch(); }}
                    placeholder="e.g. founders in fintech"
                    className="w-full px-3 py-2 bg-background border border-brand-300 rounded text-sm text-foreground font-sans placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-foreground/70 font-sans">Limit</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={researchLimit}
                      onChange={(e) => setResearchLimit(Math.max(1, Math.min(100, Number(e.target.value) || 10)))}
                      className="w-20 px-2 py-1 bg-background border border-brand-300 rounded text-xs text-foreground font-sans focus:outline-none focus:ring-2 focus:ring-brand-400"
                    />
                    <button
                      onClick={performResearchSearch}
                      className="ml-auto px-3 py-1.5 text-xs rounded bg-brand-600 text-white font-sans border border-brand-500 hover:opacity-90"
                      disabled={researchLoading}
                    >
                      {researchLoading ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                  {researchError ? (
                    <div className="text-xs text-red-500 font-sans">{researchError}</div>
                  ) : null}
                </div>
              </div>
              {/* Simple selected preview on the left (optional) */}
              <div className={`flex-1 overflow-y-auto ${isSidebarOpen ? '' : 'hidden'}` }>
                {researchResults.length === 0 && !researchLoading ? (
                  <div className="text-foreground/70 font-sans text-center py-8 flex-shrink-0">No results yet</div>
                ) : (
                  <div className="space-y-2 p-4">
                    {researchResults.map((item, idx) => {
                      const p = item.profile || {};
                      return (
                        <div
                          key={`${p.id || idx}`}
                          onClick={() => setSelectedResearchIndex(idx)}
                          className={`p-4 rounded border cursor-pointer transition ${selectedResearchIndex === idx ? 'bg-brand-100 border-brand-300 text-foreground shadow-sm' : 'bg-background border-brand-200 hover:bg-brand-50 hover:shadow-sm'}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-600/10 text-brand-600 flex items-center justify-center text-xs font-semibold">
                              {(p.name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div className="text-sm font-sans font-medium">{p.name || 'Unknown'}</div>
                                {p.location ? (
                                  <span className="text-xs text-foreground/60 font-sans">{p.location}</span>
                                ) : null}
                              </div>
                              {p.headline ? (
                                <div className="text-xs text-foreground/70 font-sans line-clamp-2 mt-0.5">{p.headline}</div>
                              ) : null}
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {item.experience && item.experience[0]?.company_name ? (
                                  <span className="text-[10px] font-sans text-foreground/70 border border-brand-300 px-2 py-0.5 rounded">{item.experience[0]?.company_name}</span>
                                ) : null}
                                {typeof p.followers_count === 'number' ? (
                                  <span className="text-[10px] font-sans text-foreground/70 border border-brand-300 px-2 py-0.5 rounded">{p.followers_count} followers</span>
                                ) : null}
                                {typeof p.connections_count === 'number' ? (
                                  <span className="text-[10px] font-sans text-foreground/70 border border-brand-300 px-2 py-0.5 rounded">{p.connections_count} connections</span>
                                ) : null}
                                {p.linkedin_url ? (
                                  <a href={p.linkedin_url} target="_blank" rel="noreferrer" className="text-[10px] font-sans text-brand-600 border border-brand-300 px-2 py-0.5 rounded hover:underline">LinkedIn</a>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        
        {/* Profile dropdown at bottom */}
        <div className="p-4 border-t border-brand-200 flex-shrink-0">
          <ProfileDropdown />
        </div>
      </aside>
      
      {/* Right: Content Area */}
      <main id="main" className="flex-1 relative bg-background text-foreground">
        {/* Profile dropdown at top right */}
        {!isSidebarOpen && (
          <div className="absolute top-6 left-6 z-10">
            <button
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Expand sidebar"
              className="p-2 rounded border border-brand-300 bg-background hover:bg-brand-50"
            >
              ⟩
            </button>
          </div>
        )}
        <div className="absolute top-6 right-6 z-10">
          <ProfileDropdown />
        </div>

        {/* AI-first layout */}
        <div className="w-full h-full p-6 space-y-6">
          {/* Proof-of-impact metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-brand-50 border border-brand-200 rounded p-3 text-center">
              <div className="text-xs text-foreground/70">Tickets processed → Insights distilled</div>
              <div className="text-xl font-semibold">{feedbackEntries.length} → {Math.min(themes.length, 3)}</div>
            </div>
            <div className="bg-brand-50 border border-brand-200 rounded p-3 text-center">
              <div className="text-xs text-foreground/70">Estimated time saved</div>
              <div className="text-xl font-semibold">{Math.max(0, Math.round((feedbackEntries.length/20)*14))} days</div>
            </div>
            <div className="bg-brand-50 border border-brand-200 rounded p-3 text-center">
              <div className="text-xs text-foreground/70">Customer reach (mentions)</div>
              <div className="text-xl font-semibold">{themes.slice(0,3).reduce((s,t)=>s+t.count,0)}</div>
            </div>
            <div className="bg-brand-50 border border-brand-200 rounded p-3 text-center">
              <div className="text-xs text-foreground/70">Approvals sent</div>
              <div className="text-xl font-semibold">{approvalsSent}</div>
            </div>
          </div>

          {/* Insights */}
          <section>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-1 text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400">AI Prioritized Insights</h2>
            <p className="text-sm text-foreground/60 mb-3">What to build next — ranked by customer signal and confidence</p>
            {themes.length === 0 ? (
              <div className="text-foreground/70 text-sm">Generating insights…</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {themes.slice(0,3).map(t => (
                  <button key={t.key} onClick={()=> setSelectedThemeKey(t.key)}
                    className={`text-left p-5 rounded-xl border transition relative ${selectedThemeKey===t.key?'border-brand-300 bg-brand-100 shadow-sm':'border-brand-200 bg-background hover:bg-brand-50 hover:shadow-sm'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-base md:text-lg font-semibold leading-tight truncate">{t.title}</div>
                        <div className="text-xs text-foreground/70 mt-1">{t.count} mentions • confidence {t.confidence}%</div>
                      </div>
                      <div className="shrink-0">
                        <div className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded-full ${t.priority>80?'bg-red-50 text-red-600':t.priority>65?'bg-yellow-50 text-yellow-700':'bg-foreground/5 text-foreground/70'}`}>Priority {t.priority}</div>
                      </div>
                    </div>
                    {t.segments.length>0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {t.segments.map(s => (
                          <span key={s} className="text-[10px] px-2 py-0.5 rounded-full border border-brand-300 text-foreground/70">{s}</span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-foreground/60 mt-2 leading-relaxed">Priority driven by {t.count} mentions across {t.segments.length || 1} segment{t.segments.length===1?'':'s'}; confidence {t.confidence}%.</p>
                    {t.priority>80 && <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-ping" />}
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Evidence and Approve */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <h3 className="text-sm font-semibold mb-2">Supporting Evidence</h3>
              <div className="space-y-2">
                {(() => {
                  const sel = themes.find(t=>t.key===selectedThemeKey);
                  if (!sel) return null;
                  // Cluster into up to 3 representative quotes
                  const quotes = sel.entries.slice(0,3).map(e => ({
                    id: e.id,
                    text: e.feedback.length>160? e.feedback.slice(0,157)+'…' : e.feedback,
                    meta: `${formatDate(e.created_at)} • ${e.startup_name}`
                  }));
                  return (
                    <>
                      <div className="text-xs text-foreground/70 mb-1">{sel.count} mentions • representative quotes</div>
                      {quotes.map(q => (
                        <div key={q.id} className="p-3 rounded border border-brand-200 bg-brand-50">
                          <div className="text-xs text-foreground/60">{q.meta}</div>
                          <blockquote className="text-sm mt-1 italic border-l-2 border-brand-300 pl-3">“{q.text}”</blockquote>
                        </div>
                      ))}
                    </>
                  );
                })()}
                {themes.length>0 && !themes.find(t=>t.key===selectedThemeKey) && (
                  <div className="text-foreground/70 text-sm">Select an insight to view evidence.</div>
                )}
              </div>

              {/* AI Summary for the currently selected ticket */}
              <div className="mt-4">
                <h3 className="text-sm font-semibold mb-2">AI Summary</h3>
                <div className="text-sm leading-relaxed p-4 rounded border border-brand-300 bg-brand-50">
                  {summaryLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 border-2 border-brand-300 border-t-transparent rounded-full animate-spin" />
                      <span className="text-foreground/70">Generating summary…</span>
                    </div>
                  ) : selectedEntry ? (
                    aiSummary ? (
                      <div className="whitespace-pre-wrap">{aiSummary}</div>
                    ) : (
                      <div className="text-foreground/70">Click a ticket on the left to generate a summary.</div>
                    )
                  ) : (
                    <div className="text-foreground/70">Select a ticket to generate AI summary.</div>
                  )}
                </div>
              </div>
            </div>
            <div className="lg:col-span-1">
              <h3 className="text-sm font-semibold mb-2">Approve & Ship</h3>
              <button
                disabled={!selectedThemeKey}
                onClick={()=> approveTheme(selectedThemeKey!)}
                className="w-full p-3 rounded bg-brand-600 text-white disabled:opacity-50"
              >
                Approve top insight
              </button>
              {justApproved && (
                <div className="mt-3 p-3 rounded border border-brand-300 bg-brand-100 text-sm animate-pulse">
                  ✅ Sent to CLI • {themes.find(t=>t.key===selectedThemeKey)?.count || 0} customers impacted • time saved +{Math.max(1, Math.round((feedbackEntries.length/40)*10))} days
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default CompanyDashboard; 