"use client";

import { useState } from "react";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: string;
  color: string;
}

const eventTypes = [
  { id: "appointment", label: "Appointment", color: "bg-red-500" },
  { id: "reminder", label: "Reminder", color: "bg-orange-500" },
  { id: "payroll", label: "Payroll", color: "bg-purple-500" },
  { id: "content", label: "Content", color: "bg-pink-500" },
  { id: "social", label: "Social", color: "bg-green-500" },
  { id: "default", label: "Other", color: "bg-blue-500" },
];

const sampleEvents: CalendarEvent[] = [
  {
    id: "1",
    title: "Drop Car Off",
    date: "2026-03-26",
    time: "7:00 AM",
    type: "reminder",
    color: "bg-orange-500",
  },
  {
    id: "2",
    title: "Lunch with Dean",
    date: "2026-03-27",
    time: "11:30 AM",
    type: "reminder",
    color: "bg-orange-500",
  },
  {
    id: "3",
    title: "Payroll P8 Due",
    date: "2026-03-27",
    time: "3:00 PM",
    type: "payroll",
    color: "bg-purple-500",
  },
  {
    id: "4",
    title: "HDP Timesheet Due",
    date: "2026-03-27",
    time: "2:00 PM",
    type: "payroll",
    color: "bg-purple-500",
  },
  {
    id: "5",
    title: "Dashboard Review",
    date: "2026-03-29",
    time: "2:00 PM",
    type: "default",
    color: "bg-blue-500",
  },
  {
    id: "6",
    title: "Inspection",
    date: "2026-03-30",
    time: "10:00 AM",
    type: "appointment",
    color: "bg-red-500",
  },
  {
    id: "7",
    title: "Tesla Service",
    date: "2026-03-31",
    time: "12:45 PM",
    type: "appointment",
    color: "bg-red-500",
  },
  {
    id: "8",
    title: "R&B Wednesdays",
    date: "2026-04-01",
    time: "6:30 PM",
    type: "social",
    color: "bg-green-500",
  },
  {
    id: "9",
    title: "Payroll P9 Due",
    date: "2026-04-10",
    time: "2:00 PM",
    type: "payroll",
    color: "bg-purple-500",
  },
  {
    id: "10",
    title: "FYIFinds Newsletter",
    date: "2026-04-03",
    time: "9:00 AM",
    type: "content",
    color: "bg-pink-500",
  },
  {
    id: "11",
    title: "FYIFinds Newsletter",
    date: "2026-04-06",
    time: "9:00 AM",
    type: "content",
    color: "bg-pink-500",
  },
  {
    id: "12",
    title: "FYIFinds Newsletter",
    date: "2026-04-10",
    time: "9:00 AM",
    type: "content",
    color: "bg-pink-500",
  },
  {
    id: "13",
    title: "FYIFinds Newsletter",
    date: "2026-04-13",
    time: "9:00 AM",
    type: "content",
    color: "bg-pink-500",
  },
  {
    id: "14",
    title: "FYIFinds Newsletter",
    date: "2026-04-17",
    time: "9:00 AM",
    type: "content",
    color: "bg-pink-500",
  },
  {
    id: "15",
    title: "FYIFinds Newsletter",
    date: "2026-04-21",
    time: "9:00 AM",
    type: "content",
    color: "bg-pink-500",
  },
  {
    id: "16",
    title: "FYIFinds Newsletter",
    date: "2026-04-24",
    time: "9:00 AM",
    type: "content",
    color: "bg-pink-500",
  },
  {
    id: "17",
    title: "FYIFinds Newsletter",
    date: "2026-04-28",
    time: "9:00 AM",
    type: "content",
    color: "bg-pink-500",
  },
  {
    id: "18",
    title: "Payroll P10 Due",
    date: "2026-04-24",
    time: "2:00 PM",
    type: "payroll",
    color: "bg-purple-500",
  },
];

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getWeekDates(baseDate: Date): Date[] {
  const dates: Date[] = [];
  const day = baseDate.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  for (let i = 0; i < 7; i++) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + mondayOffset + i);
    dates.push(date);
  }
  return dates;
}

