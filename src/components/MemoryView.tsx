"use client";

import { useState, useEffect } from "react";

interface MemoryEntry {
  id: string;
  date: string;
  title: string;
  summary: string;
  category: string;
  color: string;
}

const categories = [
  { id: "all", label: "All" },
  { id: "work", label: "Work" },
  { id: "system", label: "System" },
  { id: "project", label: "Projects" },
  { id: "setup", label: "Setup" },
];

export default function MemoryView() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedEntry, setSelectedEntry] = useState<MemoryEntry | null>(null);
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/memories")
      .then((res) => res.json())
      .then((data) => {
        if (data.memories && data.memories.length > 0) {
          setMemories(data.memories);
          // Default: expand only today and yesterday
          const dates = Object.keys(data.memories.reduce((acc: Record<string, boolean>, m: MemoryEntry) => {
            acc[m.date] = true;
            return acc;
          }, {}));
          const initial: Record<string, boolean> = {};
          dates.slice(0, 2).forEach(d => initial[d] = true);
          setExpandedDates(initial);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredMemories = selectedCategory === "all" 
    ? memories 
    : memories.filter(m => m.category === selectedCategory);

  const groupedByDate = filteredMemories.reduce((acc, memory) => {
    if (!acc[memory.date]) {
      acc[memory.date] = [];
    }
    acc[memory.date].push(memory);
    return acc;
  }, {} as Record<string, MemoryEntry[]>);

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  const toggleDate = (date: string) => {
    setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  // Stats
  const totalEntries = memories.length;
  const workEntries = memories.filter(m => m.category === "work").length;
  const systemEntries = memories.filter(m => m.category === "system").length;
  const projectEntries = memories.filter(m => m.category === "project").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          Memory
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Daily log of what was discussed and worked on — click dates to expand
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="metric-card">
          <div className="metric-value text-[var(--text-primary)]">{totalEntries}</div>
          <div className="metric-label">Total Entries</div>
        </div>
        <div className="metric-card">
          <div className="metric-value text-purple-500">{workEntries}</div>
          <div className="metric-label">Work</div>
        </div>
        <div className="metric-card">
          <div className="metric-value text-green-500">{systemEntries}</div>
          <div className="metric-label">System</div>
        </div>
        <div className="metric-card">
          <div className="metric-value text-pink-500">{projectEntries}</div>
          <div className="metric-label">Projects</div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === cat.id
                ? "bg-[var(--accent-purple)] text-white"
                : "bg-white/5 text-[var(--text-secondary)] hover:bg-white/10"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Loading or Empty State */}
      {loading ? (
        <div className="card p-8 text-center">
          <p className="text-[var(--text-muted)]">Loading memories...</p>
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-[var(--text-muted)]">No memories found. Start working and they&apos;ll appear here!</p>
        </div>
      ) : (
        /* Timeline with Collapsible Dates */
        <div className="space-y-2">
          {sortedDates.map((date) => {
            const isExpanded = expandedDates[date];
            const entryCount = groupedByDate[date].length;
            
            return (
              <div key={date} className="border border-white/10 rounded-lg overflow-hidden">
                {/* Collapsible Date Header */}
                <button
                  onClick={() => toggleDate(date)}
                  className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isExpanded ? 'bg-[var(--accent-purple)]' : 'bg-[var(--accent-purple)]/50'}`} />
                    <span className="text-lg font-bold text-[var(--text-primary)]">
                      {new Date(date).toLocaleDateString("en-US", { 
                        weekday: "long", 
                        month: "long", 
                        day: "numeric",
                        year: "numeric"
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[var(--text-muted)]">
                      {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
                    </span>
                    <span className={`text-[var(--text-muted)] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </div>
                </button>

                {/* Collapsible Content */}
                {isExpanded && (
                  <div className="border-t border-white/10">
                    <div className="p-4 space-y-2">
                      {groupedByDate[date].map((entry) => (
                        <button
                          key={entry.id}
                          onClick={() => setSelectedEntry(entry)}
                          className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${entry.color}`} />
                            <span className="text-xs text-[var(--text-muted)] uppercase">
                              {entry.category}
                            </span>
                          </div>
                          <h4 className="text-sm font-medium text-[var(--text-primary)] mb-1">
                            {entry.title}
                          </h4>
                          <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                            {entry.summary}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Memory Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedEntry(null)}>
          <div className="bg-[var(--bg-card)] rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${selectedEntry.color}`} />
                <span className="text-xs text-[var(--text-muted)] uppercase">{selectedEntry.category}</span>
              </div>
              <button 
                onClick={() => setSelectedEntry(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>
            
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
              {selectedEntry.title}
            </h3>
            
            <div className="text-sm text-[var(--text-muted)] mb-4">
              {new Date(selectedEntry.date).toLocaleDateString("en-US", { 
                weekday: "long", 
                month: "long", 
                day: "numeric",
                year: "numeric"
              })}
            </div>

            <div className="p-4 rounded-lg bg-white/5">
              <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">
                {selectedEntry.summary}
              </p>
            </div>

            <div className="flex gap-2 mt-6">
              <button 
                onClick={() => setSelectedEntry(null)}
                className="flex-1 py-2 rounded-lg bg-white/10 text-[var(--text-secondary)] text-sm font-medium hover:bg-white/20"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
