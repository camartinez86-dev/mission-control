"use client";

import { useState, useEffect } from "react";


const HOOK_PERF_FILE = "/root/.openclaw/workspace/tiktok-marketing/hook-performance.json";
const STRATEGY_FILE = "/root/.openclaw/workspace/tiktok-marketing/strategy.json";

interface PostAnalytics {
  id: string;
  hook: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  status: string;
  tier: string;
  action: string;
  date: string;
}

interface HookRule {
  hook: string;
  reason: string;
  date: string;
}

interface HookPerf {
  hooks: Array<{
    postId: string;
    hook: string;
    date: string;
    views: number;
    likes: number;
    comments: number;
    shares: number;
  }>;
  rules: {
    doubleDown: HookRule[];
    testing: HookRule[];
    dropped: HookRule[];
  };
}

interface Strategy {
  contentPlan: {
    hookCategories: Array<{
      category: string;
      hooks: string[];
    }>;
  };
}

function fmtNum(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function tierBadge(tier: string) {
  switch (tier) {
    case "SCALE":    return <span className="badge bg-emerald-500/20 text-emerald-400">🟢 SCALE IT</span>;
    case "GOOD":     return <span className="badge bg-blue-500/20 text-blue-400">✅ GOOD</span>;
    case "ITERATE":  return <span className="badge bg-yellow-500/20 text-yellow-400">🟡 ITERATE</span>;
    case "RESET":    return <span className="badge bg-orange-500/20 text-orange-400">🟠 RESET</span>;
    default:         return <span className="badge bg-white/10 text-[var(--text-muted)]">⚪ NO DATA</span>;
  }
}

function diagnose(views: number) {
  if (views >= 50000) return { tier: "SCALE", status: "🟢 SCALE IT", action: "Make 3 variations immediately" };
  if (views >= 10000) return { tier: "GOOD", status: "✅ GOOD", action: "Keep rotation, test posting times" };
  if (views >= 1000) return { tier: "ITERATE", status: "🟡 ITERATE", action: "Try 1 more variation" };
  if (views > 0) return { tier: "RESET", status: "🟠 0-1K", action: "Try radically different hook" };
  return { tier: "WAIT", status: "⚪ NO DATA", action: "TikTok indexing may lag 24-48h" };
}

export default function FYIFindsView() {
  const [posts, setPosts] = useState<PostAnalytics[]>([]);
  const [perf, setPerf] = useState<HookPerf | null>(null);
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [tab, setTab] = useState<"overview" | "hooks" | "suggestions">("overview");

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 120000); // 2 min
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch recent posts from Postiz
      const startDate = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      const endDate = new Date().toISOString().slice(0, 10);
      const res = await fetch(
        `/api/postiz?endpoint=posts&startDate=${startDate}&endDate=${endDate}`,
        
      );
      const data = await res.json();
      const postizPosts = (data.posts || []).filter(
        (p: any) => p.integration?.name === "FYIFINDS" && p.state === "PUBLISHED"
      );

      // Fetch per-post analytics
      const enriched: PostAnalytics[] = [];
      for (const post of postizPosts.slice(0, 10)) {
        let analytics = { views: 0, likes: 0, comments: 0, shares: 0 };
        try {
          const ar = await fetch(
            `/api/postiz?endpoint=analytics/post&postId=${post.id}`,
            
          );
          analytics = await ar.json() || analytics;
        } catch {}

        const { tier, status, action } = diagnose(analytics.views);
        const hookEntry = perf?.hooks?.find((h: any) => h.postId === post.id);
        enriched.push({
          id: post.id,
          hook: hookEntry?.hook || post.content?.replace(/<[^>]+>/g, "").slice(0, 80) || post.id,
          views: analytics.views || 0,
          likes: analytics.likes || 0,
          comments: analytics.comments || 0,
          shares: analytics.shares || 0,
          status,
          tier,
          action,
          date: post.date || "",
        });
        await new Promise(r => setTimeout(r, 200));
      }

      // Load hook performance file via API proxy (we can't read FS directly from browser)
      let perfData: HookPerf | null = null;
      let strategyData: Strategy | null = null;

      try {
        const pr = await fetch("/api/docs?path=hook-performance.json");
        if (pr.ok) { const j = await pr.json(); perfData = j; }
      } catch {}
      try {
        const sr = await fetch("/api/docs?path=strategy.json");
        if (sr.ok) { const j = await sr.json(); strategyData = j; }
      } catch {}

      setPosts(enriched);
      setPerf(perfData);
      setStrategy(strategyData);
      setError(null);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const totalViews = posts.reduce((s, p) => s + p.views, 0);
  const avgViews = posts.length > 0 ? Math.round(totalViews / posts.length) : 0;
  const topPost = posts.reduce((best, p) => p.views > (best?.views || 0) ? p : best, null as PostAnalytics | null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">📱 FYIFinds Analytics</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            TikTok · Last 7 days
            {lastRefresh && (
              <span className="ml-2 text-[var(--text-muted)]">
                · Updated {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="segment-control">
            {(["overview", "hooks", "suggestions"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={`segment-btn ${tab === t ? "active" : ""}`}>
                {t === "overview" ? "Overview" : t === "hooks" ? "Hook Rules" : "Suggestions"}
              </button>
            ))}
          </div>
          <button onClick={fetchData} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs transition-colors">
            ↻ Refresh
          </button>
        </div>
      </div>

      {loading && posts.length === 0 && (
        <div className="flex items-center justify-center h-48">
          <div className="text-[var(--text-secondary)] animate-pulse">Loading TikTok analytics…</div>
        </div>
      )}

      {error && (
        <div className="card p-4 border-red-500/30 text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {tab === "overview" && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="card p-4">
              <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1">Total Views</div>
              <div className="text-3xl font-bold text-[var(--text-primary)]">{fmtNum(totalViews)}</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">{posts.length} posts</div>
            </div>
            <div className="card p-4">
              <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1">Avg Views</div>
              <div className="text-3xl font-bold text-[var(--text-primary)]">{fmtNum(avgViews)}</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">per post</div>
            </div>
            <div className="card p-4">
              <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1">Top Post</div>
              <div className="text-xl font-bold text-emerald-400 truncate">{topPost ? fmtNum(topPost.views) : "—"}</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">{topPost?.date?.slice(0,10) || "none yet"}</div>
            </div>
            <div className="card p-4">
              <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1">Hook Rules</div>
              <div className="text-2xl font-bold text-purple-400">
                {perf?.rules?.doubleDown?.length || 0}
                <span className="text-[var(--text-muted)] font-normal text-sm"> / {perf?.rules?.testing?.length || 0} / {perf?.rules?.dropped?.length || 0}</span>
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-1">scale / test / drop</div>
            </div>
          </div>

          {/* Posts table */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Post Performance</h3>
              <div className="flex-1 h-px bg-white/5" />
            </div>
            {posts.length === 0 ? (
              <div className="card p-8 text-center text-[var(--text-muted)]">
                <div className="text-3xl mb-2">📱</div>
                <div>No published posts in the last 7 days</div>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      {["Hook", "Views", "Likes", "Comments", "Shares", "Status", "Action"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((p, i) => (
                      <tr key={p.id} className={`border-b border-white/5 last:border-0 ${i%2===0?"":"bg-white/[0.02]"} hover:bg-white/[0.04]`}>
                        <td className="px-4 py-3 max-w-xs">
                          <div className="truncate text-[var(--text-primary)]" title={p.hook}>{p.hook}</div>
                          <div className="text-[10px] text-[var(--text-muted)]">{p.date?.slice(0,10)}</div>
                        </td>
                        <td className="px-4 py-3 font-bold text-[var(--text-primary)]">{fmtNum(p.views)}</td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">{p.likes}</td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">{p.comments}</td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">{p.shares}</td>
                        <td className="px-4 py-3">{tierBadge(p.tier)}</td>
                        <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{p.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {tab === "hooks" && perf && (
        <div className="space-y-6">
          {/* DoubleDown */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold">🟢 SCALE IT</span>
              <span className="text-xs text-[var(--text-muted)]">{perf.rules.doubleDown.length} hooks</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>
            {perf.rules.doubleDown.length === 0 ? (
              <div className="card p-4 text-sm text-[var(--text-muted)]">No winning hooks yet — posts need 50K+ views to qualify</div>
            ) : (
              <div className="space-y-2">
                {perf.rules.doubleDown.map((h, i) => (
                  <div key={i} className="card p-4 border border-emerald-500/20">
                    <div className="font-semibold text-[var(--text-primary)]">{h.hook}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-1">{h.reason} · {h.date}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Testing */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-400 text-xs font-bold">🟡 TESTING</span>
              <span className="text-xs text-[var(--text-muted)]">{perf.rules.testing.length} hooks</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>
            {perf.rules.testing.length === 0 ? (
              <div className="card p-4 text-sm text-[var(--text-muted)]">No hooks in testing rotation</div>
            ) : (
              <div className="space-y-2">
                {perf.rules.testing.map((h, i) => (
                  <div key={i} className="card p-4 border border-yellow-500/20">
                    <div className="font-semibold text-[var(--text-primary)]">{h.hook}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-1">{h.reason} · {h.date}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dropped */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="px-2 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold">🔴 DROPPED</span>
              <span className="text-xs text-[var(--text-muted)]">{perf.rules.dropped.length} hooks</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>
            {perf.rules.dropped.length === 0 ? (
              <div className="card p-4 text-sm text-[var(--text-muted)]">No dropped hooks</div>
            ) : (
              <div className="space-y-2">
                {perf.rules.dropped.map((h, i) => (
                  <div key={i} className="card p-4 border border-red-500/20 opacity-60">
                    <div className="font-semibold text-[var(--text-primary)] line-through">{h.hook}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-1">{h.reason} · {h.date}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "suggestions" && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Today's Hook Suggestions</h3>
            <div className="flex-1 h-px bg-white/5" />
          </div>
          <div className="card p-4 space-y-3">
            {/* Priority 1: DoubleDown */}
            {perf?.rules?.doubleDown?.slice(0, 2).map((h, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-emerald-400 font-bold text-xs shrink-0">SCALE</span>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">{h.hook}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">Make 3 variations of this winning hook</div>
                </div>
              </div>
            ))}
            {/* Priority 2: Testing */}
            {perf?.rules?.testing?.slice(0, 2).map((h, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <span className="text-yellow-400 font-bold text-xs shrink-0">KEEP</span>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">{h.hook}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">Good performer — test different posting times</div>
                </div>
              </div>
            ))}
            {/* Priority 3: New from strategy */}
            {(strategy?.contentPlan?.hookCategories || []).slice(0, 3).map((cat, ci) =>
              cat.hooks.slice(0, 2).map((hook, hi) => (
                <div key={`${ci}-${hi}`} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-blue-400 font-bold text-xs shrink-0">NEW</span>
                  <div>
                    <div className="font-semibold text-[var(--text-primary)]">{hook}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">Category: {cat.category}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="text-center text-xs text-[var(--text-muted)]">
        Auto-refreshes every 2 min · Data from Postiz API · TikTok views may lag 24-48h
      </div>
    </div>
  );
}
