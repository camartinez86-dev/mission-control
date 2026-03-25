export default function Team() {
  const agents = [
    { name: "Main Agent", role: "Primary conversation", status: "active", model: "MiniMax M2.5" },
    { name: "Heartbeat Agent", role: "Self-improvement", status: "active", model: "GPT-4.1" },
    { name: "Task Tracker", role: "Task management", status: "standby", model: "Script" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-4">👥 Agent Team</h2>
        <p className="text-gray-400 mb-6">
          OpenClaw organizational structure and sub-agents
        </p>
        
        <div className="space-y-4">
          {agents.map((agent, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xl">
                  🤖
                </div>
                <div>
                  <h3 className="font-bold">{agent.name}</h3>
                  <p className="text-sm text-gray-400">{agent.role}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-1 rounded ${
                  agent.status === "active" ? "bg-green-900 text-green-300" : "bg-gray-600"
                }`}>
                  {agent.status}
                </span>
                <p className="text-xs text-gray-500 mt-1">{agent.model}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
