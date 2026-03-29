"use client";

import { useState, useEffect } from "react";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  tags?: string[];
}

const columns = [
  { id: "backlog", label: "Backlog", color: "border-[var(--text-muted)]" },
  { id: "in-progress", label: "In Progress", color: "border-blue-500" },
  { id: "in-review", label: "In Review", color: "border-orange-500" },
  { id: "done", label: "Done", color: "border-green-500" },
];

const priorityColors: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500",
};

// Sample data
const sampleTasks: Task[] = [
  {
    id: "1",
    title: "Setup cron reminders",
    status: "backlog",
    priority: "medium",
  },
  {
    id: "2",
    title: "Update workspace docs",
    status: "backlog",
    priority: "low",
  },
  {
    id: "3",
    title: "Fix timezone bugs",
    status: "in-progress",
    priority: "high",
  },
  {
    id: "4",
    title: "Redesign dashboard",
    status: "in-progress",
    priority: "high",
  },
  {
    id: "5",
    title: "Cost tracking API",
    status: "in-review",
    priority: "medium",
  },
  {
    id: "6",
    title: "Calendar integration",
    status: "done",
    priority: "medium",
  },
  {
    id: "7",
    title: "Social posting scheduler",
    status: "done",
    priority: "low",
  },
  {
    id: "8",
    title: "Morning report automation",
    status: "done",
    priority: "high",
  },
];

export default function TaskBoardView() {
  const [tasks, setTasks] = useState<Task[]>(sampleTasks);

  useEffect(() => {
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((data) => {
        if (data.tasks && data.tasks.length > 0) {
          // Map cron jobs to tasks
          const mapped = data.tasks.map(
            (t: {
              id: string;
              title: string;
              status: string;
              priority: string;
            }) => ({
              id: t.id,
              title: t.title,
              status:
                t.status === "done"
                  ? "done"
                  : t.status === "todo"
                    ? "backlog"
                    : "in-progress",
              priority: t.priority,
            }),
          );
          setTasks(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const getTasksByStatus = (status: string) =>
    tasks.filter((t) => t.status === status);

  const total = tasks.length;
  const inProgress = tasks.filter((t) => t.status === "in-progress").length;
  const done = tasks.filter((t) => t.status === "done").length;
  const blocked = tasks.filter(
    (t) => t.priority === "high" && t.status !== "done",
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            Task Board
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Manage your workspace
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
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Export CSV
          </button>
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
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="metric-card">
          <div className="metric-value text-[var(--text-primary)]">{total}</div>
          <div className="metric-label">Total</div>
        </div>
        <div className="metric-card">
          <div className="metric-value text-blue-500">{inProgress}</div>
          <div className="metric-label">In Progress</div>
        </div>
        <div className="metric-card">
          <div className="metric-value text-green-500">{done}</div>
          <div className="metric-label">Completed</div>
        </div>
        <div className="metric-card">
          <div className="metric-value text-red-500">{blocked}</div>
          <div className="metric-label">Blocked</div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-4 gap-4">
        {columns.map((col) => {
          const colTasks = getTasksByStatus(col.id);
          return (
            <div key={col.id} className="space-y-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${col.color.replace("border", "bg")}`}
                />
                <span className="text-sm font-medium text-[var(--text-secondary)]">
                  {col.label}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-[var(--text-muted)]">
                  {colTasks.length}
                </span>
              </div>
              <div className="kanban-column">
                {colTasks.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] text-center py-8">
                    No tasks
                  </p>
                ) : (
                  colTasks.map((task) => (
                    <div key={task.id} className="task-card">
                      <p className="text-sm text-[var(--text-primary)] mb-2">
                        {task.title}
                      </p>
                      <div className="flex items-center justify-between">
                        <span
                          className={`w-2 h-2 rounded-full ${priorityColors[task.priority]}`}
                        />
                        <span
                          className={`badge ${task.priority === "high" ? "bg-red-500/20 text-red-400" : task.priority === "medium" ? "bg-yellow-500/20 text-yellow-400" : "bg-blue-500/20 text-blue-400"}`}
                        >
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Activity Feed */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
          Activity Feed
        </h3>
        <div className="space-y-3">
          {[
            {
              text: "Morning report generated",
              time: "2 min ago",
              color: "bg-green-500",
            },
            {
              text: "Daily backup completed",
              time: "15 min ago",
              color: "bg-blue-500",
            },
            {
              text: "Heartbeat cycle completed",
              time: "30 min ago",
              color: "bg-purple-500",
            },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className={`w-2 h-2 rounded-full ${item.color}`} />
              <span className="text-[var(--text-primary)]">{item.text}</span>
              <span className="text-[var(--text-muted)] ml-auto">
                {item.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
