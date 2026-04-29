"use client";

import { useState, useEffect } from "react";

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  tags: string[];
  lastUpdate: string;
  link?: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  active:    { bg: "bg-green-500/20",  text: "text-green-400"  },
  planning:  { bg: "bg-yellow-500/20", text: "text-yellow-400" },
  completed: { bg: "bg-blue-500/20",   text: "text-blue-400"   },
  onhold:    { bg: "bg-red-500/20",    text: "text-red-400"    },
};

const progressColors: Record<string, string> = {
  active:    "bg-purple-500",
  planning:  "bg-yellow-500",
  completed: "bg-green-500",
};

function formatDate(d: string) {
  if (!d || d.includes("ago") || d === "Today" || d === "Yesterday") return d;
  try {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return d; }
}

export default function ProjectsView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/projects")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setProjects(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredProjects = filter === "all" ? projects : projects.filter(p => p.status === filter);

  const active    = projects.filter(p => p.status === "active").length;
  const planning  = projects.filter(p => p.status === "planning").length;
  const completed = projects.filter(p => p.status === "completed").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">🗂 Projects</h2>
          <p className="text-sm text-[var(--text-secondary)]">Carlos&apos;s active ventures &amp; goals</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="metric-card">
          <div className="metric-value">{projects.length}</div>
          <div className="metric-label">Total</div>
        </div>
        <div className="metric-card">
          <div className="metric-value text-green-400">{active}</div>
          <div className="metric-label">Active</div>
        </div>
        <div className="metric-card">
          <div className="metric-value text-yellow-400">{planning}</div>
          <div className="metric-label">Planning</div>
        </div>
        <div className="metric-card">
          <div className="metric-value text-blue-400">{completed}</div>
          <div className="metric-label">Completed</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        {["all", "active", "planning", "completed", "onhold"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-[var(--accent-purple)] text-white"
                : "bg-white/5 text-[var(--text-secondary)] hover:bg-white/10"
            }`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="text-[var(--text-secondary)] animate-pulse">Loading projects…</div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="card p-8 text-center text-[var(--text-muted)]">No projects in this category.</div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filteredProjects.map(project => {
            const style = statusColors[project.status] ?? statusColors.onhold;
            const bar   = progressColors[project.status] ?? "bg-purple-500";
            return (
              <div key={project.id} className="card p-5 hover:border-white/10 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-base font-semibold text-[var(--text-primary)] flex-1 pr-2">{project.name}</h3>
                  <span className={`badge ${style.bg} ${style.text} shrink-0`}>{project.status}</span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-4 line-clamp-2">{project.description}</p>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[var(--text-muted)]">Progress</span>
                    <span className="font-medium text-[var(--text-primary)]">{project.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className={`progress-fill ${bar}`} style={{ width: `${project.progress}%` }} />
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {project.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-[var(--text-muted)]">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <span>Updated {formatDate(project.lastUpdate)}</span>
                  {project.link && (
                    <a href={project.link} target="_blank" rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300">Visit →</a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="text-center text-xs text-[var(--text-muted)]">
        Sourced from /workspace/projects.json · edit to add/update projects
      </div>
    </div>
  );
}
