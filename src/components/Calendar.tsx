"use client";

import { useState, useEffect } from "react";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string | null;
  type: string;
}

export default function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        setEvents(data.events || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const getEventsForDay = (day: number) => {
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => e.date === dateStr);
  };

  if (loading) {
    return <div className="text-gray-400">Loading calendar...</div>;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">
        📅 {monthNames[today.getMonth()]} {today.getFullYear()}
      </h2>
      
      <div className="grid grid-cols-7 gap-1 mb-4">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-sm text-gray-400 font-medium py-2">
            {d}
          </div>
        ))}
        
        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`empty-${i}`} className="h-20" />
        ))}
        
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dayEvents = getEventsForDay(day);
          const isToday = day === today.getDate();
          
          return (
            <div
              key={day}
              className={`h-20 p-1 border border-gray-700 rounded overflow-auto ${
                isToday ? "bg-blue-900/30 border-blue-500" : "bg-gray-700"
              }`}
            >
              <span className={`text-sm ${isToday ? "text-blue-400 font-bold" : "text-gray-300"}`}>
                {day}
              </span>
              <div className="mt-1">
                {dayEvents.slice(0, 2).map((e, idx) => (
                  <div key={idx} className="text-xs truncate text-blue-300">
                    {e.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-gray-400">+{dayEvents.length - 2} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
