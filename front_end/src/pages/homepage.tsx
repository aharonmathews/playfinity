import { Sidebar } from "../components/Sidebar";
import { Dashboard } from "../components/Dashboard";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { topics, celebrate, type Topic } from "../App";
import { useScore } from "../contexts/ScoreContext";
import { useUser } from "../contexts/UserContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import TypeQuestGame from "../components/games/TypeQuestGame";
import RhymeRoundupGame from "../components/games/RhymeRoundupGame";
import SyllableSplitterGame from "../components/games/SyllableSplitterGame";

// ✅ Enhanced disability-specific themes with better accessibility
const DISABILITY_THEMES = {
  ADHD: {
    primary: "emerald",
    secondary: "teal",
    accent: "cyan",
    background: "bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50",
    cardBg: "bg-white/95 backdrop-blur-sm",
    headerBg: "bg-emerald-100/95",
    textPrimary: "text-emerald-900",
    textSecondary: "text-emerald-700",
    textMuted: "text-emerald-600",
    border: "border-emerald-200",
    button: "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800",
    shadow: "shadow-emerald-100/50",
    fontFamily: "font-mono",
    fontSize: "text-base", // Larger text for better focus
    spacing: "space-y-8",
    padding: "p-6", // Extra padding
    animations: "transition-all duration-200 ease-out",
    focusRing: "focus:ring-4 focus:ring-emerald-300 focus:outline-none",
  },
  Dyslexia: {
    primary: "blue",
    secondary: "indigo",
    accent: "purple",
    background: "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50",
    cardBg: "bg-amber-50/95 backdrop-blur-sm", // Warm cream background
    headerBg: "bg-blue-100/95",
    textPrimary: "text-blue-900",
    textSecondary: "text-blue-800",
    textMuted: "text-blue-600",
    border: "border-blue-200",
    button: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800",
    shadow: "shadow-blue-100/50",
    fontFamily: "font-sans",
    fontSize: "text-lg", // Larger text for dyslexia
    spacing: "space-y-6",
    padding: "p-5",
    animations: "transition-all duration-300 ease-in-out",
    focusRing: "focus:ring-4 focus:ring-blue-300 focus:outline-none",
  },
  Visual: {
    primary: "yellow",
    secondary: "orange",
    accent: "amber",
    background: "bg-gradient-to-br from-yellow-100 via-orange-50 to-amber-50",
    cardBg: "bg-white/98 backdrop-blur-sm",
    headerBg: "bg-yellow-200/95",
    textPrimary: "text-yellow-900",
    textSecondary: "text-yellow-800",
    textMuted: "text-yellow-700",
    border: "border-yellow-400", // Higher contrast borders
    button:
      "bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800 text-yellow-50",
    shadow: "shadow-yellow-200/60",
    fontFamily: "font-bold",
    fontSize: "text-xl", // Extra large text
    spacing: "space-y-10", // Extra spacing
    padding: "p-8",
    animations: "transition-all duration-500 ease-in-out",
    focusRing: "focus:ring-6 focus:ring-yellow-400 focus:outline-none",
  },
  Autism: {
    primary: "slate",
    secondary: "gray",
    accent: "zinc",
    background: "bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50",
    cardBg: "bg-white/98 backdrop-blur-sm",
    headerBg: "bg-slate-100/95",
    textPrimary: "text-slate-900",
    textSecondary: "text-slate-700",
    textMuted: "text-slate-600",
    border: "border-slate-300",
    button: "bg-slate-600 hover:bg-slate-700 active:bg-slate-800",
    shadow: "shadow-slate-100/50",
    fontFamily: "font-sans",
    fontSize: "text-base",
    spacing: "space-y-6",
    padding: "p-5",
    animations: "transition-all duration-150 ease-linear", // Predictable animations
    focusRing: "focus:ring-2 focus:ring-slate-300 focus:outline-none",
  },
  None: {
    primary: "indigo",
    secondary: "purple",
    accent: "pink",
    background: "bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50",
    cardBg: "bg-white/90 backdrop-blur-lg",
    headerBg: "bg-white/95",
    textPrimary: "text-gray-900",
    textSecondary: "text-gray-700",
    textMuted: "text-gray-600",
    border: "border-gray-200",
    button: "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800",
    shadow: "shadow-gray-100/50",
    fontFamily: "font-sans",
    fontSize: "text-base",
    spacing: "space-y-6",
    padding: "p-5",
    animations: "transition-all duration-300 ease-in-out",
    focusRing: "focus:ring-3 focus:ring-indigo-300 focus:outline-none",
  },
  Other: {
    primary: "violet",
    secondary: "purple",
    accent: "fuchsia",
    background: "bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50",
    cardBg: "bg-white/95 backdrop-blur-sm",
    headerBg: "bg-violet-100/95",
    textPrimary: "text-violet-900",
    textSecondary: "text-violet-700",
    textMuted: "text-violet-600",
    border: "border-violet-200",
    button: "bg-violet-600 hover:bg-violet-700 active:bg-violet-800",
    shadow: "shadow-violet-100/50",
    fontFamily: "font-sans",
    fontSize: "text-base",
    spacing: "space-y-6",
    padding: "p-5",
    animations: "transition-all duration-300 ease-in-out",
    focusRing: "focus:ring-3 focus:ring-violet-300 focus:outline-none",
  },
};