function getMonthDates(year: number, month: number): (Date | null)[] {
  const dates: (Date | null)[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;
  
  for (let i = 0; i < startDay; i++) {
    dates.push(null);
  }
  
  for (let i = 1; i <= lastDay.getDate(); i++) {
    dates.push(new Date(year, month, i));
  }
  
  return dates;
}

export default function CalendarView() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [events, setEvents] = useState<CalendarEvent[]>(sampleEvents);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    time: "9:00 AM",
    type: "default",
  });

  const today = new Date();
  
  const weekToday = new Date();
  weekToday.setDate(weekToday.getDate() + weekOffset * 7);
  const weekDates = getWeekDates(weekToday);

  const monthDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const monthDates = getMonthDates(monthDate.getFullYear(), monthDate.getMonth());

  const goToPrevWeek = () => setWeekOffset((p) => p - 1);
  const goToNextWeek = () => setWeekOffset((p) => p + 1);
  const goToToday = () => {
    setWeekOffset(0);
    setMonthOffset(0);
  };

  const goToPrevMonth = () => setMonthOffset((p) => p - 1);
  const goToNextMonth = () => setMonthOffset((p) => p + 1);

  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString();
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return events.filter((e) => e.date === dateStr);
  };

  const formatDateRange = () => {
    const start = weekDates[0];
    const end = weekDates[6];
    const startMonth = start.toLocaleDateString("en-US", { month: "short" });
    const endMonth = end.toLocaleDateString("en-US", { month: "short" });
    if (startMonth === endMonth) {
      return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${end.getFullYear()}`;
    }
    return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}`;
  };

  const formatMonth = () => {
    return monthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.date) return;
    
    const eventType = eventTypes.find(e => e.id === newEvent.type) || eventTypes[5];
    const event: CalendarEvent = {
      id: Date.now().toString(),
      title: newEvent.title,
      date: newEvent.date,
      time: newEvent.time,
      type: newEvent.type,
      color: eventType.color,
    };
    
    setEvents([...events, event]);
    setNewEvent({ title: "", date: "", time: "9:00 AM", type: "default" });
    setShowAddModal(false);
  };

  const upcomingEvents = events
    .filter((e) => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            Calendar
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {viewMode === "week" ? "Week overview" : "Monthly overview"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="segment-control">
            <button 
              onClick={() => setViewMode("week")}
              className={`segment-btn ${viewMode === "week" ? "active" : ""}`}
            >
              Week
            </button>
            <button 
              onClick={() => setViewMode("month")}
              className={`segment-btn ${viewMode === "month" ? "active" : ""}`}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      {viewMode === "week" ? (
        <>
          {/* Week Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevWeek}
                className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-secondary)]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-1.5 rounded-lg bg-white/5 text-sm text-[var(--text-secondary)] hover:bg-white/10"
              >
                Today
              </button>
              <button
                onClick={goToNextWeek}
                className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-secondary)]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
              <span className="text-sm font-medium text-[var(--text-primary)] ml-2">
                {formatDateRange()}
              </span>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-lg bg-[var(--accent-purple)] text-white text-sm font-medium hover:opacity-90"
            >
              + Add Event
            </button>
          </div>

          {/* Week Grid */}
          <div className="grid grid-cols-7 gap-3">
            {weekDates.map((date, i) => {
              const dayEvents = getEventsForDate(date);
              const today = isToday(date);
              return (
                <div
                  key={i}
                  className={`day-column ${today ? "ring-2 ring-[var(--accent-purple)]" : ""}`}
                >
                  <div className="flex flex-col items-center mb-3">
                    <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase">
                      {weekDays[i]}
                    </span>
                    <span
                      className={`text-lg font-bold mt-1 ${
                        today ? "text-[var(--accent-purple)]" : "text-[var(--text-primary)]"
                      }`}
                    >
                      {date.getDate()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`event-chip ${event.color} text-white w-full text-left`}
                      >
                        {event.time}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevMonth}
                className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-secondary)]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-1.5 rounded-lg bg-white/5 text-sm text-[var(--text-secondary)] hover:bg-white/10"
              >
                Today
              </button>
              <button
                onClick={goToNextMonth}
                className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-secondary)]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
              <span className="text-sm font-medium text-[var(--text-primary)] ml-2">
                {formatMonth()}
              </span>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-lg bg-[var(--accent-purple)] text-white text-sm font-medium hover:opacity-90"
            >
              + Add Event
            </button>
          </div>

          {/* Month Header */}
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => (
              <div key={day} className="text-center py-2">
                <span className="text-xs font-medium text-[var(--text-muted)] uppercase">{day}</span>
              </div>
            ))}
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-7 gap-1">
            {monthDates.map((date, i) => {
              if (!date) {
                return <div key={`empty-${i}`} className="min-h-[100px]" />;
              }
              const dayEvents = getEventsForDate(date);
              const today = isToday(date);
              return (
                <div
                  key={date.toISOString()}
                  className={`min-h-[100px] p-2 rounded-lg ${
                    today 
                      ? "bg-[var(--accent-purple)]/10 ring-2 ring-[var(--accent-purple)]" 
                      : "bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className="flex flex-col items-start">
                    <span
                      className={`text-sm font-bold ${
                        today 
                          ? "text-[var(--accent-purple)]" 
                          : date.getMonth() !== monthDate.getMonth()
                            ? "text-[var(--text-muted)]"
                            : "text-[var(--text-primary)]"
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    <div className="mt-1 space-y-1 w-full">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className={`text-[10px] px-1 py-0.5 rounded ${event.color} text-white truncate`}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[10px] text-[var(--text-muted)]">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Next Up */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
          Next Up
        </h3>
        <div className="space-y-3">
          {upcomingEvents.map((event) => (
            <div key={event.id} className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${event.color}`} />
              <span className="flex-1 text-sm text-[var(--text-primary)]">
                {event.title}
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                {new Date(event.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <span className="text-xs text-[var(--text-secondary)]">
                {event.time}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Event Types Legend */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
          Event Types
        </h3>
        <div className="flex flex-wrap gap-3">
          {eventTypes.filter(e => e.id !== "default").map((type) => (
            <div key={type.id} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${type.color}`} />
              <span className="text-xs text-[var(--text-muted)]">{type.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-[var(--bg-card)] rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Add New Event</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Event Title</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="e.g., Team Meeting"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-purple)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">Date</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-purple)]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">Time</label>
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-purple)]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[var(--text-muted)] mb-2 block">Event Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {eventTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setNewEvent({ ...newEvent, type: type.id })}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        newEvent.type === type.id
                          ? `${type.color} text-white`
                          : "bg-white/5 text-[var(--text-secondary)] hover:bg-white/10"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              {newEvent.title && newEvent.date && (
                <div className="p-3 rounded-lg bg-white/5">
                  <div className="text-xs text-[var(--text-muted)] mb-1">Preview</div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      eventTypes.find(e => e.id === newEvent.type)?.color || "bg-blue-500"
                    }`} />
                    <span className="text-sm text-[var(--text-primary)]">{newEvent.title}</span>
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-1">
                    {new Date(newEvent.date).toLocaleDateString("en-US", { 
                      weekday: "short", 
                      month: "short", 
                      day: "numeric" 
                    })} at {newEvent.time}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleAddEvent}
                disabled={!newEvent.title || !newEvent.date}
                className="flex-1 py-2 rounded-lg bg-[var(--accent-purple)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Event
              </button>
              <button 
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2 rounded-lg bg-white/10 text-[var(--text-secondary)] text-sm font-medium hover:bg-white/20"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
