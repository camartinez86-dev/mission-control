import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";

const LOGS_PATH = "/root/.openclaw/workspace/arb-watcher/logs";
const TRADES_LOG_PATH = `${LOGS_PATH}/trades.log`;
const BOT_STATE_PATH = `${LOGS_PATH}/bot_state.json`;

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

function parseLogLines(content: string): LogEntry[] {
  const lines = content.split("\n").filter(Boolean);
  return lines
    .map((line) => {
      const match = line.match(/^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] \[(\w+)\] (.+)$/);
      if (match) return { timestamp: match[1], level: match[2], message: match[3] };
      return { timestamp: "", level: "INFO", message: line };
    })
    .filter((e) => e.timestamp);
}

function getPeriodStart(period: string): Date {
  const now = new Date();
  switch (period) {
    case "today":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "week":
      const dayOfWeek = now.getDay();
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      return new Date(now.getFullYear(), now.getMonth(), diff);
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    default:
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "week";

    const logEntries: LogEntry[] = existsSync(TRADES_LOG_PATH)
      ? parseLogLines(readFileSync(TRADES_LOG_PATH, "utf-8"))
      : [];

    const periodStart = getPeriodStart(period);
    const filteredLogs = logEntries.filter((e) => {
      const d = new Date(e.timestamp);
      return d >= periodStart;
    });

    // Parse trades and closed positions
    interface TradeResult {
      symbol: string;
      side: string;
      pnl: number;
      rr: number;
      timestamp: string;
      result: "win" | "loss" | "open";
    }

    const trades: TradeResult[] = [];

    // EXEC lines
    filteredLogs.forEach((e) => {
      if (e.level === "EXEC") {
        const match = e.message.match(/^(BOUGHT|SOLD) (\w+): ([\d.]+) shares @ \$([\d.]+)/);
        if (match) {
          trades.push({
            symbol: match[2],
            side: match[1] === "BOUGHT" ? "long" : "short",
            pnl: 0,
            rr: 0,
            timestamp: e.timestamp,
            result: "open",
          });
        }
      }
    });

    // CLOSED lines - extract actual P&L
    filteredLogs.forEach((e) => {
      if (e.message.includes("CLOSED")) {
        const pnlMatch = e.message.match(/P&L[:\s]*\$?(-?[\d.]+)/);
        const symMatch = e.message.match(/(\w+) (long|short)/);
        const rrMatch = e.message.match(/R\/R[:\s]*([\d.]+)/);
        if (pnlMatch && symMatch) {
          const pnl = parseFloat(pnlMatch[1]);
          trades.push({
            symbol: symMatch[1],
            side: symMatch[2],
            pnl,
            rr: rrMatch ? parseFloat(rrMatch[1]) : 0,
            timestamp: e.timestamp,
            result: pnl >= 0 ? "win" : "loss",
          });
        }
      }
    });

    const closedTrades = trades.filter((t) => t.result !== "open");
    const wins = closedTrades.filter((t) => t.result === "win");
    const losses = closedTrades.filter((t) => t.result === "loss");

    const totalPnl = closedTrades.reduce((s, t) => s + t.pnl, 0);
    const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0;
    const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length : 0;
    const bestTrade = closedTrades.length > 0 ? Math.max(...closedTrades.map((t) => t.pnl)) : 0;
    const worstTrade = closedTrades.length > 0 ? Math.min(...closedTrades.map((t) => t.pnl)) : 0;

    // Current streak
    let streak = 0;
    const sortedTrades = [...closedTrades].reverse();
    if (sortedTrades.length > 0) {
      const firstResult = sortedTrades[0].result;
      streak = 1;
      for (let i = 1; i < sortedTrades.length; i++) {
        if (sortedTrades[i].result === firstResult) streak++;
        else break;
      }
    }

    return NextResponse.json({
      period,
      summary: {
        totalTrades: closedTrades.length,
        wins: wins.length,
        losses: losses.length,
        winRate: parseFloat(winRate.toFixed(1)),
        totalPnl: parseFloat(totalPnl.toFixed(2)),
        avgWin: parseFloat(avgWin.toFixed(2)),
        avgLoss: parseFloat(avgLoss.toFixed(2)),
        bestTrade: parseFloat(bestTrade.toFixed(2)),
        worstTrade: parseFloat(worstTrade.toFixed(2)),
        currentStreak: streak,
        streakType: closedTrades.length > 0 ? closedTrades[closedTrades.length - 1]?.result : null,
      },
      trades: closedTrades.reverse(),
    });
  } catch (error) {
    console.error("Trading performance error:", error);
    return NextResponse.json({ error: "Could not fetch performance data" }, { status: 500 });
  }
}
