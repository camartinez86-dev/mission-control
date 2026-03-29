export default function Office() {
  // Simple 8x8 pixel office grid
  const grid = Array(8)
    .fill(null)
    .map(() => Array(8).fill("empty"));

  // Place some desks and agents
  const desks = [
    { x: 1, y: 1, occupant: "Main Agent", emoji: "🤖" },
    { x: 4, y: 2, occupant: "Heartbeat", emoji: "💓" },
    { x: 2, y: 5, occupant: "Task Bot", emoji: "📋" },
    { x: 5, y: 5, occupant: "Docs Bot", emoji: "📄" },
  ];

  desks.forEach(({ x, y }) => {
    grid[y][x] = "desk";
  });

  const getCellContent = (x: number, y: number) => {
    const desk = desks.find((d) => d.x === x && d.y === y);
    return desk ? desk.emoji : "";
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-4">🏢 Virtual Office</h2>
        <p className="text-gray-400 mb-6">
          2D pixel art visualization of agents at work
        </p>

        <div
          className="grid gap-1 mx-auto w-fit"
          style={{ gridTemplateColumns: "repeat(8, 48px)" }}
        >
          {grid.map((row, y) =>
            row.map((cell, x) => (
              <div
                key={`${x}-${y}`}
                className={`w-12 h-12 flex items-center justify-center text-2xl rounded ${
                  cell === "desk" ? "bg-blue-900/50" : "bg-gray-700/30"
                } border border-gray-600`}
              >
                {getCellContent(x, y)}
              </div>
            )),
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-4 justify-center">
          {desks.map((desk, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 bg-gray-700 px-3 py-2 rounded"
            >
              <span>{desk.emoji}</span>
              <span className="text-sm">{desk.occupant}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
