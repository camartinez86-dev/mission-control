import { NextResponse } from "next/server";
import { execSync } from "child_process";

interface Job {
  id: string;
  name: string;
  schedule?: { at?: string };
  state?: { lastStatus?: string };
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
}

export async function GET() {
  try {
    let jobs: Job[] = [];
    try {
      const output = execSync("openclaw cron list --json 2>/dev/null", {
        encoding: "utf8",
      });
      const data = JSON.parse(output);
      jobs = data.jobs || [];
    } catch {
      jobs = [];
    }

    // Transform to tasks
    const tasks: Task[] = jobs.map((job) => ({
      id: job.id,
      title: job.name,
      status:
        job.state?.lastStatus === "ok"
          ? "done"
          : job.schedule?.at && new Date(job.schedule.at) > new Date()
            ? "todo"
            : "in-progress",
      priority:
        job.name.toLowerCase().includes("payroll") ||
        job.name.toLowerCase().includes("tesla")
          ? "high"
          : "medium",
    }));

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ tasks: [] }, { status: 500 });
  }
}
