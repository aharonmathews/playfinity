import { Sidebar } from "../components/Sidebar";
import { Dashboard } from "../components/Dashboard";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { topics, celebrate, type Topic, type UserProfile } from "../App";
import { useScore } from "../contexts/ScoreContext";
import TypeQuestGame from "../components/games/TypeQuestGame";
import RhymeRoundupGame from "../components/games/RhymeRoundupGame";

function HomePage() {
  const bubbleContainerRef = useRef<HTMLDivElement>(null);
  const [bubbles, setBubbles] = useState<
    Array<{ id: number; x: number; y: number; color: string; size: number }>
  >([]);
  const bubbleId = useRef(0);

  const { score, addPoints } = useScore();
  const [showTypeQuest, setShowTypeQuest] = useState(false);
  const [showRhymeRoundup, setShowRhymeRoundup] = useState(false);

  const bubblePopSound = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    bubblePopSound.current = new Audio(
      "https://cdn.pixabay.com/audio/2022/03/15/audio_115b6c7b7c.mp3"
    );
    bubblePopSound.current.volume = 0.3;
  }, []);

  function randomColor() {
    const colors = [
      "#FFD700",
      "#FF6347",
      "#00FFFF",
      "#FF69B4",
      "#8B5CF6",
      "#22D3EE",
      "#F59E42",
      "#34D399",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  function handleBgClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target !== bubbleContainerRef.current) return;
    const rect = bubbleContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setBubbles((b) => [
      ...b,
      {
        id: bubbleId.current++,
        x,
        y,
        color: randomColor(),
        size: 40 + Math.random() * 60,
      },
    ]);
    bubblePopSound.current?.play().catch(() => {});
  }

  useEffect(() => {
    if (!bubbles.length) return;
    const timeout = setTimeout(() => setBubbles((b) => b.slice(1)), 1200);
    return () => clearTimeout(timeout);
  }, [bubbles]);

  const [selectedTopicIds] = useState<string[]>(["t1"]);
  const [runningTopicIds] = useState<string[]>(["t1"]);
  const [user] = useState<UserProfile>({
    name: "Alex Johnson",
    age: 14,
    disability: "Dyslexia",
  });

  const [showCanvas, setShowCanvas] = useState(false);
  const navigate = useNavigate();

  const coveredCount = selectedTopicIds.length;
  const runningCount = runningTopicIds.length;
  const progressPercent =
    coveredCount === 0
      ? 0
      : Math.round(((coveredCount - runningCount) / coveredCount) * 100);

  function awardPoints(points: number) {
    addPoints(points);
  }

  function navigateToGame(topic: Topic) {
    navigate(`/game/${topic.id}`);
  }

  return (
    <div
      className="min-h-full bg-[#f8fafc] relative overflow-hidden text-gray-900"
      ref={bubbleContainerRef}
      onClick={handleBgClick}
      style={{ minHeight: "100vh", width: "100vw" }}
    >
      {bubbles.map((bub) => (
        <span
          key={bub.id}
          style={{
            position: "absolute",
            left: bub.x - bub.size / 2,
            top: bub.y - bub.size / 2,
            width: bub.size,
            height: bub.size,
            background: bub.color,
            borderRadius: "50%",
            boxShadow: `0 0 24px 4px ${bub.color}`,
            opacity: 0.7,
            pointerEvents: "none",
            transition:
              "transform 1.2s cubic-bezier(.17,.67,.83,.67), opacity 1.2s",
            transform: "scale(1.2)",
            zIndex: 10,
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

            {/* ✅ Games Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* TypeQuest Game Button */}
              <div
                className="bg-gradient-to-br from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 p-6 rounded-lg cursor-pointer transition-all duration-300 group shadow-lg hover:shadow-xl transform hover:scale-105"
                onClick={() => setShowTypeQuest(true)}
              >
                <div className="text-center text-white">
                  <div className="text-5xl mb-3 group-hover:animate-bounce">
                    ⚔️
                  </div>
                  <h3 className="text-2xl font-bold mb-2">TypeQuest</h3>
                  <p className="text-purple-100 text-sm mb-3">
                    Battle monsters with math skills!
                  </p>
                  <div className="flex justify-center gap-2 text-xs">
                    <span className="bg-purple-500 px-2 py-1 rounded-full">
                      Math Combat
                    </span>
                    <span className="bg-purple-500 px-2 py-1 rounded-full">
                      RPG Style
                    </span>
                  </div>
                </div>
              </div>

              {/* Dyslexic Rhyming Words Button */}
              <div
                className="bg-gradient-to-br from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 p-6 rounded-lg cursor-pointer transition-all duration-300 group shadow-lg hover:shadow-xl transform hover:scale-105"
                onClick={() => setShowRhymeRoundup(true)}
              >
                <div className="text-center text-white">
                  <div className="text-5xl mb-3 group-hover:animate-bounce">
                    🤠
                  </div>
                  <h3 className="text-xl font-bold mb-2">
                    Dyslexic Rhyming Words
                  </h3>
                  <p className="text-green-100 text-sm mb-3">
                    Catch falling words that rhyme!
                  </p>
                  <div className="flex justify-center gap-2 text-xs">
                    <span className="bg-green-500 px-2 py-1 rounded-full">
                      Phonics
                    </span>
                    <span className="bg-green-500 px-2 py-1 rounded-full">
                      Dyslexia-Friendly
                    </span>
                  </div>
                </div>
              </div>

              {/* Test Games Button */}
              <div
                className="bg-gradient-to-br from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 p-6 rounded-lg cursor-pointer transition-all duration-300 group shadow-lg hover:shadow-xl transform hover:scale-105"
                onClick={() => navigate("/test-games")}
              >
                <div className="text-center text-white">
                  <div className="text-5xl mb-3 group-hover:animate-spin">
                    🧪
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Test Games</h3>
                  <p className="text-red-100 text-sm mb-3">
                    Try experimental learning games
                  </p>
                  <div className="flex justify-center gap-2 text-xs">
                    <span className="bg-red-500 px-2 py-1 rounded-full">
                      No API
                    </span>
                    <span className="bg-red-500 px-2 py-1 rounded-full">
                      Testing
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Canvas Section */}
            <div className="rounded-lg border border-gray-200 p-4 bg-[#f1f5f9] space-y-3">
              {!showCanvas ? (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      Wanna draw some picture and learn about it?
                    </h3>
                    <p className="text-sm text-gray-500">
                      Open the canvas and start sketching your ideas below the
                      dashboard.
                    </p>
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
                    <h3 className="text-base font-semibold text-gray-900">
                      Canvas
                    </h3>
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

      {/* ✅ TypeQuest Game Modal */}
      {showTypeQuest && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
            <div className="flex justify-end p-4">
              <button
                onClick={() => setShowTypeQuest(false)}
                className="text-gray-400 hover:text-white text-2xl font-bold"
              >
                ✕
              </button>
            </div>
            <div className="px-4 pb-4">
              <TypeQuestGame onGameComplete={() => setShowTypeQuest(false)} />
            </div>
          </div>
        </div>
      )}

      {/* ✅ Rhyme Roundup Game Modal */}
      {showRhymeRoundup && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[95vh] overflow-hidden shadow-2xl">
            <div className="flex justify-end p-4">
              <button
                onClick={() => setShowRhymeRoundup(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ✕
              </button>
            </div>
            <div className="px-4 pb-4">
              <RhymeRoundupGame />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { HomePage };
