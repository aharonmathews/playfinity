type UserProfile = {
  name: string
  age: number
  disability: string
}

type DashboardProps = {
  user: UserProfile
  coveredCount: number
  runningCount: number
  progressPercent: number
}

export function Dashboard({ user, coveredCount, runningCount, progressPercent }: DashboardProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Welcome, {user.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Age {user.age} • {user.disability}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Topics Selected" value={coveredCount} color="indigo" />
        <StatCard label="Topics Running" value={runningCount} color="emerald" />
        <StatCard label="Remaining" value={Math.max(coveredCount - Math.max(0, coveredCount - runningCount), 0)} color="amber" />
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Overall Progress</div>
          <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded">
            <div className="h-2 bg-indigo-600 rounded" style={{ width: `${Math.min(Math.max(progressPercent, 0), 100)}%` }} />
          </div>
          <div className="mt-1 text-sm font-medium">{Math.min(Math.max(progressPercent, 0), 100)}%</div>
        </div>
      </div>
    </section>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: 'indigo' | 'emerald' | 'amber' }) {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  } as const
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
      <div className={`mt-1 inline-flex items-center gap-2 rounded px-2 py-1 text-sm font-medium ${colorMap[color]}`}>{value}</div>
    </div>
  )
}


