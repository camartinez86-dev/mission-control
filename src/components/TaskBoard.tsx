"use client";

import { useState } from "react";

type TaskStatus = "todo" | "in-progress" | "done";

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: "low" | "medium" | "high";
}

const initialTasks: Task[] = [
  { id: "1", title: "Set up Next.js project", status: "done", priority: "high" },
  { id: "2", title: "Create dashboard layout", status: "in-progress", priority: "high" },
  { id: "3", title: "Add Task Board component", status: "todo", priority: "medium" },
  { id: "4", title: "Connect to OpenClaw API", status: "todo", priority: "high" },
  { id: "5", title: "Deploy to localhost", status: "todo", priority: "medium" },
];

const columns: { id: TaskStatus; label: string; color: string }[] = [
  { id: "todo", label: "To Do", color: "border-gray-500" },
  { id: "in-progress", color: "border-blue-500", label: "In Progress" },
  { id: "done", label: "Done", color: "border-green-500" },
];

export default function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const getTasksByStatus = (status: TaskStatus) =>
    tasks.filter((t) => t.status === status);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {columns.map((col) => (
        <div
          key={col.id}
          className={`bg-gray-800 rounded-lg p-4 border-t-4 ${col.color}`}
        >
          <h3 className="font-bold text-lg mb-4">{col.label}</h3>
          <div className="space-y-3">
            {getTasksByStatus(col.id).map((task) => (
              <div
                key={task.id}
                className="bg-gray-700 rounded p-3 hover:bg-gray-600 transition-colors cursor-pointer"
              >
                <p className="font-medium">{task.title}</p>
                <span
                  className={`text-xs px-2 py-0.5 rounded mt-2 inline-block ${
                    task.priority === "high"
                      ? "bg-red-900 text-red-300"
                      : task.priority === "medium"
                      ? "bg-yellow-900 text-yellow-300"
                      : "bg-gray-600 text-gray-300"
                  }`}
                >
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
