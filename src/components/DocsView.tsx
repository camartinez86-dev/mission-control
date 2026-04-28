"use client";

import { useState, useLayoutEffect } from "react";

interface Doc {
  id: string;
  name: string;
  type: string;
  size: string;
  updated: string;
  path: string;
}

interface Video {
  name: string;
  path: string;
  size: number | null;
  duration?: string;
  type: string;
}

const fileIcon = (type: string) => {
  switch (type) {
    case "md": return "📝";
    case "json": return "📋";
    case "mp4": return "🎬";
    case "mp3": return "🎵";
    case "ts": return "💻";
    case "tsx": return "⚛️";
    case "zip": return "📦";
    default: return "📄";
  }
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

export default function DocsView() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState<"docs" | "videos">("docs");
  const [loading, setLoading] = useState(false);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/docs");
      const data = await res.json();
      if (data.docs) {
        setDocs(data.docs.map((d: Doc, i: number) => ({ ...d, id: String(i) })));
      }
    } catch (e) {
      console.error("Failed to load docs", e);
    }
    setLoading(false);
  };

  const fetchVideos = async () => {
    try {
      const res = await fetch("/api/files/download?path=%2Ftorn-channel");
      const data = await res.json();
      if (data.items) {
        setVideos(data.items
          .filter((i: Video) => i.type === "file" && i.name.endsWith(".mp4"))
          .map((v: Video, i: number) => ({
            ...v,
            id: String(i),
            size: formatBytes(v.size || 0),
            type: "mp4",
          })));
      }
    } catch (e) {
      console.error("Failed to load videos", e);
    }
  };

  const downloadFile = (path: string, name: string) => {
    const url = `/api/files/download?path=${encodeURIComponent(path)}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredDocs = docs.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useLayoutEffect(() => {
    fetchDocs();
    fetchVideos();
  }, []);

  return (
    <div className="h-full flex flex-col -m-6">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Files</h2>
            <p className="text-sm text-[var(--text-secondary)]">Workspace browser</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTab("docs")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === "docs" ? "bg-[var(--accent-purple)] text-white" : "bg-white/5 text-[var(--text-secondary)] hover:bg-white/10"
              }`}
            >
              📝 Docs
            </button>
            <button
              onClick={() => setTab("videos")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === "videos" ? "bg-[var(--accent-purple)] text-white" : "bg-white/5 text-[var(--text-secondary)] hover:bg-white/10"
              }`}
            >
              🎬 Videos
            </button>
          </div>
        </div>
      </div>

      {tab === "docs" ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Left: File list */}
          <div className="w-64 border-r border-white/5 flex flex-col">
            <div className="px-4 pb-3">
              <input
                type="text"
                placeholder="Search docs..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input w-full text-sm"
              />
            </div>
            <div className="flex-1 overflow-y-auto px-2">
              {loading ? (
                <div className="p-4 text-sm text-[var(--text-muted)]">Loading...</div>
              ) : filteredDocs.length === 0 ? (
                <div className="p-4 text-sm text-[var(--text-muted)]">No files found</div>
              ) : filteredDocs.map(doc => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`w-full text-left px-3 py-2 rounded-lg mb-1 flex items-center gap-3 transition-colors ${
                    selectedDoc?.id === doc.id ? "bg-purple-500/20 text-purple-400" : "hover:bg-white/5 text-[var(--text-secondary)]"
                  }`}
                >
                  <span className="text-base">{fileIcon(doc.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{doc.name}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{doc.size}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Preview + Download */}
          <div className="flex-1 flex flex-col">
            {selectedDoc ? (
              <>
                <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{fileIcon(selectedDoc.type)}</span>
                    <span className="text-sm font-medium text-[var(--text-primary)]">{selectedDoc.name}</span>
                  </div>
                  <button
                    onClick={() => downloadFile(selectedDoc.path, selectedDoc.name)}
                    className="px-3 py-1 rounded bg-[var(--accent-purple)] text-sm text-white hover:bg-purple-600 transition-colors flex items-center gap-1"
                  >
                    ⬇ Download
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  <pre className="text-sm text-[var(--text-secondary)] font-mono whitespace-pre-wrap">
                    {selectedDoc.path}
                  </pre>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-4">📄</div>
                  <p className="text-[var(--text-muted)]">Select a file to preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Videos Tab */
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {videos.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-4xl mb-4">🎬</div>
                <p className="text-[var(--text-muted)]">No videos found in torn-channel</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {videos.map(video => (
                <div key={video.name} className="card p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{video.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{video.size}</p>
                    </div>
                    <button
                      onClick={() => downloadFile(video.path, video.name)}
                      className="px-3 py-1 rounded bg-[var(--accent-purple)] text-sm text-white hover:bg-purple-600 transition-colors flex items-center gap-1 shrink-0"
                    >
                      ⬇ Download
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">MP4</span>
                    <span className="text-xs text-[var(--text-muted)]">{video.path}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
