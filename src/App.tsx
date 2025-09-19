import { useMemo, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './components/Dashboard'
import { DrawingCanvas } from './components/DrawingCanvas'
import { SpellingGame } from './components/games/SpellingGame'
import { DrawingGame } from './components/games/DrawingGame'

type Topic = {
  id: string
  title: string
}

type UserProfile = {
  name: string
  age: number
  disability: string
}

function HomePage() {
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
  const [showCanvas, setShowCanvas] = useState(false)
  const navigate = useNavigate()

  const coveredCount = selectedTopicIds.length
  const runningCount = runningTopicIds.length
  const progressPercent = coveredCount === 0 ? 0 : Math.round((coveredCount - runningCount) / coveredCount * 100)

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

  function navigateToGame(topic: Topic) {
    navigate(`/game/${topic.id}`)
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
            <Sidebar topics={topics} onTopicClick={navigateToGame} />
          </aside>

          <section className="col-span-9 space-y-6">
            <Dashboard
              user={user}
              coveredCount={coveredCount}
              runningCount={runningCount}
              progressPercent={progressPercent}
            />
            
            {/* Canvas section positioned just below dashboard */}
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
        </div>
      </main>
    </div>
  )
}

function GamePage() {
  const { topicId } = useParams<{ topicId: string }>()
  const navigate = useNavigate()
  const [gamePhase, setGamePhase] = useState<'spelling' | 'drawing' | 'completed'>('spelling')
  
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

  const currentTopic = topics.find(topic => topic.id === topicId)

  if (!currentTopic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Topic not found</h1>
          <button
            onClick={() => navigate('/')}
            className="rounded-md bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-500"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  const handleSpellingComplete = () => {
    setGamePhase('drawing')
  }

  const handleDrawingComplete = () => {
    setGamePhase('completed')
  }

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:dark:bg-gray-950/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="font-semibold">UST Learning</div>
          <button
            onClick={() => navigate('/')}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-900"
          >
            ← Back to Home
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">
                {currentTopic.title} - {
                  gamePhase === 'spelling' ? 'Spelling Game' :
                  gamePhase === 'drawing' ? 'Drawing Game' :
                  'All Games Completed!'
                }
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {gamePhase === 'spelling' && 'Practice spelling with mirror characters'}
                {gamePhase === 'drawing' && 'Draw each character to practice writing'}
                {gamePhase === 'completed' && 'Congratulations! You completed both games!'}
              </p>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
              gamePhase === 'spelling' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300' :
              'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                gamePhase === 'spelling' ? 'bg-indigo-600' : 'bg-green-600'
              }`}></div>
              <span className="text-sm font-medium">Spelling Game</span>
            </div>
            <div className="text-gray-400">→</div>
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
              gamePhase === 'drawing' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' :
              gamePhase === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300' :
              'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                gamePhase === 'drawing' ? 'bg-emerald-600' :
                gamePhase === 'completed' ? 'bg-green-600' : 'bg-gray-400'
              }`}></div>
              <span className="text-sm font-medium">Drawing Game</span>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6 bg-white dark:bg-gray-950">
            {gamePhase === 'spelling' && (
              <SpellingGame topic={currentTopic.title} onGameComplete={handleSpellingComplete} />
            )}
            {gamePhase === 'drawing' && (
              <DrawingGame topic={currentTopic.title} onGameComplete={handleDrawingComplete} />
            )}
            {gamePhase === 'completed' && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Congratulations!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  You have successfully completed both the Spelling Game and Drawing Game for {currentTopic.title}!
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="rounded-md bg-indigo-600 text-white px-6 py-2 hover:bg-indigo-700 transition-colors"
                >
                  Back to Home
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}


export function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game/:topicId" element={<GamePage />} />
      </Routes>
    </Router>
  )
}



