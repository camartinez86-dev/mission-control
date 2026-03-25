import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const memoryDir = "/root/.openclaw/workspace/memory";
    const memories: any[] = [];

    if (fs.existsSync(memoryDir)) {
      const files = fs.readdirSync(memoryDir);
      for (const file of files) {
        if (file.endsWith(".md")) {
          const content = fs.readFileSync(path.join(memoryDir, file), "utf8");
          const date = file.replace(".md", "");
          memories.push({
            date,
            preview: content.substring(0, 200).replace(/[#*]/g, "").trim(),
            type: "session",
          });
        }
      }
    }

    // Also check root markdown files
    const rootFiles = ["MEMORY.md", "SOUL.md", "AGENTS.md", "TOOLS.md", "USER.md"];
    for (const file of rootFiles) {
      const filePath = `/root/.openclaw/workspace/${file}`;
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf8");
        memories.push({
          date: new Date().toISOString().split("T")[0],
          name: file,
          preview: content.substring(0, 150).replace(/[#*]/g, "").trim(),
          type: "config",
        });
      }
    }

    return NextResponse.json({ memories: memories.reverse() });
  } catch (error) {
    console.error("Error fetching memories:", error);
    return NextResponse.json({ memories: [] }, { status: 500 });
  }
}
