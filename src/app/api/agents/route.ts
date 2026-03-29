import { NextResponse } from "next/server";
import { execSync } from "child_process";

interface Agent {
  name: string;
  role: string;
  status: string;
  model: string;
}

export async function GET() {
  try {
    let agents: Agent[] = [
      {
        name: "Main Agent",
        role: "Primary conversation",
        status: "active",
        model: "MiniMax M2.5",
      },
      {
        name: "Heartbeat Agent",
        role: "Self-improvement",
        status: "active",
        model: "GPT-4.1",
      },
      {
        name: "Task Tracker",
        role: "Task management",
        status: "standby",
        model: "Script",
      },
    ];

    // Try to get real session info
    try {
      const sessionsOutput = execSync(
        "openclaw sessions list --json 2>/dev/null",
        { encoding: "utf8" },
      );
      const sessions = JSON.parse(sessionsOutput);

      if (sessions.sessions) {
        agents = sessions.sessions.map(
          (s: {
            displayName?: string;
            key?: string;
            updatedAt?: string;
            model?: string;
          }) => ({
            name: s.displayName || s.key?.split(":").pop() || "Unknown",
            role: s.key?.split(":")[0] || "session",
            status: s.updatedAt ? "active" : "inactive",
            model: s.model || "unknown",
          }),
        );
      }
    } catch {
      // Use default agents
    }

    return NextResponse.json({ agents });
  } catch (error) {
    console.error("Error fetching agents:", error);
    return NextResponse.json(
      {
        agents: [
          {
            name: "Main Agent",
            role: "Primary",
            status: "active",
            model: "MiniMax M2.5",
          },
        ],
      },
      { status: 500 },
    );
  }
}
