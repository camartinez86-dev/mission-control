"use client";

import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TradingStatus {
  botRunning: boolean;
  mode: string;
  date: string;
  lastScanTime: string | null;
}

interface AccountData {
  equity: number;
  cash: number;
  buyingPower: number;
  dailyPnl: number;
  dailyPnlPct: number;
  openPositions: number;
  maxPositions: number;
  tradestoday: number;
  consecutiveLosses: number;
  totalDeployed: number;
  maxDeployable: number;
  deployedPct: number;
}

interface Position {
  symbol: string;
  qty: number;
  side: string;
  entry: number;
  current: number;
  pnl: number;
  pnlPercent: number;
  stop: number;
  target: number;
  marketValue: number;
}

interface Trade {
  symbol: string;
  side: string;
  qty: number;
  entry: number;
  pnl: number;
  rr: number;
  result: "win" | "loss";
  timestamp: string;
}

interface Performance {
  winRate: number;
  totalTrades: number;
  wins: number;
  losses: number;
  avgRR: number;
  weeklyPnl: number;
  bestTrade: number;
  worstTrade: number;
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

interface TradingData {
  status: TradingStatus;
  account: AccountData;
  positions: Position[];
  recentTrades: Trade[];
  performance: Performance;
  recentSetups: string[];
  recentLogs: LogEntry[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt$(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : n > 0 ? "+" : "";
  if (abs >= 1000000) return `${sign}$${(abs / 1000000).toFixed(2)}M`;
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(2)}`;
}

function fmtPct(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

function relTime(ts: string): string {
  if (!ts) return "—";
  const d = new Date(ts.replace(" ", "T"));
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function pnlColor(n: number): string {
  if (n > 0) return "text-emerald-400";
  if (n < 0) return "text-red-400";
  return "text-[var(--text-muted)]";
}

function levelColor(level: string): string {
  switch (level) {
    case "ERROR": return "text-red-400";
    case "WARN":  return "text-yellow-400";
    case "EXEC":  return "text-purple-400";
    default:      return "text-[var(--text-secondary)]";
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ running }: { running: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
        running
          ? "bg-emerald-500/15 text-emerald-400"
          : "bg-zinc-700/50 text-zinc-400"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          running ? "bg-emerald-400 shadow-[0_0_6px_#34d399]" : "bg-zinc-500"
        }`}
      />
      {running ? "BOT RUNNING" : "BOT OFFLINE"}
    </span>
  );
}

function MetricCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="card p-4">
      <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1">
        {label}
      </div>
      <div className={`text-2xl font-bold leading-tight ${accent ?? "text-[var(--text-primary)]"}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-[var(--text-muted)] mt-1">{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, badge }: { title: string; badge?: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
        {title}
      </h3>
      {badge && (
        <span className="px-2 py-0.5 rounded-full bg-white/5 text-[var(--text-muted)] text-[10px] font-semibold">
          {badge}
        </span>
      )}
      <div className="flex-1 h-px bg-white/5" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const DEFAULT_DATA: TradingData = {
  status: { botRunning: false, mode: "PAPER", date: "", lastScanTime: null },
  account: {
    equity: 0, cash: 0, buyingPower: 0,
    dailyPnl: 0, dailyPnlPct: 0,
    openPositions: 0, maxPositions: 4,
    tradestoday: 0, consecutiveLosses: 0,
    totalDeployed: 0, maxDeployable: 0, deployedPct: 0,
  },
  positions: [],
  recentTrades: [],
  performance: {
    winRate: 0, totalTrades: 0, wins: 0, losses: 0,
    avgRR: 3.0, weeklyPnl: 0, bestTrade: 0, worstTrade: 0,
  },
  recentSetups: [],
  recentLogs: [],
};

export default function TradingView() {
  const [data, setData] = useState<TradingData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [tab, setTab] = useState<"overview" | "logs">("overview");

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/trading");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData({ ...DEFAULT_DATA, ...json });
      setError(null);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const { status, account, positions, recentTrades, performance, recentSetups, recentLogs } = data;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--text-secondary)] animate-pulse">Loading trading data…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">📊 Trading Dashboard</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Alpaca Paper Trading · {status.mode} mode
            {lastRefresh && (
              <span className="ml-2 text-[var(--text-muted)]">
                · Updated {relTime(lastRefresh.toISOString().replace("T", " ").split(".")[0])}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge running={status.botRunning} />
          <div className="segment-control">
            {(["overview", "logs"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`segment-btn ${tab === t ? "active" : ""}`}
              >
                {t === "overview" ? "Overview" : "Live Log"}
              </button>
            ))}
          </div>
          <button
            onClick={fetchData}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] text-xs transition-colors"
          >
            ↻ Refresh
          </button>
          <button
            onClick={async () => {
              const res = await fetch("/api/trading/history?period=week&format=csv");
              if (res.ok) {
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `trades-${new Date().toISOString().split("T")[0]}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }
            }}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] text-xs transition-colors"
          >
            ↓ Export CSV
          </button>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="card p-4 border-red-500/30 border text-red-400 text-sm flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* ── Alert Thresholds ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <SectionHeader title="Alert Thresholds" />
          <div className="flex items-center gap-2">
            {account.consecutiveLosses >= 3 && (
              <span className="px-2 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold">
                ⚠️ {account.consecutiveLosses} consecutive losses
              </span>
            )}
            {account.dailyPnl < -account.equity * 0.05 && (
              <span className="px-2 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold">
                ⚠️ Daily loss limit hit
              </span>
            )}
          </div>
        </div>
        <div className="card p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Max Daily Loss</span>
            <div className="text-lg font-bold text-[var(--text-primary)]">-5%</div>
          </div>
          <div>
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Max Positions</span>
            <div className="text-lg font-bold text-[var(--text-primary)]">4</div>
          </div>
          <div>
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Consecutive Loss Stop</span>
            <div className="text-lg font-bold text-[var(--text-primary)]">3</div>
          </div>
          <div>
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Min R/R</span>
            <div className="text-lg font-bold text-[var(--text-primary)]">3:1</div>
          </div>
        </div>
      </section>

      {tab === "overview" ? (
        <>
          {/* ── Account Status ── */}
          <section>
            <SectionHeader title="Account Status" badge="PAPER" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <MetricCard
                label="Portfolio Equity"
                value={`$${(account.equity / 1000).toFixed(1)}K`}
                sub="paper account"
              />
              <MetricCard
                label="Daily P&L"
                value={fmt$(account.dailyPnl)}
                sub={fmtPct(account.dailyPnlPct)}
                accent={pnlColor(account.dailyPnl)}
              />
              <MetricCard
                label="Open Positions"
                value={`${account.openPositions}/${account.maxPositions}`}
                sub="max 4 concurrent"
              />
              <MetricCard
                label="Capital Deployed"
                value={`${account.deployedPct}%`}
                sub={`${fmt$(account.totalDeployed)} of ${fmt$(account.maxDeployable)}`}
                accent={account.deployedPct > 80 ? "text-yellow-400" : "text-[var(--text-primary)]"}
              />
              <MetricCard
                label="Trades Today"
                value={String(account.tradestoday)}
                sub={`${account.consecutiveLosses} consec. losses`}
                accent={account.consecutiveLosses >= 2 ? "text-yellow-400" : undefined}
              />
              <MetricCard
                label="Buying Power"
                value={`$${(account.buyingPower / 1000).toFixed(1)}K`}
                sub="available cash"
              />
            </div>

            {/* Deployed capital bar */}
            <div className="mt-3 card p-3">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2">
                <span>Capital deployed</span>
                <span>{fmt$(account.totalDeployed)} / {fmt$(account.maxDeployable)} (50% max)</span>
              </div>
              <div className="progress-bar">
                <div
                  className={`progress-fill ${
                    account.deployedPct > 80
                      ? "bg-yellow-500"
                      : account.deployedPct > 50
                      ? "bg-blue-500"
                      : "bg-purple-500"
                  }`}
                  style={{ width: `${Math.min(100, account.deployedPct)}%` }}
                />
              </div>
            </div>

            {/* Risk limits */}
            {account.consecutiveLosses >= 2 && (
              <div className="mt-3 card p-3 border border-yellow-500/30 flex items-center gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <div className="text-sm font-semibold text-yellow-400">
                    Consecutive Loss Warning
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    {account.consecutiveLosses} consecutive losses · Bot stops at 3
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ── Open Positions ── */}
          <section>
            <SectionHeader
              title="Open Positions"
              badge={positions.length === 0 ? "None" : String(positions.length)}
            />
            {positions.length === 0 ? (
              <div className="card p-8 text-center text-[var(--text-muted)] text-sm">
                <div className="text-3xl mb-2">📭</div>
                <div>No open positions</div>
                <div className="text-xs mt-1 text-[var(--text-muted)]">
                  Bot scans for S/D zone entries every ~20 minutes
                </div>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      {["Symbol", "Side", "Qty", "Entry", "Current", "P&L", "P&L %", "Mkt Value"].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-4 py-3 text-left text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((p, i) => (
                      <tr
                        key={p.symbol}
                        className={`border-b border-white/5 last:border-0 ${
                          i % 2 === 0 ? "" : "bg-white/[0.02]"
                        } hover:bg-white/[0.04] transition-colors`}
                      >
                        <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">
                          {p.symbol}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`badge ${
                              p.side === "long"
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-red-500/15 text-red-400"
                            }`}
                          >
                            {p.side.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">{p.qty}</td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">
                          ${p.entry.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">
                          ${p.current.toFixed(2)}
                        </td>
                        <td className={`px-4 py-3 font-semibold ${pnlColor(p.pnl)}`}>
                          {fmt$(p.pnl)}
                        </td>
                        <td className={`px-4 py-3 font-semibold ${pnlColor(p.pnlPercent)}`}>
                          {fmtPct(p.pnlPercent)}
                        </td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">
                          ${Math.abs(p.marketValue).toFixed(0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ── Two-column row: Recent Trades + Performance ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Recent Trades */}
            <section>
              <SectionHeader title="Recent Trades" badge="Last 5" />
              <div className="card">
                {recentTrades.length === 0 ? (
                  <div className="p-6 text-center text-[var(--text-muted)] text-sm">
                    <div className="text-2xl mb-2">🕐</div>
                    No trades executed yet today
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {recentTrades.map((t, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                              t.side === "long"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {t.side === "long" ? "L" : "S"}
                          </span>
                          <div>
                            <div className="font-semibold text-[var(--text-primary)] text-sm">
                              {t.symbol}
                            </div>
                            <div className="text-xs text-[var(--text-muted)]">
                              {t.qty} × ${t.entry.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-semibold ${pnlColor(t.pnl)}`}>
                            {t.pnl !== 0 ? fmt$(t.pnl) : "Open"}
                          </div>
                          <div className="text-xs text-[var(--text-muted)]">{relTime(t.timestamp)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Performance Stats */}
            <section>
              <SectionHeader title="Performance Stats" badge="All Time" />
              <div className="card divide-y divide-white/5">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-[var(--text-secondary)]">Win Rate</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 progress-bar">
                      <div
                        className="progress-fill bg-emerald-500"
                        style={{ width: `${performance.winRate}%` }}
                      />
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        performance.winRate >= 50 ? "text-emerald-400" : "text-[var(--text-secondary)]"
                      }`}
                    >
                      {performance.winRate.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-[var(--text-secondary)]">Total Trades</span>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">
                    {performance.totalTrades} ({performance.wins}W / {performance.losses}L)
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-[var(--text-secondary)]">Target R:R</span>
                  <span className="text-sm font-semibold text-purple-400">
                    {performance.avgRR.toFixed(1)}:1 min
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-[var(--text-secondary)]">Daily P&L</span>
                  <span className={`text-sm font-semibold ${pnlColor(performance.weeklyPnl)}`}>
                    {fmt$(performance.weeklyPnl)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-[var(--text-secondary)]">Best Trade</span>
                  <span className="text-sm font-semibold text-emerald-400">
                    {performance.bestTrade > 0 ? fmt$(performance.bestTrade) : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-[var(--text-secondary)]">Worst Trade</span>
                  <span className={`text-sm font-semibold ${pnlColor(performance.worstTrade)}`}>
                    {performance.worstTrade < 0 ? fmt$(performance.worstTrade) : "—"}
                  </span>
                </div>
                {/* Strategy rules reminder */}
                <div className="px-4 py-3 bg-white/[0.02] rounded-b-xl">
                  <div className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider mb-1.5">
                    Strategy Rules
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["Min R/R 3:1", "Max 4 positions", "2.5% per trade", "Trail at 2:1", "5% daily limit"].map(
                      (r) => (
                        <span
                          key={r}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300"
                        >
                          {r}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* ── Active Setups / Scan Activity ── */}
          <section>
            <SectionHeader title="Recent Scan Activity" badge={`Last ${recentSetups.length}`} />
            <div className="card p-4">
              {recentSetups.length === 0 ? (
                <div className="text-center text-[var(--text-muted)] text-sm py-4">
                  No scan data available
                </div>
              ) : (
                <div className="space-y-1 font-mono text-xs">
                  {recentSetups.map((line, i) => {
                    const ts = line.match(/^\[(.+?)\]/)?.[1] ?? "";
                    const msg = line.replace(/^\[.+?\]\s*/, "");
                    const isDeployed = msg.includes("Deployed");
                    const isLoaded = msg.includes("Loaded");
                    const isScanning = msg.includes("Scanning");
                    return (
                      <div key={i} className="flex items-start gap-3 py-1 border-b border-white/[0.03] last:border-0">
                        <span className="text-[var(--text-muted)] shrink-0 w-36">{ts}</span>
                        <span
                          className={
                            isDeployed
                              ? "text-blue-400"
                              : isLoaded
                              ? "text-emerald-400"
                              : isScanning
                              ? "text-yellow-400"
                              : "text-[var(--text-secondary)]"
                          }
                        >
                          {msg}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </>
      ) : (
        /* ── Live Log Tab ── */
        <section>
          <SectionHeader title="Live Log" badge={`${recentLogs.length} entries`} />
          <div className="card p-4">
            {recentLogs.length === 0 ? (
              <div className="text-center text-[var(--text-muted)] text-sm py-8">
                No log entries found
              </div>
            ) : (
              <div className="space-y-0.5 font-mono text-xs">
                {recentLogs.map((entry, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 py-1.5 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors px-1 rounded"
                  >
                    <span className="text-[var(--text-muted)] shrink-0 w-36">
                      {entry.timestamp.split(" ")[1] ?? entry.timestamp}
                    </span>
                    <span
                      className={`shrink-0 w-10 font-bold ${levelColor(entry.level)}`}
                    >
                      {entry.level}
                    </span>
                    <span className="text-[var(--text-secondary)] break-all">{entry.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <div className="text-center text-xs text-[var(--text-muted)] pb-2">
        Auto-refreshes every 30s · Paper trading only · No real money at risk
      </div>
    </div>
  );
}
