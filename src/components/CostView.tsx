"use client";

import { useState, useEffect } from "react";

interface CostEntry {
  date: string;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  cacheReads: number;
  cacheWrites: number;
  cost: number;
}

interface DailyTotal {
  cost: number;
  input: number;
  output: number;
  cacheReads: number;
  cacheWrites: number;
}

interface ModelBreakdown {
  cost: number;
  input: number;
  output: number;
  provider: string;
}

interface BudgetStatus {
  minimax: {
    limit: number;
    used: number;
    remaining: number;
    percentUsed: number;
  };
}

interface CostData {
  dailyTotals: Record<string, DailyTotal>;
  byModel: Record<string, ModelBreakdown>;
  totalCost: number;
  totalInput: number;
  totalOutput: number;
  lastUpdated: string | null;
  budgetStatus: BudgetStatus;
  recentEntries: CostEntry[];
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(0) + "K";
  return num.toString();
}

function formatCurrency(amount: number): string {
  if (amount >= 1) return "$" + amount.toFixed(2);
  return "$" + amount.toFixed(4);
}

function calculatePercentage(value: number, total: number): number {
  return total > 0 ? (value / total) * 100 : 0;
}

const modelColors: Record<string, string> = {
  "MiniMax-M2.7": "bg-purple-500",
  "nexos:gpt-5-4": "bg-blue-500",
  "default": "bg-gray-500",
};

const modelLabels: Record<string, string> = {
  "MiniMax-M2.7": "MiniMax M2.7",
  "nexos:gpt-5-4": "Nexos GPT 5 4",
  "default": "Other",
};

