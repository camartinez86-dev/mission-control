"use client";

import { useState, useEffect } from "react";

interface CostData {
  period: string;
  startDate: string;
  endDate: string;
  totalCalls: number;
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  byModel: Record<string, { cost: number; calls: number }>;
  byTaskType: Record<string, { cost: number; calls: number }>;
  budgetStatus: { minimax: { limit: number; used: number; remaining: number; percentUsed: number } };
}

function formatCurrency(amount: number): string {
  if (amount >= 1) return "$" + amount.toFixed(2);
  return "$" + amount.toFixed(4);
}

export default function CostView() {
  const [costData, setCostData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");

  useEffect(() => {
    fetchCostData();
  }, [period]);

  const fetchCostData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/cost?period=${period}`);
      const data = await res.json();
      setCostData(data);
    } catch (err) {
      console.error("Failed to fetch cost data:", err);
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

  if (!costData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">Failed to load cost data</div>
      </div>
    );
  }

  const budget = costData.budgetStatus.minimax;
  const budgetPercent = budget.percentUsed || 0;

  const modelData = Object.entries(costData.byModel)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.cost - a.cost);

  const taskData = Object.entries(costData.byTaskType)
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
      {budgetPercent > 75 && (
        <div className={`card p-4 border-2 ${budgetPercent > 90 ? "border-red-500" : "border-yellow-500"}`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{budgetPercent > 90 ? "🚨" : "⚠️"}</span>
            <div>
              <div className="font-semibold text-[var(--text-primary)]">
                MiniMax Budget {budgetPercent > 90 ? "Critical!" : "Warning"}
              </div>
              <div className="text-sm text-[var(--text-secondary)]">
                Used {formatCurrency(budget.used)} of {formatCurrency(budget.limit)} ({budgetPercent.toFixed(1)}%)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="metric-card">
          <div className="text-3xl font-bold text-[var(--text-primary)]">{formatCurrency(costData.totalCost)}</div>
          <div className="metric-label">Total Cost</div>
        </div>
        <div className="metric-card">
          <div className="text-3xl font-bold text-[var(--text-primary)]">{costData.totalCalls.toLocaleString()}</div>
          <div className="metric-label">API Calls</div>
        </div>
        <div className="metric-card">
          <div className="text-3xl font-bold text-purple-500">{costData.totalInputTokens.toLocaleString()}</div>
          <div className="metric-label">Input Tokens</div>
        </div>
        <div className="metric-card">
          <div className="text-3xl font-bold text-blue-500">{costData.totalOutputTokens.toLocaleString()}</div>
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
            {modelData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">{item.name}</div>
                  <div className="text-xs text-[var(--text-muted)]">{item.calls} calls</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-green-500">{formatCurrency(item.cost)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Task Type */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
            Cost by Task Type
          </h3>
          <div className="space-y-3">
            {taskData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-[var(--text-primary)] capitalize">{item.name.replace(/_/g, " ")}</div>
                  <div className="text-xs text-[var(--text-muted)]">{item.calls} calls</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-green-500">{formatCurrency(item.cost)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-purple-500">{formatCurrency(costData.totalCost)}</div>
          <div className="text-xs text-[var(--text-muted)]">Total Cost</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-[var(--text-primary)]">{costData.totalCalls.toLocaleString()}</div>
          <div className="text-xs text-[var(--text-muted)]">Total Calls</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-500">{formatCurrency(budget.remaining)}</div>
          <div className="text-xs text-[var(--text-muted)]">Budget Left</div>
        </div>
      </div>
    </div>
  );
}
