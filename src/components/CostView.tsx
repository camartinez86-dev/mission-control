"use client";

import { useState } from "react";

export default function CostView() {
  const [data] = useState("Cost View Working!");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Cost Tracking</h2>
      </div>
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
          Status
        </h3>
        <p className="text-green-500 text-lg">{data}</p>
        <p className="text-[var(--text-muted)] mt-4">If you see this, the component loads correctly.</p>
      </div>
    </div>
  );
}
