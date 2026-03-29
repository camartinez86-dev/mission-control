import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface MemoryEntry {
  id: string;
  date: string;
  title: string;
  summary: string;
  category: string;
  color: string;
}

export async function GET() {
  try {
    const memoryDir = path.join(process.cwd(), "..", "memory");
    const files = fs.readdirSync(memoryDir).filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.md$/));
    
    const memories: MemoryEntry[] = [];
    
    for (const file of files.slice(0, 30)) {
      const filePath = path.join(memoryDir, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const date = file.replace(".md", "");
      
      // Parse entries from memory file
      const lines = content.split("\n");
      let currentTitle = "";
      let currentSummary = "";
      
      for (const line of lines) {
        if (line.startsWith("### ")) {
          if (currentTitle) {
            // Determine category based on title keywords
            let category = "work";
            let color = "bg-purple-500";
            const titleLower = currentTitle.toLowerCase();
            
            if (titleLower.includes("system") || titleLower.includes("cron") || titleLower.includes("check") || titleLower.includes("backup")) {
              category = "system";
              color = "bg-green-500";
            } else if (titleLower.includes("project") || titleLower.includes("launch")) {
              category = "project";
              color = "bg-pink-500";
            } else if (titleLower.includes("setup") || titleLower.includes("install") || titleLower.includes("config")) {
              category = "setup";
              color = "bg-orange-500";
            }
            
            memories.push({
              id: `${date}-${memories.length}`,
              date,
              title: currentTitle,
              summary: currentSummary.trim(),
              category,
              color,
            });
          }
          currentTitle = line.replace("### ", "").replace(/^\d{2}:\d{2}\sUTC\s*-\s*/, "");
          currentSummary = "";
        } else if (line.startsWith("## ") && !line.startsWith("### ")) {
          // Skip main headers
        } else if (line.trim() && !line.startsWith("#") && currentTitle) {
          currentSummary += line.trim() + " ";
        }
      }
      
      // Push last entry
      if (currentTitle) {
        let category = "work";
        let color = "bg-purple-500";
        const titleLower = currentTitle.toLowerCase();
        
        if (titleLower.includes("system") || titleLower.includes("cron") || titleLower.includes("check") || titleLower.includes("backup")) {
          category = "system";
          color = "bg-green-500";
        } else if (titleLower.includes("project") || titleLower.includes("launch")) {
          category = "project";
          color = "bg-pink-500";
        } else if (titleLower.includes("setup") || titleLower.includes("install") || titleLower.includes("config")) {
          category = "setup";
          color = "bg-orange-500";
        }
        
        memories.push({
          id: `${date}-${memories.length}`,
          date,
          title: currentTitle,
          summary: currentSummary.trim(),
          category,
          color,
        });
      }
    }
    
    // Sort by date descending
    memories.sort((a, b) => b.date.localeCompare(a.date));
    
    return NextResponse.json({ memories });
  } catch (error) {
    console.error("Error reading memories:", error);
    return NextResponse.json({ memories: [], error: "Failed to load memories" }, { status: 500 });
  }
}
