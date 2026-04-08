"use client";

import { useState, useEffect } from "react";

interface CalendarEvent {
  id: string;
  title: string;
  date: string | null;
  time: string | null;
  type: string;
  color: string;
  description?: string;
  recurring?: boolean;
}

const eventTypeColors: Record<string, string> = {
  appointment: "bg-red-500",
  reminder: "bg-orange-500",
  payroll: "bg-purple-500",
  content: "bg-pink-500",
  social: "bg-green-500",
  work: "bg-blue-500",
  scheduled: "bg-blue-500",
  default: "bg-blue-500",
};

export default function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/calendar");
      const data = await res.json();
      if (data.events) {
        setEvents(data.events);
      }
    } catch (err) {
      console.error("Failed to fetch events:", err);
    } finally {
      setLoading(false);
    }
  };

  // Get week dates
  const getWeekDates = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return events.filter((e) => e.date === dateStr);
  };

  // Get upcoming events
  const getUpcoming = () => {
    const today = new Date().toISOString().split("T")[0];
    return events
      .filter((e) => e.date && e.date >= today)
      .sort((a, b) => (a.date || "") > (b.date || "") ? 1 : -1)
      .slice(0, 5);
  };

  const weekDates = getWeekDates();
  const upcoming = getUpcoming();
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            {view === "week" ? "Week Overview" : "Month Overview"}
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="segment-control">
            <button
              onClick={() => setView("week")}
              className={`segment-btn ${view === "week" ? "active" : ""}`}
            >
              Week
            </button>
            <button
              onClick={() => setView("month")}
              className={`segment-btn ${view === "month" ? "active" : ""}`}
            >
              Month
            </button>
          </div>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 rounded-lg bg-white/5 text-sm text-[var(--text-secondary)] hover:bg-white/10"
          >
            Today
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="card p-8 text-center">
          <p className="text-[var(--text-muted)]">Loading calendar...</p>
        </div>
      ) : (
        <>
          {/* Week View */}
          {view === "week" && (
            <>
              <div className="grid grid-cols-7 gap-3">
                {weekDates.map((date) => {
                  const dateStr = date.toISOString().split("T")[0];
                  const dayEvents = getEventsForDate(date);
                  const isToday = dateStr === today;

                  return (
                    <div
                      key={dateStr}
                      className={`day-column ${isToday ? "ring-2 ring-[var(--accent-purple)]" : ""}`}
                    >
                      <div className="flex flex-col items-center mb-3">
                        <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase">
                          {date.toLocaleDateString("en-US", { weekday: "short" })}
                        </span>
                        <span
                          className={`text-lg font-bold mt-1 ${
                            isToday ? "text-[var(--accent-purple)]" : "text-[var(--text-primary)]"
                          }`}
                        >
                          {date.getDate()}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className={`event-chip ${event.color} text-white w-full text-left text-xs truncate`}
                            title={event.title}
                          >
                            {event.time && <span className="opacity-70">{event.time}</span>}{" "}
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-center text-[var(--text-muted)]">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Next Up */}
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
                  Next Up
                </h3>
                <div className="space-y-3">
                  {upcoming.length === 0 ? (
                    <p className="text-[var(--text-muted)] text-sm">No upcoming events</p>
                  ) : (
                    upcoming.map((event) => (
                      <div key={event.id} className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${event.color}`} />
                        <span className="flex-1 text-sm text-[var(--text-primary)]">{event.title}</span>
                        <span className="text-xs text-[var(--text-muted)]">
                          {event.date && new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                        {event.time && (
                          <span className="text-xs text-[var(--text-secondary)]">{event.time}</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {/* Month View - Simple grid */}
          {view === "month" && (
            <div className="card p-5">
              <p className="text-[var(--text-muted)] text-center">
                Month view - {events.length} total events
              </p>
              <div className="mt-4 grid grid-cols-7 gap-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-[var(--text-muted)]">
                    {d}
                  </div>
                ))}
                {Array.from({ length: 35 }).map((_, i) => {
                  const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i - 3);
                  const dateStr = date.toISOString().split("T")[0];
                  const dayEvents = getEventsForDate(date);
                  return (
                    <div
                      key={i}
                      className={`min-h-[60px] p-1 rounded border border-white/5 ${
                        date.toISOString().split("T")[0] === today ? "bg-[var(--accent-purple)]/10" : ""
                      }`}
                    >
                      <div className="text-xs text-[var(--text-muted)]">{date.getDate()}</div>
                      {dayEvents.slice(0, 2).map((e) => (
                        <div key={e.id} className={`text-[10px] truncate ${e.color.replace("bg-", "text-")}`}>
                          {e.title}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Event Types Legend */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
              Event Types
            </h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(eventTypeColors).slice(0, 6).map(([type, color]) => (
                <div key={type} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${color}`} />
                  <span className="text-xs text-[var(--text-muted)] capitalize">{type}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
