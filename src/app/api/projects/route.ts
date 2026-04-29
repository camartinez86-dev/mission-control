import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";

const PROJECTS_FILE = "/root/.openclaw/workspace/projects.json";

export async function GET() {
  try {
    if (!existsSync(PROJECTS_FILE)) {
      return NextResponse.json([]);
    }
    const raw = readFileSync(PROJECTS_FILE, "utf-8");
    const projects = JSON.parse(raw);
    return NextResponse.json(projects);
  } catch (err) {
    console.error("Failed to load projects:", err);
    return NextResponse.json({ error: "Failed to load projects" }, { status: 500 });
  }
}
