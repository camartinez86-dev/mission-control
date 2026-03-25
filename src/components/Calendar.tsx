export default function Calendar() {
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();

  const events = [
    { day: 25, title: "Haircut", time: "9-10 AM" },
    { day: 25, title: "R&B Wednesdays", time: "6:30-7:30 PM" },
    { day: 26, title: "Tire Swap", time: "7-8 AM" },
    { day: 27, title: "Payroll Due (P8)", time: "9 AM" },
    { day: 30, title: "Tesla Service", time: "12:45 PM" },
  ];

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

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
          const dayEvents = events.filter((e) => e.day === day);
          const isToday = day === today.getDate();
          
          return (
            <div
              key={day}
              className={`h-20 p-1 border border-gray-700 rounded ${
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
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
