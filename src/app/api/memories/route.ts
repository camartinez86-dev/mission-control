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

interface GitHubFile {
  name: string;
  download_url: string;
}

const GITHUB_REPO = "camartinez86-dev/openclaw-workspace-backup";
const GITHUB_TOKEN = process.env.GITHUB_API_KEY || "";
const GITHUB_BRANCH = "main";

// Cache to avoid hitting GitHub API on every request
let cache: { memories: MemoryEntry[]; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function fetchMemoryFilesFromGitHub(): Promise<Map<string, string>> {
  const files = new Map<string, string>();
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "mission-control",
  };
  if (GITHUB_TOKEN) headers["Authorization"] = `token ${GITHUB_TOKEN}`;

  const listRes = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/memory?ref=${GITHUB_BRANCH}`,
    { headers }
  );
  if (!listRes.ok) return files;

  const listing: GitHubFile[] = await listRes.json();
  const mdFiles = listing.filter((f) => f.name.match(/^\d{4}-\d{2}-\d{2}\.md$/));

  for (const f of mdFiles.slice(0, 30)) {
    const contentRes = await fetch(f.download_url, { headers });
    if (contentRes.ok) {
      files.set(f.name, await contentRes.text());
    }
  }
  return files;
}

function parseMemoryContent(filename: string, content: string): MemoryEntry[] {
  const date = filename.replace(".md", "");
  const memories: MemoryEntry[] = [];
  const lines = content.split("\n");
  let currentTitle = "";
  let currentSummary = "";

  function pushEntry() {
    if (!currentTitle) return;
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

  for (const line of lines) {
    if (line.startsWith("### ")) {
      pushEntry();
      currentTitle = line.replace("### ", "").replace(/^\d{2}:\d{2}\sUTC\s*-\s*/, "");
      currentSummary = "";
    } else if (line.startsWith("## ") && !line.startsWith("### ")) {
      // Skip main headers
    } else if (line.trim() && !line.startsWith("#") && currentTitle) {
      currentSummary += line.trim() + " ";
    }
  }
  pushEntry();

  return memories;
}

export async function GET() {
  try {
    // Try GitHub first (primary source)
    if (!cache || Date.now() - cache.fetchedAt > CACHE_TTL_MS) {
      try {
        const ghFiles = await fetchMemoryFilesFromGitHub();
        if (ghFiles.size > 0) {
          const memories: MemoryEntry[] = [];
          for (const [filename, content] of ghFiles) {
            memories.push(...parseMemoryContent(filename, content));
          }
          memories.sort((a, b) => b.date.localeCompare(a.date));
          cache = { memories, fetchedAt: Date.now() };
          return NextResponse.json({ memories, source: "github" });
        }
      } catch (e) {
        console.error("GitHub fetch failed, falling back to local:", e);
      }
    } else {
      return NextResponse.json({ memories: cache.memories, source: "github-cached" });
    }

    // Fallback: read from local filesystem
    const memoryDir = path.join(process.cwd(), "..", "memory");
    const files = fs.readdirSync(memoryDir).filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.md$/));
    const memories: MemoryEntry[] = [];

    for (const file of files.slice(0, 30)) {
      const filePath = path.join(memoryDir, file);
      const content = fs.readFileSync(filePath, "utf-8");
      memories.push(...parseMemoryContent(file, content));
    }

    memories.sort((a, b) => b.date.localeCompare(a.date));
    return NextResponse.json({ memories, source: "local" });
  } catch (error) {
    console.error("Error reading memories:", error);
    return NextResponse.json({ memories: [], error: "Failed to load memories" }, { status: 500 });
  }
}

