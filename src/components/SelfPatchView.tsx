"use client";

import { useState, useEffect } from "react";

interface ErrorEntry {
  ts: string;
  msg: string;
  count: number;
  files: string[];
  last: string;
}

interface LearningEntry {
  ts: string;
  type: string;
  text: string;
  source: string;
}

interface FeatureEntry {
  ts: string;
  text: string;
  priority: string;
  status: string;
}

interface SelfImprovementEntry {
  ts: string;
  type: "correction" | "insight" | "best_practice" | "knowledge_gap";
  summary: string;
  lesson: string;
  source: string;
  relatedError?: string;
}

function typeColor(type: string) {
  switch (type) {
    case "correction":    return "text-red-400 bg-red-500/15";
    case "insight":       return "text-blue-400 bg-blue-500/15";
    case "best_practice": return "text-emerald-400 bg-emerald-500/15";
    case "knowledge_gap":  return "text-yellow-400 bg-yellow-500/15";
    default:              return "text-[var(--text-secondary)] bg-white/5";
  }
}

function priColor(pri: string) {
  switch (pri) {
    case "high":   return "text-red-400 bg-red-500/15";
    case "medium": return "text-yellow-400 bg-yellow-500/15";
    default:       return "text-[var(--text-muted)] bg-white/5";
  }
}

