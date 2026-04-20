import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { execSync } from "child_process";

const LOGS_PATH = "/root/.openclaw/workspace/arb-watcher/logs";
const BOT_STATE_PATH = `${LOGS_PATH}/bot_state.json`;
const TRADES_LOG_PATH = `${LOGS_PATH}/trades.log`;

const ALPACA_KEY = process.env.ALPACA_API_KEY || "";
const ALPACA_SECRET = process.env.ALPACA_SECRET_KEY || "";
const ALPACA_BASE = "https://paper-api.alpaca.markets";

interface BotState {
  date: string;
  daily_pnl: number;
  consecutive_losses: number;
  trades_today: number;
  positions: Record<string, unknown>;
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
  price?: number;
  pnl: number;
  rr: number;
  result: "win" | "loss";
  timestamp: string;
  type: "EXEC" | "CLOSED";
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

function parseLogLines(content: string): LogEntry[] {
  const lines = content.split("\n").filter(Boolean);
  return lines.map((line) => {
    const match = line.match(/^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] \[(\w+)\] (.+)$/);
    if (match) {
      return { timestamp: match[1], level: match[2], message: match[3] };
    }
    return { timestamp: "", level: "INFO", message: line };
  }).filter((e) => e.timestamp);
}

async function fetchAlpacaAccount(): Promise<{ equity: number; cash: number; buyingPower: number } | null> {
  if (!ALPACA_KEY || !ALPACA_SECRET) return null;
  try {
    const res = await fetch(`${ALPACA_BASE}/v2/account`, {
      headers: {
        "Apca-Api-Key-Id": ALPACA_KEY,
        "Apca-Api-Secret-Key": ALPACA_SECRET,
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      equity: parseFloat(data.equity || "0"),
      cash: parseFloat(data.cash || "0"),
      buyingPower: parseFloat(data.buying_power || "0"),
    };
  } catch {
    return null;
  }
}

async function fetchAlpacaPositions(): Promise<Position[]> {
  if (!ALPACA_KEY || !ALPACA_SECRET) return [];
  try {
    const res = await fetch(`${ALPACA_BASE}/v2/positions`, {
      headers: {
        "Apca-Api-Key-Id": ALPACA_KEY,
        "Apca-Api-Secret-Key": ALPACA_SECRET,
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((p: Record<string, string>) => {
      const entry = parseFloat(p.avg_entry_price || "0");
      const current = parseFloat(p.current_price || "0");
      const qty = parseFloat(p.qty || "0");
      const pnl = parseFloat(p.unrealized_pl || "0");
      const pnlPct = entry > 0 ? ((current - entry) / entry) * 100 : 0;
      return {
        symbol: p.symbol,
        qty: Math.abs(qty),
        side: qty >= 0 ? "long" : "short",
        entry,
        current,
        pnl,
        pnlPercent: parseFloat(pnlPct.toFixed(2)),
        stop: 0,
        target: 0,
        marketValue: parseFloat(p.market_value || "0"),
      };
    });
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    // === BOT STATE ===
    let botState: BotState = {
      date: new Date().toISOString().split("T")[0],
      daily_pnl: 0,
      consecutive_losses: 0,
      trades_today: 0,
      positions: {},
    };

    if (existsSync(BOT_STATE_PATH)) {
      try {
        botState = JSON.parse(readFileSync(BOT_STATE_PATH, "utf-8"));
      } catch {
        // Use defaults
      }
    }

    // === LOG PARSING ===
    let logEntries: LogEntry[] = [];
    let equity = 100000;
    let recentSetups: string[] = [];
    const execTrades: Trade[] = [];

    if (existsSync(TRADES_LOG_PATH)) {
      const logContent = readFileSync(TRADES_LOG_PATH, "utf-8");
      logEntries = parseLogLines(logContent);

      // Get latest equity
      const equityLines = logEntries.filter((e) => e.message.includes("Account equity:"));
      if (equityLines.length > 0) {
        const match = equityLines[equityLines.length - 1].message.match(/\$([0-9,.]+)/);
        if (match) equity = parseFloat(match[1].replace(",", ""));
      }

      // Get recent scan/setup lines (last 50 lines worth)
      const recentEntries = logEntries.slice(-100);
      const setupLines = recentEntries.filter(
        (e) =>
          e.message.includes("SETUP") ||
          e.message.includes("Scanning for new setups") ||
          e.message.includes("Loaded") ||
          e.message.includes("Deployed")
      );
      recentSetups = setupLines.slice(-10).map((e) => `[${e.timestamp}] ${e.message}`);

      // Parse EXEC (buy/sell) lines
      const execLines = logEntries.filter((e) => e.level === "EXEC");
      for (const e of execLines.slice(-20)) {
        // BOUGHT AAPL: 10 shares @ $150.00, cost $1500.00
        // SOLD AAPL: 10 shares @ $150.00, cost $1500.00
        const match = e.message.match(/^(BOUGHT|SOLD) (\w+(?:\/\w+)?): ([\d.]+) shares @ \$([\d.]+)/);
        if (match) {
          execTrades.push({
            symbol: match[2],
            side: match[1] === "BOUGHT" ? "long" : "short",
            qty: parseFloat(match[3]),
            entry: parseFloat(match[4]),
            pnl: 0,
            rr: 0,
            result: "win",
            timestamp: e.timestamp,
            type: "EXEC",
          });
        }
      }
    }

    // === LIVE DATA FROM ALPACA ===
    const [account, positions] = await Promise.all([
      fetchAlpacaAccount(),
      fetchAlpacaPositions(),
    ]);

    if (account) {
      equity = account.equity;
    }

    // === BOT SCANNER STATUS ===
    // Try running a quick status check via docker
    let botRunning = false;
    let lastScanTime = logEntries.length > 0 ? logEntries[logEntries.length - 1].timestamp : null;

    try {
      const psOutput = execSync('docker ps --filter name=edge-hunter --format "{{.Status}}" 2>/dev/null', {
        timeout: 5000,
      }).toString().trim();
      botRunning = psOutput.length > 0 && psOutput.includes("Up");
    } catch {
      botRunning = false;
    }

    // === PERFORMANCE STATS ===
    // Compute from closed positions in log (CLOSED lines)
    const closedLines = logEntries.filter((e) => e.message.includes("CLOSED") || e.message.includes("closed at"));
    const allTrades: Trade[] = [...execTrades];

    // Weekly stats from bot state
    const weeklyWins = allTrades.filter((t) => t.result === "win").length;
    const weeklyTotal = allTrades.length;
    const winRate = weeklyTotal > 0 ? (weeklyWins / weeklyTotal) * 100 : 0;

    // Daily P&L from bot state or account
    const dailyPnl = botState.daily_pnl || 0;

    // Deployed capital
    const totalDeployed = positions.reduce((sum, p) => sum + Math.abs(p.marketValue), 0);
    const maxDeployable = equity * 0.5;
    const deployedPct = maxDeployable > 0 ? (totalDeployed / maxDeployable) * 100 : 0;

    // Recent log lines for display
    const recentLogs = logEntries
      .slice(-15)
      .reverse()
      .map((e) => ({ timestamp: e.timestamp, level: e.level, message: e.message }));

    return NextResponse.json({
      status: {
        botRunning,
        mode: "PAPER",
        date: botState.date,
        lastScanTime,
      },
      account: {
        equity,
        cash: account?.cash ?? equity,
        buyingPower: account?.buyingPower ?? equity,
        dailyPnl,
        dailyPnlPct: equity > 0 ? (dailyPnl / equity) * 100 : 0,
        openPositions: positions.length,
        maxPositions: 4,
        tradestoday: botState.trades_today,
        consecutiveLosses: botState.consecutive_losses,
        totalDeployed,
        maxDeployable,
        deployedPct: parseFloat(deployedPct.toFixed(1)),
      },
      positions,
      recentTrades: execTrades.slice(-5).reverse(),
      performance: {
        winRate: parseFloat(winRate.toFixed(1)),
        totalTrades: weeklyTotal,
        wins: weeklyWins,
        losses: weeklyTotal - weeklyWins,
        avgRR: 3.0,
        weeklyPnl: dailyPnl,
        bestTrade: execTrades.length > 0 ? Math.max(...execTrades.map((t) => t.pnl)) : 0,
        worstTrade: execTrades.length > 0 ? Math.min(...execTrades.map((t) => t.pnl)) : 0,
      },
      recentSetups,
      recentLogs,
      closedCount: closedLines.length,
    });
  } catch (error) {
    console.error("Trading API error:", error);
    return NextResponse.json({ error: "Could not fetch trading data" }, { status: 500 });
  }
}
