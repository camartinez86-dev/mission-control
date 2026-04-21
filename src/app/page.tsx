"use client";

import { useState, Component, ReactNode } from "react";
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
import ArbView from "@/components/ArbView";
import TradingView from "@/components/TradingView";
import FYIFindsView from "@/components/FYIFindsView";
import SelfPatchView from "@/components/SelfPatchView";

type TabId =
  | "calendar"
  | "tasks"
  | "agents"
  | "projects"
  | "docs"
  | "memory"
  | "social"
  | "logs"
  | "cost"
  | "arb"
  | "trading"
  | "fyifinds"
  | "selfpatch";

class ErrorBoundary extends Component<{ children: ReactNode; label: string }, { error: Error | null }> {
  constructor(props: { children: ReactNode; label: string }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="p-8 text-red-400">
          <div className="font-bold mb-2">⚠️ {this.props.label} crashed</div>
          <div className="text-sm font-mono bg-white/5 p-3 rounded">{this.state.error.message}</div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
          <ErrorBoundary label="Calendar">
            {activeTab === "calendar" && <CalendarView />}
          </ErrorBoundary>
          <ErrorBoundary label="Task Board">
            {activeTab === "tasks" && <TaskBoardView />}
          </ErrorBoundary>
          <ErrorBoundary label="Agents">
            {activeTab === "agents" && <AgentsView />}
          </ErrorBoundary>
          <ErrorBoundary label="Projects">
            {activeTab === "projects" && <ProjectsView />}
          </ErrorBoundary>
          <ErrorBoundary label="Docs">
            {activeTab === "docs" && <DocsView />}
          </ErrorBoundary>
          <ErrorBoundary label="Memory">
            {activeTab === "memory" && <MemoryView />}
          </ErrorBoundary>
          <ErrorBoundary label="Social">
            {activeTab === "social" && <SocialView />}
          </ErrorBoundary>
          <ErrorBoundary label="Logs">
            {activeTab === "logs" && <LogsView />}
          </ErrorBoundary>
          <ErrorBoundary label="Cost">
            {activeTab === "cost" && <CostView />}
          </ErrorBoundary>
          <ErrorBoundary label="Arb Watcher">
            {activeTab === "arb" && <ArbView />}
          </ErrorBoundary>
          <ErrorBoundary label="Trading">
            {activeTab === "trading" && <TradingView />}
          </ErrorBoundary>
          <ErrorBoundary label="FYIFinds">
            {activeTab === "fyifinds" && <FYIFindsView />}
          </ErrorBoundary>
          <ErrorBoundary label="SelfPatch">
            {activeTab === "selfpatch" && <SelfPatchView />}
          </ErrorBoundary>
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