export default function CostView() {
  const [costData, setCostData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("day");

  useEffect(() => {
    fetchCostData();
  }, [timeRange]);

  const fetchCostData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/cost");
      if (!res.ok) throw new Error("Failed to fetch cost data");
      const data = await res.json();
      setCostData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--text-secondary)]">Loading cost data...</div>
      </div>
    );
  }

  if (error || !costData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">Error: {error || "No data"}</div>
      </div>
    );
  }

  const totalCost = costData.totalCost;
  const totalInput = costData.totalInput;
  const totalOutput = costData.totalOutput;
  const totalCacheReads = Object.values(costData.dailyTotals).reduce((sum, d) => sum + d.cacheReads, 0);
  const totalCacheWrites = Object.values(costData.dailyTotals).reduce((sum, d) => sum + d.cacheWrites, 0);
  const budget = costData.budgetStatus.minimax;
  const budgetPercent = budget.percentUsed;
  const isBudgetWarning = budgetPercent > 75;
  const isBudgetCritical = budgetPercent > 90;

  // Get dates for the selected range
  const today = new Date();
  const dateKeys = Object.keys(costData.dailyTotals).sort().reverse();
  const filteredDates = dateKeys.slice(0, timeRange === "day" ? 1 : timeRange === "week" ? 7 : 30);
  const rangeTotalCost = filteredDates.reduce((sum, date) => sum + (costData.dailyTotals[date]?.cost || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            Cost Tracking
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {costData.lastUpdated ? `Last updated: ${new Date(costData.lastUpdated).toLocaleString()}` : "Real-time usage data"}
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

      {/* Budget Alert */}
      {isBudgetWarning && (
        <div className={`card p-4 border-2 ${isBudgetCritical ? "border-red-500" : "border-yellow-500"}`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{isBudgetCritical ? "🚨" : "⚠️"}</span>
            <div>
              <div className="font-semibold text-[var(--text-primary)]">
                {isBudgetCritical ? "MiniMax Budget Critical!" : "MiniMax Budget Warning"}
              </div>
              <div className="text-sm text-[var(--text-secondary)]">
                Used {budget.used.toFixed(2)} of ${budget.limit} ({budgetPercent.toFixed(1)}%) — {budget.remaining.toFixed(2)} remaining
              </div>
            </div>
          </div>
          <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full transition-all ${isBudgetCritical ? "bg-red-500" : "bg-yellow-500"}`}
              style={{ width: `${Math.min(100, budgetPercent)}%` }}
            />
          </div>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="metric-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl font-bold text-[var(--text-primary)]">
              {formatCurrency(rangeTotalCost)}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${rangeTotalCost > 1 ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
              {timeRange}
            </span>
          </div>
          <div className="metric-label">Total Cost ({timeRange})</div>
          <div className="progress-bar mt-3">
            <div
              className="progress-fill bg-purple-500"
              style={{ width: `${Math.min(100, rangeTotalCost * 10)}%` }}
            />
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl font-bold text-[var(--text-primary)]">
              {formatNumber(totalInput)}
            </span>
          </div>
          <div className="metric-label">Input Tokens</div>
          <div className="progress-bar mt-3">
            <div
              className="progress-fill bg-purple-500"
              style={{ width: "45%" }}
            />
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl font-bold text-[var(--text-primary)]">
              {formatNumber(totalOutput)}
            </span>
          </div>
          <div className="metric-label">Output Tokens</div>
          <div className="progress-bar mt-3">
            <div
              className="progress-fill bg-blue-500"
              style={{ width: "35%" }}
            />
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl font-bold text-green-500">
              {totalCacheReads > 0 ? ((totalCacheReads / (totalInput + totalOutput)) * 100).toFixed(0) + "%" : "N/A"}
            </span>
          </div>
          <div className="metric-label">Cache Hit Rate</div>
          <div className="progress-bar mt-3">
            <div
              className="progress-fill bg-green-500"
              style={{ width: `${(totalCacheReads / (totalInput + totalOutput)) * 100 || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Per-Model Cost Breakdown */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
          Per-Model Cost Breakdown
        </h3>
        
        {Object.keys(costData.byModel).length === 0 ? (
          <div className="text-center py-8 text-[var(--text-muted)]">
            No usage data yet. Costs will appear as you use the bot.
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(costData.byModel).map(([model, data]) => {
              const color = modelColors[model] || modelColors.default;
              const label = modelLabels[model] || model;
              const inputPct = calculatePercentage(data.input, totalInput + totalOutput);
              const outputPct = calculatePercentage(data.output, totalInput + totalOutput);

              return (
                <div key={model} className="flex items-center gap-4">
                  {/* Model info */}
                  <div className="w-48 flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-xs`}
                    >
                      🤖
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[var(--text-primary)]">
                        {label}
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {data.provider}
                      </div>
                    </div>
                  </div>

                  {/* Stacked bar */}
                  <div className="flex-1">
                    <div className="h-6 rounded-full bg-white/5 overflow-hidden flex">
                      <div
                        className="h-full bg-purple-500 transition-all"
                        style={{ width: `${inputPct}%` }}
                        title={`Input: ${formatNumber(data.input)}`}
                      />
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${outputPct}%` }}
                        title={`Output: ${formatNumber(data.output)}`}
                      />
                    </div>
                  </div>

                  {/* Cost */}
                  <div className="w-24 text-right">
                    <div className="text-sm font-semibold text-green-500">
                      {formatCurrency(data.cost)}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {totalCost > 0 ? ((data.cost / totalCost) * 100).toFixed(0) + "%" : "0%"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-xs text-[var(--text-muted)]">Input Tokens</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xs text-[var(--text-muted)]">Output Tokens</span>
          </div>
        </div>
      </div>

      {/* Daily Breakdown */}
      {dateKeys.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
            Daily Usage
          </h3>
          <div className="space-y-2">
            {dateKeys.slice(0, 7).map((date) => {
              const day = costData.dailyTotals[date];
              return (
                <div key={date} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <span className="text-sm text-[var(--text-primary)]">
                    {new Date(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                  <div className="flex items-center gap-6 text-xs text-[var(--text-muted)]">
                    <span>{formatNumber(day.input)} in</span>
                    <span>{formatNumber(day.output)} out</span>
                    <span className="text-green-500 font-medium">{formatCurrency(day.cost)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
            {formatCurrency(totalCost)}
          </div>
          <div className="text-xs text-[var(--text-muted)]">Total Cost</div>
        </div>
      </div>
    </div>
  );
}
