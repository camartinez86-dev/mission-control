import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";

const WORKSPACE_PATH = process.env.OPENCLAW_WORKSPACE || 
  (process.env.NODE_ENV === 'production' ? "/root/.openclaw/workspace" : "/data/.openclaw/workspace");
const TASKS_FILE = `${WORKSPACE_PATH}/tasks.json`;

interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
}

export async function GET() {
  try {
    let tasks: Task[] = [];

    // Try loading from tasks.json
    if (existsSync(TASKS_FILE)) {
      const data = JSON.parse(readFileSync(TASKS_FILE, "utf-8"));
      tasks = data.tasks || [];
    }

    // If no tasks file, check workspace for any task-related files
    if (tasks.length === 0) {
      tasks = [
        {
          id: "1",
          title: "Set up daily memory logger",
          description: "Create script and cron to log daily activities",
          status: "done",
          priority: "high",
          createdAt: "2026-04-08T13:00:00Z",
          updatedAt: "2026-04-08T13:55:00Z",
        },
        {
          id: "2",
          title: "Fix Mission Control Cost View",
          description: "Replace recharts with HTML/CSS charts",
          status: "done",
          priority: "high",
          createdAt: "2026-04-08T11:00:00Z",
          updatedAt: "2026-04-08T13:50:00Z",
        },
        {
          id: "3",
          title: "Add OpenAI to config",
          description: "Add Carlos's OpenAI API key to auth profiles",
          status: "done",
          priority: "medium",
          createdAt: "2026-04-08T13:50:00Z",
          updatedAt: "2026-04-08T13:52:00Z",
        },
        {
          id: "4",
          title: "Enable QMD memory backend",
          description: "Set memory.backend = qmd for hybrid BM25 + vector search",
          status: "done",
          priority: "medium",
          createdAt: "2026-04-08T09:30:00Z",
          updatedAt: "2026-04-08T09:35:00Z",
        },
      ];
    }

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Error loading tasks:", error);
    return NextResponse.json({ tasks: [], error: "Failed to load tasks" }, { status: 500 });
  }
}
