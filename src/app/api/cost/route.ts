import { NextResponse } from "next/server";
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";

const WORKSPACE_PATH = process.env.OPENCLAW_WORKSPACE || 
  (process.env.NODE_ENV === 'production' ? "/root/.openclaw/workspace" : "/data/.openclaw/workspace");
const USAGE_LOGS_DIR = `${WORKSPACE_PATH}/usage-logs`;
const REPORTS_DIR = `${USAGE_LOGS_DIR}/reports`;

interface Call {
  timestamp: string;
  provider: string;
  model: string;
  taskType: string;
  inputTokens: number;
  outputTokens: number;
  cacheReads: number;
  cacheWrites: number;
  estimatedCost: number;
  success: boolean;
  sessionId?: string;
  error?: string;
}

interface ModelBreakdown {
  cost: number;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  provider: string;
}

interface TaskBreakdown {
  cost: number;
  calls: number;
  inputTokens: number;
  outputTokens: number;
}

function getDateRange(period: string): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  
  if (period === "day") {
    start.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    start.setDate(start.getDate() - 7);
  } else if (period === "month") {
    start.setDate(start.getDate() - 30);
  }
  
  return { start, end };
}

function loadCallsForPeriod(start: Date, end: Date): Call[] {
  const calls: Call[] = [];
  const current = new Date(start);
  
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    const logFile = join(USAGE_LOGS_DIR, `calls-${dateStr}.jsonl`);
    
    if (existsSync(logFile)) {
      try {
        const content = readFileSync(logFile, 'utf-8');
        const lines = content.split('\n').filter(Boolean);
        
        for (const line of lines) {
          try {
            const call = JSON.parse(line) as Call;
            calls.push(call);
          } catch {
            // Skip malformed lines
          }
        }
      } catch {
        // Skip unreadable files
      }
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  return calls;
}

function filterCalls(calls: Call[], model?: string, taskType?: string, provider?: string): Call[] {
  return calls.filter(c => {
    if (model && !c.model.toLowerCase().includes(model.toLowerCase())) return false;
    if (taskType && c.taskType !== taskType) return false;
    if (provider && c.provider !== provider) return false;
    return true;
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'day';
    const model = searchParams.get('model') || undefined;
    const taskType = searchParams.get('task_type') || searchParams.get('taskType') || undefined;
    const provider = searchParams.get('provider') || undefined;
    
    const { start, end } = getDateRange(period);
    let calls = loadCallsForPeriod(start, end);
    
    // Apply filters
    if (model || taskType || provider) {
      calls = filterCalls(calls, model, taskType, provider);
    }
    
    // Aggregate totals
    const totalCalls = calls.length;
    const totalCost = calls.reduce((sum, c) => sum + c.estimatedCost, 0);
    const totalInput = calls.reduce((sum, c) => sum + c.inputTokens, 0);
    const totalOutput = calls.reduce((sum, c) => sum + c.outputTokens, 0);
    const totalCacheReads = calls.reduce((sum, c) => sum + c.cacheReads, 0);
    const totalCacheWrites = calls.reduce((sum, c) => sum + c.cacheWrites, 0);
    
    // By Model
    const byModel: Record<string, ModelBreakdown> = {};
    for (const call of calls) {
      if (!byModel[call.model]) {
        byModel[call.model] = { cost: 0, calls: 0, inputTokens: 0, outputTokens: 0, provider: call.provider };
      }
      byModel[call.model].cost += call.estimatedCost;
      byModel[call.model].calls += 1;
      byModel[call.model].inputTokens += call.inputTokens;
      byModel[call.model].outputTokens += call.outputTokens;
    }
    
    // By Task Type
    const byTaskType: Record<string, TaskBreakdown> = {};
    for (const call of calls) {
      if (!byTaskType[call.taskType]) {
        byTaskType[call.taskType] = { cost: 0, calls: 0, inputTokens: 0, outputTokens: 0 };
      }
      byTaskType[call.taskType].cost += call.estimatedCost;
      byTaskType[call.taskType].calls += 1;
      byTaskType[call.taskType].inputTokens += call.inputTokens;
      byTaskType[call.taskType].outputTokens += call.outputTokens;
    }
    
    // By Provider
    const byProvider: Record<string, { cost: number; calls: number }> = {};
    for (const call of calls) {
      if (!byProvider[call.provider]) {
        byProvider[call.provider] = { cost: 0, calls: 0 };
      }
      byProvider[call.provider].cost += call.estimatedCost;
      byProvider[call.provider].calls += 1;
    }
    
    // By Day
    const byDay: Record<string, { cost: number; calls: number }> = {};
    for (const call of calls) {
      const day = call.timestamp?.split('T')[0] || 'unknown';
      if (!byDay[day]) {
        byDay[day] = { cost: 0, calls: 0 };
      }
      byDay[day].cost += call.estimatedCost;
      byDay[day].calls += 1;
    }
    
    // Top calls
    const topCalls = [...calls]
      .sort((a, b) => b.estimatedCost - a.estimatedCost)
      .slice(0, 10)
      .map(c => ({
        timestamp: c.timestamp,
        model: c.model,
        taskType: c.taskType,
        cost: c.estimatedCost,
        inputTokens: c.inputTokens,
        outputTokens: c.outputTokens,
        provider: c.provider
      }));
    
    // MiniMax budget tracking
    const miniMaxCost = Object.entries(byModel)
      .filter(([model]) => model.includes('MiniMax'))
      .reduce((sum, [, data]) => sum + data.cost, 0);
    
    const result = {
      period,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      filters: { model, taskType, provider },
      totalCalls,
      totalCost,
      totalInputTokens: totalInput,
      totalOutputTokens: totalOutput,
      totalCacheReads: totalCacheReads,
      totalCacheWrites: totalCacheWrites,
      avgCostPerCall: totalCalls > 0 ? totalCost / totalCalls : 0,
      byModel: Object.fromEntries(
        Object.entries(byModel).map(([k, v]) => [k, { ...v, cost: Math.round(v.cost * 1000000) / 1000000 }])
      ),
      byTaskType: Object.fromEntries(
        Object.entries(byTaskType).map(([k, v]) => [k, { ...v, cost: Math.round(v.cost * 1000000) / 1000000 }])
      ),
      byProvider,
      byDay,
      topCalls,
      budgetStatus: {
        minimax: {
          limit: 20,
          used: Math.round(miniMaxCost * 1000000) / 1000000,
          remaining: Math.max(0, 20 - miniMaxCost),
          percentUsed: (miniMaxCost / 20) * 100
        }
      },
      generatedAt: new Date().toISOString()
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Cost API error:', error);
    return NextResponse.json({ error: 'Failed to generate cost report' }, { status: 500 });
  }
}
