import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { execSync } = require("child_process");
    
    let agents = [
      { name: "Main Agent", role: "Primary conversation", status: "active", model: "MiniMax M2.5" },
      { name: "Heartbeat Agent", role: "Self-improvement", status: "active", model: "GPT-4.1" },
      { name: "Task Tracker", role: "Task management", status: "standby", model: "Script" },
    ];

    // Try to get real session info
    try {
      const sessionsOutput = execSync("openclaw sessions list --json 2>/dev/null", { encoding: "utf8" });
      const sessions = JSON.parse(sessionsOutput);
      
      if (sessions.sessions) {
        agents = sessions.sessions.map((s: any) => ({
          name: s.displayName || s.key?.split(":").pop() || "Unknown",
          role: s.kind || "session",
          status: s.updatedAt ? "active" : "inactive",
          model: s.model || "unknown",
        }));
      }
    } catch (e) {
      // Use default agents
    }

    return NextResponse.json({ agents });
  } catch (error) {
    console.error("Error fetching agents:", error);
    return NextResponse.json({ 
      agents: [
        { name: "Main Agent", role: "Primary", status: "active", model: "MiniMax M2.5" }
      ]
    }, { status: 500 });
  }
}
