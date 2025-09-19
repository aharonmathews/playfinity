type Topic = {
  id: string
  title: string
}

type SidebarProps = {
  topics: Topic[]
  onTopicClick?: (topic: Topic) => void
}

export function Sidebar({ topics, onTopicClick }: SidebarProps) {
  return (
    <div className="h-full p-4">
      <h2 className="text-lg font-semibold mb-4">Topics</h2>
      <ul className="space-y-2">
        {topics.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => onTopicClick?.(t)}
              className="w-full text-left px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              <div className="font-medium">{t.title}</div>
              <div className="text-xs opacity-90">Start Learning</div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}


