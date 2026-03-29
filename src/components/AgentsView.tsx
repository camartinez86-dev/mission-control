"use client";

import { useState } from "react";

interface Agent {
  id: string;
  name: string;
  role: string;
  status: string;
  model: string;
  sessions: number;
  cost: number;
}

const sampleAgents: Agent[] = [
  {
    id: "1",
    name: "Main Agent",
    role: "Primary conversation (Telegram)",
    status: "active",
    model: "MiniMax M2.5",
    sessions: 12,
    cost: 0,
  },
  {
    id: "2",
    name: "Daily Quality Check",
    role: "Cron job - Workspace validation",
    status: "active",
    model: "MiniMax M2.5",
    sessions: 1,
    cost: 0,
  },
  {
    id: "3",
    name: "Morning Report",
    role: "Cron job - News & weather",
    status: "scheduled",
    model: "MiniMax M2.5",
    sessions: 1,
    cost: 0,
  },
  {
    id: "4",
    name: "Dashboard Improvements",
    role: "Cron job - Nightly updates",
    status: "scheduled",
    model: "MiniMax M2.5",
    sessions: 1,
    cost: 0,
  },
  {
    id: "5",
    name: "FYIFinds Content",
    role: "Cron job - Mon/Wed/Fri",
    status: "scheduled",
    model: "MiniMax M2.5",
    sessions: 1,
    cost: 0,
  },
  {
    id: "6",
    name: "Lossless Claw",
    role: "Memory persistence (plugin)",
    status: "active",
    model: "SQLite",
    sessions: 0,
    cost: 0,
  },
  {
    id: "7",
    name: "Gateway",
    role: "OpenClaw API server",
    status: "active",
    model: "HTTP",
    sessions: 0,
    cost: 0,
  },
];

const statusColors: Record<string, string> = {
  active: "bg-green-500",
  scheduled: "bg-blue-500",
  standby: "bg-yellow-500",
  error: "bg-red-500",
};

export default function AgentsView() {
  const [agents] = useState<Agent[]>(sampleAgents);

  const totalSessions = agents.reduce((sum, a) => sum + a.sessions, 0);
  const activeAgents = agents.filter((a) => a.status === "active").length;
  const scheduledAgents = agents.filter((a) => a.status === "scheduled").length;
  const totalCost = agents.reduce((sum, a) => sum + a.cost, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            Agents
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            System components and scheduled tasks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="status-dot active" />
          <span className="text-sm text-[var(--text-secondary)]">
            All Systems Operational
          </span>
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-4 gap-4">
        <div className="metric-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl font-bold text-[var(--text-primary)]">
              {activeAgents}
            </span>
            <span className="text-2xl">✅</span>
          </div>
          <div className="metric-label">Active</div>
        </div>
        <div className="metric-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl font-bold text-blue-500">
              {scheduledAgents}
            </span>
            <span className="text-2xl">📅</span>
          </div>
          <div className="metric-label">Scheduled</div>
        </div>
        <div className="metric-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl font-bold text-[var(--text-primary)]">
              {totalSessions}
            </span>
            <span className="text-2xl">💬</span>
          </div>
          <div className="metric-label">Sessions Today</div>
        </div>
        <div className="metric-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl font-bold text-green-500">
              ${totalCost.toFixed(2)}
            </span>
            <span className="text-2xl">💰</span>
          </div>
          <div className="metric-label">AI Cost Today</div>
        </div>
      </div>

      {/* System Components */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
          System Components
        </h3>
        <div className="space-y-3">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="flex items-center gap-4 p-3 rounded-lg bg-white/5 hover:bg-white/5"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-sm">
                {agent.role.includes("plugin") ? "💾" : 
                 agent.role.includes("Cron") ? "⏰" :
                 agent.role.includes("Gateway") ? "🌐" : "🤖"}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {agent.name}
                  </span>
                  <div className={`w-2 h-2 rounded-full ${statusColors[agent.status]}`} />
                  <span className="text-xs text-[var(--text-muted)]">
                    {agent.status}
                  </span>
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  {agent.role}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  {agent.model}
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  {agent.sessions > 0 ? `${agent.sessions} session${agent.sessions > 1 ? 's' : ''}` : 'Running'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-green-500">
                  ${agent.cost.toFixed(2)}
                </div>
                <div className="text-xs text-[var(--text-muted)]">today</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Up Next */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
          Up Next (Cron Schedule)
        </h3>
        <div className="space-y-3">
          {[
            {
              text: "Daily Dashboard Improvement",
              time: "2:00 AM Chicago",
              color: "bg-purple-500",
              day: "Daily",
            },
            {
              text: "GitHub Workspace Backup",
              time: "3:00 AM Chicago",
              color: "bg-blue-500",
              day: "Daily",
            },
            {
              text: "Daily Quality Check",
              time: "4:00 AM Chicago",
              color: "bg-green-500",
              day: "Daily",
            },
            {
              text: "Morning Report",
              time: "7:00 AM Chicago",
              color: "bg-orange-500",
              day: "Daily",
            },
            {
              text: "FYIFinds Content Reminder",
              time: "7:00 AM Chicago",
              color: "bg-pink-500",
              day: "Mon/Wed/Fri",
            },
            {
              text: "Inspection Appointment",
              time: "10:00 AM Chicago",
              color: "bg-cyan-500",
              day: "Mar 30",
            },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded ${item.color}`} />
              <span className="flex-1 text-sm text-[var(--text-primary)]">
                {item.text}
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                {item.day} {item.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
