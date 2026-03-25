import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const workspaceDir = "/root/.openclaw/workspace";
    const docs: any[] = [];

    const allowedExtensions = [".md", ".txt", ".json", ".yaml", ".yml"];

    function scanDir(dir: string) {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        
        // Skip hidden and special directories
        if (item.name.startsWith(".") || item.name === "node_modules" || item.name === ".git") {
          continue;
        }
        
        if (item.isDirectory()) {
          scanDir(fullPath);
        } else if (item.isFile()) {
          const ext = path.extname(item.name).toLowerCase();
          if (allowedExtensions.includes(ext)) {
            const stats = fs.statSync(fullPath);
            const content = fs.readFileSync(fullPath, "utf8").substring(0, 200);
            docs.push({
              name: item.name,
              path: fullPath.replace(workspaceDir, ""),
              size: formatBytes(stats.size),
              type: ext.replace(".", ""),
              preview: content.replace(/[#*]/g, "").trim(),
            });
          }
        }
      }
    }

    scanDir(workspaceDir);

    return NextResponse.json({ docs });
  } catch (error) {
    console.error("Error fetching docs:", error);
    return NextResponse.json({ docs: [] }, { status: 500 });
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
