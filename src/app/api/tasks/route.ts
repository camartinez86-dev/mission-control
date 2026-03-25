import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { execSync } = require("child_process");
    
    let jobs = [];
    try {
      const output = execSync("openclaw cron list --json 2>/dev/null", { encoding: "utf8" });
      const data = JSON.parse(output);
      jobs = data.jobs || [];
    } catch (e) {
      jobs = [];
    }

    // Transform to tasks
    const tasks = jobs.map((job: any, idx: number) => ({
      id: job.id,
      title: job.name,
      status: job.state?.lastStatus === "ok" ? "done" : 
             job.schedule?.at && new Date(job.schedule.at) > new Date() ? "todo" : "in-progress",
      priority: job.name.toLowerCase().includes("payroll") || job.name.toLowerCase().includes("tesla") ? "high" : "medium",
    }));

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ tasks: [] }, { status: 500 });
  }
}
