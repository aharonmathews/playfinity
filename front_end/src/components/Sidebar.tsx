type Topic = {
  id: string
  title: string
}

type SidebarProps = {
  topics: Topic[]
  onTopicClick?: (topic: Topic) => void
}

export function Sidebar({ topics, onTopicClick }: SidebarProps) {
  const gameLinks = [
    { type: 'spelling', label: 'Spelling' },
    { type: 'drawing', label: 'Drawing' },
    { type: 'gallery', label: 'Gallery' },
  ]
  return (
    <div className="h-full p-4">
      <h2 className="text-lg font-semibold mb-4">Topics</h2>
      <ul className="space-y-4">
        {topics.map((t) => (
          <li key={t.id}>
            <div className="mb-1 font-medium text-indigo-700 dark:text-indigo-300">{t.title}</div>
            <div className="flex flex-wrap gap-2">
              {gameLinks.map((g) => (
                <a
                  key={g.type}
                  href={`/game/${t.id}/${g.type}`}
                  className="px-3 py-1 rounded bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
                >
                  {g.label}
                </a>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}


