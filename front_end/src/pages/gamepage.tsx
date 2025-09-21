import { SpellingGame } from "../components/games/SpellingGame";
import { DrawingGame } from "../components/games/DrawingGame";
import { ImageGalleryGame } from "../components/games/ImageGalleryGame";
import { GeneralKnowledgeGame } from "../components/games/GeneralKnowledgeGame";
import { useMemo, useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { topics, celebrate } from "../App";
import { useScore } from "../contexts/ScoreContext";
import { useUser } from "../contexts/UserContext";

interface GameData {
  game1: { word: string };
  game2: { prompts: string[] };
  game3: {
    questions: Array<{
      question: string;
      options: string[];
      correct_answer: string;
    }>;
  };
  game4: { calculation: string };
}

function GamePage() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const { addPoints } = useScore();
  const { user } = useUser();

  const [gamePhase, setGamePhase] = useState<
    | "loading"
    | "spelling"
    | "drawing"
    | "matching"
    | "gallery"
    | "gk"
    | "completed"
  >("loading");
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentTopic = topics.find((topic) => topic.id === topicId);

  // Theme configuration based on user disability
  const getTheme = () => {
    const baseTheme = {
      animations: "transition-all duration-300",
      focusRing: "focus:ring-4 focus:outline-none",
      shadow: "shadow-xl",
    };

    switch (user?.disability) {
      case "ADHD":
        return {
          ...baseTheme,
          primary: "emerald",
          secondary: "teal",
          accent: "cyan",
          bg: "bg-gradient-to-br from-emerald-50 via-white to-teal-50",
          cardBg: "bg-white/90 backdrop-blur-sm",
          headerBg: "bg-emerald-50/95",
          textPrimary: "text-emerald-900",
          textSecondary: "text-emerald-700",
          textMuted: "text-emerald-600",
          button:
            "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700",
          border: "border-emerald-200",
          fontSize: "text-lg",
          focusRing: "focus:ring-emerald-500 focus:ring-4 focus:outline-none",
        };
      case "Dyslexia":
        return {
          ...baseTheme,
          primary: "blue",
          secondary: "indigo",
          accent: "purple",
          bg: "bg-gradient-to-br from-blue-50 via-white to-indigo-50",
          cardBg: "bg-white/90 backdrop-blur-sm",
          headerBg: "bg-blue-50/95",
          textPrimary: "text-blue-900",
          textSecondary: "text-blue-700",
          textMuted: "text-blue-600",
          button:
            "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
          border: "border-blue-200",
          fontSize: "text-xl",
          focusRing: "focus:ring-blue-500 focus:ring-4 focus:outline-none",
        };
      case "Visual":
        return {
          ...baseTheme,
          primary: "amber",
          secondary: "orange",
          accent: "yellow",
          bg: "bg-gradient-to-br from-amber-50 via-white to-orange-50",
          cardBg: "bg-white/95 backdrop-blur-sm",
          headerBg: "bg-amber-50/95",
          textPrimary: "text-gray-900",
          textSecondary: "text-gray-800",
          textMuted: "text-gray-700",
          button:
            "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700",
          border: "border-amber-300",
          fontSize: "text-2xl",
          focusRing: "focus:ring-amber-500 focus:ring-6 focus:outline-none",
        };
      case "Autism":
        return {
          ...baseTheme,
          primary: "slate",
          secondary: "gray",
          accent: "zinc",
          bg: "bg-gradient-to-br from-slate-50 via-white to-gray-50",
          cardBg: "bg-white/95 backdrop-blur-sm",
          headerBg: "bg-slate-50/95",
          textPrimary: "text-slate-900",
          textSecondary: "text-slate-700",
          textMuted: "text-slate-600",
          button:
            "bg-gradient-to-r from-slate-600 to-gray-600 hover:from-slate-700 hover:to-gray-700",
          border: "border-slate-300",
          fontSize: "text-lg",
          focusRing: "focus:ring-slate-500 focus:ring-4 focus:outline-none",
        };
      default:
        return {
          ...baseTheme,
          primary: "violet",
          secondary: "purple",
          accent: "fuchsia",
          bg: "bg-gradient-to-br from-violet-50 via-white to-purple-50",
          cardBg: "bg-white/90 backdrop-blur-sm",
          headerBg: "bg-violet-50/95",
          textPrimary: "text-violet-900",
          textSecondary: "text-violet-700",
          textMuted: "text-violet-600",
          button:
            "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700",
          border: "border-violet-200",
          fontSize: "text-lg",
          focusRing: "focus:ring-violet-500 focus:ring-4 focus:outline-none",
        };
    }
  };

  const theme = getTheme();

  // Generate games when component mounts
  useEffect(() => {
    if (currentTopic) {
      generateGames(currentTopic.title);
    }
  }, [currentTopic]);

  const generateGames = async (topicTitle: string) => {
    try {
      setError(null);
      const response = await fetch("http://127.0.0.1:8000/generate-games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: topicTitle,
          age_group: "7-11",
          user_disability: user?.disability || "None",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.games) {
        setGameData(data.games);
        setGamePhase("spelling");
      } else {
        throw new Error("Failed to generate games");
      }
    } catch (err) {
      console.error("Error generating games:", err);
      setError(err instanceof Error ? err.message : "Failed to generate games");
    }
  };

  const getGameProgress = () => {
    const phases = ["spelling", "drawing", "matching", "gallery", "gk"];
    const currentIndex = phases.indexOf(gamePhase);

    return phases.map((phase, index) => ({
      phase,
      icon: {
        spelling: "🔤",
        drawing: "🎨",
        matching: "🧩",
        gallery: "🖼️",
        gk: "🧠",
      }[phase],
      name: {
        spelling: "Spelling",
        drawing: "Drawing",
        matching: "Matching",
        gallery: "Gallery",
        gk: "Quiz",
      }[phase],
      status:
        index < currentIndex
          ? "completed"
          : index === currentIndex
          ? "current"
          : "upcoming",
    }));
  };

  if (!currentTopic) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${theme.bg} ${theme.textPrimary}`}
      >
        <div
          className={`text-center max-w-md mx-auto p-8 ${theme.cardBg} rounded-3xl ${theme.shadow} ${theme.border} border`}
        >
          <div className="text-6xl mb-6">❌</div>
          <h1 className={`text-3xl font-bold mb-4 ${theme.textPrimary}`}>
            Topic Not Found
          </h1>
          <p className={`${theme.textSecondary} mb-6 ${theme.fontSize}`}>
            The requested topic could not be found in our learning library.
          </p>
          <button
            onClick={() => navigate("/")}
            className={`${theme.button} text-white px-8 py-4 rounded-2xl font-bold ${theme.animations} ${theme.focusRing} ${theme.shadow} hover:shadow-lg`}
          >
            🏠 Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${theme.bg} ${theme.textPrimary}`}
      >
        <div
          className={`text-center max-w-lg mx-auto p-8 ${theme.cardBg} rounded-3xl ${theme.shadow} ${theme.border} border`}
        >
          <div className="text-6xl mb-6">⚠️</div>
          <h1 className="text-3xl font-bold mb-4 text-red-600">
            Connection Error
          </h1>
          <p className={`${theme.textSecondary} mb-6 ${theme.fontSize}`}>
            {error}
          </p>
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <p className="text-red-800 text-sm">
              <strong>💡 Troubleshooting:</strong> Make sure the backend server
              is running on
              <code className="bg-red-100 px-2 py-1 rounded ml-1">
                http://127.0.0.1:8000
              </code>
            </p>
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => generateGames(currentTopic.title)}
              className={`${theme.button} text-white px-6 py-3 rounded-2xl font-bold ${theme.animations} ${theme.focusRing}`}
            >
              🔄 Retry
            </button>
            <button
              onClick={() => navigate("/")}
              className={`bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-2xl font-bold ${theme.animations} focus:ring-gray-400 focus:ring-4 focus:outline-none`}
            >
              🏠 Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gamePhase === "loading" || !gameData) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${theme.bg} ${theme.textPrimary}`}
      >
        <div
          className={`text-center max-w-lg mx-auto p-12 ${theme.cardBg} rounded-3xl ${theme.shadow} ${theme.border} border`}
        >
          <div className="relative mb-8">
            <div
              className={`w-20 h-20 border-4 border-${theme.primary}-200 border-t-${theme.primary}-600 rounded-full animate-spin mx-auto`}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl">🎮</span>
            </div>
          </div>
          <h1 className={`text-2xl font-bold mb-4 ${theme.textPrimary}`}>
            Creating Your Learning Experience
          </h1>
          <p className={`${theme.textSecondary} mb-6 ${theme.fontSize}`}>
            Generating personalized games for{" "}
            <strong>{currentTopic.title}</strong>
            {user?.disability && ` optimized for ${user.disability} learning`}
          </p>

          <div className="flex justify-center space-x-2 mb-4">
            <div
              className={`w-3 h-3 bg-${theme.primary}-400 rounded-full animate-pulse`}
            ></div>
            <div
              className={`w-3 h-3 bg-${theme.primary}-400 rounded-full animate-pulse`}
              style={{ animationDelay: "0.2s" }}
            ></div>
            <div
              className={`w-3 h-3 bg-${theme.primary}-400 rounded-full animate-pulse`}
              style={{ animationDelay: "0.4s" }}
            ></div>
          </div>

          <p className="text-sm text-gray-500">
            This may take a few moments...
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (gamePhase !== "spelling" && gamePhase !== "loading") celebrate();
  }, [gamePhase]);

  const handleSpellingComplete = () => {
    addPoints(10);
    setGamePhase("drawing");
  };

  const handleDrawingComplete = () => {
    addPoints(15);
    setGamePhase("matching");
  };

  const handleMatchingComplete = () => {
    addPoints(20);
    setGamePhase("gallery");
  };

  const handleGalleryComplete = () => {
    addPoints(5);
    setGamePhase("gk");
  };

  const handleGKComplete = () => {
    addPoints(25);
    setGamePhase("completed");
  };

  const getCurrentGameTitle = () => {
    const titles = {
      spelling: "Spelling Challenge",
      drawing: "Creative Drawing",
      matching: "Pattern Matching",
      gallery: "Image Explorer",
      gk: "Knowledge Quiz",
      completed: "Mission Complete!",
    };
    return titles[gamePhase] || "Learning Game";
  };

  const getCurrentGameDescription = () => {
    const descriptions = {
      spelling: "Master spelling with interactive word challenges",
      drawing: "Express creativity while learning through drawing",
      matching: "Connect concepts through visual pattern matching",
      gallery: "Discover and explore topic-related images",
      gk: "Test knowledge with engaging quiz questions",
      completed: "Celebrate your learning achievements!",
    };
    return descriptions[gamePhase] || "";
  };

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.textPrimary}`}>
      {/* Enhanced Header */}
      <header
        className={`sticky top-0 z-50 ${theme.headerBg} backdrop-blur-md border-b ${theme.border}`}
      >
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-3xl">🎓</div>
              <div>
                <h1 className={`text-xl font-bold ${theme.textPrimary}`}>
                  UST Learning
                </h1>
                {user?.disability && (
                  <p className={`text-sm ${theme.textMuted}`}>
                    {user.disability} Learning Profile
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => navigate("/")}
              className={`px-6 py-2 rounded-xl border ${theme.border} ${theme.textSecondary} hover:${theme.textPrimary} hover:bg-white/50 ${theme.animations} ${theme.focusRing} flex items-center gap-2`}
            >
              <span>←</span>
              Back to Home
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Topic & Progress Section */}
        <div
          className={`${theme.cardBg} rounded-3xl p-8 mb-8 ${theme.shadow} ${theme.border} border`}
        >
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">{currentTopic.icon}</div>
            <h1 className={`text-4xl font-bold ${theme.textPrimary} mb-2`}>
              {currentTopic.title}
            </h1>
            <h2 className={`text-2xl ${theme.textSecondary} mb-4`}>
              {getCurrentGameTitle()}
            </h2>
            <p
              className={`${theme.textMuted} ${theme.fontSize} max-w-2xl mx-auto`}
            >
              {getCurrentGameDescription()}
            </p>
          </div>

          {/* Enhanced Progress Indicator */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-4 bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              {getGameProgress().map((game, index) => (
                <div key={game.phase} className="flex items-center">
                  <div
                    className={`relative flex flex-col items-center ${
                      index === getGameProgress().length - 1 ? "" : "mr-6"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 ${
                        theme.animations
                      } ${
                        game.status === "completed"
                          ? `bg-green-500 border-green-500 text-white`
                          : game.status === "current"
                          ? `bg-${theme.primary}-500 border-${theme.primary}-500 text-white animate-pulse`
                          : `bg-gray-200 border-gray-300 text-gray-500`
                      }`}
                    >
                      {game.status === "completed" ? "✓" : game.icon}
                    </div>
                    <span
                      className={`text-xs mt-2 font-medium ${
                        game.status === "current"
                          ? theme.textPrimary
                          : theme.textMuted
                      }`}
                    >
                      {game.name}
                    </span>
                  </div>
                  {index < getGameProgress().length - 1 && (
                    <div
                      className={`w-8 h-1 rounded-full ${
                        index <
                        getGameProgress().findIndex(
                          (g) => g.status === "current"
                        )
                          ? "bg-green-400"
                          : "bg-gray-300"
                      } mb-8`}
                    ></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Learning Profile Badge */}
          {user?.disability && (
            <div className="flex justify-center">
              <div
                className={`bg-${theme.primary}-100 text-${theme.primary}-800 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2`}
              >
                <span>👤</span>
                Optimized for {user.disability} Learning
              </div>
            </div>
          )}
        </div>

        {/* Game Content */}
        <div
          className={`${theme.cardBg} rounded-3xl overflow-hidden ${theme.shadow} ${theme.border} border`}
        >
          {gamePhase === "spelling" && (
            <div className="p-8">
              <SpellingGame
                topic={currentTopic.title}
                word={gameData.game1.word}
                onGameComplete={handleSpellingComplete}
              />
            </div>
          )}

          {gamePhase === "drawing" && (
            <div className="p-8">
              <DrawingGame
                topic={currentTopic.title}
                prompts={gameData.game2.prompts}
                onGameComplete={handleDrawingComplete}
              />
            </div>
          )}

          {gamePhase === "gallery" && (
            <div className="p-8">
              <ImageGalleryGame
                topic={currentTopic.title}
                onGameComplete={handleGalleryComplete}
              />
            </div>
          )}

          {gamePhase === "gk" && (
            <div className="p-8">
              <GeneralKnowledgeGame
                topic={currentTopic.title}
                questions={gameData.game3.questions}
                onGameComplete={handleGKComplete}
              />
            </div>
          )}

          {gamePhase === "completed" && (
            <div className="text-center py-16 px-8">
              <div className="text-8xl mb-6">🏆</div>
              <h2 className={`text-4xl font-bold mb-4 ${theme.textPrimary}`}>
                Outstanding Achievement!
              </h2>
              <p
                className={`${theme.textSecondary} mb-8 text-xl max-w-2xl mx-auto`}
              >
                You have successfully mastered all learning activities for{" "}
                <strong>{currentTopic.title}</strong>!
                {user?.disability &&
                  ` Your ${user.disability} learning profile helped optimize this experience.`}
              </p>

              {/* Achievement Summary */}
              <div
                className={`bg-gradient-to-r from-${theme.primary}-100 to-${theme.secondary}-100 rounded-2xl p-6 mb-8 max-w-2xl mx-auto`}
              >
                <h3 className={`font-bold text-xl ${theme.textPrimary} mb-4`}>
                  🎯 Learning Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { icon: "🔤", name: "Spelling", points: 10 },
                    { icon: "🎨", name: "Drawing", points: 15 },
                    { icon: "🧩", name: "Matching", points: 20 },
                    { icon: "🖼️", name: "Gallery", points: 5 },
                    { icon: "🧠", name: "Quiz", points: 25 },
                  ].map((game) => (
                    <div
                      key={game.name}
                      className="bg-white/70 rounded-xl p-3 text-center"
                    >
                      <div className="text-2xl mb-1">{game.icon}</div>
                      <div className={`text-sm ${theme.textMuted}`}>
                        {game.name}
                      </div>
                      <div className={`font-bold ${theme.textPrimary}`}>
                        +{game.points} pts
                      </div>
                    </div>
                  ))}
                </div>
                <div className={`bg-${theme.primary}-50 rounded-xl p-4 mt-4`}>
                  <p className={`text-sm ${theme.textSecondary}`}>
                    <strong>Math Connection:</strong>{" "}
                    {gameData.game4.calculation}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate("/")}
                  className={`${theme.button} text-white px-8 py-4 rounded-2xl font-bold ${theme.animations} ${theme.focusRing} ${theme.shadow} hover:shadow-lg flex items-center justify-center gap-2`}
                >
                  <span>🏠</span>
                  Explore More Topics
                </button>
                <button
                  onClick={() => {
                    setGamePhase("loading");
                    generateGames(currentTopic.title);
                  }}
                  className={`bg-white border-2 ${theme.border} ${theme.textPrimary} hover:bg-gray-50 px-8 py-4 rounded-2xl font-bold ${theme.animations} ${theme.focusRing} flex items-center justify-center gap-2`}
                >
                  <span>🔄</span>
                  Play Again
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export { GamePage };
