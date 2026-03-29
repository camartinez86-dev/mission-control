"use client";

import { useState } from "react";

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

const sampleProjects: Project[] = [
  {
    id: "1",
    name: "Mission Control Dashboard",
    description: "Next.js dashboard with 8 views: Calendar, Tasks, Agents, Projects, Docs, Social, Logs, Cost. Dark theme with purple accents.",
    status: "active",
    progress: 75,
    tags: ["infrastructure", "frontend", "Next.js"],
    lastUpdate: "Today",
    link: "http://187.77.199.214:3000",
  },
  {
    id: "2",
    name: "OpenClaw Workspace",
    description: "Automated workspace with cron jobs: Daily Quality Check (4AM), Morning Report (7AM), GitHub Backup (3AM), Dashboard Improvements (2AM)",
    status: "active",
    progress: 90,
    tags: ["infrastructure", "automation"],
    lastUpdate: "Today",
  },
  {
    id: "3",
    name: "AllFashionMatters (eBay)",
    description: "eBay store selling Nike shoes, Sorel boots, gold watches, designer fashion. Top seller: athletic footwear.",
    status: "active",
    progress: 85,
    tags: ["ecommerce", "reselling"],
    lastUpdate: "Today",
    link: "https://www.ebay.com/usr/allfashionmatters",
  },
  {
    id: "4",
    name: "FYIFinds (TikTok/YouTube)",
    description: "Fitness lifestyle brand. 3 posts/week via Postiz (Mon/Wed/Fri), Newsletter Fridays. Content: Running Shoes, Workout Accessories, Designer Fashion.",
    status: "active",
    progress: 60,
    tags: ["social", "content", "TikTok", "YouTube"],
    lastUpdate: "Today",
    link: "https://www.youtube.com/channel/UCUcGM7G2tRh3eGBezCYMbfA",
  },
  {
    id: "5",
    name: "Larry TikTok Strategy",
    description: "Skill for automated TikTok slideshow marketing. Pipeline: Generate → Overlay → Post → Track → Iterate. Uses OpenAI images + Postiz.",
    status: "active",
    progress: 70,
    tags: ["automation", "marketing", "skill"],
    lastUpdate: "Today",
  },
  {
    id: "6",
    name: "Daily Quality Automation",
    description: "Automated checks: Cron validation, model configs, workspace staleness, file validity. Self-healing enabled.",
    status: "completed",
    progress: 100,
    tags: ["automation", "infrastructure"],
    lastUpdate: "Yesterday",
  },
  {
    id: "7",
    name: "Real Estate Goal (Madison WI)",
    description: "Goal: Buy multi-unit property in Madison, WI by 2026-2027. Currently saving/researching.",
    status: "planning",
    progress: 15,
    tags: ["investing", "real-estate"],
    lastUpdate: "2 days ago",
  },
  {
    id: "8",
    name: "Options Trading Setup",
    description: "Learn swing/day trading and start options trading. Research phase.",
    status: "planning",
    progress: 10,
    tags: ["investing", "trading"],
    lastUpdate: "1 week ago",
  },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  active: { bg: "bg-green-500/20", text: "text-green-400" },
  planning: { bg: "bg-yellow-500/20", text: "text-yellow-400" },
  completed: { bg: "bg-blue-500/20", text: "text-blue-400" },
  onhold: { bg: "bg-red-500/20", text: "text-red-400" },
};

const progressColors: Record<string, string> = {
  active: "bg-purple-500",
  planning: "bg-yellow-500",
  completed: "bg-green-500",
};

export default function ProjectsView() {
  const [projects] = useState<Project[]>(sampleProjects);
  const [filter, setFilter] = useState("all");

  const filteredProjects =
    filter === "all" ? projects : projects.filter((p) => p.status === filter);

  const total = projects.length;
  const active = projects.filter((p) => p.status === "active").length;
  const planning = projects.filter((p) => p.status === "planning").length;
  const completed = projects.filter((p) => p.status === "completed").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          Projects
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Track and manage your work
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="metric-card">
          <div className="metric-value text-[var(--text-primary)]">{total}</div>
          <div className="metric-label">Total Projects</div>
        </div>
        <div className="metric-card">
          <div className="metric-value text-green-500">{active}</div>
          <div className="metric-label">Active</div>
        </div>
        <div className="metric-card">
          <div className="metric-value text-yellow-500">{planning}</div>
          <div className="metric-label">Planning</div>
        </div>
        <div className="metric-card">
          <div className="metric-value text-blue-500">{completed}</div>
          <div className="metric-label">Completed</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        {["all", "active", "planning", "completed"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-[var(--accent-purple)] text-white"
                : "bg-white/5 text-[var(--text-secondary)] hover:bg-white/10"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-3 gap-4">
        {filteredProjects.map((project) => {
          const statusStyle =
            statusColors[project.status] || statusColors.onhold;
          const progressColor =
            progressColors[project.status] || progressColors.active;
          return (
            <div
              key={project.id}
              className="card p-5 hover:border-white/10 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  {project.name}
                </h3>
                <span className={`badge ${statusStyle.bg} ${statusStyle.text}`}>
                  {project.status}
                </span>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-4 line-clamp-2">
                {project.description}
              </p>

              {/* Progress */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[var(--text-muted)]">Progress</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {project.progress}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-fill ${progressColor}`}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-3">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-[var(--text-muted)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>Updated {project.lastUpdate}</span>
                {project.link && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300"
                  >
                    Visit →
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
