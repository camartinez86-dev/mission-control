"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface CostCall {
  timestamp: string;
  model: string;
  taskType: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  provider: string;
}

interface ModelData {
  cost: number;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  provider: string;
}

interface TaskData {
  cost: number;
  calls: number;
  inputTokens: number;
  outputTokens: number;
}

interface ProviderData {
  cost: number;
  calls: number;
}

interface DayData {
  cost: number;
  calls: number;
}

interface CostData {
  period: string;
  startDate: string;
  endDate: string;
  filters: { model?: string; taskType?: string; provider?: string };
  totalCalls: number;
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheReads: number;
  totalCacheWrites: number;
  avgCostPerCall: number;
  byModel: Record<string, ModelData>;
  byTaskType: Record<string, TaskData>;
  byProvider: Record<string, ProviderData>;
  byDay: Record<string, DayData>;
  topCalls: CostCall[];
  budgetStatus: {
    minimax: { limit: number; used: number; remaining: number; percentUsed: number };
  };
  generatedAt: string;
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

export default function CostView() {
  const [costData, setCostData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");
  const [modelFilter, setModelFilter] = useState<string>("");
  const [taskFilter, setTaskFilter] = useState<string>("");
  const [showPieByModel, setShowPieByModel] = useState(true);

  useEffect(() => {
    fetchCostData();
  }, [period, modelFilter, taskFilter]);

  const fetchCostData = async () => {
    try {
      setLoading(true);
      let url = `/api/cost?period=${period}`;
      if (modelFilter) url += `&model=${encodeURIComponent(modelFilter)}`;
      if (taskFilter) url += `&task_type=${encodeURIComponent(taskFilter)}`;
      
      const res = await fetch(url);
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

  // Prepare chart data
  const modelChartData = Object.entries(costData.byModel).map(([name, data]) => ({
    name: name.length > 20 ? name.substring(0, 20) + "..." : name,
    fullName: name,
    value: data.cost,
    calls: data.calls,
    provider: data.provider
  })).sort((a, b) => b.value - a.value);

  const taskChartData = Object.entries(costData.byTaskType).map(([name, data]) => ({
    name: name.replace("_", " "),
    value: data.cost,
    calls: data.calls
  })).sort((a, b) => b.value - a.value);

  const providerChartData = Object.entries(costData.byProvider).map(([name, data]) => ({
    name,
    value: data.cost,
    calls: data.calls
  })).sort((a, b) => b.value - a.value);

  const dayChartData = Object.entries(costData.byDay)
    .map(([date, data]) => ({
      name: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: data.cost,
      calls: data.calls
    }))
    .reverse();

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
        
        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as "day" | "week" | "month")}
            className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-[var(--text-primary)]"
          >
            <option value="day">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
          
          <input
            type="text"
            placeholder="Filter by model..."
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-[var(--text-primary)] w-40"
          />
          
          <select
            value={taskFilter}
            onChange={(e) => setTaskFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-[var(--text-primary)]"
          >
            <option value="">All Tasks</option>
            <option value="chat">Chat</option>
            <option value="compaction">Compaction</option>
            <option value="content_gen">Content Gen</option>
            <option value="morning_report">Morning Report</option>
            <option value="arb_analysis">Arb Analysis</option>
            <option value="heartbeat">Heartbeat</option>
            <option value="skill">Skill</option>
            <option value="cron">Cron</option>
          </select>
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
            {formatCurrency(totalCost)}
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
            {formatNumber(totalInput)}
          </div>
          <div className="metric-label">Input Tokens</div>
        </div>
        <div className="metric-card">
          <div className="text-3xl font-bold text-blue-500">
            {formatNumber(totalOutput)}
          </div>
          <div className="metric-label">Output Tokens</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost by Model Pie Chart */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Cost by Model
            </h3>
          </div>
          {modelChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={modelChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {modelChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-[var(--text-muted)]">
              No data available
            </div>
          )}
          
          {/* Model breakdown table */}
          <div className="mt-4 space-y-2">
            {modelChartData.slice(0, 5).map((item, index) => (
              <div key={item.fullName} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-[var(--text-primary)] truncate max-w-[180px]" title={item.fullName}>
                    {item.fullName}
                  </span>
                </div>
                <div className="text-[var(--text-secondary)]">
                  {formatCurrency(item.value)} ({item.calls} calls)
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cost by Task Type Pie Chart */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Cost by Task Type
            </h3>
          </div>
          {taskChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={taskChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {taskChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-[var(--text-muted)]">
              No data available
            </div>
          )}
          
          {/* Task breakdown table */}
          <div className="mt-4 space-y-2">
            {taskChartData.slice(0, 5).map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-[var(--text-primary)] capitalize">{item.name}</span>
                </div>
                <div className="text-[var(--text-secondary)]">
                  {formatCurrency(item.value)} ({item.calls} calls)
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Cost Bar Chart */}
      {dayChartData.length > 1 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
            Daily Cost Trend
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dayChartData}>
              <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickFormatter={(v) => `$${v.toFixed(2)}`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Expensive Calls */}
      {costData.topCalls.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
            Top 10 Expensive Calls
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--text-muted)] border-b border-white/10">
                  <th className="text-left py-2 px-3">Time</th>
                  <th className="text-left py-2 px-3">Model</th>
                  <th className="text-left py-2 px-3">Task</th>
                  <th className="text-right py-2 px-3">Input</th>
                  <th className="text-right py-2 px-3">Output</th>
                  <th className="text-right py-2 px-3">Cost</th>
                </tr>
              </thead>
              <tbody>
                {costData.topCalls.map((call, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-2 px-3 text-[var(--text-muted)]">
                      {new Date(call.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-3 text-[var(--text-primary)]">
                      {call.model.length > 25 ? call.model.substring(0, 25) + "..." : call.model}
                    </td>
                    <td className="py-2 px-3 text-[var(--text-secondary)] capitalize">
                      {call.taskType.replace("_", " ")}
                    </td>
                    <td className="py-2 px-3 text-right text-[var(--text-muted)]">
                      {formatNumber(call.inputTokens)}
                    </td>
                    <td className="py-2 px-3 text-right text-[var(--text-muted)]">
                      {formatNumber(call.outputTokens)}
                    </td>
                    <td className="py-2 px-3 text-right text-green-500 font-medium">
                      {formatCurrency(call.estimatedCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
