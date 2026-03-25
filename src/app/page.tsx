"use client";

import { useState } from "react";
import TaskBoard from "@/components/TaskBoard";
import Calendar from "@/components/Calendar";
import Projects from "@/components/Projects";
import Memories from "@/components/Memories";
import Docs from "@/components/Docs";
import Team from "@/components/Team";
import Office from "@/components/Office";

type TabId = "tasks" | "calendar" | "projects" | "memories" | "docs" | "team" | "office";

const tabs: { id: TabId; label: string; emoji: string }[] = [
  { id: "tasks", label: "Task Board", emoji: "📋" },
  { id: "calendar", label: "Calendar", emoji: "📅" },
  { id: "projects", label: "Projects", emoji: "📁" },
  { id: "memories", label: "Memories", emoji: "🧠" },
  { id: "docs", label: "Docs", emoji: "📄" },
  { id: "team", label: "Team", emoji: "👥" },
  { id: "office", label: "Office", emoji: "🏢" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("tasks");

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            🚀 Mission Control
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">MiniMax M2.5</span>
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-gray-800 border-b border-gray-700 px-6">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6">
        {activeTab === "tasks" && <TaskBoard />}
        {activeTab === "calendar" && <Calendar />}
        {activeTab === "projects" && <Projects />}
        {activeTab === "memories" && <Memories />}
        {activeTab === "docs" && <Docs />}
        {activeTab === "team" && <Team />}
        {activeTab === "office" && <Office />}
      </main>
    </div>
  );
}
