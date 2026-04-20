"use client";

import { useState, useEffect } from "react";

interface SimTrade {
  ticker: string;
  side: string;
  size: number;
  ai_prob: number;
  market_prob: number;
  edge: number;
  timestamp: string;
}

interface ArbViewData {
  arbWatcher: {
    status: string;
    polls: number;
    lastPoll: string;
    kalshi_markets: number;
    poly_markets: number;
    mode: string;
  };
  edgeHunter: {
    status: string;
    mode: string;
    lastRun: string;
    signalsGenerated: number;
    lastSignalUpdate?: string | null;
    healthCheck: string;
    positions: number;
    trades: number;
    profit: number;
  };
  simulation: {
    enabled: boolean;
    totalSimTrades: number;
    lastSimTrade: string | null;
    recentTrades: SimTrade[];
    testPeriod: string;
    daysRemaining: number;
  };
}

const sampleData: ArbViewData = {
  arbWatcher: { status: "Running", polls: 142, lastPoll: "", kalshi_markets: 50, poly_markets: 100, mode: "Simulation" },
  edgeHunter: { status: "Running", mode: "Simulation", lastRun: "", signalsGenerated: 10, healthCheck: "Healthy", positions: 0, trades: 0, profit: 0 },
  simulation: { enabled: true, totalSimTrades: 0, lastSimTrade: null, recentTrades: [], testPeriod: "Apr 10 - Apr 24, 2026", daysRemaining: 13 },
};

export default function ArbView() {
  const [data, setData] = useState<ArbViewData>(sampleData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/arb");
      if (res.ok) {
        const json = await res.json();
        setData({ ...sampleData, ...json });
      }
    } catch (error) {
      console.log("Could not fetch arb data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">📈 Trading Bots</h2>
          <p className="text-sm text-[var(--text-secondary)]">Edge Hunter + Arb Watcher monitoring</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-[var(--text-muted)]">Test Period</div>
          <div className="text-lg font-bold text-[var(--text-primary)]">{data.simulation.testPeriod}</div>
          <div className="text-xs text-green-500">{data.simulation.daysRemaining} days remaining</div>
        </div>
      </div>

      {/* Simulation Banner */}
      <div className="card p-4 border border-yellow-500/30 bg-yellow-500/10">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧪</span>
          <div>
            <div className="font-bold text-yellow-500">SIMULATION MODE ACTIVE</div>
            <div className="text-sm text-[var(--text-secondary)]">
              Running hypothetical trades — no real money spent
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-2xl font-bold text-yellow-500">{data.simulation.totalSimTrades}</div>
            <div className="text-xs text-[var(--text-muted)]">Sim trades</div>
          </div>
        </div>
      </div>

      {/* Bot Status Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Edge Hunter */}
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🎯</span>
            <span className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Edge Hunter</span>
          </div>
          <div className="text-2xl font-bold text-green-500">{data.edgeHunter.status}</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">AI probability mispricing</div>
          <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
            <div className="bg-white/5 p-2 rounded">
              <div className="text-[var(--text-muted)]">Trades</div>
              <div className="font-bold">{data.edgeHunter.trades}</div>
            </div>
            <div className="bg-white/5 p-2 rounded">
              <div className="text-[var(--text-muted)]">Signals</div>
              <div className="font-bold">{data.edgeHunter.signalsGenerated}</div>
            </div>
            <div className="bg-white/5 p-2 rounded">
              <div className="text-[var(--text-muted)]">Positions</div>
              <div className="font-bold">{data.edgeHunter.positions}</div>
            </div>
          </div>
        </div>

        {/* Arb Watcher */}
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">⚡</span>
            <span className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Arb Watcher</span>
          </div>
          <div className="text-2xl font-bold text-green-500">{data.arbWatcher.status}</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">Cross-exchange arbitrage</div>
          <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
            <div className="bg-white/5 p-2 rounded">
              <div className="text-[var(--text-muted)]">Polls</div>
              <div className="font-bold">{data.arbWatcher.polls}</div>
            </div>
            <div className="bg-white/5 p-2 rounded">
              <div className="text-[var(--text-muted)]">Kalshi</div>
              <div className="font-bold">{data.arbWatcher.kalshi_markets}</div>
            </div>
            <div className="bg-white/5 p-2 rounded">
              <div className="text-[var(--text-muted)]">Poly</div>
              <div className="font-bold">{data.arbWatcher.poly_markets}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Simulation Trades */}
      {data.simulation.recentTrades.length > 0 ? (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
            📊 Recent Simulation Trades
          </h3>
          <div className="space-y-2">
            {data.simulation.recentTrades.slice(-5).reverse().map((trade, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-white/5">
                <div className="w-16 text-sm font-medium">
                  <span className={trade.side === 'yes' ? 'text-green-500' : 'text-red-500'}>
                    {trade.side.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {trade.ticker.slice(0, 40)}...
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    AI: {(trade.ai_prob * 100).toFixed(0)}% | Market: {(trade.market_prob * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">${trade.size.toFixed(2)}</div>
                  <div className={`text-xs ${trade.edge > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {(trade.edge * 100).toFixed(1)}% edge
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card p-5 text-center">
          <div className="text-4xl mb-3">⏳</div>
          <div className="text-[var(--text-secondary)]">No simulation trades yet</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">
            Bot will log hypothetical trades when edges are found
          </div>
        </div>
      )}

      {/* AI Signals Status */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="text-xs text-[var(--text-muted)] mb-1">AI Signals</div>
          <div className="text-xl font-bold">{data.edgeHunter.signalsGenerated}</div>
          <div className="text-xs text-[var(--text-muted)]">markets analyzed</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-[var(--text-muted)] mb-1">Last Signal</div>
          <div className="text-xl font-bold text-[var(--text-primary)]">
            {data.edgeHunter.lastSignalUpdate ? new Date(data.edgeHunter.lastSignalUpdate).toLocaleTimeString() : "N/A"}
          </div>
          <div className="text-xs text-[var(--text-muted)]">HH:MM:SS</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-[var(--text-muted)] mb-1">Mode</div>
          <div className="text-xl font-bold text-yellow-500">SIM</div>
          <div className="text-xs text-[var(--text-muted)]">No real trades</div>
        </div>
      </div>

      {loading && <div className="text-center text-[var(--text-muted)]">Loading...</div>}
    </div>
  );
}