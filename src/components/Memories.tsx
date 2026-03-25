"use client";

import { useState, useEffect } from "react";

interface Memory {
  date: string;
  name?: string;
  preview: string;
  type: string;
}

export default function Memories() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/memories")
      .then((res) => res.json())
      .then((data) => {
        setMemories(data.memories || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredMemories = memories.filter((m) =>
    m.preview.toLowerCase().includes(search.toLowerCase()) ||
    m.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="text-gray-400">Loading memories...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">🧠 Memory Journal</h2>
        <input
          type="search"
          placeholder="Search memories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
      </div>
      
      <div className="space-y-3">
        {filteredMemories.length === 0 ? (
          <p className="text-gray-500">No memories found</p>
        ) : (
          filteredMemories.map((mem, idx) => (
            <div key={idx} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm text-gray-400">{mem.date}</span>
                {mem.name && <span className="text-xs text-gray-500">{mem.name}</span>}
                <span className="text-xs px-2 py-0.5 bg-purple-900 text-purple-300 rounded">
                  {mem.type}
                </span>
              </div>
              <p className="text-gray-300">{mem.preview}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
