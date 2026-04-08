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

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(0) + "K";
  return num.toString();
}

function formatCurrency(amount: number): string {
  if (amount >= 1) return "$" + amount.toFixed(2);
  return "$" + amount.toFixed(4);
}

// Simple HTML/CSS horizontal bar chart component
function HorizontalBar({ label, value, maxValue, color }: { label: string; value: number; maxValue: number; color: string }) {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="w-32 text-sm text-[var(--text-secondary)] truncate">{label}</div>
      <div className="flex-1 h-6 bg-white/5 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all" 
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
      <div className="w-20 text-right text-sm text-[var(--text-primary)]">{formatCurrency(value)}</div>
    </div>
  );
}

// Simple vertical bar for daily trend
function DailyBar({ day, value, maxValue }: { day: string; value: number; maxValue: number }) {
  const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-full flex-1 flex items-end justify-center">
        <div 
          className="w-8 bg-purple-500 rounded-t"
          style={{ height: `${Math.max(height, 2)}%` }}
          title={formatCurrency(value)}
        />
      </div>
      <div className="text-xs text-[var(--text-muted)]">{day}</div>
    </div>
  );
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

  // Prepare data
  const modelData = Object.entries(costData.byModel)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.cost - a.cost);

  const taskData = Object.entries(costData.byTaskType)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.cost - a.cost);

  const providerData = Object.entries(costData.byProvider)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.cost - a.cost);

  const dayData = Object.entries(costData.byDay)
    .map(([date, data]) => ({ 
      day: new Date(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).split(',')[0],
      date,
      ...data 
    }))
    .reverse();

  const maxModelCost = modelData.length > 0 ? Math.max(...modelData.map(d => d.cost)) : 0;
  const maxTaskCost = taskData.length > 0 ? Math.max(...taskData.map(d => d.cost)) : 0;
  const maxDayCost = dayData.length > 0 ? Math.max(...dayData.map(d => d.cost)) : 0;

  const totalCost = costData.totalCost;
  const totalInput = costData.totalInputTokens;
  const totalOutput = costData.totalOutputTokens;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
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
          <div className="text-3xl font-bold text-[var(--text-primary)]">{formatCurrency(totalCost)}</div>
          <div className="metric-label">Total Cost</div>
        </div>
        <div className="metric-card">
          <div className="text-3xl font-bold text-[var(--text-primary)]">{costData.totalCalls.toLocaleString()}</div>
          <div className="metric-label">API Calls</div>
        </div>
        <div className="metric-card">
          <div className="text-3xl font-bold text-purple-500">{formatNumber(totalInput)}</div>
          <div className="metric-label">Input Tokens</div>
        </div>
        <div className="metric-card">
          <div className="text-3xl font-bold text-blue-500">{formatNumber(totalOutput)}</div>
          <div className="metric-label">Output Tokens</div>
        </div>
      </div>

      {/* Charts - HTML/CSS based */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost by Model - Horizontal Bars */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
            Cost by Model
          </h3>
          {modelData.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-muted)]">No data</div>
          ) : (
            <div className="space-y-1">
              {modelData.map((item, i) => (
                <HorizontalBar 
                  key={item.name}
                  label={item.name.split(':').pop() || item.name}
                  value={item.cost}
                  maxValue={maxModelCost}
                  color={COLORS[i % COLORS.length]}
                />
              ))}
            </div>
          )}
        </div>

        {/* Cost by Task Type - Horizontal Bars */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
            Cost by Task Type
          </h3>
          {taskData.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-muted)]">No data</div>
          ) : (
            <div className="space-y-1">
              {taskData.map((item, i) => (
                <HorizontalBar 
                  key={item.name}
                  label={item.name.replace(/_/g, ' ')}
                  value={item.cost}
                  maxValue={maxTaskCost}
                  color={COLORS[i % COLORS.length]}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Daily Trend - Vertical Bars */}
      {dayData.length > 1 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
            Daily Cost Trend
          </h3>
          <div className="flex items-end justify-between gap-2 h-32">
            {dayData.map((item) => (
              <DailyBar 
                key={item.date}
                day={item.day}
                value={item.cost}
                maxValue={maxDayCost}
              />
            ))}
          </div>
        </div>
      )}

      {/* By Provider */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
          Cost by Provider
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {providerData.map((item, i) => (
            <div key={item.name} className="text-center">
              <div className="text-2xl font-bold" style={{ color: COLORS[i % COLORS.length] }}>
                {formatCurrency(item.cost)}
              </div>
              <div className="text-sm text-[var(--text-primary)] capitalize">{item.name}</div>
              <div className="text-xs text-[var(--text-muted)]">{item.calls} calls</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Expensive Calls */}
      {costData.topCalls.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
            Top 5 Expensive Calls
          </h3>
          <div className="space-y-2">
            {costData.topCalls.slice(0, 5).map((call, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <div className="text-sm text-[var(--text-primary)]">{call.model.split(':').pop()}</div>
                  <div className="text-xs text-[var(--text-muted)] capitalize">{call.taskType.replace(/_/g, ' ')}</div>
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

      {/* Summary Footer */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-purple-500">{formatCurrency(totalCost)}</div>
          <div className="text-xs text-[var(--text-muted)]">Total Cost</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-[var(--text-primary)]">{costData.totalCalls.toLocaleString()}</div>
          <div className="text-xs text-[var(--text-muted)]">Total Calls</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-purple-500">{formatNumber(totalInput)}</div>
          <div className="text-xs text-[var(--text-muted)]">Input Tokens</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-blue-500">{formatNumber(totalOutput)}</div>
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
