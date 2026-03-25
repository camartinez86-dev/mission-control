export default function Docs() {
  const docs = [
    { name: "AGENTS.md", type: "config", size: "7.8 KB" },
    { name: "SOUL.md", type: "config", size: "2.7 KB" },
    { name: "MEMORY.md", type: "memory", size: "514 B" },
    { name: "HEARTBEAT.md", type: "config", size: "780 B" },
    { name: "TOOLS.md", type: "config", size: "860 B" },
    { name: "cron_jobs.md", type: "docs", size: "486 B" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">📄 Documents</h2>
        <input
          type="search"
          placeholder="Search docs..."
          className="bg-gray-700 border border-gray-600 rounded px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {docs.map((doc, idx) => (
          <div key={idx} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors flex items-center gap-4">
            <div className="text-2xl">📄</div>
            <div className="flex-1">
              <h3 className="font-medium">{doc.name}</h3>
              <div className="flex gap-2 text-xs text-gray-400">
                <span>{doc.type}</span>
                <span>•</span>
                <span>{doc.size}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
