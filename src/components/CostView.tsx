"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";

interface CostCall {
  timestamp: string;
  model: string;
  provider: string;
  cost: number;
  inputTokens: number;
  outputTokens: number;
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
  byProvider: Record<string, { cost: number; calls: number }>;
  byDay: Record<string, { cost: number; calls: number }>;
  topCalls: CostCall[];
  budgetStatus: { minimax: { limit: number; used: number; remaining: number; percentUsed: number }; openai: { limit: number; used: number; remaining: number; percentUsed: number } };
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

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name?: string; value?: number }> }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--bg-card)] border border-white/10 rounded px-3 py-2 text-sm">
        <p className="text-[var(--text-primary)]">{payload[0].name}</p>
        <p className="text-green-500">{formatCurrency(payload[0].value ?? 0)}</p>
      </div>
    );
  }
  return null;
};

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

  const budgetMM = costData.budgetStatus.minimax;
  const budgetOA = costData.budgetStatus.openai;
  const mmWarn = budgetMM.percentUsed > 75;
  const mmCrit = budgetMM.percentUsed > 90;
  const oaWarn = budgetOA.percentUsed > 75;
  const oaCrit = budgetOA.percentUsed > 90;

  const modelChartData = Object.entries(costData.byModel)
    .map(([name, data]) => ({
      name: name.length > 20 ? name.substring(0, 20) + "..." : name,
      fullName: name,
      value: data.cost,
      calls: data.calls,
      provider: data.provider
    }))
    .sort((a, b) => b.value - a.value);

  const providerChartData = Object.entries(costData.byProvider || {})
    .map(([name, data]) => ({
      name: name.replace(/_/g, " "),
      value: data.cost,
      calls: data.calls
    }))
    .sort((a, b) => b.value - a.value);

  const dayChartData = Object.entries(costData.byDay || {})
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

      {/* MiniMax Budget Alert */}
      {mmWarn && (
        <div className={`card p-4 border-2 ${mmCrit ? 'border-red-500' : 'border-yellow-500'}`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{mmCrit ? '🚨' : '⚠️'}</span>
            <div>
              <div className="font-semibold text-[var(--text-primary)]">
                {mmCrit ? 'MiniMax Budget Critical!' : 'MiniMax Budget Warning'}
              </div>
              <div className="text-sm text-[var(--text-secondary)]">
                Used {formatCurrency(budgetMM.used)} of {formatCurrency(budgetMM.limit)} ({budgetMM.percentUsed.toFixed(1)}%) — {formatCurrency(budgetMM.remaining)} remaining
              </div>
            </div>
          </div>
          <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full transition-all ${mmCrit ? 'bg-red-500' : 'bg-yellow-500'}`}
              style={{ width: `${Math.min(100, budgetMM.percentUsed)}%` }}
            />
          </div>
        </div>
      )}

      {/* OpenAI Budget Alert */}
      {oaWarn && (
        <div className={`card p-4 border-2 ${oaCrit ? 'border-red-500' : 'border-yellow-500'}`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{oaCrit ? '🚨' : '⚠️'}</span>
            <div>
              <div className="font-semibold text-[var(--text-primary)]">
                {oaCrit ? 'OpenAI Budget Critical!' : 'OpenAI Budget Warning'}
              </div>
              <div className="text-sm text-[var(--text-secondary)]">
                Used {formatCurrency(budgetOA.used)} of {formatCurrency(budgetOA.limit)} ({budgetOA.percentUsed.toFixed(1)}%) — {formatCurrency(budgetOA.remaining)} remaining
              </div>
            </div>
          </div>
          <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full transition-all ${oaCrit ? 'bg-red-500' : 'bg-yellow-500'}`}
              style={{ width: `${Math.min(100, budgetOA.percentUsed)}%` }}
            />
          </div>
        </div>
      )}

      {/* Usage Spike Alert */}
      {(costData.totalInputTokens > 500000 || costData.totalCost > 5) && period === 'day' && (
        <div className="card p-4 border-2 border-red-500">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <div className="font-semibold text-[var(--text-primary)]">USAGE SPIKE ALERT</div>
              <div className="text-sm text-[var(--text-secondary)]">
                {costData.totalInputTokens.toLocaleString()} input tokens · {formatCurrency(costData.totalCost)} spent today
              </div>
              <div className="text-xs text-red-400 mt-1">
                Normal daily: under 500K tokens / under $5 — possible runaway process!
              </div>
            </div>
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost by Model Pie Chart */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
            Cost by Model
          </h3>
          {modelChartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={modelChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={false}
                  >
                    {modelChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value) => <span className="text-xs text-[var(--text-secondary)]">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {modelChartData.slice(0, 4).map((item, index) => (
                  <div key={item.fullName} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-[var(--text-primary)] truncate max-w-[160px]" title={item.fullName}>
                        {item.fullName}
                      </span>
                    </div>
                    <span className="text-green-500 font-medium">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-[var(--text-muted)]">No data</div>
          )}
        </div>

        {/* Cost by Provider Pie Chart */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
            Cost by Provider
          </h3>
          {providerChartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={providerChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={false}
                  >
                    {providerChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value) => <span className="text-xs text-[var(--text-secondary)]">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {providerChartData.slice(0, 4).map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-[var(--text-primary)] capitalize">{item.name}</span>
                    </div>
                    <span className="text-green-500 font-medium">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-[var(--text-muted)]">No data</div>
          )}
        </div>
      </div>

      {/* Daily Cost Trend */}
      {dayChartData.length > 1 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
            Daily Cost Trend
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={dayChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="name"
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              />
              <YAxis
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                tickFormatter={(v) => `$${v.toFixed(2)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: "#8b5cf6", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Expensive Calls */}
      {costData.topCalls && costData.topCalls.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
            Top 5 Expensive Calls
          </h3>
          <div className="space-y-2">
            {costData.topCalls.slice(0, 5).map((call, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <div className="text-sm text-[var(--text-primary)]">{call.model.length > 30 ? call.model.substring(0, 30) + "..." : call.model}</div>
                  <div className="text-xs text-[var(--text-muted)]">{call.provider}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-green-500">{formatCurrency(call.cost)}</div>
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
