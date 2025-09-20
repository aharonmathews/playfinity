import { useMemo, useState, useEffect, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './components/Dashboard'
import { DrawingCanvas } from './components/DrawingCanvas'
import { SpellingGame } from './components/games/SpellingGame'
import { DrawingGame } from './components/games/DrawingGame'
import { ImageGalleryGame } from './components/games/ImageGalleryGame'
import { GeneralKnowledgeGame } from './components/games/GeneralKnowledgeGame'
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

type Topic = { id: string; title: string }
type UserProfile = { name: string; age: number; disability: string }

const topics: Topic[] = [
  { id: 't1', title: 'Mathematics' },
  { id: 't2', title: 'Science' },
  { id: 't3', title: 'History' },
  { id: 't4', title: 'Geography' },
  { id: 't5', title: 'Arts' },
]

let userScore = 0;

function HomePage() {
  const bubbleContainerRef = useRef<HTMLDivElement>(null);
  const [bubbles, setBubbles] = useState<Array<{id:number,x:number,y:number,color:string,size:number}>>([]);
  const bubbleId = useRef(0);

  const bubblePopSound = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    bubblePopSound.current = new Audio("https://cdn.pixabay.com/audio/2022/03/15/audio_115b6c7b7c.mp3");
    bubblePopSound.current.volume = 0.3;
  }, []);

  function randomColor() {
    const colors = ["#FFD700","#FF6347","#00FFFF","#FF69B4","#8B5CF6","#22D3EE","#F59E42","#34D399"];
    return colors[Math.floor(Math.random()*colors.length)];
  }

  function handleBgClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target !== bubbleContainerRef.current) return;
    const rect = bubbleContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setBubbles(b => [...b,{ id:bubbleId.current++, x, y, color:randomColor(), size:40+Math.random()*60 }]);
    bubblePopSound.current?.play().catch(() => {});
  }

  useEffect(() => {
    if (!bubbles.length) return;
    const timeout = setTimeout(() => setBubbles(b => b.slice(1)), 1200);
    return () => clearTimeout(timeout);
  }, [bubbles]);

  const [selectedTopicIds] = useState<string[]>(['t1'])
  const [runningTopicIds] = useState<string[]>(['t1'])
  const [user] = useState<UserProfile>({ name: 'Alex Johnson', age: 14, disability: 'Dyslexia' })
  const [score, setScore] = useState(userScore)
  const [showCanvas, setShowCanvas] = useState(false)
  const navigate = useNavigate()

  const coveredCount = selectedTopicIds.length
  const runningCount = runningTopicIds.length
  const progressPercent = coveredCount === 0 ? 0 : Math.round((coveredCount - runningCount) / coveredCount * 100)

  function awardPoints(points: number) {
    userScore += points;
    setScore(userScore);
  }

  function navigateToGame(topic: Topic) { navigate(`/game/${topic.id}`) }

  return (
    <div
      className="min-h-full bg-[#f8fafc] relative overflow-hidden text-gray-900"
      ref={bubbleContainerRef}
      onClick={handleBgClick}
      style={{minHeight:'100vh',width:'100vw'}}
    >
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
            boxShadow:`0 0 24px 4px ${bub.color}`,
            opacity:0.7,
            pointerEvents:'none',
            transition:'transform 1.2s cubic-bezier(.17,.67,.83,.67), opacity 1.2s',
            transform:'scale(1.2)',
            zIndex:10
          }}
        />
      ))}

      <header className="sticky top-0 z-20 border-b border-gray-200 bg-[#f1f5f9]/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center">
          <div className="font-semibold text-gray-900">UST Learning</div>
        </div>
      </header>

  <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        <div className="grid grid-cols-12 gap-6">
          <aside className="col-span-3 rounded-lg border border-gray-200 bg-[#f1f5f9] text-gray-900">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">Topics</h2>
            </div>
            <Sidebar topics={topics} onTopicClick={navigateToGame} />
          </aside>

          <section className="col-span-9 space-y-6">
            <Dashboard
              user={user}
              coveredCount={coveredCount}
              runningCount={runningCount}
              progressPercent={progressPercent}
              score={score}
            />

            <div className="rounded-lg border border-gray-200 p-4 bg-[#f1f5f9] space-y-3">
              {!showCanvas ? (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Wanna draw some picture and learn about it?</h3>
                    <p className="text-sm text-gray-500">Open the canvas and start sketching your ideas below the dashboard.</p>
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
                    <h3 className="text-base font-semibold text-gray-900">Canvas</h3>
                    <button
                      type="button"
                      onClick={() => setShowCanvas(false)}
                      className="text-sm text-gray-500 hover:underline"
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
  const [gamePhase, setGamePhase] = useState<'spelling' | 'drawing' | 'matching' | 'gallery' | 'gk' | 'completed'>('spelling')

  const currentTopic = topics.find(topic => topic.id === topicId)
  const awardPoints = (points: number) => { userScore += points; };

  if (!currentTopic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Topic not found</h1>
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
  useEffect(() => { if (gamePhase !== 'spelling') celebrate(); }, [gamePhase]);

  const handleSpellingComplete = () => { awardPoints(10); setGamePhase('drawing') }
  const handleDrawingComplete  = () => { awardPoints(15); setGamePhase('matching') }
  const handleMatchingComplete = () => { awardPoints(20); setGamePhase('gallery') }
  const handleGalleryComplete  = () => { awardPoints(5);  setGamePhase('gk') }
  const handleGKComplete = () => { setGamePhase('completed') }

  return (
  <div className="min-h-full bg-[#f8fafc] text-gray-900">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-[#f1f5f9]/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="font-semibold text-gray-900">UST Learning</div>
          <button
            onClick={() => navigate('/')}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
          >
            ← Back to Home
          </button>
        </div>
      </header>

  <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {currentTopic.title} – {
                gamePhase === 'spelling' ? 'Spelling Game' :
                gamePhase === 'drawing' ? 'Drawing Game' :
                gamePhase === 'matching' ? 'Matching Game' :
                gamePhase === 'gallery' ? 'Image Gallery' :
                'All Games Completed!'
              }
            </h1>
            <p className="text-sm text-gray-500">
              {gamePhase === 'spelling' && 'Practice spelling with mirror characters'}
              {gamePhase === 'drawing' && 'Draw each character to practice writing'}
              {gamePhase === 'matching' && 'Match the word to the correct image'}
              {gamePhase === 'gallery' && 'Explore images related to the topic'}
              {gamePhase === 'completed' && 'Congratulations! You completed all games!'}
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 p-6 bg-[#f1f5f9] shadow-2xl">
            {gamePhase === 'spelling' && (
              <SpellingGame topic={currentTopic.title} onGameComplete={handleSpellingComplete} />
            )}
            {gamePhase === 'drawing' && (
              <DrawingGame topic={currentTopic.title} onGameComplete={handleDrawingComplete} />
            )}
            {gamePhase === 'gallery' && (
              <ImageGalleryGame topic={currentTopic.title} onGameComplete={handleGalleryComplete} />
            )}
            {gamePhase === 'gk' && (
              <GeneralKnowledgeGame topic={currentTopic.title} onGameComplete={handleGKComplete} />
            )}
            {gamePhase === 'completed' && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold mb-2 text-gray-900">
                  Congratulations!
                </h2>
                <p className="text-gray-500 mb-6">
                  You have successfully completed all games for {currentTopic.title}!
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="rounded-md bg-indigo-600 text-white px-6 py-2 hover:bg-indigo-700"
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

function SingleGamePage({ gameType }: { gameType: 'spelling' | 'drawing' | 'gallery' | 'gk' }) {
  const { topicId } = useParams<{ topicId: string }>()
  const navigate = useNavigate()
  const currentTopic = topics.find(topic => topic.id === topicId)
  const [completed, setCompleted] = useState(false)
  if (!currentTopic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9] text-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Topic not found</h1>
          <button
            onClick={() => navigate('/')}
            className="rounded-md bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-500"
          >Back to Home</button>
        </div>
      </div>
    )
  }
  const handleComplete = () => setCompleted(true)
  const goToGame = (type: 'spelling' | 'drawing' | 'gallery' | 'gk') => {
    setCompleted(false)
    navigate(`/game/${topicId}/${type}`)
  }
  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9] text-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900">{gameType === 'gk' ? 'General Knowledge' : gameType.charAt(0).toUpperCase() + gameType.slice(1)} Game Completed!</h2>
          <p className="text-gray-500 mb-6">You have completed the {gameType === 'gk' ? 'General Knowledge' : gameType} game for {currentTopic.title}.</p>
          <div className="flex justify-center gap-4">
            {gameType !== 'spelling' && (
              <button onClick={() => goToGame('spelling')} className="rounded bg-indigo-600 text-white px-4 py-2">Previous Game</button>
            )}
            {gameType !== 'gk' && (
              <button onClick={() => goToGame(gameType === 'spelling' ? 'drawing' : gameType === 'drawing' ? 'gallery' : 'gk')} className="rounded bg-indigo-600 text-white px-4 py-2">Next Game</button>
            )}
            <button onClick={() => navigate('/')} className="rounded bg-gray-200 text-gray-900 px-4 py-2">Home</button>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-full flex items-center justify-center bg-[#f1f5f9] text-gray-900">
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
        {gameType === 'gk' && (
          <GeneralKnowledgeGame topic={currentTopic.title} onGameComplete={handleComplete} />
        )}
      </div>
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
        <Route path="/game/:topicId/gk" element={<SingleGamePage gameType="gk" />} />
      </Routes>
    </Router>
  )
}
