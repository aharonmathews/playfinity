type UserProfile = {
  name: string;
  age: number;
  disability: string;
};

type DashboardProps = {
  user: UserProfile;
  coveredCount: number;
  runningCount: number;
  progressPercent: number;
  score: number;
  theme: any;
};

export function Dashboard({
  user,
  coveredCount,
  runningCount,
  progressPercent,
  score,
  theme,
}: DashboardProps) {
  return (
    <section className={`${theme.padding} ${theme.spacing}`}>
      {/* ✅ Enhanced Welcome Section */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1
            className={`text-4xl font-bold ${theme.textPrimary} mb-3 ${theme.fontFamily}`}
          >
            Welcome back, {user.name}! 👋
          </h1>
          <div className="flex items-center gap-4 flex-wrap">
            <div
              className={`flex items-center gap-2 px-4 py-2 bg-${theme.primary}-100 ${theme.border} border rounded-2xl`}
            >
              <span className="text-2xl">🎂</span>
              <span className={`${theme.textSecondary} font-medium`}>
                Age {user.age}
              </span>
            </div>
            <div
              className={`flex items-center gap-2 px-4 py-2 bg-${theme.secondary}-100 ${theme.border} border rounded-2xl`}
            >
              <span className="text-2xl">
                {user.disability === "ADHD"
                  ? "🧠"
                  : user.disability === "Dyslexia"
                  ? "📖"
                  : user.disability === "Visual"
                  ? "👁️"
                  : user.disability === "Autism"
                  ? "🧩"
                  : "⭐"}
              </span>
              <span className={`${theme.textSecondary} font-medium`}>
                {user.disability === "None"
                  ? "General Learning"
                  : `${user.disability} Support`}
              </span>
            </div>
          </div>
        </div>

        {/* ✅ Quick Actions */}
        <div className="flex gap-3">
          <button
            className={`${theme.button} text-white px-6 py-3 rounded-2xl ${theme.animations} ${theme.focusRing} flex items-center gap-2 font-semibold`}
          >
            <span className="text-lg">📊</span>
            View Progress
          </button>
        </div>
      </div>

      {/* ✅ Enhanced Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Your Score"
          value={score}
          color="rose"
          icon="🏆"
          theme={theme}
          subtitle="Total points earned"
        />
        <StatCard
          label="Topics Running"
          value={runningCount}
          color="emerald"
          icon="🚀"
          theme={theme}
          subtitle="Currently active"
        />
        <StatCard
          label="Remaining"
          value={Math.max(
            coveredCount - Math.max(0, coveredCount - runningCount),
            0
          )}
          color="amber"
          icon="⏳"
          theme={theme}
          subtitle="Topics to complete"
        />

        {/* ✅ Enhanced Progress Card */}
        <div
          className={`${theme.cardBg} rounded-2xl ${theme.border} border ${theme.padding} ${theme.shadow} group hover:shadow-lg ${theme.animations}`}
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">📈</span>
            <div>
              <div className={`text-sm ${theme.textMuted} font-medium`}>
                Overall Progress
              </div>
              <div className={`text-2xl font-bold ${theme.textPrimary}`}>
                {Math.min(Math.max(progressPercent, 0), 100)}%
              </div>
            </div>
          </div>

          <div className="relative">
            <div
              className={`h-3 bg-${theme.primary}-100 rounded-full overflow-hidden`}
            >
              <div
                className={`h-full bg-gradient-to-r from-${theme.primary}-500 to-${theme.secondary}-500 rounded-full ${theme.animations} shadow-sm`}
                style={{
                  width: `${Math.min(Math.max(progressPercent, 0), 100)}%`,
                }}
              />
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Keep up the great work! 🌟
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Learning Insights */}
      <div
        className={`mt-8 ${theme.cardBg} rounded-2xl ${theme.border} border ${theme.padding} ${theme.shadow}`}
      >
        <h3
          className={`text-xl font-bold ${theme.textPrimary} mb-4 flex items-center gap-3`}
        >
          <span className="text-2xl">💡</span>
          Learning Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className={`p-4 bg-${theme.primary}-50 rounded-xl ${theme.border} border`}
          >
            <div className="text-lg font-semibold text-center">🔥</div>
            <div className={`text-sm ${theme.textSecondary} text-center mt-1`}>
              {score > 50 ? "On fire!" : "Getting started"}
            </div>
          </div>
          <div
            className={`p-4 bg-${theme.secondary}-50 rounded-xl ${theme.border} border`}
          >
            <div className="text-lg font-semibold text-center">⭐</div>
            <div className={`text-sm ${theme.textSecondary} text-center mt-1`}>
              {runningCount > 0 ? "Active learner" : "Ready to start"}
            </div>
          </div>
          <div
            className={`p-4 bg-${theme.accent}-50 rounded-xl ${theme.border} border`}
          >
            <div className="text-lg font-semibold text-center">🎯</div>
            <div className={`text-sm ${theme.textSecondary} text-center mt-1`}>
              {progressPercent > 75 ? "Almost there!" : "Making progress"}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
  theme,
  subtitle,
}: {
  label: string;
  value: number;
  color: "indigo" | "emerald" | "amber" | "rose";
  icon: string;
  theme: any;
  subtitle: string;
}) {
  const colorMap = {
    indigo: `bg-indigo-50 text-indigo-700 border-indigo-200`,
    emerald: `bg-emerald-50 text-emerald-700 border-emerald-200`,
    amber: `bg-amber-50 text-amber-700 border-amber-200`,
    rose: `bg-rose-50 text-rose-700 border-rose-200`,
  } as const;

  return (
    <div
      className={`${theme.cardBg} rounded-2xl ${theme.border} border ${theme.padding} ${theme.shadow} group hover:shadow-lg ${theme.animations}`}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">{icon}</span>
        <div>
          <div className={`text-sm ${theme.textMuted} font-medium`}>
            {label}
          </div>
          <div className={`text-2xl font-bold ${theme.textPrimary}`}>
            {value}
          </div>
        </div>
      </div>
      <div
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${colorMap[color]} border`}
      >
        {subtitle}
      </div>
    </div>
  );
}
