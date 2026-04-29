import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const WORKSPACE = "/root/.openclaw/workspace";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get("path");

  if (!filePath) {
    return NextResponse.json({ error: "path required" }, { status: 400 });
  }

  const fullPath = path.join(WORKSPACE, filePath.replace(/^\//, ""));

  // Security: stay within workspace
  if (!fullPath.startsWith(WORKSPACE)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!fs.existsSync(fullPath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const stat = fs.statSync(fullPath);
  if (stat.isDirectory()) {
    // Return directory listing
    const items = fs.readdirSync(fullPath).map(name => {
      const itemPath = path.join(fullPath, name);
      const s = fs.statSync(itemPath);
      return {
        name,
        type: s.isDirectory() ? "dir" : "file",
        size: s.isDirectory() ? null : s.size,
        modified: s.mtime.toISOString(),
        path: path.join(filePath, name).replace(/^\//, ""),
      };
    });
    return NextResponse.json({ items });
  }

  // Stream binary file
  const ext = path.extname(fullPath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".mp4": "video/mp4",
    ".mp3": "audio/mpeg",
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".zip": "application/zip",
    ".txt": "text/plain",
    ".md": "text/markdown",
    ".json": "application/json",
  };

  const contentType = mimeTypes[ext] || "application/octet-stream";
  const fileName = path.basename(fullPath);

  const stream = fs.createReadStream(fullPath);
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }

  const buffer = Buffer.concat(chunks);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Length": String(buffer.length),
      "Cache-Control": "no-store",
    },
  });
}
