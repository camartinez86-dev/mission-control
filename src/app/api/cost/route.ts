import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// Use environment variable or fallback to common paths
const WORKSPACE_PATH = process.env.OPENCLAW_WORKSPACE || 
  (process.env.NODE_ENV === 'production' ? "/root/.openclaw/workspace" : "/data/.openclaw/workspace");
const COST_TRACKING_PATH = `${WORKSPACE_PATH}/cost-tracking.json`;
const SESSIONS_PATH = `${WORKSPACE_PATH}/agents/main/sessions/sessions.json`;

interface ModelCost {
  inputCostPerM: number;
  outputCostPerM: number;
  cacheReadCostPerM: number;
  cacheWriteCostPerM: number;
}

interface CostEntry {
  date: string;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  cacheReads: number;
  cacheWrites: number;
  cost: number;
  sessionId?: string;
  agentId?: string;
}

export async function GET() {
  try {
    const result = {
      dailyTotals: {} as Record<string, { cost: number; input: number; output: number; cacheReads: number; cacheWrites: number }>,
      byModel: {} as Record<string, { cost: number; input: number; output: number; provider: string }>,
      totalCost: 0,
      totalInput: 0,
      totalOutput: 0,
      lastUpdated: null as string | null,
      budgetStatus: {
        minimax: { limit: 20, used: 0, remaining: 20, percentUsed: 0 },
      },
      recentEntries: [] as CostEntry[],
    };

    // Load cost tracking data
    if (existsSync(COST_TRACKING_PATH)) {
      const data = JSON.parse(readFileSync(COST_TRACKING_PATH, "utf-8"));
      
      // Process entries
      if (data.entries && Array.isArray(data.entries)) {
        for (const entry of data.entries as CostEntry[]) {
          const date = entry.date;
          if (!result.dailyTotals[date]) {
            result.dailyTotals[date] = { cost: 0, input: 0, output: 0, cacheReads: 0, cacheWrites: 0 };
          }
          result.dailyTotals[date].cost += entry.cost;
          result.dailyTotals[date].input += entry.inputTokens;
          result.dailyTotals[date].output += entry.outputTokens;
          result.dailyTotals[date].cacheReads += entry.cacheReads;
          result.dailyTotals[date].cacheWrites += entry.cacheWrites;

          const modelKey = entry.model;
          if (!result.byModel[modelKey]) {
            result.byModel[modelKey] = { cost: 0, input: 0, output: 0, provider: entry.provider };
          }
          result.byModel[modelKey].cost += entry.cost;
          result.byModel[modelKey].input += entry.inputTokens;

          result.totalCost += entry.cost;
          result.totalInput += entry.inputTokens;
          result.totalOutput += entry.outputTokens;
        }
        result.recentEntries = data.entries.slice(-10).reverse();
        result.lastUpdated = data.lastUpdated;
      }

      // Update MiniMax budget status (the 402 error showed $20 limit)
      if (result.byModel["MiniMax-M2.7"]) {
        result.budgetStatus.minimax.used = result.byModel["MiniMax-M2.7"].cost;
        result.budgetStatus.minimax.remaining = Math.max(0, 20 - result.byModel["MiniMax-M2.7"].cost);
        result.budgetStatus.minimax.percentUsed = (result.byModel["MiniMax-M2.7"].cost / 20) * 100;
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Cost API error:", error);
    return NextResponse.json({ error: "Failed to load cost data" }, { status: 500 });
  }
}
