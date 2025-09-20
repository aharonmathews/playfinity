import { useMemo, useState, useEffect, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './components/Dashboard'
import { DrawingCanvas } from './components/DrawingCanvas'
import { SpellingGame } from './components/games/SpellingGame'
import { DrawingGame } from './components/games/DrawingGame'
import { ImageGalleryGame } from './components/games/ImageGalleryGame'
import confetti from "canvas-confetti";

const applauseSound = new Audio("https://www.soundjay.com/human/applause-8.mp3");
applauseSound.volume = 0.7;
applauseSound.load();

const celebrate = () => {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#FFD700", "#FF6347", "#00FFFF", "#FF69B4"]
  });
  applauseSound.play().catch(() => {});
};

type Topic = {
  id: string
  title: string
}

type UserProfile = {
  name: string
  age: number
  disability: string
}

const topics: Topic[] = [
  { id: 't1', title: 'Mathematics' },
  { id: 't2', title: 'Science' },
  { id: 't3', title: 'History' },
  { id: 't4', title: 'Geography' },
  { id: 't5', title: 'Arts' },
]

// ADDED: A global state for user score
let userScore = 0;

function HomePage() {
  const bubbleContainerRef = useRef<HTMLDivElement>(null);
  // Bubble state
  const [bubbles, setBubbles] = useState<Array<{id:number,x:number,y:number,color:string,size:number}>>([]);
  // Bubble id counter
  const bubbleId = useRef(0);

  // Generate a random color for curiosity
  function randomColor() {
    const colors = ["#FFD700", "#FF6347", "#00FFFF", "#FF69B4", "#8B5CF6", "#22D3EE", "#F59E42", "#34D399"];
    return colors[Math.floor(Math.random()*colors.length)];
  }

  // Sensory pop sound for bubbles
  const bubblePopSound = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    bubblePopSound.current = new Audio("https://cdn.pixabay.com/audio/2022/03/15/audio_115b6c7b7c.mp3");
    bubblePopSound.current.volume = 0.3;
  }, []);

  // Generate a bubble at click position
  function handleBgClick(e: React.MouseEvent<HTMLDivElement>) {
    // Only create bubble if clicked on blank space (not a child element)
    if (e.target !== bubbleContainerRef.current) return;
    const rect = bubbleContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setBubbles(bubs => [
      ...bubs,
      {
        id: bubbleId.current++,
        x,
        y,
        color: randomColor(),
        size: 40 + Math.random()*60
      }
    ]);
    // Play pop sound for sensory feedback
    bubblePopSound.current?.play().catch(() => {});
  }

  // Remove bubbles after animation
  useEffect(() => {
    if (!bubbles.length) return;
    const timeout = setTimeout(() => {
      setBubbles(bubs => bubs.slice(1));
    }, 1200);
    return () => clearTimeout(timeout);
  }, [bubbles]);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(['t1'])
  const [runningTopicIds, setRunningTopicIds] = useState<string[]>(['t1'])
  const [user] = useState<UserProfile>({ name: 'Alex Johnson', age: 14, disability: 'Dyslexia' })
  // ADDED: State to manage and display the score on the dashboard
  const [score, setScore] = useState(userScore)
  const [showCanvas, setShowCanvas] = useState(false)
  const navigate = useNavigate()

  const coveredCount = selectedTopicIds.length
  const runningCount = runningTopicIds.length
  const progressPercent = coveredCount === 0 ? 0 : Math.round((coveredCount - runningCount) / coveredCount * 100)

  // ADDED: A function to award points, which will be passed to the GamePage
  function awardPoints(points: number) {
    userScore += points;
    setScore(userScore);
  }

  function navigateToGame(topic: Topic) {
    navigate(`/game/${topic.id}`)
  }

  return (
    <div
      className="min-h-full bg-gradient-to-br from-blue-50 via-emerald-50 to-pink-100 dark:from-gray-900 dark:via-indigo-950 dark:to-gray-800 relative overflow-hidden"
      ref={bubbleContainerRef}
      onClick={handleBgClick}
      style={{minHeight:'100vh',width:'100vw'}}
    >
      {/* Render bubbles */}
      {bubbles.map(bub => (
        <span
          key={bub.id}
          style={{
            position:'absolute',
            left:bub.x-bub.size/2,
            top:bub.y-bub.size/2,
            width:bub.size,
            height:bub.size,
            background:bub.color,
            borderRadius:'50%',
            boxShadow:'0 0 24px 4px '+bub.color,
            opacity:0.7,
            pointerEvents:'none',
            transition:'transform 1.2s cubic-bezier(.17,.67,.83,.67), opacity 1.2s',
            transform:'scale(1.2)',
            zIndex:10
          }}
          className="bubble curiosity-bubble"
        />
      ))}
  <header className="sticky top-0 z-20 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:dark:bg-gray-950/60">
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
              // ADDED: Pass score to Dashboard
              score={score}
            />
            
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
  // MODIFIED: Added 'matching' to the game phase
  const [gamePhase, setGamePhase] = useState<'spelling' | 'drawing' | 'matching' | 'gallery' | 'completed'>('spelling')
  
  const currentTopic = topics.find(topic => topic.id === topicId)

  // ADDED: This function will be passed to each game component
  const awardPoints = (points: number) => {
      userScore += points;
  };

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
  useEffect(() => {
    if (gamePhase !== 'spelling') {
      celebrate();
    }
  }, [gamePhase]);

  const handleSpellingComplete = () => {
    awardPoints(10); // Award 10 points for completing the spelling game
    setGamePhase('drawing')
  }

  const handleDrawingComplete = () => {
    awardPoints(15); // Award 15 points
    setGamePhase('matching') // MODIFIED: Go to matching game next
  }

  // ADDED: Handler for the new matching game
  const handleMatchingComplete = () => {
    awardPoints(20); // Award 20 points
    setGamePhase('gallery')
  }

  const handleGalleryComplete = () => {
    awardPoints(5); // Award 5 points
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
                  gamePhase === 'matching' ? 'Matching Game' : // MODIFIED
                  gamePhase === 'gallery' ? 'Image Gallery' :
                  'All Games Completed!'
                }
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {gamePhase === 'spelling' && 'Practice spelling with mirror characters'}
                {gamePhase === 'drawing' && 'Draw each character to practice writing'}
                {gamePhase === 'matching' && 'Match the word to the correct image'} {/* ADDED */}
                {gamePhase === 'gallery' && 'Explore images related to the topic'}
                {gamePhase === 'completed' && 'Congratulations! You completed all games!'}
              </p>
            </div>
          </div>

          {/* MODIFIED: Progress indicator updated to include the matching game */}
          <div className="flex items-center justify-center space-x-2">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
              gamePhase === 'spelling' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300' :
              'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300'
            }`}>
              <div className={`w-2 h-2 rounded-full ${ gamePhase === 'spelling' ? 'bg-indigo-600' : 'bg-green-600' }`}></div>
              <span className="text-sm font-medium">Spelling</span>
            </div>
            <div className="text-gray-400">→</div>
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
              gamePhase === 'drawing' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' :
              gamePhase === 'matching' || gamePhase === 'gallery' || gamePhase === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300' :
              'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                gamePhase === 'drawing' ? 'bg-emerald-600' :
                gamePhase === 'matching' || gamePhase === 'gallery' || gamePhase === 'completed' ? 'bg-green-600' : 'bg-gray-400'
              }`}></div>
              <span className="text-sm font-medium">Drawing</span>
            </div>
            <div className="text-gray-400">→</div>
            {/* ADDED: New progress step for Matching Game */}
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
              gamePhase === 'matching' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300' :
              gamePhase === 'gallery' || gamePhase === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300' :
              'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                gamePhase === 'matching' ? 'bg-rose-600' :
                gamePhase === 'gallery' || gamePhase === 'completed' ? 'bg-green-600' : 'bg-gray-400'
              }`}></div>
              <span className="text-sm font-medium">Matching</span>
            </div>
            <div className="text-gray-400">→</div>
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
              gamePhase === 'gallery' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300' :
              gamePhase === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300' :
              'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                gamePhase === 'gallery' ? 'bg-purple-600' :
                gamePhase === 'completed' ? 'bg-green-600' : 'bg-gray-400'
              }`}></div>
              <span className="text-sm font-medium">Gallery</span>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6 bg-white dark:bg-gray-950">
            {gamePhase === 'spelling' && (
              <SpellingGame topic={currentTopic.title} onGameComplete={handleSpellingComplete} />
            )}
            {gamePhase === 'drawing' && (
              <DrawingGame topic={currentTopic.title} onGameComplete={handleDrawingComplete} />
            )}
            {/* ADDED: Render the new MatchingGame */}
          
            {gamePhase === 'gallery' && (
              <ImageGalleryGame topic={currentTopic.title} onGameComplete={handleGalleryComplete} />
            )}
            {gamePhase === 'completed' && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Congratulations!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  You have successfully completed all games for {currentTopic.title}!
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
        <Route path="/game/:topicId/spelling" element={<SingleGamePage gameType="spelling" />} />
        <Route path="/game/:topicId/drawing" element={<SingleGamePage gameType="drawing" />} />
        <Route path="/game/:topicId/gallery" element={<SingleGamePage gameType="gallery" />} />
      </Routes>
    </Router>
  )

}

