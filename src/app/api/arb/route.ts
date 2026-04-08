import { NextResponse } from "next/server";
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";

const ARB_LOG_PATH = "/root/.openclaw/workspace/arb-watcher/logs";

export async function GET() {
  try {
    const result: any = {
      polls: 0,
      lastPoll: new Date().toISOString(),
      status: "Unknown",
      mode: "Unknown",
      kalshi_markets: 0,
      poly_markets: 0,
      daily_trades: 0,
      daily_profit: 0,
      daily_loss: 0,
      last_edge: 0,
      recent_trades: [],
    };

    // Read main log file
    const mainLogPath = join(ARB_LOG_PATH, "arb-watcher.log");
    if (existsSync(mainLogPath)) {
      const logContent = readFileSync(mainLogPath, "utf-8");
      const lines = logContent.split("\n").filter(Boolean);

      // Count polls
      result.polls = lines.filter((l) => l.includes("Polled")).length;

      // Get last poll time
      const pollLines = lines.filter((l) => l.includes("INFO") && l.includes("Polled"));
      if (pollLines.length > 0) {
        const lastLine = pollLines[pollLines.length - 1];
        const match = lastLine.match(/^(\d{4}-\d{2}-\d{2}T[\d:]+)/);
        if (match) result.lastPoll = match[1];
      }

      // Parse poll info
      if (pollLines.length > 0) {
        const lastPollLine = pollLines[pollLines.length - 1];
        const marketsMatch = lastPollLine.match(/Polled (\d+) markets \((\d+) Poly\)/);
        if (marketsMatch) {
          result.kalshi_markets = parseInt(marketsMatch[1]);
          result.poly_markets = parseInt(marketsMatch[2]);
        }
      }

      // Check status
      result.status = lines.some((l) => l.includes("Starting Arb Watcher")) ? "Running" : "Stopped";

      // Check if simulation or live
      result.mode = lines.some((l) => l.includes("No Kalshi API key") || l.includes("simulation"))
        ? "Simulation"
        : "Live";
    }

    // Read today's trade log
    const today = new Date().toISOString().split("T")[0];
    const tradeLogPath = join(ARB_LOG_PATH, `trade-log-${today}.json`);
    if (existsSync(tradeLogPath)) {
      const tradeContent = readFileSync(tradeLogPath, "utf-8");
      const trades = JSON.parse(tradeContent);
      result.recent_trades = trades;

      // Calculate stats
      result.daily_trades = trades.length;
      result.daily_profit = trades
        .filter((t: any) => t.simulation)
        .reduce((sum: number, t: any) => sum + (1 - t.total_cost), 0);
    }

    // Read state file
    const statePath = join(ARB_LOG_PATH, "state.json");
    if (existsSync(statePath)) {
      const stateContent = readFileSync(statePath, "utf-8");
      const state = JSON.parse(stateContent);
      result.daily_trades = state.trades || 0;
      result.daily_profit = state.profit || 0;
      result.daily_loss = state.loss || 0;
    }

    // Check container status
    // Note: This would need to be fetched differently in production

    return NextResponse.json(result);
  } catch (error) {
    console.error("Arb API error:", error);
    return NextResponse.json(
      {
        error: "Could not fetch arb data",
        status: "Error",
        polls: 0,
        daily_trades: 0,
      },
      { status: 500 }
    );
  }
}