export default function SelfPatchView() {
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [learnings, setLearnings] = useState<LearningEntry[]>([]);
  const [features, setFeatures] = useState<FeatureEntry[]>([]);
  const [selfImprovement, setSelfImprovement] = useState<SelfImprovementEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"errors" | "learnings" | "features" | "self-improvement">("errors");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eRes, lRes, fRes, siRes] = await Promise.allSettled([
        fetch("/api/docs?path=.learnings/ERRORS.md"),
        fetch("/api/docs?path=.learnings/LEARNINGS.md"),
        fetch("/api/docs?path=.learnings/FEATURE_REQUESTS.md"),
        fetch("/api/docs?path=self-improving/corrections.md"),
      ]);

      // Parse errors
      if (eRes.status === "fulfilled" && eRes.value.ok) {
        const text = await eRes.value.text();
        const lines = text.split("\n");
        const patternMap: Record<string, ErrorEntry> = {};
        for (const line of lines) {
          const m = line.match(/^\[([^\]]+)\] ERROR \| ([^|]+) \| ([^|]+) \| fix: (\w+)/);
          if (m) {
            const key = m[3].trim().slice(0, 50);
            if (!patternMap[key]) {
              patternMap[key] = { ts: m[1], msg: m[3].trim(), count: 0, files: [], last: m[1] };
            }
            patternMap[key].count++;
            patternMap[key].files.push(m[2].trim());
          }
        }
        setErrors(Object.values(patternMap).sort((a, b) => b.count - a.count));
      }

      // Parse learnings
      if (lRes.status === "fulfilled" && lRes.value.ok) {
        const text = await lRes.value.text();
        const lines = text.split("\n");
        const entries: LearningEntry[] = [];
        for (const line of lines) {
          const m = line.match(/^\[([^\]]+)\] (\w+) \| (.+?) \| source: (.+)/);
          if (m) entries.push({ ts: m[1], type: m[2], text: m[3].replace(/→.+/, '').trim(), source: m[4].trim() });
        }
        setLearnings(entries.reverse().slice(0, 50));
      }

      // Parse features
      if (fRes.status === "fulfilled" && fRes.value.ok) {
        const text = await fRes.value.text();
        const lines = text.split("\n");
        const entries: FeatureEntry[] = [];
        for (const line of lines) {
          const m = line.match(/^\[([^\]]+)\] ([^|]+) \| priority: ([\w]+) \| status: ([\w]+)/);
          if (m) entries.push({ ts: m[1], text: m[2].trim(), priority: m[3].trim(), status: m[4].trim() });
        }
        setFeatures(entries.reverse().slice(0, 50));
      }

      // Parse self-improvement corrections
      if (siRes.status === "fulfilled" && siRes.value.ok) {
        const text = await siRes.value.text();
        const lines = text.split("\n");
        const entries: SelfImprovementEntry[] = [];
        for (const line of lines) {
          const m = line.match(/^\[([^\]]+)\] (\w+) \| (.+?) →\s*(.+)/);
          if (m) {
            const type = m[2].toLowerCase() as SelfImprovementEntry["type"];
            entries.push({
              ts: m[1],
              type,
              summary: m[3].trim(),
              lesson: m[4].trim(),
              source: "corrections.md",
            });
          }
        }
        setSelfImprovement(entries.reverse().slice(0, 50));
      }

      setLastRefresh(new Date());
    } catch (err) {
      console.error("Failed to load self-patch data:", err);
    } finally {
      setLoading(false);
    }
  };

  const pendingFeatures = features.filter(f => f.status === "pending");
  const recentErrors = errors.filter(e => {
    if (!e.last) return false;
    const d = new Date(e.last.replace(" ", "T"));
    return (Date.now() - d.getTime()) < 7 * 86400000;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">🔧 Self-Patch System</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            .learnings/ · last 7 days
            {lastRefresh && (
              <span className="ml-2 text-[var(--text-muted)]">
                · Updated {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Summary badges */}
          <div className="flex gap-2">
            <span className="px-3 py-1 rounded-full bg-red-500/15 text-red-400 text-xs font-semibold">
              {errors.length} patterns
            </span>
            <span className="px-3 py-1 rounded-full bg-blue-500/15 text-blue-400 text-xs font-semibold">
              {learnings.length} learnings
            </span>
            <span className="px-3 py-1 rounded-full bg-yellow-500/15 text-yellow-400 text-xs font-semibold">
              {pendingFeatures.length} pending
            </span>
          </div>
          <div className="segment-control">
            {(["errors", "learnings", "features", "self-improvement"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={`segment-btn ${tab === t ? "active" : ""}`}>
                {t === "errors" ? "Errors" : t === "learnings" ? "Learnings" : t === "features" ? "Features" : "Self-Improvement"}
              </button>
            ))}
          </div>
          <button onClick={fetchData} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs transition-colors">
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="card p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📝</span>
          <div>
            <div className="font-semibold text-[var(--text-primary)] text-sm">Log Errors</div>
            <div className="text-xs text-[var(--text-muted)]">Every failure from FYIFinds scripts logs here automatically</div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔧</span>
          <div>
            <div className="font-semibold text-[var(--text-primary)] text-sm">Self-Patch Review</div>
            <div className="text-xs text-[var(--text-muted)]">6AM daily: proposes fixes, auto-applies safe ones, flags complex</div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <div className="font-semibold text-[var(--text-primary)] text-sm">Carlos Approves</div>
            <div className="text-xs text-[var(--text-muted)]">Trading/auth/cron changes always need approval first</div>
          </div>
        </div>
      </div>

      {loading && errors.length === 0 && (
        <div className="flex items-center justify-center h-48">
          <div className="text-[var(--text-secondary)] animate-pulse">Loading self-patch data…</div>
        </div>
      )}

      {tab === "errors" && (
        <>
          <div>
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Error Patterns</h3>
              <div className="flex-1 h-px bg-white/5" />
              {errors.filter(e => e.count >= 3).length > 0 && (
                <span className="px-2 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold">
                  ⚠️ {errors.filter(e => e.count >= 3).length} recurring (3x+)
                </span>
              )}
            </div>
            {errors.length === 0 ? (
              <div className="card p-8 text-center">
                <div className="text-3xl mb-2">✅</div>
                <div className="text-[var(--text-primary)] font-semibold">No errors logged</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">System is clean — or no failures have occurred yet</div>
              </div>
            ) : (
              <div className="space-y-2">
                {errors.map((e, i) => (
                  <div key={i} className={`card p-4 flex items-center gap-4 ${e.count >= 3 ? "border-red-500/30" : ""}`}>
                    <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${
                      e.count >= 3 ? "bg-red-500/20 text-red-400" :
                      e.count >= 2 ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-white/10 text-[var(--text-muted)]"
                    }`}>
                      {e.count}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm text-[var(--text-primary)] truncate">{e.msg}</div>
                      <div className="text-xs text-[var(--text-muted)] mt-0.5">
                        Files: {e.files.filter((f, idx, a) => a.indexOf(f) === idx).join(", ")} · Last: {e.last}
                      </div>
                    </div>
                    {e.count >= 3 && (
                      <span className="shrink-0 px-2 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold">
                        ESCALATE
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {tab === "learnings" && (
        <>
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Corrections & Insights</h3>
            <div className="flex-1 h-px bg-white/5" />
          </div>
          {learnings.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="text-3xl mb-2">🧠</div>
              <div className="text-[var(--text-primary)] font-semibold">No learnings yet</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">Corrections and insights get logged here automatically</div>
            </div>
          ) : (
            <div className="space-y-2">
              {learnings.map((l, i) => (
                <div key={i} className="card p-4 flex items-start gap-3">
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded uppercase ${typeColor(l.type)}`}>
                    {l.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[var(--text-primary)]">{l.text}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">{l.source} · {l.ts}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "features" && (
        <>
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Feature Requests</h3>
            <div className="flex-1 h-px bg-white/5" />
            {pendingFeatures.length > 0 && (
              <span className="px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-400 text-xs font-bold">
                {pendingFeatures.length} pending approval
              </span>
            )}
          </div>
          {features.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="text-3xl mb-2">📋</div>
              <div className="text-[var(--text-primary)] font-semibold">No feature requests</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">Things Carlos wants but aren't built yet go here</div>
            </div>
          ) : (
            <div className="space-y-2">
              {features.map((f, i) => (
                <div key={i} className="card p-4 flex items-center gap-3">
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded uppercase ${priColor(f.priority)}`}>
                    {f.priority}
                  </span>
                  <div className="flex-1 text-sm text-[var(--text-primary)]">{f.text}</div>
                  <span className={`shrink-0 text-[10px] px-2 py-1 rounded ${
                    f.status === "approved" ? "bg-emerald-500/15 text-emerald-400" :
                    f.status === "built" ? "bg-blue-500/15 text-blue-400" :
                    f.status === "rejected" ? "bg-white/5 text-[var(--text-muted)]" :
                    "bg-yellow-500/15 text-yellow-400"
                  }`}>
                    {f.status}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] shrink-0">{f.ts}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "self-improvement" && (
        <>
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Self-Improvement Log</h3>
            <div className="flex-1 h-px bg-white/5" />
            {selfImprovement.filter(e => e.ts.includes("2026-04-29")).length > 0 && (
              <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                {selfImprovement.filter(e => e.ts.includes("2026-04-29")).length} today
              </span>
            )}
          </div>
          {selfImprovement.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="text-3xl mb-2">🔄</div>
              <div className="text-[var(--text-primary)] font-semibold">No self-improvement entries</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">Corrections, insights, and lessons learned get logged here automatically</div>
            </div>
          ) : (
            <div className="space-y-2">
              {selfImprovement.map((si, i) => (
                <div key={i} className="card p-4 flex items-start gap-3">
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded uppercase ${typeColor(si.type)}`}>
                    {si.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--text-primary)]">{si.summary}</div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">{si.lesson}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-1.5 flex items-center gap-2">
                      <span>{si.source}</span>
                      {si.relatedError && <span>· Related: {si.relatedError}</span>}
                      <span>· {si.ts}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="text-center text-xs text-[var(--text-muted)]">
        Auto-refreshes every 60s · Logs at /root/.openclaw/workspace/.learnings/
      </div>
    </div>
  );
}
