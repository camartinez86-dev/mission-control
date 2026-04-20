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
  location?: string;
  endTime?: string;
}

const eventTypeColors: Record<string, string> = {
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

const eventTypes = [
  { value: "appointment", label: "Appointment" },
  { value: "reminder", label: "Reminder" },
  { value: "payroll", label: "Payroll" },
  { value: "content", label: "Content" },
  { value: "social", label: "Social" },
  { value: "work", label: "Work" },
  { value: "event", label: "Event" },
  { value: "recurring", label: "Recurring" },
];

export default function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [formData, setFormData] = useState<Partial<CalendarEvent>>({});

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

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return events.filter((e) => e.date === dateStr);
  };

  const getUpcoming = () => {
    const today = new Date().toISOString().split("T")[0];
    return events
      .filter((e) => e.date && e.date >= today)
      .sort((a, b) => (a.date || "") > (b.date || "") ? 1 : -1)
      .slice(0, 5);
  };

  const openAddModal = () => {
    setEditingEvent(null);
    setFormData({
      title: "",
      date: new Date().toISOString().split("T")[0],
      time: "12:00",
      type: "default",
      description: "",
      location: "",
    });
    setShowModal(true);
  };

  const openEditModal = (event: CalendarEvent) => {
    setEditingEvent(event);
    setFormData({ ...event });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const method = editingEvent ? "PUT" : "POST";
      const res = await fetch("/api/calendar", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        fetchEvents();
        setShowModal(false);
      }
    } catch (err) {
      console.error("Failed to save event:", err);
    }
  };

  const handleDelete = async () => {
    if (!editingEvent) return;
    if (!confirm("Delete this event?")) return;
    try {
      const res = await fetch(`/api/calendar?id=${editingEvent.id}`, { method: "DELETE" });
      if (res.ok) {
        fetchEvents();
        setShowModal(false);
      }
    } catch (err) {
      console.error("Failed to delete event:", err);
    }
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
            <button onClick={() => setView("week")} className={`segment-btn ${view === "week" ? "active" : ""}`}>Week</button>
            <button onClick={() => setView("month")} className={`segment-btn ${view === "month" ? "active" : ""}`}>Month</button>
          </div>
          <button onClick={openAddModal} className="btn-primary text-sm px-4 py-2">+ Add Event</button>
        </div>
      </div>

      {/* Week View */}
      {view === "week" && (
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date, i) => {
            const dateStr = date.toISOString().split("T")[0];
            const dayEvents = getEventsForDate(date);
            const isToday = dateStr === today;
            return (
              <div key={i} className={`card p-3 ${isToday ? "ring-2 ring-yellow-500" : ""}`}>
                <div className={`text-sm font-bold mb-2 ${isToday ? "text-yellow-500" : "text-[var(--text-secondary)]"}`}>
                  {date.toLocaleDateString("en-US", { weekday: "short", day: "numeric" })}
                </div>
                <div className="space-y-1">
                  {dayEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => openEditModal(event)}
                      className={`w-full text-left text-xs p-2 rounded ${eventTypeColors[event.type] || eventTypeColors.default} text-white truncate hover:opacity-80 transition`}
                    >
                      {event.time && <span className="opacity-75">{event.time} </span>}
                      {event.title}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upcoming Events */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Upcoming Events</h3>
        {upcoming.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-muted)]">
            <div className="text-4xl mb-2">📅</div>
            <div>No upcoming events</div>
            <button onClick={openAddModal} className="btn-primary mt-3">+ Add Event</button>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((event) => (
              <button
                key={event.id}
                onClick={() => openEditModal(event)}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition text-left"
              >
                <div className={`w-2 h-2 rounded-full ${eventTypeColors[event.type] || eventTypeColors.default}`} />
                <div className="flex-1">
                  <div className="font-medium text-[var(--text-primary)]">{event.title}</div>
                  <div className="text-xs text-[var(--text-muted)]">
                    {event.date} {event.time && `at ${event.time}`}
                    {event.location && ` • ${event.location}`}
                  </div>
                </div>
                <div className="text-xs text-[var(--text-muted)] capitalize">{event.type}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="card p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">{editingEvent ? "Edit Event" : "Add Event"}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[var(--text-muted)] uppercase">Title</label>
                <input
                  type="text"
                  value={formData.title || ""}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field w-full mt-1"
                  placeholder="Event title"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[var(--text-muted)] uppercase">Date</label>
                  <input
                    type="date"
                    value={formData.date || ""}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="input-field w-full mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] uppercase">Time</label>
                  <input
                    type="time"
                    value={formData.time || ""}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="input-field w-full mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] uppercase">Type</label>
                <select
                  value={formData.type || "default"}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="input-field w-full mt-1"
                >
                  {eventTypes.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] uppercase">Location</label>
                <input
                  type="text"
                  value={formData.location || ""}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="input-field w-full mt-1"
                  placeholder="Location (optional)"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] uppercase">Notes</label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field w-full mt-1"
                  rows={3}
                  placeholder="Notes (optional)"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              {editingEvent && (
                <button onClick={handleDelete} className="px-4 py-2 bg-red-500/20 text-red-500 rounded hover:bg-red-500/30">Delete</button>
              )}
              <button onClick={() => setShowModal(false)} className="flex-1 btn-secondary">Cancel</button>
              <button onClick={handleSave} className="flex-1 btn-primary">Save</button>
            </div>
          </div>
        </div>
      )}

      {loading && <div className="text-center text-[var(--text-muted)]">Loading...</div>}
    </div>
  );
}