"use client";

import { useState } from "react";

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

interface Container {
  name: string;
  status: string;
  uptime: string;
  cpu: string;
  memory: string;
}

const sampleLogs: LogEntry[] = [
  {
    timestamp: "14:52:01",
    level: "INFO",
    message: "Gateway started successfully on ws://127.0.0.1:18789",
  },
  {
    timestamp: "14:52:02",
    level: "INFO",
    message: "Dashboard available at http://127.0.0.1:18789/",
  },
  {
    timestamp: "14:52:30",
    level: "INFO",
    message: "Cron job 'Daily Morning Report' completed in 44.5s",
  },
  {
    timestamp: "14:53:15",
    level: "WARN",
    message:
      "Session 'agent:main:telegram:direct:5548286268' taking longer than expected",
  },
  {
    timestamp: "14:54:00",
    level: "INFO",
    message: "Heartbeat cycle completed - 4 tasks executed",
  },
  {
    timestamp: "14:55:22",
    level: "ERROR",
    message: "Failed to fetch weather data: timeout after 10s",
  },
  {
    timestamp: "14:55:30",
    level: "INFO",
    message: "Retry successful for weather fetch",
  },
  {
    timestamp: "14:56:00",
    level: "INFO",
    message: "Cron job 'Daily GitHub Backup' completed in 12.2s",
  },
  {
    timestamp: "14:57:00",
    level: "INFO",
    message: "Quality check found 0 issues",
  },
  {
    timestamp: "14:58:00",
    level: "EVENT",
    message: "Telegram message received from Carlos Martinez",
  },
];

const sampleContainers: Container[] = [
  {
    name: "openclaw-gateway",
    status: "running",
    uptime: "2d 14h",
    cpu: "7.8%",
    memory: "635 MB",
  },
  {
    name: "mission-control",
    status: "running",
    uptime: "1d 3h",
    cpu: "2.1%",
    memory: "218 MB",
  },
  {
    name: "postgres-db",
    status: "running",
    uptime: "5d 8h",
    cpu: "1.2%",
    memory: "89 MB",
  },
];

const sampleJobs = [
  { name: "Daily Morning Report", nextRun: "in 4 hours", status: "ok" },
  { name: "GitHub Workspace Backup", nextRun: "in 6 hours", status: "ok" },
  { name: "Quality Check", nextRun: "in 8 hours", status: "ok" },
  { name: "Payroll P8 Due", nextRun: "in 12 hours", status: "ok" },
];

const levelColors: Record<string, string> = {
  INFO: "text-blue-400",
  WARN: "text-yellow-400",
  ERROR: "text-red-400",
  EVENT: "text-purple-400",
};

export default function LogsView() {
  const [activeTab, setActiveTab] = useState<
    "all" | "errors" | "warnings" | "info" | "events"
  >("all");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const filteredLogs =
    activeTab === "all"
      ? sampleLogs
      : sampleLogs.filter((log) => {
          if (activeTab === "errors") return log.level === "ERROR";
          if (activeTab === "warnings") return log.level === "WARN";
          if (activeTab === "info") return log.level === "INFO";
          if (activeTab === "events") return log.level === "EVENT";
          return true;
        });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            Logs
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            System logs and monitoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-3 py-1.5 rounded-lg bg-white/5 text-sm text-[var(--text-secondary)] hover:bg-white/10 flex items-center gap-2">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            Refresh
          </button>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 ${
              autoRefresh
                ? "bg-green-500/20 text-green-400"
                : "bg-white/5 text-[var(--text-secondary)]"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${autoRefresh ? "bg-green-500 animate-pulse" : "bg-gray-500"}`}
            />
            Auto-refresh
          </button>
        </div>
      </div>

      {/* Log Viewer */}
      <div className="card p-4">
        {/* Tabs */}
        <div className="segment-control mb-4">
          {(["all", "errors", "warnings", "info", "events"] as const).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`segment-btn capitalize ${activeTab === tab ? "active" : ""}`}
              >
                {tab}
              </button>
            ),
          )}
        </div>

        {/* Log entries */}
        <div className="bg-black/50 rounded-lg p-4 font-mono text-xs h-80 overflow-y-auto">
          {filteredLogs.map((log, i) => (
            <div
              key={i}
              className="flex gap-3 py-1 hover:bg-white/5 px-2 -mx-2 rounded"
            >
              <span className="text-[var(--text-muted)]">{log.timestamp}</span>
              <span className={`font-semibold ${levelColors[log.level]}`}>
                [{log.level}]
              </span>
              <span className="text-[var(--text-secondary)] flex-1">
                {log.message}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Containers & Jobs */}
      <div className="grid grid-cols-2 gap-4">
        {/* Containers */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
            Containers
          </h3>
          <div className="space-y-2">
            {sampleContainers.map((container, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5"
              >
                <span
                  className={`status-dot ${container.status === "running" ? "active" : "error"}`}
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {container.name}
                  </span>
                </div>
                <div className="text-right text-xs">
                  <div className="text-[var(--text-secondary)]">
                    {container.cpu}
                  </div>
                  <div className="text-[var(--text-muted)]">
                    {container.memory}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scheduled Jobs */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
            Scheduled Jobs
          </h3>
          <div className="space-y-2">
            {sampleJobs.map((job, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5"
              >
                <span
                  className={`status-dot ${job.status === "ok" ? "active" : "warning"}`}
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {job.name}
                  </span>
                </div>
                <span className="text-xs text-[var(--text-muted)]">
                  {job.nextRun}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
