import { NextResponse } from "next/server";
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";

const SESSIONS_DIR = process.env.OPENCLAW_SESSIONS_DIR ||
  (process.env.NODE_ENV === 'production'
    ? "/root/.openclaw/agents/main/sessions"
    : "/root/.openclaw/agents/main/sessions");

interface UsageEntry {
  timestamp: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheRead: number;
  cacheWrite: number;
  cost: number;
}

function getDateRange(period: string): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  if (period === "day") {
    start.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
  } else if (period === "month") {
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
  }

  return { start, end };
}

function parseSessionsForUsage(start: Date, end: Date): UsageEntry[] {
  const entries: UsageEntry[] = [];

  if (!existsSync(SESSIONS_DIR)) return entries;

  const files = readdirSync(SESSIONS_DIR).filter(f => f.endsWith('.jsonl'));

  for (const file of files) {
    const filePath = join(SESSIONS_DIR, file);
    let content: string;
    try {
      content = readFileSync(filePath, 'utf-8');
    } catch {
      continue;
    }

    const lines = content.split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const record = JSON.parse(line);
        if (record.type !== 'message') continue;
        if (record.message?.role !== 'assistant') continue;

        const usage = record.message?.usage;
        if (!usage || typeof usage !== 'object') continue;

        const costObj = usage.cost;
        const totalCost = typeof costObj?.total === 'number' ? costObj.total : 0;

        const ts = record.timestamp ? new Date(record.timestamp) : null;
        if (!ts || isNaN(ts.getTime())) continue;
        if (ts < start || ts > end) continue;

        const inputTok = usage.input || 0;
        const outputTok = usage.output || 0;
        if (inputTok === 0 && outputTok === 0) continue;

        entries.push({
          timestamp: ts.toISOString(),
          provider: record.message.provider || 'unknown',
          model: record.message.model || 'unknown',
          inputTokens: inputTok,
          outputTokens: outputTok,
          cacheRead: usage.cacheRead || 0,
          cacheWrite: usage.cacheWrite || 0,
          cost: totalCost,
        });
      } catch {
        // skip malformed
      }
    }
  }

  return entries;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'day';
    const filterProvider = searchParams.get('provider') || undefined;
    const filterModel = searchParams.get('model') || undefined;

    const { start, end } = getDateRange(period);
    let entries = parseSessionsForUsage(start, end);

    if (filterProvider) {
      entries = entries.filter(e => e.provider.toLowerCase().includes(filterProvider.toLowerCase()));
    }
    if (filterModel) {
      entries = entries.filter(e => e.model.toLowerCase().includes(filterModel.toLowerCase()));
    }

    const totalCalls = entries.length;
    const totalCost = entries.reduce((s, e) => s + e.cost, 0);
    const totalInput = entries.reduce((s, e) => s + e.inputTokens, 0);
    const totalOutput = entries.reduce((s, e) => s + e.outputTokens, 0);
    const totalCacheRead = entries.reduce((s, e) => s + e.cacheRead, 0);
    const totalCacheWrite = entries.reduce((s, e) => s + e.cacheWrite, 0);

    // By Model
    const byModel: Record<string, { cost: number; calls: number; inputTokens: number; outputTokens: number; provider: string }> = {};
    for (const e of entries) {
      if (!byModel[e.model]) {
        byModel[e.model] = { cost: 0, calls: 0, inputTokens: 0, outputTokens: 0, provider: e.provider };
      }
      byModel[e.model].cost += e.cost;
      byModel[e.model].calls += 1;
      byModel[e.model].inputTokens += e.inputTokens;
      byModel[e.model].outputTokens += e.outputTokens;
    }

    // By Provider
    const byProvider: Record<string, { cost: number; calls: number }> = {};
    for (const e of entries) {
      if (!byProvider[e.provider]) {
        byProvider[e.provider] = { cost: 0, calls: 0 };
      }
      byProvider[e.provider].cost += e.cost;
      byProvider[e.provider].calls += 1;
    }

    // By Day
    const byDay: Record<string, { cost: number; calls: number }> = {};
    for (const e of entries) {
      const day = e.timestamp.split('T')[0];
      if (!byDay[day]) byDay[day] = { cost: 0, calls: 0 };
      byDay[day].cost += e.cost;
      byDay[day].calls += 1;
    }

    // Top calls by cost
    const topCalls = [...entries]
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10)
      .map(e => ({
        timestamp: e.timestamp,
        model: e.model,
        provider: e.provider,
        cost: e.cost,
        inputTokens: e.inputTokens,
        outputTokens: e.outputTokens,
      }));

    // Budget calculations
    const mmUsed = Object.entries(byProvider)
      .filter(([p]) => p.includes('minimax'))
      .reduce((s, [, v]) => s + v.cost, 0);
    const openaiUsed = Object.entries(byProvider)
      .filter(([p]) => p.includes('openai'))
      .reduce((s, [, v]) => s + v.cost, 0);
    const modelstudioUsed = Object.entries(byProvider)
      .filter(([p]) => p.includes('modelstudio'))
      .reduce((s, [, v]) => s + v.cost, 0);
    const kimiUsed = Object.entries(byProvider)
      .filter(([p]) => p.includes('kimi'))
      .reduce((s, [, v]) => s + v.cost, 0);
    const openaiLimit = 10;
    const modelstudioLimit = 10; // pay-as-you-go soft cap
    const kimiLimit = 5; // pay-as-you-go soft cap

    const result = {
      period,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      source: 'openclaw-sessions',
      filters: { provider: filterProvider, model: filterModel },
      totalCalls,
      totalCost,
      totalInputTokens: totalInput,
      totalOutputTokens: totalOutput,
      totalCacheReads: totalCacheRead,
      totalCacheWrites: totalCacheWrite,
      avgCostPerCall: totalCalls > 0 ? totalCost / totalCalls : 0,
      byModel,
      byProvider,
      byDay,
      topCalls,
      budgetStatus: {
        minimax: {
          limit: 20,
          used: mmUsed,
          remaining: Math.max(0, 20 - mmUsed),
          percentUsed: (mmUsed / 20) * 100,
        },
        openai: {
          limit: openaiLimit,
          used: openaiUsed,
          remaining: Math.max(0, openaiLimit - openaiUsed),
          percentUsed: (openaiUsed / openaiLimit) * 100,
        },
        modelstudio: {
          limit: modelstudioLimit,
          used: modelstudioUsed,
          remaining: Math.max(0, modelstudioLimit - modelstudioUsed),
          percentUsed: (modelstudioUsed / modelstudioLimit) * 100,
          isPayGo: true,
        },
        kimi: {
          limit: kimiLimit,
          used: kimiUsed,
          remaining: Math.max(0, kimiLimit - kimiUsed),
          percentUsed: (kimiUsed / kimiLimit) * 100,
          isPayGo: true,
        },
      },
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Cost API error:', error);
    return NextResponse.json({ error: 'Failed to generate cost report' }, { status: 500 });
  }
}
