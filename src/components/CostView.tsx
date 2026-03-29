"use client";

import { useState } from "react";

interface CostEntry {
  id: string;
  agent: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReads: number;
  cacheWrites: number;
  totalCost: number;
  color: string;
}

const sampleCosts: CostEntry[] = [
  {
    id: "1",
    agent: "Main Agent",
    model: "MiniMax M2.5",
    inputTokens: 125000,
    outputTokens: 89000,
    cacheReads: 45000,
    cacheWrites: 12000,
    totalCost: 0.58,
    color: "bg-purple-500",
  },
  {
    id: "2",
    agent: "Heartbeat Agent",
    model: "GPT-4.1",
    inputTokens: 45000,
    outputTokens: 32000,
    cacheReads: 0,
    cacheWrites: 0,
    totalCost: 0.82,
    color: "bg-blue-500",
  },
  {
    id: "3",
    agent: "Quality Check",
    model: "MiniMax M2.7",
    inputTokens: 78000,
    outputTokens: 56000,
    cacheReads: 28000,
    cacheWrites: 8000,
    totalCost: 0.45,
    color: "bg-green-500",
  },
  {
    id: "4",
    agent: "Dashboard Agent",
    model: "GPT-5.4",
    inputTokens: 23000,
    outputTokens: 18000,
    cacheReads: 0,
    cacheWrites: 0,
    totalCost: 0.35,
    color: "bg-orange-500",
  },
  {
    id: "5",
    agent: "Social Poster",
    model: "MiniMax M2.5",
    inputTokens: 15000,
    outputTokens: 12000,
    cacheReads: 5000,
    cacheWrites: 2000,
    totalCost: 0.12,
    color: "bg-pink-500",
  },
];

interface DailyMetric {
  label: string;
  value: string;
  change: string;
  positive: boolean;
}

const dailyMetrics: DailyMetric[] = [
  { label: "Total Cost", value: "$2.32", change: "+12%", positive: false },
  { label: "Input Tokens", value: "285K", change: "+8%", positive: false },
  { label: "Output Tokens", value: "207K", change: "+15%", positive: false },
  { label: "Cache Hit Rate", value: "34%", change: "+3%", positive: true },
];

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(0) + "K";
  return num.toString();
}

function calculatePercentage(value: number, total: number): number {
  return total > 0 ? (value / total) * 100 : 0;
}

export default function CostView() {
  const [costs] = useState<CostEntry[]>(sampleCosts);
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("day");

  const totalCost = costs.reduce((sum, c) => sum + c.totalCost, 0);
  const totalInput = costs.reduce((sum, c) => sum + c.inputTokens, 0);
  const totalOutput = costs.reduce((sum, c) => sum + c.outputTokens, 0);
  const totalCacheReads = costs.reduce((sum, c) => sum + c.cacheReads, 0);
  const totalCacheWrites = costs.reduce((sum, c) => sum + c.cacheWrites, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            Cost Tracking
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Monitor AI model costs
          </p>
        </div>
        <div className="segment-control">
          {(["day", "week", "month"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`segment-btn capitalize ${timeRange === range ? "active" : ""}`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        {dailyMetrics.map((metric, i) => (
          <div key={i} className="metric-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-bold text-[var(--text-primary)]">
                {metric.value}
              </span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  metric.positive
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {metric.change}
              </span>
            </div>
            <div className="metric-label">{metric.label}</div>
            <div className="progress-bar mt-3">
              <div
                className={`progress-fill ${metric.positive ? "bg-green-500" : "bg-purple-500"}`}
                style={{ width: "65%" }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Per-Agent Cost Breakdown */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
          Per-Agent Cost Breakdown
        </h3>
        <div className="space-y-4">
          {costs.map((entry) => {
            const inputPct = calculatePercentage(
              entry.inputTokens,
              totalInput + totalOutput,
            );
            const outputPct = calculatePercentage(
              entry.outputTokens,
              totalInput + totalOutput,
            );
            const cachePct = calculatePercentage(
              entry.cacheReads,
              totalInput + totalOutput,
            );

            return (
              <div key={entry.id} className="flex items-center gap-4">
                {/* Agent info */}
                <div className="w-40 flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full ${entry.color} flex items-center justify-center text-xs`}
                  >
                    🤖
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[var(--text-primary)]">
                      {entry.agent}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {entry.model}
                    </div>
                  </div>
                </div>

                {/* Stacked bar */}
                <div className="flex-1">
                  <div className="h-6 rounded-full bg-white/5 overflow-hidden flex">
                    <div
                      className="h-full bg-purple-500 transition-all"
                      style={{ width: `${inputPct}%` }}
                      title={`Input: ${formatNumber(entry.inputTokens)}`}
                    />
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${outputPct}%` }}
                      title={`Output: ${formatNumber(entry.outputTokens)}`}
                    />
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${cachePct}%` }}
                      title={`Cache: ${formatNumber(entry.cacheReads)}`}
                    />
                  </div>
                </div>

                {/* Cost */}
                <div className="w-24 text-right">
                  <div className="text-sm font-semibold text-green-500">
                    ${entry.totalCost.toFixed(2)}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    {((entry.totalCost / totalCost) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-xs text-[var(--text-muted)]">
              Input Tokens
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xs text-[var(--text-muted)]">
              Output Tokens
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-[var(--text-muted)]">
              Cache Reads
            </span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-5 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-purple-500">
            {formatNumber(totalInput)}
          </div>
          <div className="text-xs text-[var(--text-muted)]">Input Tokens</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-blue-500">
            {formatNumber(totalOutput)}
          </div>
          <div className="text-xs text-[var(--text-muted)]">Output Tokens</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-500">
            {formatNumber(totalCacheReads)}
          </div>
          <div className="text-xs text-[var(--text-muted)]">Cache Reads</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-orange-500">
            {formatNumber(totalCacheWrites)}
          </div>
          <div className="text-xs text-[var(--text-muted)]">Cache Writes</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            ${totalCost.toFixed(2)}
          </div>
          <div className="text-xs text-[var(--text-muted)]">Total Cost</div>
        </div>
      </div>
    </div>
  );
}
