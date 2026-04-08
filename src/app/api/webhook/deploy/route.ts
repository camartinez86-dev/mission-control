import { NextResponse } from "next/server";
import { execSync } from "child_process";

export async function POST(request: Request) {
  try {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${process.env.GITHUB_API_KEY}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const cwd = process.cwd();
    const output: string[] = [];

    const pull = execSync("git pull origin master", { cwd, encoding: "utf-8", timeout: 30000 });
    output.push(`git pull: ${pull.trim()}`);

    const build = execSync("npm run build 2>&1", { cwd, encoding: "utf-8", timeout: 120000 });
    output.push(`build: done`);

    return NextResponse.json({ ok: true, output });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message.substring(0, 500) }, { status: 500 });
  }
}
