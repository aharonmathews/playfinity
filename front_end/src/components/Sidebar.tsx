type Topic = {
  id: string;
  title: string;
};

type SidebarProps = {
  topics: Topic[];
  onTopicClick?: (topic: Topic) => void;
  theme: any;
};

export function Sidebar({ topics, onTopicClick, theme }: SidebarProps) {
  const gameLinks = [
    { type: "spelling", label: "Spelling", icon: "📝", color: "blue" },
    { type: "drawing", label: "Drawing", icon: "🎨", color: "purple" },
    { type: "gallery", label: "Gallery", icon: "🖼️", color: "indigo" },
    { type: "gk", label: "Quiz", icon: "🧠", color: "green" },
  ];

  return (
    <div className="h-full">
      {/* ✅ Enhanced Header */}
      <div
        className={`${theme.padding} ${theme.border} border-b bg-gradient-to-r from-${theme.primary}-50 to-${theme.secondary}-50`}
      >
        <h2
          className={`text-2xl font-bold ${theme.textPrimary} ${theme.fontFamily} flex items-center gap-3`}
        >
          <span className="text-3xl">📚</span>
          <div>
            <div>Learning Topics</div>
            <div className={`text-sm ${theme.textMuted} font-normal`}>
              Explore subjects & games
            </div>
          </div>
        </h2>
      </div>

      {/* ✅ Enhanced Topics List */}
      <div
        className={`${theme.padding} ${theme.spacing} max-h-[calc(100vh-200px)] overflow-y-auto`}
      >
        {topics.map((topic) => (
          <div
            key={topic.id}
            className={`group ${theme.cardBg} rounded-2xl ${theme.border} border ${theme.shadow} hover:shadow-lg ${theme.animations} overflow-hidden`}
          >
            {/* ✅ Topic Header */}
            <div
              className={`p-4 bg-gradient-to-r from-${theme.primary}-100 to-${theme.secondary}-100 ${theme.border} border-b`}
            >
              <h3
                className={`font-bold ${theme.textPrimary} ${theme.fontSize} flex items-center gap-3 cursor-pointer`}
                onClick={() => onTopicClick?.(topic)}
              >
                <span className="text-2xl">
                  {topic.title.toLowerCase().includes("math")
                    ? "🔢"
                    : topic.title.toLowerCase().includes("science")
                    ? "🔬"
                    : topic.title.toLowerCase().includes("history")
                    ? "📜"
                    : topic.title.toLowerCase().includes("art")
                    ? "🎨"
                    : "📖"}
                </span>
                <span className="group-hover:text-blue-600 transition-colors">
                  {topic.title}
                </span>
              </h3>
            </div>

            {/* ✅ Enhanced Game Links */}
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {gameLinks.map((game) => (
                  <a
                    key={game.type}
                    href={`/game/${topic.id}/${game.type}`}
                    className={`
                      group/game flex flex-col items-center gap-2 p-3 rounded-xl 
                      ${
                        game.color === "blue"
                          ? "bg-blue-500 hover:bg-blue-600"
                          : game.color === "purple"
                          ? "bg-purple-500 hover:bg-purple-600"
                          : game.color === "indigo"
                          ? "bg-indigo-500 hover:bg-indigo-600"
                          : "bg-green-500 hover:bg-green-600"
                      }
                      text-white font-semibold text-sm
                      ${theme.animations} ${theme.focusRing}
                      hover:shadow-lg transform hover:scale-105
                    `}
                    style={{ textDecoration: "none" }}
                  >
                    <span className="text-2xl group-hover/game:animate-bounce">
                      {game.icon}
                    </span>
                    <span className="text-center leading-tight">
                      {game.label}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* ✅ Quick Actions */}
        <div
          className={`${theme.cardBg} rounded-2xl ${theme.border} border ${theme.shadow} p-4 mt-4`}
        >
          <h4
            className={`font-semibold ${theme.textPrimary} mb-3 flex items-center gap-2`}
          >
            <span className="text-xl">⚡</span>
            Quick Actions
          </h4>
          <div className="space-y-2">
            <button
              className={`w-full text-left p-3 rounded-xl hover:bg-${theme.primary}-50 ${theme.animations} ${theme.focusRing} flex items-center gap-3`}
            >
              <span className="text-lg">🎯</span>
              <span className={`text-sm ${theme.textSecondary}`}>
                View All Progress
              </span>
            </button>
            <button
              className={`w-full text-left p-3 rounded-xl hover:bg-${theme.primary}-50 ${theme.animations} ${theme.focusRing} flex items-center gap-3`}
            >
              <span className="text-lg">🏆</span>
              <span className={`text-sm ${theme.textSecondary}`}>
                Achievements
              </span>
            </button>
            <button
              className={`w-full text-left p-3 rounded-xl hover:bg-${theme.primary}-50 ${theme.animations} ${theme.focusRing} flex items-center gap-3`}
            >
              <span className="text-lg">⚙️</span>
              <span className={`text-sm ${theme.textSecondary}`}>Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
