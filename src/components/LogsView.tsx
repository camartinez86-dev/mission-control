"use client";

import { useState, useEffect, useRef } from "react";

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  source: string;
}

interface LogFile {
  name: string;
  exists: boolean;
  size: string;
}

interface ContainerInfo {
  name: string;
  status: string;
  cpu: string;
  memory: string;
}

interface CronJob {
  name: string;
  nextRun: string;
  lastStatus: string;
  errors: number;
}

interface LogsData {
  logs: LogEntry[];
  logFiles: LogFile[];
  containers: ContainerInfo[];
  cronJobs: CronJob[];
  generatedAt: string;
}

const levelColor: Record<string, string> = {
  INFO:    "text-blue-400",
  WARN:    "text-yellow-400",
  WARNING: "text-yellow-400",
  ERROR:   "text-red-400",
  DEBUG:   "text-gray-500",
  EVENT:   "text-purple-400",
};

const sourceColor: Record<string, string> = {
  "edge-hunter":  "text-emerald-400",
  "arb-watcher":  "text-blue-400",
  "news-monitor": "text-purple-400",
  "health-check": "text-yellow-400",
  "analysis":     "text-orange-400",
};

const LOG_SOURCES = ["all", "edge-hunter", "arb-watcher", "news-monitor", "health-check", "analysis"];

export default function LogsView() {
  const [data, setData] = useState<LogsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [source, setSource] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`/api/logs?source=${source}&limit=150`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: LogsData = await res.json();
      setData(json);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Failed to load logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, source]);

  const filteredLogs = (data?.logs ?? []).filter((l) => {
    if (levelFilter === "all") return true;
    const lvl = l.level?.toUpperCase();
    if (levelFilter === "errors") return lvl === "ERROR";
    if (levelFilter === "warnings") return lvl === "WARN" || lvl === "WARNING";
    if (levelFilter === "info") return lvl === "INFO";
    return true;
  });

  const errorCount = (data?.logs ?? []).filter(l => l.level?.toUpperCase() === "ERROR").length;
  const warnCount  = (data?.logs ?? []).filter(l => ["WARN","WARNING"].includes(l.level?.toUpperCase())).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">📋 Logs</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Live system logs · 10s refresh
            {lastRefresh && <span className="ml-2 text-[var(--text-muted)]">· {lastRefresh.toLocaleTimeString()}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {errorCount > 0 && (
            <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold">
              {errorCount} errors
            </span>
          )}
          {warnCount > 0 && (
            <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold">
              {warnCount} warnings
            </span>
          )}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-colors ${
              autoRefresh ? "bg-green-500/20 text-green-400" : "bg-white/5 text-[var(--text-secondary)]"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? "bg-green-400 animate-pulse" : "bg-gray-500"}`} />
            {autoRefresh ? "Live" : "Paused"}
          </button>
          <button onClick={fetchLogs} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs transition-colors">
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Log file status */}
      {data?.logFiles && (
        <div className="flex flex-wrap gap-2">
          {data.logFiles.map((f) => (
            <div key={f.name} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs ${
              f.exists ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-[var(--text-muted)]"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${f.exists ? "bg-emerald-400" : "bg-gray-600"}`} />
              {f.name} {f.exists ? `· ${f.size}` : "· missing"}
            </div>
          ))}
        </div>
      )}

      {/* Source + Level filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="segment-control">
          {(["all", "errors", "warnings", "info"] as const).map(t => (
            <button key={t} onClick={() => setLevelFilter(t)}
              className={`segment-btn capitalize ${levelFilter === t ? "active" : ""}`}>
              {t}
            </button>
          ))}
        </div>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-white/5 text-xs text-[var(--text-secondary)] border border-white/10 focus:outline-none"
        >
          {LOG_SOURCES.map(s => (
            <option key={s} value={s}>{s === "all" ? "All sources" : s}</option>
          ))}
        </select>
      </div>

      {/* Log terminal */}
      <div className="card p-4">
        <div
          ref={logRef}
          className="bg-black/60 rounded-lg p-4 font-mono text-xs h-80 overflow-y-auto space-y-0.5"
        >
          {loading ? (
            <div className="text-[var(--text-muted)] animate-pulse">Loading logs…</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-[var(--text-muted)]">No log entries found.</div>
          ) : (
            filteredLogs.map((log, i) => (
              <div key={i} className="flex gap-3 py-0.5 hover:bg-white/5 px-1 -mx-1 rounded">
                <span className="text-[var(--text-muted)] shrink-0">{log.timestamp}</span>
                <span className={`shrink-0 font-bold ${sourceColor[log.source] ?? "text-gray-400"}`}>
                  [{log.source}]
                </span>
                <span className={`shrink-0 font-semibold ${levelColor[log.level?.toUpperCase()] ?? "text-gray-400"}`}>
                  {log.level}
                </span>
                <span className="text-[var(--text-secondary)] flex-1 break-all">{log.message}</span>
              </div>
            ))
          )}
        </div>
        <div className="mt-2 text-xs text-[var(--text-muted)] text-right">
          {filteredLogs.length} entries
        </div>
      </div>

      {/* Containers + Cron */}
      <div className="grid grid-cols-2 gap-4">
        {/* Containers */}
        <div className="card p-5">
          <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4">Docker Containers</h3>
          {!data?.containers || data.containers.length === 0 ? (
            <div className="text-xs text-[var(--text-muted)]">No container data</div>
          ) : (
            <div className="space-y-2">
              {data.containers.map((c, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                  <span className={`status-dot ${c.status === "running" ? "active" : "error"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--text-primary)] truncate">{c.name}</div>
                    <div className="text-xs text-[var(--text-muted)]">{c.status}</div>
                  </div>
                  <div className="text-right text-xs shrink-0">
                    <div className="text-[var(--text-secondary)]">{c.cpu}</div>
                    <div className="text-[var(--text-muted)]">{c.memory}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cron Jobs */}
        <div className="card p-5">
          <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4">Cron Jobs</h3>
          {!data?.cronJobs || data.cronJobs.length === 0 ? (
            <div className="text-xs text-[var(--text-muted)]">No cron data available</div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.cronJobs.map((job, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                  <span className={`status-dot ${job.errors > 0 ? "error" : "active"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-[var(--text-primary)] truncate">{job.name}</div>
                    <div className="text-xs text-[var(--text-muted)]">next: {job.nextRun}</div>
                  </div>
                  {job.errors > 0 && (
                    <span className="shrink-0 text-xs text-red-400 font-bold">{job.errors}x</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="text-center text-xs text-[var(--text-muted)]">
        Auto-refreshes every 10s · Logs from /workspace/arb-watcher/logs/
      </div>
    </div>
  );
}
