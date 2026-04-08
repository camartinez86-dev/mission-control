import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";

const WORKSPACE_PATH = process.env.OPENCLAW_WORKSPACE || 
  (process.env.NODE_ENV === 'production' ? "/root/.openclaw/workspace" : "/data/.openclaw/workspace");
const CALENDAR_FILE = `${WORKSPACE_PATH}/allfashionmatters/calendar.json`;

export async function GET() {
  try {
    if (!existsSync(CALENDAR_FILE)) {
      return NextResponse.json({ events: [], error: "No calendar file found" });
    }

    const data = JSON.parse(readFileSync(CALENDAR_FILE, "utf-8"));
    const events = data.events || [];

    // Transform to calendar format
    const calendarEvents = events.map((event: any, index: number) => ({
      id: event.id || `event-${index}`,
      title: event.title || "Untitled",
      date: event.date || null,
      time: event.time || null,
      type: event.type || "default",
      color: event.color || getColorForType(event.type),
      description: event.description || "",
      recurring: event.recurring || false,
      endDate: event.endDate || null,
      endTime: event.endTime || null,
    }));

    return NextResponse.json({ events: calendarEvents });
  } catch (error) {
    console.error("Error loading calendar:", error);
    return NextResponse.json({ events: [], error: "Failed to load calendar" }, { status: 500 });
  }
}

function getColorForType(type: string): string {
  const colors: Record<string, string> = {
    appointment: "bg-red-500",
    reminder: "bg-orange-500",
    payroll: "bg-purple-500",
    content: "bg-pink-500",
    social: "bg-green-500",
    work: "bg-blue-500",
    default: "bg-blue-500",
  };
  return colors[type] || colors.default;
}
