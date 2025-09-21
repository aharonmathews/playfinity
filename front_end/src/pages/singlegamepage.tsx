import { SpellingGame } from "../components/games/SpellingGame";
import { DrawingGame } from "../components/games/DrawingGame";
import { ImageGalleryGame } from "../components/games/ImageGalleryGame";
import { GeneralKnowledgeGame } from "../components/games/GeneralKnowledgeGame";
import { useMemo, useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { topics, addToUserScore, celebrate } from "../App";
import { useUser } from "../contexts/UserContext";

function SingleGamePage({
  gameType,
}: {
  gameType: "spelling" | "drawing" | "gallery" | "gk";
}) {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const currentTopic = topics.find((topic) => topic.id === topicId);
  const [completed, setCompleted] = useState(false);

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

  const getGameInfo = () => {
    const gameInfo = {
      spelling: {
        icon: "🔤",
        title: "Spelling Challenge",
        description: "Master word spelling with interactive exercises",
        color: "blue",
      },
      drawing: {
        icon: "🎨",
        title: "Creative Drawing",
        description: "Express creativity while learning concepts",
        color: "green",
      },
      gallery: {
        icon: "🖼️",
        title: "Image Gallery",
        description: "Explore and discover visual learning materials",
        color: "purple",
      },
      gk: {
        icon: "🧠",
        title: "Knowledge Quiz",
        description: "Test understanding with engaging questions",
        color: "orange",
      },
    };
    return gameInfo[gameType];
  };

  const gameInfo = getGameInfo();

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

  const handleComplete = () => {
    celebrate();
    setCompleted(true);
  };

  const goToGame = (type: "spelling" | "drawing" | "gallery" | "gk") => {
    setCompleted(false);
    navigate(`/game/${topicId}/${type}`);
  };

  const getNavigationOptions = () => {
    const allGames = ["spelling", "drawing", "gallery", "gk"];
    const currentIndex = allGames.indexOf(gameType);

    return {
      previous: currentIndex > 0 ? allGames[currentIndex - 1] : null,
      next:
        currentIndex < allGames.length - 1 ? allGames[currentIndex + 1] : null,
    };
  };

  const navigation = getNavigationOptions();

  if (completed) {
    return (
      <div className={`min-h-screen ${theme.bg} ${theme.textPrimary}`}>
        {/* Header */}
        <header
          className={`${theme.headerBg} backdrop-blur-md border-b ${theme.border} py-4`}
        >
          <div className="mx-auto max-w-4xl px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-3xl">🎓</div>
                <div>
                  <h1 className={`text-xl font-bold ${theme.textPrimary}`}>
                    UST Learning
                  </h1>
                  {user?.disability && (
                    <p className={`text-sm ${theme.textMuted}`}>
                      {user.disability} Profile
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => navigate("/")}
                className={`px-4 py-2 rounded-xl border ${theme.border} ${theme.textSecondary} hover:${theme.textPrimary} hover:bg-white/50 ${theme.animations} ${theme.focusRing}`}
              >
                ← Home
              </button>
            </div>
          </div>
        </header>

        <main className="flex items-center justify-center min-h-[calc(100vh-80px)] p-6">
          <div
            className={`text-center max-w-2xl mx-auto p-12 ${theme.cardBg} rounded-3xl ${theme.shadow} ${theme.border} border`}
          >
            <div className="text-8xl mb-6">🎉</div>

            <h2 className={`text-4xl font-bold mb-4 ${theme.textPrimary}`}>
              {gameInfo.title} Complete!
            </h2>

            <p className={`${theme.textSecondary} mb-8 text-xl`}>
              Excellent work! You've successfully completed the{" "}
              {gameInfo.title.toLowerCase()} for{" "}
              <span className="font-semibold">{currentTopic.title}</span>.
              {user?.disability &&
                ` This experience was optimized for ${user.disability} learning.`}
            </p>

            {/* Achievement Badge */}
            <div
              className={`bg-gradient-to-r from-${theme.primary}-100 to-${theme.secondary}-100 rounded-2xl p-6 mb-8`}
            >
              <div className="text-4xl mb-2">{gameInfo.icon}</div>
              <h3 className={`font-bold text-lg ${theme.textPrimary} mb-2`}>
                Achievement Unlocked!
              </h3>
              <p className={`text-sm ${theme.textSecondary}`}>
                {gameInfo.description}
              </p>
            </div>

            {/* Navigation Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {navigation.previous && (
                <button
                  onClick={() => goToGame(navigation.previous as any)}
                  className={`bg-gray-100 hover:bg-gray-200 ${theme.textPrimary} p-4 rounded-2xl ${theme.animations} ${theme.focusRing} border ${theme.border}`}
                >
                  <div className="text-2xl mb-2">⏮️</div>
                  <div className="font-semibold">Previous Game</div>
                  <div className="text-sm opacity-75 capitalize">
                    {navigation.previous}
                  </div>
                </button>
              )}

              <button
                onClick={() => navigate(`/topics/${topicId}`)}
                className={`${theme.button} text-white p-4 rounded-2xl ${theme.animations} ${theme.focusRing} ${theme.shadow} hover:shadow-lg`}
              >
                <div className="text-2xl mb-2">🏆</div>
                <div className="font-semibold">All Games</div>
                <div className="text-sm opacity-90">Complete Topic</div>
              </button>

              {navigation.next && (
                <button
                  onClick={() => goToGame(navigation.next as any)}
                  className={`bg-gray-100 hover:bg-gray-200 ${theme.textPrimary} p-4 rounded-2xl ${theme.animations} ${theme.focusRing} border ${theme.border}`}
                >
                  <div className="text-2xl mb-2">⏭️</div>
                  <div className="font-semibold">Next Game</div>
                  <div className="text-sm opacity-75 capitalize">
                    {navigation.next}
                  </div>
                </button>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setCompleted(false)}
                className={`bg-white border-2 ${theme.border} ${theme.textPrimary} hover:bg-gray-50 px-6 py-3 rounded-2xl font-semibold ${theme.animations} ${theme.focusRing} flex items-center justify-center gap-2`}
              >
                <span>🔄</span>
                Play Again
              </button>
              <button
                onClick={() => navigate("/")}
                className={`bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-2xl font-semibold ${theme.animations} focus:ring-gray-400 focus:ring-4 focus:outline-none flex items-center justify-center gap-2`}
              >
                <span>🏠</span>
                Back to Home
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.textPrimary}`}>
      {/* Header */}
      <header
        className={`${theme.headerBg} backdrop-blur-md border-b ${theme.border} py-4`}
      >
        <div className="mx-auto max-w-4xl px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-3xl">{currentTopic.icon}</div>
              <div>
                <h1 className={`text-xl font-bold ${theme.textPrimary}`}>
                  {currentTopic.title}
                </h1>
                <p className={`text-sm ${theme.textMuted}`}>
                  {gameInfo.title}
                  {user?.disability && ` • ${user.disability} Profile`}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/")}
              className={`px-4 py-2 rounded-xl border ${theme.border} ${theme.textSecondary} hover:${theme.textPrimary} hover:bg-white/50 ${theme.animations} ${theme.focusRing}`}
            >
              ← Home
            </button>
          </div>
        </div>
      </header>

      {/* Game Header */}
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div
          className={`${theme.cardBg} rounded-3xl p-8 mb-8 ${theme.shadow} ${theme.border} border text-center`}
        >
          <div className="text-6xl mb-4">{gameInfo.icon}</div>
          <h2 className={`text-3xl font-bold ${theme.textPrimary} mb-3`}>
            {gameInfo.title}
          </h2>
          <p
            className={`${theme.textSecondary} ${theme.fontSize} max-w-2xl mx-auto`}
          >
            {gameInfo.description}
          </p>

          {user?.disability && (
            <div className="mt-4">
              <span
                className={`bg-${theme.primary}-100 text-${theme.primary}-800 px-4 py-2 rounded-full text-sm font-medium`}
              >
                👤 Optimized for {user.disability} Learning
              </span>
            </div>
          )}
        </div>

        {/* Game Content */}
        <div
          className={`${theme.cardBg} rounded-3xl overflow-hidden ${theme.shadow} ${theme.border} border`}
        >
          <div className="p-8">
            {gameType === "spelling" && (
              <SpellingGame
                topic={currentTopic.title}
                onGameComplete={handleComplete}
              />
            )}
            {gameType === "drawing" && (
              <DrawingGame
                topic={currentTopic.title}
                onGameComplete={handleComplete}
              />
            )}
            {gameType === "gallery" && (
              <ImageGalleryGame
                topic={currentTopic.title}
                onGameComplete={handleComplete}
              />
            )}
            {gameType === "gk" && (
              <GeneralKnowledgeGame
                topic={currentTopic.title}
                onGameComplete={handleComplete}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export { SingleGamePage };
