"use client";

import { useState } from "react";

interface Doc {
  id: string;
  name: string;
  type: string;
  size: string;
  updated: string;
  content?: string;
}

const sampleDocs: Doc[] = [
  {
    id: "1",
    name: "openclaw.json",
    type: "json",
    size: "4.2 KB",
    updated: "2 min ago",
  },
  {
    id: "2",
    name: "cron_jobs.md",
    type: "md",
    size: "1.8 KB",
    updated: "1 hour ago",
  },
  {
    id: "3",
    name: "MEMORY.md",
    type: "md",
    size: "8.3 KB",
    updated: "3 hours ago",
  },
  {
    id: "4",
    name: "AGENTS.md",
    type: "md",
    size: "2.1 KB",
    updated: "1 day ago",
  },
  {
    id: "5",
    name: "SOUL.md",
    type: "md",
    size: "1.2 KB",
    updated: "1 day ago",
  },
  {
    id: "6",
    name: "USER.md",
    type: "md",
    size: "0.5 KB",
    updated: "2 days ago",
  },
  {
    id: "7",
    name: "TOOLS.md",
    type: "md",
    size: "0.8 KB",
    updated: "2 days ago",
  },
  {
    id: "8",
    name: "IDENTITY.md",
    type: "md",
    size: "0.3 KB",
    updated: "3 days ago",
  },
  {
    id: "9",
    name: "package.json",
    type: "json",
    size: "0.6 KB",
    updated: "1 week ago",
  },
];

const sampleContent = `{
  "meta": {
    "lastTouchedVersion": "2026.3.13",
    "lastTouchedAt": "2026-03-25T05:00:29.004Z"
  },
  "wizard": {
    "lastRunAt": "2026-03-25T05:00:28.969Z",
    "lastRunVersion": "2026.3.13",
    "lastRunCommand": "doctor",
    "lastRunMode": "local"
  },
  "auth": {
    "profiles": {
      "minimax-portal:default": {
        "provider": "minimax-portal",
        "mode": "oauth"
      }
    }
  },
  "models": {
    "providers": {
      "openai": {
        "baseUrl": "https://api.openai.com/v1",
        "apiKey": "sk-proj-***",
        "api": "openai-completions",
        "models": [...]
      }
    }
  }
}`;

const fileIcon = (type: string) => {
  switch (type) {
    case "md":
      return "📝";
    case "json":
      return "📋";
    case "ts":
      return "💻";
    default:
      return "📄";
  }
};

export default function DocsView() {
  const [docs] = useState<Doc[]>(sampleDocs);
  const [selectedDoc, setSelectedDoc] = useState<Doc | null>(sampleDocs[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const filteredDocs = docs.filter((doc) => {
    const matchesSearch = doc.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleDocClick = (doc: Doc) => {
    setSelectedDoc(doc);
  };

  return (
    <div className="h-full flex flex-col -m-6">
      {/* Header */}
      <div className="p-6 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            Documents
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Browse workspace files
          </p>
        </div>
      </div>

      {/* Three-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: File list */}
        <div className="w-64 border-r border-white/5 flex flex-col">
          {/* Search */}
          <div className="px-4 pb-3">
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full text-sm"
            />
          </div>

          {/* Filter chips */}
          <div className="px-4 pb-3 flex gap-2 flex-wrap">
            {["all", "md", "json"].map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTags(tag === "all" ? [] : [tag])}
                className={`px-2 py-0.5 rounded text-xs ${
                  selectedTags.includes(tag) ||
                  (tag === "all" && selectedTags.length === 0)
                    ? "bg-purple-500/20 text-purple-400"
                    : "bg-white/5 text-[var(--text-muted)]"
                }`}
              >
                {tag.toUpperCase()}
              </button>
            ))}
          </div>

          {/* File list */}
          <div className="flex-1 overflow-y-auto px-2">
            {filteredDocs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => handleDocClick(doc)}
                className={`w-full text-left px-3 py-2 rounded-lg mb-1 flex items-center gap-3 transition-colors ${
                  selectedDoc?.id === doc.id
                    ? "bg-purple-500/20 text-purple-400"
                    : "hover:bg-white/5 text-[var(--text-secondary)]"
                }`}
              >
                <span className="text-base">{fileIcon(doc.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{doc.name}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {doc.size}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Middle: Preview */}
        <div className="flex-1 flex flex-col">
          {selectedDoc ? (
            <>
              {/* Preview header */}
              <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{fileIcon(selectedDoc.type)}</span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {selectedDoc.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-muted)]">
                    Updated {selectedDoc.updated}
                  </span>
                  <button className="px-3 py-1 rounded bg-white/5 text-sm text-[var(--text-secondary)] hover:bg-white/10">
                    Download
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <pre className="text-sm text-[var(--text-secondary)] font-mono whitespace-pre-wrap">
                  {selectedDoc.type === "json"
                    ? sampleContent
                    : `# ${selectedDoc.name}\n\nThis is the content preview for the selected document.`}
                </pre>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-4">📄</div>
                <p className="text-[var(--text-muted)]">
                  Select a file to preview
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
