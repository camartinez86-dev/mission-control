import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const ARB_LOG_PATH = "/root/.openclaw/workspace/arb-watcher/logs";

export async function GET() {
  try {
    const result: any = {
      // Arb Watcher (cross-exchange)
      arbWatcher: {
        status: "Unknown",
        polls: 0,
        lastPoll: null,
        kalshi_markets: 0,
        poly_markets: 0,
        mode: "Unknown",
        daily_trades: 0,
        daily_profit: 0,
        daily_loss: 0,
      },
      // Edge Hunter (AI mispricing)
      edgeHunter: {
        status: "Unknown",
        mode: "Simulation",
        lastRun: null,
        signalsGenerated: 0,
        lastSignalUpdate: null,
        healthCheck: "Unknown",
        positions: 0,
        trades: 0,
        profit: 0,
      },
      // Simulation data
      simulation: {
        enabled: true,
        totalSimTrades: 0,
        lastSimTrade: null,
        recentTrades: [],
        testPeriod: "Apr 10 - Apr 24, 2026",
        daysRemaining: 13,
      },
      // System status
      containers: {
        edgeHunter: "Unknown",
        newsMonitor: "Unknown",
        arbWatcher: "Unknown",
      },
    };

    // === ARB WATCHER ===
    const arbLogPath = join(ARB_LOG_PATH, "arb-watcher.log");
    if (existsSync(arbLogPath)) {
      const logContent = readFileSync(arbLogPath, "utf-8");
      const lines = logContent.split("\n").filter(Boolean);

      result.arbWatcher.polls = lines.filter((l) => l.includes("Polled")).length;

      const pollLines = lines.filter((l) => l.includes("INFO") && l.includes("Polled"));
      if (pollLines.length > 0) {
        const lastLine = pollLines[pollLines.length - 1];
        const match = lastLine.match(/^(\d{4}-\d{2}-\d{2}T[\d:]+)/);
        if (match) result.arbWatcher.lastPoll = match[1];

        const marketsMatch = lastLine.match(/Polled (\d+) markets \((\d+) Poly\)/);
        if (marketsMatch) {
          result.arbWatcher.kalshi_markets = parseInt(marketsMatch[1]);
          result.arbWatcher.poly_markets = parseInt(marketsMatch[2]);
        }
      }

      result.arbWatcher.status = lines.some((l) => l.includes("Starting Arb Watcher")) ? "Running" : "Stopped";
      result.arbWatcher.mode = "Simulation";
    }

    // === EDGE HUNTER ===
    const edgeLogPath = join(ARB_LOG_PATH, "edge-hunter.log");
    if (existsSync(edgeLogPath)) {
      const edgeLogContent = readFileSync(edgeLogPath, "utf-8");
      const edgeLines = edgeLogContent.split("\n").filter(Boolean);

      // Check if running
      if (edgeLines.some((l) => l.includes("Edge Hunter running continuous loop"))) {
        result.edgeHunter.status = "Running";
      }

      // Count simulation trades
      const simTrades = edgeLines.filter((l) => l.includes("[SIMULATION] Logged"));
      if (simTrades.length > 0) {
        const lastSim = simTrades[simTrades.length - 1].match(/Total sim trades: (\d+)/);
        if (lastSim) result.simulation.totalSimTrades = parseInt(lastSim[1]);
      }

      // Get last run time
      const runLines = edgeLines.filter((l) => l.includes("Edge Hunter running"));
      if (runLines.length > 0) {
        const lastRunMatch = runLines[0].match(/^(\d{4}-\d{2}-\d{2}T[\d:]+)/);
        if (lastRunMatch) result.edgeHunter.lastRun = lastRunMatch[1];
      }

      // Check errors
      const errorLines = edgeLines.filter((l) => l.includes("ERROR"));
      if (errorLines.length > 0) {
        result.edgeHunter.status = "Has Errors";
      }

      // Parse state
      const statePath = join(ARB_LOG_PATH, "edge_state.json");
      if (existsSync(statePath)) {
        try {
          const state = JSON.parse(readFileSync(statePath, "utf-8"));
          result.edgeHunter.trades = state.trades || 0;
          result.edgeHunter.profit = state.profit || 0;
          result.edgeHunter.positions = state.positions?.length || 0;
        } catch (e) {}
      }
    }

    // === SIGNALS ===
    const signalsPath = join(ARB_LOG_PATH, "edge_signals.json");
    if (existsSync(signalsPath)) {
      try {
        const signals = JSON.parse(readFileSync(signalsPath, "utf-8"));
        result.edgeHunter.signalsGenerated = Object.keys(signals.signals || {}).length;
        result.edgeHunter.lastSignalUpdate = signals.timestamp || null;
      } catch (e) {}
    }

    // === SIMULATION TRADES ===
    const simPath = join(ARB_LOG_PATH, "simulation_trades.json");
    if (existsSync(simPath)) {
      try {
        const trades = JSON.parse(readFileSync(simPath, "utf-8"));
        result.simulation.totalSimTrades = trades.length;
        result.simulation.recentTrades = trades.slice(-10).map((t: any) => ({
          ticker: t.ticker,
          side: t.side,
          size: t.size,
          ai_prob: t.ai_prob,
          market_prob: t.market_prob,
          edge: t.edge_abs,
          timestamp: t.timestamp,
        }));
        if (trades.length > 0) {
          result.simulation.lastSimTrade = trades[trades.length - 1].timestamp;
        }
      } catch (e) {}
    }

    // === TEST SUMMARY ===
    const summaryPath = join(ARB_LOG_PATH, "test_summary.json");
    if (existsSync(summaryPath)) {
      try {
        const summary = JSON.parse(readFileSync(summaryPath, "utf-8"));
        result.simulation.daysRemaining = summary.days_remaining || 0;
        result.simulation.testPeriod = summary.test_period || "Apr 10 - Apr 24";
      } catch (e) {}
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Arb API error:", error);
    return NextResponse.json({ error: "Could not fetch arb data" }, { status: 500 });
  }
}