"use client";

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

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: "calendar", label: "Calendar", icon: "📅" },
  { id: "tasks", label: "Task Board", icon: "📋" },
  { id: "memory", label: "Memory", icon: "🧠" },
  { id: "agents", label: "Agents", icon: "🤖" },
  { id: "projects", label: "Projects", icon: "📁" },
  { id: "docs", label: "Docs", icon: "📄" },
  { id: "social", label: "Social", icon: "📱" },
  { id: "logs", label: "Logs", icon: "📊" },
  { id: "cost", label: "Cost", icon: "💰" },
  { id: "arb", label: "Arb Watcher", icon: "📈" },
  { id: "trading", label: "Trading", icon: "📊" },
  { id: "fyifinds", label: "FYIFinds", icon: "📱" },
  { id: "selfpatch", label: "Self-Patch", icon: "🔧" },
];

const statusItems = [
  { label: "Always Running", color: "bg-green-500" },
  { label: "3 Active Sessions", color: "bg-blue-500" },
];

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="w-56 bg-[var(--bg-card)] border-r border-white/5 flex flex-col">
      {/* Logo / Header */}
      <div className="p-4 border-b border-white/5">
        <h1 className="text-lg font-bold text-[var(--text-primary)]">
          🚀 Mission Control
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          OpenClaw Dashboard
        </p>
      </div>

      {/* Status indicators */}
      <div className="p-4 space-y-2">
        {statusItems.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${item.color}`} />
            <span className="text-xs text-[var(--text-secondary)]">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-3 py-2">
          Workspace
        </div>
        {tabs.slice(0, 6).map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`nav-item w-full ${activeTab === tab.id ? "active" : ""}`}
          >
            <span className="text-base">{tab.icon}</span>
            <span className="text-sm">{tab.label}</span>
          </button>
        ))}

        <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-3 py-2 mt-4">
          System
        </div>
        {tabs.slice(6).map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`nav-item w-full ${activeTab === tab.id ? "active" : ""}`}
          >
            <span className="text-base">{tab.icon}</span>
            <span className="text-sm">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-sm">
            👤
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
              Carlos
            </p>
            <p className="text-xs text-[var(--text-muted)]">Online</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
