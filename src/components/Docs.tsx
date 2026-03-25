"use client";

import { useState, useEffect } from "react";

interface Doc {
  name: string;
  path: string;
  size: string;
  type: string;
  preview: string;
}

export default function Docs() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/docs")
      .then((res) => res.json())
      .then((data) => {
        setDocs(data.docs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredDocs = docs.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.path.toLowerCase().includes(search.toLowerCase())
  );

  const getIcon = (type: string) => {
    switch (type) {
      case "md": return "📝";
      case "json": return "📋";
      case "yaml": return "⚙️";
      default: return "📄";
    }
  };

  if (loading) {
    return <div className="text-gray-400">Loading docs...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">📄 Documents</h2>
        <input
          type="search"
          placeholder="Search docs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredDocs.length === 0 ? (
          <p className="text-gray-500 col-span-2">No documents found</p>
        ) : (
          filteredDocs.map((doc, idx) => (
            <div key={idx} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors flex items-center gap-4">
              <div className="text-2xl">{getIcon(doc.type)}</div>
              <div className="flex-1">
                <h3 className="font-medium">{doc.name}</h3>
                <div className="flex gap-2 text-xs text-gray-400">
                  <span>{doc.type.toUpperCase()}</span>
                  <span>•</span>
                  <span>{doc.size}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
