import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";

const WORKSPACE_PATH = process.env.OPENCLAW_WORKSPACE || 
  (process.env.NODE_ENV === 'production' ? "/root/.openclaw/workspace" : "/data/.openclaw/workspace");
const CALENDAR_FILE = `${WORKSPACE_PATH}/allfashionmatters/calendar.json`;

function getColorForType(type: string): string {
  const colors: Record<string, string> = {
    appointment: "bg-red-500",
    reminder: "bg-orange-500",
    payroll: "bg-purple-500",
    content: "bg-pink-500",
    social: "bg-green-500",
    work: "bg-blue-500",
    event: "bg-emerald-500",
    recurring: "bg-cyan-500",
    default: "bg-blue-500",
  };
  return colors[type] || colors.default;
}

function loadCalendar() {
  if (!existsSync(CALENDAR_FILE)) {
    return { events: [] };
  }
  return JSON.parse(readFileSync(CALENDAR_FILE, "utf-8"));
}

function saveCalendar(data: any) {
  writeFileSync(CALENDAR_FILE, JSON.stringify(data, null, 2));
}

export async function GET() {
  try {
    const data = loadCalendar();
    const events = data.events || [];

    const calendarEvents = events.map((event: any, index: number) => ({
      id: event.id || `event-${index}`,
      title: event.title || "Untitled",
      date: event.date || null,
      time: event.time || null,
      type: event.type || "default",
      color: event.color || getColorForType(event.type),
      description: event.description || event.notes || "",
      recurring: event.recurring || false,
      endDate: event.endDate || null,
      endTime: event.endTime || null,
      location: event.location || "",
    }));

    return NextResponse.json({ events: calendarEvents });
  } catch (error) {
    console.error("Error loading calendar:", error);
    return NextResponse.json({ events: [], error: "Failed to load calendar" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = loadCalendar();
    
    // Generate ID if not provided
    if (!body.id) {
      body.id = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Add color based on type
    body.color = getColorForType(body.type || "default");
    
    // Add to events array
    data.events = data.events || [];
    data.events.push(body);
    
    saveCalendar(data);
    
    return NextResponse.json({ success: true, event: body });
  } catch (error) {
    console.error("Error adding event:", error);
    return NextResponse.json({ error: "Failed to add event" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const data = loadCalendar();
    
    if (!body.id) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }
    
    // Find and update event
    const index = data.events.findIndex((e: any) => e.id === body.id);
    if (index === -1) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    
    // Update with new data
    body.color = getColorForType(body.type || "default");
    data.events[index] = { ...data.events[index], ...body };
    
    saveCalendar(data);
    
    return NextResponse.json({ success: true, event: data.events[index] });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }
    
    const data = loadCalendar();
    data.events = (data.events || []).filter((e: any) => e.id !== id);
    
    saveCalendar(data);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}