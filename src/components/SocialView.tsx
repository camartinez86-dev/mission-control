"use client";

import { useState, useEffect } from "react";

interface PostizIntegration {
  id: string;
  name: string;
  type: string;
}

interface PostizPost {
  id: string;
  content: string;
  publishDate: string;
  status: string;
  integration?: PostizIntegration;
}

interface Account {
  name: string;
  handle: string;
  color: string;
  link: string;
}

const accounts: Account[] = [
  { name: "TikTok", handle: "@fyifinds", color: "bg-black", link: "https://tiktok.com/@fyifinds" },
  { name: "YouTube", handle: "FYIFinds", color: "bg-red-500", link: "https://www.youtube.com/channel/UCUcGM7G2tRh3eGBezCYMbfA" },
  { name: "Substack", handle: "@fyifinds", color: "bg-gray-600", link: "https://substack.com/@fyifinds" },
  { name: "eBay", handle: "@allfashionmatters", color: "bg-blue-600", link: "https://www.ebay.com/usr/allfashionmatters" },
  { name: "Amazon", handle: "fyifinds-20", color: "bg-orange-500", link: "https://www.amazon.com/shop/fyifinds" },
];

const platformColor: Record<string, string> = {
  TIKTOK: "bg-black",
  YOUTUBE: "bg-red-500",
  INSTAGRAM: "bg-pink-500",
  TWITTER: "bg-sky-500",
};

const platformLabel: Record<string, string> = {
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  INSTAGRAM: "Instagram",
  TWITTER: "Twitter/X",
};

function statusBadge(status: string) {
  switch (status?.toUpperCase()) {
    case "SCHEDULED": return "bg-blue-500/20 text-blue-400";
    case "PUBLISHED": return "bg-green-500/20 text-green-400";
    case "DRAFT": return "bg-yellow-500/20 text-yellow-400";
    case "ERROR": return "bg-red-500/20 text-red-400";
    default: return "bg-white/10 text-[var(--text-muted)]";
  }
}

function formatDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function SocialView() {
  const [posts, setPosts] = useState<PostizPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<PostizPost | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "tiktok" | "youtube" | "substack">("all");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/postiz?endpoint=posts");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      // Postiz returns { posts: [...] } or directly an array
      const list: PostizPost[] = Array.isArray(data) ? data : (data.posts ?? []);
      setPosts(list);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    const interval = setInterval(fetchPosts, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredPosts = posts.filter((p) => {
    if (activeTab === "all") return true;
    const type = p.integration?.type?.toUpperCase() ?? "";
    if (activeTab === "tiktok") return type === "TIKTOK";
    if (activeTab === "youtube") return type === "YOUTUBE";
    if (activeTab === "substack") return type === "SUBSTACK";
    return true;
  });

  const scheduled = posts.filter(p => p.status?.toUpperCase() === "SCHEDULED").length;
  const published = posts.filter(p => p.status?.toUpperCase() === "PUBLISHED").length;
  const drafts = posts.filter(p => p.status?.toUpperCase() === "DRAFT").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">📱 Social Media</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            FYIFinds & AllFashionMatters · Postiz
            {lastRefresh && (
              <span className="ml-2 text-[var(--text-muted)]">· Updated {lastRefresh.toLocaleTimeString()}</span>
            )}
          </p>
        </div>
        <button onClick={fetchPosts} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs transition-colors">
          ↻ Refresh
        </button>
      </div>

      {/* Accounts */}
      <div className="card p-4">
        <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">Connected Accounts</h3>
        <div className="flex flex-wrap gap-3">
          {accounts.map((a) => (
            <a key={a.name} href={a.link} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <div className={`w-7 h-7 rounded ${a.color} flex items-center justify-center text-white text-xs font-bold`}>
                {a.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium text-[var(--text-primary)]">{a.name}</div>
                <div className="text-xs text-[var(--text-muted)]">{a.handle}</div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="metric-card">
          <div className="metric-value">{posts.length}</div>
          <div className="metric-label">Total Posts</div>
        </div>
        <div className="metric-card">
          <div className="metric-value text-blue-400">{scheduled}</div>
          <div className="metric-label">Scheduled</div>
        </div>
        <div className="metric-card">
          <div className="metric-value text-green-400">{published}</div>
          <div className="metric-label">Published</div>
        </div>
        <div className="metric-card">
          <div className="metric-value text-yellow-400">{drafts}</div>
          <div className="metric-label">Drafts</div>
        </div>
      </div>

      {/* Tab filter */}
      <div className="segment-control">
        {(["all", "tiktok", "youtube", "substack"] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`segment-btn ${activeTab === t ? "active" : ""}`}>
            {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Posts list */}
      {loading && posts.length === 0 ? (
        <div className="flex items-center justify-center h-48">
          <div className="text-[var(--text-secondary)] animate-pulse">Loading posts from Postiz…</div>
        </div>
      ) : error ? (
        <div className="card p-8 text-center">
          <div className="text-3xl mb-2">⚠️</div>
          <div className="text-[var(--text-primary)] font-semibold">Postiz connection error</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">{error}</div>
          <button onClick={fetchPosts} className="mt-4 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-colors">
            Retry
          </button>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-3xl mb-2">📭</div>
          <div className="text-[var(--text-primary)] font-semibold">No posts found</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">Schedule posts in Postiz to see them here</div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Posts Queue</h3>
            <div className="flex-1 h-px bg-white/5" />
          </div>
          {filteredPosts.map((post) => {
            const type = post.integration?.type?.toUpperCase() ?? "";
            const dot = platformColor[type] ?? "bg-gray-500";
            const label = platformLabel[type] ?? post.integration?.name ?? "Unknown";
            return (
              <button key={post.id} onClick={() => setSelectedPost(post)}
                className="w-full card p-4 flex items-center gap-4 hover:bg-white/10 transition-colors text-left">
                <div className={`shrink-0 w-2 h-10 rounded-full ${dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {post.content?.slice(0, 80) || "(no content)"}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">
                    {label} · {formatDate(post.publishDate)}
                  </div>
                </div>
                <span className={`shrink-0 px-2 py-1 rounded text-xs font-medium ${statusBadge(post.status)}`}>
                  {post.status?.toLowerCase()}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Weekly calendar — static but accurate */}
      <div className="card p-4">
        <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4">Weekly Schedule</h3>
        <div className="grid grid-cols-7 gap-2">
          {[
            { day: "Mon", items: ["TikTok 7AM", "YouTube Short"], active: true },
            { day: "Tue", items: ["—"], active: false },
            { day: "Wed", items: ["TikTok 7AM", "YouTube Short"], active: true },
            { day: "Thu", items: ["—"], active: false },
            { day: "Fri", items: ["TikTok 7AM", "YouTube Short", "Newsletter 9AM"], active: true },
            { day: "Sat", items: ["—"], active: false },
            { day: "Sun", items: ["Trending research 9AM"], active: false },
          ].map((d) => (
            <div key={d.day} className={`p-3 rounded-lg ${d.active ? "bg-purple-500/10 border border-purple-500/20" : "bg-white/5"}`}>
              <div className="text-sm font-bold text-[var(--text-primary)] mb-2">{d.day}</div>
              {d.items.map((item, i) => (
                <div key={i} className="text-xs text-[var(--text-muted)]">{item}</div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Post detail modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPost(null)}>
          <div className="bg-[var(--bg-card)] rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs text-[var(--text-muted)] mb-1">
                  {platformLabel[selectedPost.integration?.type?.toUpperCase() ?? ""] ?? selectedPost.integration?.name ?? "Post"}
                  {" · "}{formatDate(selectedPost.publishDate)}
                </div>
                <span className={`text-xs px-2 py-1 rounded ${statusBadge(selectedPost.status)}`}>
                  {selectedPost.status?.toLowerCase()}
                </span>
              </div>
              <button onClick={() => setSelectedPost(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl">✕</button>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-sm text-[var(--text-primary)] whitespace-pre-wrap max-h-96 overflow-y-auto">
              {selectedPost.content || "(no content)"}
            </div>
            <button onClick={() => setSelectedPost(null)}
              className="mt-4 w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-colors">
              Close
            </button>
          </div>
        </div>
      )}

      <div className="text-center text-xs text-[var(--text-muted)]">
        Auto-refreshes every 60s · Data from Postiz API
      </div>
    </div>
  );
}
