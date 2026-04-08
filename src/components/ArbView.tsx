"use client";

import { useState, useEffect } from "react";

interface TradeEntry {
  time: string;
  market_id: string;
  opportunity: string;
  poly_price: number;
  kalshi_price: number;
  total_cost: number;
  edge_percent: number;
  kalshi_result: any;
  simulation: boolean;
}

interface DailyStats {
  date: string;
  trades: number;
  loss: number;
  profit: number;
  positions: any[];
}

interface ArbLog {
  polls: number;
  lastPoll: string;
  status: string;
  mode: string;
  kalshi_markets: number;
  poly_markets: number;
  daily_trades: number;
  daily_profit: number;
  daily_loss: number;
  last_edge: number;
  recent_trades: TradeEntry[];
}

const sampleArbLog: ArbLog = {
  polls: 142,
  lastPoll: "2026-04-08T06:05:00Z",
  status: "Running",
  mode: "Simulation",
  kalshi_markets: 50,
  poly_markets: 100,
  daily_trades: 0,
  daily_profit: 0,
  daily_loss: 0,
  last_edge: 0,
  recent_trades: [],
};

export default function ArbView() {
  const [arbLog, setArbLog] = useState<ArbLog>(sampleArbLog);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"hour" | "day" | "week">("day");

  useEffect(() => {
    fetchArbData();
    const interval = setInterval(fetchArbData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchArbData = async () => {
    try {
      const res = await fetch("/api/arb");
      if (res.ok) {
        const data = await res.json();
        setArbLog({ ...sampleArbLog, ...data });
      }
    } catch (error) {
      console.log("Could not fetch arb data:", error);
    } finally {
      setLoading(false);
    }
  };

  const metrics = [
    {
      label: "Status",
      value: arbLog.status,
      color: arbLog.status === "Running" ? "text-green-500" : "text-red-500",
      icon: arbLog.status === "Running" ? "🟢" : "🔴",
    },
    {
      label: "Mode",
      value: arbLog.mode,
      color: "text-blue-500",
      icon: "🎮",
    },
    {
      label: "Markets Watched",
      value: `${arbLog.kalshi_markets} / ${arbLog.poly_markets}`,
      color: "text-purple-500",
      icon: "📊",
    },
    {
      label: "Edge Threshold",
      value: "3.0%",
      color: "text-orange-500",
      icon: "⚡",
    },
  ];

  const pnlMetrics = [
    { label: "Trades Today", value: arbLog.daily_trades.toString(), change: "0", positive: true },
    { label: "Profit", value: `$${arbLog.daily_profit.toFixed(2)}`, change: "0", positive: true },
    { label: "Loss", value: `$${arbLog.daily_loss.toFixed(2)}`, change: "0", positive: false },
    {
      label: "Net P&L",
      value: `$${(arbLog.daily_profit - arbLog.daily_loss).toFixed(2)}`,
      change: arbLog.daily_profit - arbLog.daily_loss >= 0 ? "+" : "",
      positive: arbLog.daily_profit - arbLog.daily_loss >= 0,
    },
  ];

  const potentialProfit = arbLog.recent_trades.reduce((sum, t) => sum + (1 - t.total_cost), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            📈 Arbitrage Monitor
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Polymarket → Kalshi cross-exchange arbitrage
          </p>
        </div>
        <div className="segment-control">
          {(["hour", "day", "week"] as const).map((range) => (
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

      {/* Status Cards */}
      <div className="grid grid-cols-4 gap-4">
        {metrics.map((metric, i) => (
          <div key={i} className="metric-card">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{metric.icon}</span>
              <span className={`text-2xl font-bold ${metric.color}`}>
                {metric.value}
              </span>
            </div>
            <div className="metric-label">{metric.label}</div>
          </div>
        ))}
      </div>

      {/* P&L Section */}
      <div className="grid grid-cols-4 gap-4">
        {pnlMetrics.map((metric, i) => (
          <div key={i} className="card p-4">
            <div className="text-xs text-[var(--text-muted)] mb-1">{metric.label}</div>
            <div className={`text-2xl font-bold ${metric.positive ? "text-green-500" : "text-red-500"}`}>
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      {/* Performance Bars */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
          Capital Allocation
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[var(--text-secondary)]">Max Trade Size</span>
              <span className="text-[var(--text-primary)] font-medium">$1.00</span>
            </div>
            <div className="h-3 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full bg-purple-500" style={{ width: "100%" }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[var(--text-secondary)]">Daily Budget</span>
              <span className="text-[var(--text-primary)] font-medium">$5.00</span>
            </div>
            <div className="h-3 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: "100%" }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[var(--text-secondary)]">Budget Used</span>
              <span className="text-[var(--text-primary)] font-medium">
                ${(arbLog.daily_profit + arbLog.daily_loss).toFixed(2)} / $5.00
              </span>
            </div>
            <div className="h-3 rounded-full bg-white/5 overflow-hidden">
              <div
                className={`h-full ${arbLog.daily_profit >= arbLog.daily_loss ? "bg-green-500" : "bg-red-500"}`}
                style={{ width: `${Math.min(((arbLog.daily_profit + arbLog.daily_loss) / 5) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Trades */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
          Recent Trades
        </h3>
        {arbLog.recent_trades.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🔍</div>
            <div className="text-[var(--text-secondary)]">
              No trades yet — watching for 3%+ edge opportunities
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-2">
              {arbLog.polls} polls completed | Last: {arbLog.lastPoll}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {arbLog.recent_trades.slice(0, 10).map((trade, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-white/5">
                <div className="w-20 text-sm font-medium text-[var(--text-primary)]">
                  {trade.simulation ? "🧪" : "💵"} {trade.opportunity}
                </div>
                <div className="flex-1">
                  <div className="text-xs text-[var(--text-muted)]">
                    Poly: ${trade.poly_price.toFixed(4)} + Kalshi: ${trade.kalshi_price.toFixed(4)}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${trade.edge_percent >= 3 ? "text-green-500" : "text-yellow-500"}`}>
                    {trade.edge_percent.toFixed(2)}% edge
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    ~${(1 - trade.total_cost).toFixed(4)} profit
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Strategy Info */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="text-xs text-[var(--text-muted)] mb-2">⌚ Poll Interval</div>
          <div className="text-xl font-bold text-[var(--text-primary)]">30 sec</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-[var(--text-muted)] mb-2">📊 Min Edge</div>
          <div className="text-xl font-bold text-[var(--text-primary)]">3.0%</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-[var(--text-muted)] mb-2">🔄 Rotation</div>
          <div className="text-xl font-bold text-[var(--text-primary)]">Weekly</div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-center text-xs text-[var(--text-muted)]">
        Last poll: {arbLog.lastPoll} | {arbLog.polls} total polls today
      </div>
    </div>
  );
}