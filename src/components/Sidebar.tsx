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
              title={t.title}
              onClick={() => onTopicClick?.(t)}
              className="w-full text-left truncate text-sm px-2 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              {t.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}


