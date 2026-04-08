"use client";

import { useState, useEffect } from "react";

interface CostCall {
  timestamp: string;
  model: string;
  taskType: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  provider: string;
}

interface CostData {
  period: string;
  startDate: string;
  endDate: string;
  totalCalls: number;
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheReads: number;
  totalCacheWrites: number;
  avgCostPerCall: number;
  byModel: Record<string, { cost: number; calls: number; inputTokens: number; outputTokens: number; provider: string }>;
  byTaskType: Record<string, { cost: number; calls: number }>;
  byProvider: Record<string, { cost: number; calls: number }>;
  byDay: Record<string, { cost: number; calls: number }>;
  topCalls: CostCall[];
  budgetStatus: { minimax: { limit: number; used: number; remaining: number; percentUsed: number } };
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

export default function CostView() {
  const [costData, setCostData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");

  useEffect(() => {
    fetchCostData();
  }, [period]);

  const fetchCostData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/cost?period=${period}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCostData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !costData) {
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

  const budget = costData.budgetStatus.minimax;
  const budgetPercent = budget.percentUsed || 0;
  const isBudgetWarning = budgetPercent > 75;
  const isBudgetCritical = budgetPercent > 90;

  const modelData = Object.entries(costData.byModel)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.cost - a.cost);

  const taskData = Object.entries(costData.byTaskType)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.cost - a.cost);

  const providerData = Object.entries(costData.byProvider)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.cost - a.cost);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Cost Tracking</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {costData.startDate} to {costData.endDate}
          </p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as "day" | "week" | "month")}
          className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-[var(--text-primary)]"
        >
          <option value="day">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
        </select>
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
                Used {formatCurrency(budget.used)} of {formatCurrency(budget.limit)} ({budgetPercent.toFixed(1)}%) — {formatCurrency(budget.remaining)} remaining
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="metric-card">
          <div className="text-3xl font-bold text-[var(--text-primary)]">
            {formatCurrency(costData.totalCost)}
          </div>
          <div className="metric-label">Total Cost</div>
        </div>
        <div className="metric-card">
          <div className="text-3xl font-bold text-[var(--text-primary)]">
            {costData.totalCalls.toLocaleString()}
          </div>
          <div className="metric-label">API Calls</div>
        </div>
        <div className="metric-card">
          <div className="text-3xl font-bold text-purple-500">
            {formatNumber(costData.totalInputTokens)}
          </div>
          <div className="metric-label">Input Tokens</div>
        </div>
        <div className="metric-card">
          <div className="text-3xl font-bold text-blue-500">
            {formatNumber(costData.totalOutputTokens)}
          </div>
          <div className="metric-label">Output Tokens</div>
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Model */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
            Cost by Model
          </h3>
          <div className="space-y-3">
            {modelData.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-muted)]">No data</div>
            ) : (
              modelData.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-[var(--text-primary)]">{item.name}</div>
                    <div className="text-xs text-[var(--text-muted)]">{item.calls} calls</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-green-500">{formatCurrency(item.cost)}</div>
                    <div className="text-xs text-[var(--text-muted)]">{formatNumber(item.inputTokens)} in</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* By Task Type */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
            Cost by Task Type
          </h3>
          <div className="space-y-3">
            {taskData.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-muted)]">No data</div>
            ) : (
              taskData.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-[var(--text-primary)] capitalize">{item.name.replace("_", " ")}</div>
                    <div className="text-xs text-[var(--text-muted)]">{item.calls} calls</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-green-500">{formatCurrency(item.cost)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* By Provider */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
          Cost by Provider
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {providerData.map((item) => (
            <div key={item.name} className="text-center">
              <div className="text-2xl font-bold text-[var(--text-primary)]">{formatCurrency(item.cost)}</div>
              <div className="text-sm text-[var(--text-muted)]">{item.name}</div>
              <div className="text-xs text-[var(--text-muted)]">{item.calls} calls</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Calls */}
      {costData.topCalls.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
            Top 5 Expensive Calls
          </h3>
          <div className="space-y-2">
            {costData.topCalls.slice(0, 5).map((call, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <div className="text-sm text-[var(--text-primary)]">{call.model}</div>
                  <div className="text-xs text-[var(--text-muted)] capitalize">{call.taskType.replace("_", " ")}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-green-500">{formatCurrency(call.estimatedCost)}</div>
                  <div className="text-xs text-[var(--text-muted)]">{new Date(call.timestamp).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-purple-500">{formatCurrency(costData.totalCost)}</div>
          <div className="text-xs text-[var(--text-muted)]">Total Cost</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-[var(--text-primary)]">{costData.totalCalls.toLocaleString()}</div>
          <div className="text-xs text-[var(--text-muted)]">Total Calls</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-purple-500">{formatNumber(costData.totalInputTokens)}</div>
          <div className="text-xs text-[var(--text-muted)]">Input Tokens</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-blue-500">{formatNumber(costData.totalOutputTokens)}</div>
          <div className="text-xs text-[var(--text-muted)]">Output Tokens</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-500">{formatCurrency(costData.avgCostPerCall)}</div>
          <div className="text-xs text-[var(--text-muted)]">Avg Cost/Call</div>
        </div>
      </div>
    </div>
  );
}
