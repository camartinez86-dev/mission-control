export default function Projects() {
  const projects = [
    {
      id: "1",
      name: "Mission Control Dashboard",
      status: "in-progress",
      tasks: 5,
      completed: 2,
      description: "Next.js-powered control panel with all modules",
    },
    {
      id: "2",
      name: "OpenClaw Memory System",
      status: "planning",
      tasks: 8,
      completed: 0,
      description: "QMD-backed memory and learning system",
    },
    {
      id: "3",
      name: "Website Audit Automation",
      status: "todo",
      tasks: 12,
      completed: 0,
      description: "Daily automated site health checks",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <div
          key={project.id}
          className="bg-gray-800 rounded-lg p-5 border border-gray-700"
        >
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-lg">{project.name}</h3>
            <span
              className={`text-xs px-2 py-1 rounded ${
                project.status === "in-progress"
                  ? "bg-blue-900 text-blue-300"
                  : project.status === "planning"
                    ? "bg-purple-900 text-purple-300"
                    : "bg-gray-600 text-gray-300"
              }`}
            >
              {project.status}
            </span>
          </div>
          <p className="text-gray-400 text-sm mb-4">{project.description}</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{
                  width: `${(project.completed / project.tasks) * 100}%`,
                }}
              />
            </div>
            <span className="text-sm text-gray-400">
              {project.completed}/{project.tasks}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
