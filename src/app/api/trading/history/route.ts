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

function exportToCsv(trades: Array<{
  symbol: string;
  side: string;
  qty: number;
  entry: number;
  pnl: number;
  timestamp: string;
  type: string;
}>): string {
  const headers = ["Timestamp", "Symbol", "Side", "Qty", "Entry", "P&L", "Type"];
  const rows = trades.map((t) =>
    [t.timestamp, t.symbol, t.side, t.qty, t.entry.toFixed(2), t.pnl.toFixed(2), t.type]
  );
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "today";
    const format = searchParams.get("format") || "json";

    const logEntries: LogEntry[] = existsSync(TRADES_LOG_PATH)
      ? parseLogLines(readFileSync(TRADES_LOG_PATH, "utf-8"))
      : [];

    const periodStart = getPeriodStart(period);
    const filteredLogs = logEntries.filter((e) => {
      const d = new Date(e.timestamp);
      return d >= periodStart;
    });

    // Parse all EXEC lines as trades
    const execLines = filteredLogs.filter((e) => e.level === "EXEC");
    const trades = execLines.map((e) => {
      const match = e.message.match(/^(BOUGHT|SOLD) (\w+(?:\/\w+)?): ([\d.]+) shares @ \$([\d.]+)/);
      return match
        ? {
            symbol: match[2],
            side: match[1] === "BOUGHT" ? "long" : "short",
            qty: parseFloat(match[3]),
            entry: parseFloat(match[4]),
            pnl: 0,
            timestamp: e.timestamp,
            type: "EXEC",
          }
        : null;
    }).filter(Boolean) as Array<{
      symbol: string;
      side: string;
      qty: number;
      entry: number;
      pnl: number;
      timestamp: string;
      type: string;
    }>;

    // Add closed trades from log
    const closedLines = filteredLogs.filter(
      (e) => e.message.includes("CLOSED") || e.message.includes("closed at")
    );
    closedLines.forEach((e) => {
      // Parse closed trade info if present
      const match = e.message.match(/(\w+) (long|short) closed.*?\$?(-?[\d.]+)/);
      if (match) {
        trades.push({
          symbol: match[1],
          side: match[2],
          qty: 0,
          entry: 0,
          pnl: parseFloat(match[3]),
          timestamp: e.timestamp,
          type: "CLOSED",
        });
      }
    });

    if (format === "csv") {
      const csv = exportToCsv(trades);
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="trades-${period}.csv"`,
        },
      });
    }

    return NextResponse.json({
      period,
      count: trades.length,
      trades: trades.reverse(),
    });
  } catch (error) {
    console.error("Trading history error:", error);
    return NextResponse.json({ error: "Could not fetch trade history" }, { status: 500 });
  }
}
