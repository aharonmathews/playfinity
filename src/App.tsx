import { useMemo, useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './components/Dashboard'
import { DrawingCanvas } from './components/DrawingCanvas'
import { SpellingGame } from './components/games/SpellingGame'

type Topic = {
  id: string
  title: string
}

type UserProfile = {
  name: string
  age: number
  disability: string
}

export function App() {
  const topics: Topic[] = useMemo(
    () => [
      { id: 't1', title: 'Mathematics' },
      { id: 't2', title: 'Science' },
      { id: 't3', title: 'History' },
      { id: 't4', title: 'Geography' },
      { id: 't5', title: 'Arts' },
    ],
    [],
  )

  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(['t1'])
  const [runningTopicIds, setRunningTopicIds] = useState<string[]>(['t1'])
  const [user] = useState<UserProfile>({ name: 'Alex Johnson', age: 14, disability: 'Dyslexia' })
  // Right panel now only shows an opener; no inline canvas toggle

  const coveredCount = selectedTopicIds.length
  const runningCount = runningTopicIds.length
  const progressPercent = coveredCount === 0 ? 0 : Math.round((coveredCount - runningCount) / coveredCount * 100)
  const [showCanvas, setShowCanvas] = useState(false)
  const [activeView, setActiveView] = useState<'home' | 'game'>('home')
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null)

  function toggleTopicSelection(topicId: string) {
    setSelectedTopicIds((prev) =>
      prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId],
    )
  }

  function toggleTopicRunning(topicId: string) {
    setRunningTopicIds((prev) =>
      prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId],
    )
  }

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:dark:bg-gray-950/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center">
          <div className="font-semibold">UST Learning</div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        <div className="grid grid-cols-12 gap-6">
          <aside className="col-span-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-base font-semibold">Topics</h2>
            </div>
            <Sidebar topics={topics} onTopicClick={(t) => { setActiveTopic(t); setActiveView('game') }} />
          </aside>

          <section className="col-span-9 space-y-6">
            <Dashboard
              user={user}
              coveredCount={coveredCount}
              runningCount={runningCount}
              progressPercent={progressPercent}
            />
          </section>
        </div>

        {activeView === 'home' ? (
        <section className="col-span-12">
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-950 space-y-3">
            {!showCanvas ? (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="text-base font-semibold">Wanna draw some picture and learn about it?</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Open the canvas and start sketching your ideas below the dashboard.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCanvas(true)}
                  className="rounded-md bg-indigo-600 text-white px-3 py-2 text-sm font-medium hover:bg-indigo-500"
                >
                  Open Canvas
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">Canvas</h3>
                  <button
                    type="button"
                    onClick={() => setShowCanvas(false)}
                    className="text-sm text-gray-600 hover:underline"
                  >
                    Close
                  </button>
                </div>
                <DrawingCanvas />
              </div>
            )}
          </div>
        </section>
        ) : (
          <section className="col-span-12 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Spelling Game</h2>
                {activeTopic && <p className="text-sm text-gray-500 dark:text-gray-400">Topic: {activeTopic.title}</p>}
              </div>
              <button
                type="button"
                onClick={() => setActiveView('home')}
                className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                ← Back to Home
              </button>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-950">
              <SpellingGame topic={activeTopic?.title ?? ''} />
            </div>
          </section>
        )}
      </main>
    </div>
  )
}



