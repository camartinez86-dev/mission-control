export default function Memories() {
  const memories = [
    { date: "2026-03-23", preview: "Setup OpenAI provider, added GPT-4.1...", type: "session" },
    { date: "2026-03-22", preview: "First bootstrap conversation...", type: "session" },
    { date: "2026-03-21", preview: "System configuration and onboarding...", type: "session" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">🧠 Memory Journal</h2>
        <input
          type="search"
          placeholder="Search memories..."
          className="bg-gray-700 border border-gray-600 rounded px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
      </div>
      
      <div className="space-y-3">
        {memories.map((mem, idx) => (
          <div key={idx} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm text-gray-400">{mem.date}</span>
              <span className="text-xs px-2 py-0.5 bg-purple-900 text-purple-300 rounded">
                {mem.type}
              </span>
            </div>
            <p className="text-gray-300">{mem.preview}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