function HomePage() {
  const bubbleContainerRef = useRef<HTMLDivElement>(null);
  const [bubbles, setBubbles] = useState<
    Array<{ id: number; x: number; y: number; color: string; size: number }>
  >([]);
  const bubbleId = useRef(0);

  const { score, addPoints } = useScore();
  const { user, loading, setUser } = useUser();
  const [showTypeQuest, setShowTypeQuest] = useState(false);
  const [showRhymeRoundup, setShowRhymeRoundup] = useState(false);
  const [showSyllableSplitter, setShowSyllableSplitter] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const navigate = useNavigate();

  // ✅ Get theme based on user's disability
  const theme = useMemo(() => {
    if (!user || !user.disability) return DISABILITY_THEMES.None;
    return DISABILITY_THEMES[user.disability] || DISABILITY_THEMES.None;
  }, [user?.disability]);

  const bubblePopSound = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    bubblePopSound.current = new Audio(
      "https://cdn.pixabay.com/audio/2022/03/15/audio_115b6c7b7c.mp3"
    );
    bubblePopSound.current.volume = 0.3;
  }, []);

  function getThemeColors() {
    const colors = {
      ADHD: ["#10B981", "#14B8A6", "#06B6D4", "#0EA5E9"],
      Dyslexia: ["#3B82F6", "#6366F1", "#8B5CF6", "#A855F7"],
      Visual: ["#F59E0B", "#EAB308", "#D97706", "#B45309"],
      Autism: ["#64748B", "#475569", "#334155", "#1E293B"],
      None: ["#8B5CF6", "#EC4899", "#06B6D4", "#10B981"],
      Other: ["#8B5CF6", "#A855F7", "#C084FC", "#DDD6FE"],
    };
    return colors[user?.disability || "None"];
  }

  function randomColor() {
    const themeColors = getThemeColors();
    return themeColors[Math.floor(Math.random() * themeColors.length)];
  }

  function handleBgClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target !== bubbleContainerRef.current) return;
    const rect = bubbleContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const bubbleSize =
      user?.disability === "ADHD"
        ? 30 + Math.random() * 20
        : 40 + Math.random() * 60;

    setBubbles((b) => [
      ...b,
      {
        id: bubbleId.current++,
        x,
        y,
        color: randomColor(),
        size: bubbleSize,
      },
    ]);
    bubblePopSound.current?.play().catch(() => {});
    addPoints(1);
  }

  useEffect(() => {
    if (!bubbles.length) return;
    const timeout = setTimeout(() => setBubbles((b) => b.slice(1)), 1200);
    return () => clearTimeout(timeout);
  }, [bubbles]);

  const [selectedTopicIds] = useState<string[]>(["t1"]);
  const [runningTopicIds] = useState<string[]>(["t1"]);
  const [showCanvas, setShowCanvas] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut(auth);
      setUser(null);
      localStorage.removeItem("currentUser");
      navigate("/loginpage");
    } catch (error) {
      console.error("Error signing out:", error);
      setUser(null);
      localStorage.removeItem("currentUser");
      navigate("/loginpage");
    } finally {
      setSigningOut(false);
    }
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${theme.background}`}
      >
        <div className="text-center">
          <div
            className={`animate-spin rounded-full h-20 w-20 border-4 border-${theme.primary}-200 border-t-${theme.primary}-600 mx-auto mb-8`}
          ></div>
          <p
            className={`${theme.textSecondary} ${theme.fontSize} ${theme.fontFamily} font-medium`}
          >
            Loading your personalized learning space...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${theme.background}`}
      >
        <div className="text-center">
          <p
            className={`${theme.textSecondary} mb-8 ${theme.fontSize} ${theme.fontFamily}`}
          >
            Please sign in to continue
          </p>
          <button
            onClick={() => navigate("/loginpage")}
            className={`px-8 py-4 ${theme.button} text-white rounded-2xl hover:shadow-xl ${theme.animations} ${theme.fontFamily} font-semibold ${theme.focusRing} ${theme.shadow}`}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const coveredCount = selectedTopicIds.length;
  const runningCount = runningTopicIds.length;
  const progressPercent =
    coveredCount === 0
      ? 0
      : Math.round(((coveredCount - runningCount) / coveredCount) * 100);

  function navigateToGame(topic: Topic) {
    navigate(`/game/${topic.id}`);
  }

  const getAvailableGames = () => {
    const allGames = [
      {
        id: "typequest",
        name: "TypeQuest",
        description: "Battle monsters with math skills!",
        icon: "⚔️",
        gradient: `from-${theme.primary}-600 to-${theme.primary}-800`,
        hoverGradient: `hover:from-${theme.primary}-700 hover:to-${theme.primary}-900`,
        tags: ["Math", "RPG"],
        suitable: ["ADHD", "None", "Other", "Autism"],
        onClick: () => setShowTypeQuest(true),
      },
      {
        id: "rhyme",
        name: "Rhyming Words",
        description: "Catch falling words that rhyme!",
        icon: "🎵",
        gradient: `from-${theme.secondary}-600 to-${theme.secondary}-800`,
        hoverGradient: `hover:from-${theme.secondary}-700 hover:to-${theme.secondary}-900`,
        tags: ["Phonics", "Dyslexia"],
        suitable: ["Dyslexia", "None", "Other"],
        onClick: () => setShowRhymeRoundup(true),
      },
      {
        id: "syllable",
        name: "Syllable Splitter",
        description: "Learn to decode words!",
        icon: "📖",
        gradient: `from-${theme.accent}-600 to-orange-700`,
        hoverGradient: `hover:from-${theme.accent}-700 hover:to-orange-800`,
        tags: ["Reading", "Phonics"],
        suitable: ["Dyslexia", "None", "Other", "Visual"],
        onClick: () => setShowSyllableSplitter(true),
      },
      {
        id: "test",
        name: "Test Games",
        description: "Try experimental learning games",
        icon: "🧪",
        gradient: "from-red-600 to-red-800",
        hoverGradient: "hover:from-red-700 hover:to-red-900",
        tags: ["Testing", "Experimental"],
        suitable: ["None", "Other"],
        onClick: () => navigate("/test-games"),
      },
    ];

    return allGames.filter((game) =>
      game.suitable.includes(user?.disability || "None")
    );
  };

  const availableGames = getAvailableGames();

  return (
    <div
      className={`min-h-full ${theme.background} relative overflow-hidden ${theme.textPrimary} ${theme.fontFamily} ${theme.fontSize}`}
      ref={bubbleContainerRef}
      onClick={handleBgClick}
      style={{ minHeight: "100vh", width: "100vw" }}
    >
      {/* ✅ Enhanced bubbles with accessibility considerations */}
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
            boxShadow: `0 0 ${bub.size / 2}px 4px ${bub.color}`,
            opacity:
              user?.disability === "ADHD"
                ? 0.3
                : user?.disability === "Autism"
                ? 0.4
                : 0.6,
            pointerEvents: "none",
            transition: theme.animations,
            transform: "scale(1.1)",
            zIndex: 10,
          }}
          aria-hidden="true"
        />
      ))}

      {/* ✅ Enhanced Header */}
      <header
        className={`sticky top-0 z-20 ${theme.border} border-b ${theme.headerBg} backdrop-blur-lg ${theme.shadow}`}
      >
        <div className="mx-auto max-w-7xl px-6 sm:px-8 h-20 flex items-center justify-between">
          <div
            className={`text-2xl font-bold ${theme.textPrimary} flex items-center gap-4`}
          >
            <div
              className={`w-12 h-12 bg-gradient-to-r from-${theme.primary}-600 to-${theme.secondary}-600 rounded-2xl flex items-center justify-center ${theme.shadow}`}
            >
              <span className="text-white font-bold text-lg">U</span>
            </div>
            <div>
              <div>UST Learning</div>
              {user.disability && user.disability !== "None" && (
                <span
                  className={`text-sm px-4 py-1 bg-${theme.primary}-100 text-${theme.primary}-700 rounded-full font-medium border ${theme.border}`}
                >
                  ♿ {user.disability} Support
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 bg-gradient-to-r from-${theme.primary}-600 to-${theme.secondary}-600 rounded-2xl flex items-center justify-center text-white font-bold ${theme.shadow} text-xl`}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className={`${theme.textPrimary} font-bold text-lg`}>
                  {user.name}
                </span>
                <span className={`${theme.textMuted} text-sm`}>
                  🏆 {score} points
                </span>
              </div>
            </div>

            <div
              className={`h-8 w-px ${theme.border} bg-current opacity-30`}
            ></div>

            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className={`flex items-center gap-3 ${theme.textMuted} hover:${theme.textPrimary} px-6 py-3 rounded-2xl hover:bg-white/50 ${theme.animations} disabled:opacity-50 disabled:cursor-not-allowed font-medium ${theme.focusRing}`}
            >
              {signingOut ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing out...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>Sign Out</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className={`mx-auto max-w-7xl px-6 sm:px-8 py-10 ${theme.spacing}`}>
        <div className="grid grid-cols-12 gap-10">
          {/* ✅ Enhanced Sidebar */}
          <aside
            className={`col-span-4 rounded-3xl ${theme.border} border ${theme.cardBg} ${theme.shadow} shadow-xl overflow-hidden`}
          >
            <Sidebar
              topics={topics}
              onTopicClick={navigateToGame}
              theme={theme}
            />
          </aside>

          <section className={`col-span-8 ${theme.spacing}`}>
            {/* ✅ Enhanced Dashboard */}
            <div
              className={`${theme.cardBg} rounded-3xl shadow-xl ${theme.border} border overflow-hidden ${theme.shadow}`}
            >
              <Dashboard
                user={user}
                coveredCount={coveredCount}
                runningCount={runningCount}
                progressPercent={progressPercent}
                score={score}
                theme={theme}
              />
            </div>

            {/* ✅ Enhanced Games Section */}
            <div
              className={`${theme.cardBg} rounded-3xl shadow-xl ${theme.border} border ${theme.padding} ${theme.shadow}`}
            >
              <div className="mb-8">
                <h2
                  className={`text-3xl font-bold ${theme.textPrimary} mb-3 flex items-center gap-4`}
                >
                  <span className="text-4xl">🎮</span>
                  <div>
                    <div>Learning Games</div>
                    {user.disability && user.disability !== "None" && (
                      <span
                        className={`text-sm ${theme.textMuted} bg-${theme.primary}-50 px-4 py-2 rounded-full mt-1 inline-block`}
                      >
                        🎯 Curated for {user.disability}
                      </span>
                    )}
                  </div>
                </h2>
                <p className={`${theme.textSecondary} ${theme.fontSize}`}>
                  Interactive games designed to enhance your learning experience
                </p>
              </div>

              <div className={`grid grid-cols-1 md:grid-cols-2 gap-8`}>
                {availableGames.map((game) => (
                  <div
                    key={game.id}
                    className={`bg-gradient-to-br ${game.gradient} ${game.hoverGradient} ${theme.padding} rounded-3xl cursor-pointer ${theme.animations} group shadow-xl hover:shadow-2xl transform hover:scale-105 ${theme.focusRing}`}
                    onClick={game.onClick}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && game.onClick()}
                  >
                    <div className="text-center text-white">
                      <div
                        className={`text-6xl mb-6 group-hover:animate-bounce ${theme.animations}`}
                      >
                        {game.icon}
                      </div>
                      <h3 className="text-2xl font-bold mb-4">{game.name}</h3>
                      <p className="text-white/90 mb-6 leading-relaxed">
                        {game.description}
                      </p>
                      <div className="flex justify-center gap-3 text-sm">
                        {game.tags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-white/25 px-4 py-2 rounded-full backdrop-blur-sm font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ✅ Enhanced Canvas Section */}
            <div
              className={`${theme.cardBg} rounded-3xl shadow-xl ${theme.border} border ${theme.padding} ${theme.shadow}`}
            >
              {!showCanvas ? (
                <div className="flex items-center justify-between gap-8 flex-wrap">
                  <div className="flex-1">
                    <h3
                      className={`text-2xl font-bold ${theme.textPrimary} mb-4 flex items-center gap-4`}
                    >
                      <span className="text-3xl">🎨</span>
                      Creative Drawing Canvas
                    </h3>
                    <p
                      className={`${theme.textSecondary} ${theme.fontSize} leading-relaxed`}
                    >
                      Express your creativity! Draw anything and our AI will
                      create personalized learning games based on your artwork.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCanvas(true)}
                    className={`${theme.button} text-white px-8 py-4 ${theme.fontSize} font-bold rounded-2xl hover:shadow-xl ${theme.animations} flex items-center gap-3 ${theme.focusRing}`}
                  >
                    <span className="text-2xl">🖌️</span>
                    Open Canvas
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3
                      className={`text-2xl font-bold ${theme.textPrimary} flex items-center gap-4`}
                    >
                      <span className="text-3xl">🎨</span>
                      Drawing Canvas
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowCanvas(false)}
                      className={`${theme.textMuted} hover:${theme.textSecondary} px-4 py-2 rounded-xl hover:bg-black/5 ${theme.animations} ${theme.focusRing}`}
                    >
                      Close Canvas
                    </button>
                  </div>
                  <div className="rounded-2xl overflow-hidden shadow-inner bg-white/50">
                    <DrawingCanvas theme={theme} />
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* ✅ Enhanced Game Modals */}
      {showTypeQuest && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-slate-800 rounded-3xl max-w-6xl w-full max-h-[95vh] overflow-hidden shadow-2xl border border-slate-600">
            <div className="flex justify-end p-6">
              <button
                onClick={() => setShowTypeQuest(false)}
                className={`text-gray-400 hover:text-white text-3xl font-bold w-12 h-12 rounded-2xl hover:bg-white/10 ${theme.animations} ${theme.focusRing}`}
              >
                ✕
              </button>
            </div>
            <div className="px-6 pb-6">
              <TypeQuestGame onGameComplete={() => setShowTypeQuest(false)} />
            </div>
          </div>
        </div>
      )}

      {showRhymeRoundup && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[95vh] overflow-auto shadow-2xl border border-gray-200">
            <div className="flex justify-end p-6">
              <button
                onClick={() => setShowRhymeRoundup(false)}
                className={`text-gray-500 hover:text-gray-700 text-3xl font-bold w-12 h-12 rounded-2xl hover:bg-gray-100 ${theme.animations} ${theme.focusRing}`}
              >
                ✕
              </button>
            </div>
            <div className="px-6 pb-6">
              <RhymeRoundupGame />
            </div>
          </div>
        </div>
      )}

      {showSyllableSplitter && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[95vh] overflow-auto shadow-2xl border border-gray-200">
            <div className="flex justify-end p-6">
              <button
                onClick={() => setShowSyllableSplitter(false)}
                className={`text-gray-500 hover:text-gray-700 text-3xl font-bold w-12 h-12 rounded-2xl hover:bg-gray-100 ${theme.animations} ${theme.focusRing}`}
              >
                ✕
              </button>
            </div>
            <div className="px-6 pb-6">
              <SyllableSplitterGame />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { HomePage };
