import { NextResponse } from "next/server";
import { execSync } from "child_process";

interface Job {
  id: string;
  name: string;
  schedule?: { at?: string };
  state?: { nextRunAtMs?: number; lastStatus?: string };
  enabled?: boolean;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string | null;
  time: string | null;
  type: string;
  status: string;
  nextRun: string | null;
}

export async function GET() {
  try {
    // Get cron jobs from OpenClaw CLI
    let jobs: Job[] = [];
    try {
      const output = execSync("openclaw cron list --json 2>/dev/null", {
        encoding: "utf8",
      });
      jobs = JSON.parse(output).jobs || [];
    } catch {
      // Fallback: try reading from gateway cron file
      jobs = [];
    }

    // Transform jobs for calendar
    const events: CalendarEvent[] = jobs.map((job) => ({
      id: job.id,
      title: job.name,
      date: job.schedule?.at
        ? new Date(job.schedule.at).toISOString().split("T")[0]
        : null,
      time: job.schedule?.at
        ? new Date(job.schedule.at).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : null,
      type: job.name.toLowerCase().includes("payroll")
        ? "payroll"
        : job.name.toLowerCase().includes("reminder")
          ? "reminder"
          : "scheduled",
      status: job.enabled ? "active" : "inactive",
      nextRun: job.state?.nextRunAtMs
        ? new Date(job.state.nextRunAtMs).toISOString()
        : null,
    }));

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ events: [] }, { status: 500 });
  }
}