function SingleGamePage({ gameType }: { gameType: 'spelling' | 'drawing' | 'gallery' }) {
  const { topicId } = useParams<{ topicId: string }>()
  const navigate = useNavigate()
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
  const [completed, setCompleted] = useState(false)
  if (!currentTopic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Topic not found</h1>
          <button
            onClick={() => navigate('/')}
            className="rounded-md bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-500"
          >Back to Home</button>
        </div>
      </div>
    )
  }
  const handleComplete = () => setCompleted(true)
  const goToGame = (type: 'spelling' | 'drawing' | 'gallery') => {
    setCompleted(false)
    navigate(`/game/${topicId}/${type}`)
  }
  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{gameType.charAt(0).toUpperCase() + gameType.slice(1)} Game Completed!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">You have completed the {gameType} game for {currentTopic.title}.</p>
          <div className="flex justify-center gap-4">
            {gameType !== 'spelling' && (
              <button onClick={() => goToGame('spelling')} className="rounded bg-indigo-600 text-white px-4 py-2">Previous Game</button>
            )}
            {gameType !== 'gallery' && (
              <button onClick={() => goToGame(gameType === 'spelling' ? 'drawing' : 'gallery')} className="rounded bg-indigo-600 text-white px-4 py-2">Next Game</button>
            )}
            <button onClick={() => navigate('/')} className="rounded bg-gray-300 text-gray-900 px-4 py-2">Home</button>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-full flex items-center justify-center">
      <div className="w-full max-w-xl">
        {gameType === 'spelling' && (
          <SpellingGame topic={currentTopic.title} onGameComplete={handleComplete} />
        )}
        {gameType === 'drawing' && (
          <DrawingGame topic={currentTopic.title} onGameComplete={handleComplete} />
        )}
        {gameType === 'gallery' && (
          <ImageGalleryGame topic={currentTopic.title} onGameComplete={handleComplete} />
        )}
      </div>
    </div>
  )
}