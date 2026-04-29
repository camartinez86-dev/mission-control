import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync, statSync } from "fs";
import { execSync } from "child_process";

const WORKSPACE = "/root/.openclaw/workspace";

const LOG_FILES: Record<string, string> = {
  "edge-hunter": `${WORKSPACE}/arb-watcher/logs/edge-hunter.log`,
  "arb-watcher": `${WORKSPACE}/arb-watcher/logs/arb-watcher.log`,
  "news-monitor": `${WORKSPACE}/arb-watcher/logs/news_monitor.log`,
  "health-check": `${WORKSPACE}/arb-watcher/logs/health-check.log`,
  "analysis":     `${WORKSPACE}/arb-watcher/logs/analysis.log`,
};

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  source: string;
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

function parseLogLine(line: string, source: string): LogEntry | null {
  if (!line.trim()) return null;

  // Format: 2026-04-29 04:31:04,295 [INFO] Message
  const m = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})[,\d]* \[(\w+)\] (.+)/);
  if (m) {
    return {
      timestamp: m[1].slice(11), // just HH:MM:SS
      level: m[2].toUpperCase(),
      message: m[3].trim(),
      source,
    };
  }

  // Fallback: treat entire line as INFO
  return {
    timestamp: new Date().toTimeString().slice(0, 8),
    level: "INFO",
    message: line.trim(),
    source,
  };
}

function readLastLines(path: string, n: number): string[] {
  if (!existsSync(path)) return [];
  try {
    const content = readFileSync(path, "utf-8");
    const lines = content.split("\n").filter(Boolean);
    return lines.slice(-n);
  } catch {
    return [];
  }
}

function getContainers(): ContainerInfo[] {
  const containers = [
    { name: "edge-hunter", id: "edge-hunter" },
    { name: "openclaw", id: "openclaw-tbz9" },
  ];

  return containers.map((c) => {
    try {
      const stats = execSync(
        `docker stats ${c.id} --no-stream --format "{{.CPUPerc}}|{{.MemUsage}}" 2>/dev/null`,
        { timeout: 3000 }
      ).toString().trim();

      if (stats) {
        const [cpu, mem] = stats.split("|");
        return { name: c.name, status: "running", cpu: cpu.trim(), memory: mem.split("/")[0].trim() };
      }
    } catch {
      // ignore
    }
    return { name: c.name, status: "unknown", cpu: "—", memory: "—" };
  });
}

function getCronJobs(): CronJob[] {
  try {
    const out = execSync("openclaw cron list --json 2>/dev/null", { timeout: 5000 }).toString();
    const data = JSON.parse(out);
    const jobs: CronJob[] = (data.jobs ?? data).slice(0, 8).map((j: Record<string, unknown>) => ({
      name: (j.name as string) ?? "Unknown",
      nextRun: (j.nextRunAt as string) ? new Date(j.nextRunAt as string).toLocaleTimeString() : "—",
      lastStatus: (j.lastRunStatus as string) ?? "unknown",
      errors: (j.consecutiveErrors as number) ?? 0,
    }));
    return jobs;
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source") ?? "all";
  const limit = parseInt(searchParams.get("limit") ?? "100");

  // Gather logs
  const entries: LogEntry[] = [];

  if (source === "all") {
    for (const [name, path] of Object.entries(LOG_FILES)) {
      const lines = readLastLines(path, Math.floor(limit / Object.keys(LOG_FILES).length));
      for (const line of lines) {
        const entry = parseLogLine(line, name);
        if (entry) entries.push(entry);
      }
    }
    // Sort by timestamp desc
    entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  } else {
    const path = LOG_FILES[source];
    if (path) {
      const lines = readLastLines(path, limit);
      for (const line of lines) {
        const entry = parseLogLine(line, source);
        if (entry) entries.push(entry);
      }
      entries.reverse(); // most recent first
    }
  }

  // Log file sizes for info
  const logFiles = Object.entries(LOG_FILES).map(([name, path]) => ({
    name,
    exists: existsSync(path),
    size: existsSync(path) ? Math.round(statSync(path).size / 1024) + "KB" : "—",
  }));

  const containers = getContainers();
  const cronJobs = getCronJobs();

  return NextResponse.json({
    logs: entries.slice(0, limit),
    logFiles,
    containers,
    cronJobs,
    generatedAt: new Date().toISOString(),
  });
}
