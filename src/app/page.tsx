"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import CalendarView from "@/components/CalendarView";
import TaskBoardView from "@/components/TaskBoardView";
import AgentsView from "@/components/AgentsView";
import ProjectsView from "@/components/ProjectsView";
import DocsView from "@/components/DocsView";
import SocialView from "@/components/SocialView";
import MemoryView from "@/components/MemoryView";
import LogsView from "@/components/LogsView";
import CostView from "@/components/CostView";

type TabId =
  | "calendar"
  | "tasks"
  | "agents"
  | "projects"
  | "docs"
  | "memory"
  | "social"
  | "logs"
  | "cost";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("calendar");

  return (
    <div className="flex h-screen bg-[var(--bg-base)]">
      {/* Left Sidebar Navigation */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 pb-20">
          {activeTab === "calendar" && <CalendarView />}
          {activeTab === "tasks" && <TaskBoardView />}
          {activeTab === "agents" && <AgentsView />}
          {activeTab === "projects" && <ProjectsView />}
          {activeTab === "docs" && <DocsView />}
          {activeTab === "memory" && <MemoryView />}
          {activeTab === "social" && <SocialView />}
          {activeTab === "logs" && <LogsView />}
          {activeTab === "cost" && <CostView />}
        </div>
      </main>

      {/* Floating PIP Avatar */}
      <div className="pip-overlay">
        <div className="w-full h-full rounded-full bg-[var(--bg-card)] flex items-center justify-center text-2xl">
          🤖
        </div>
      </div>

      {/* Floating Action Button */}
      <button className="fab">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  );
}
