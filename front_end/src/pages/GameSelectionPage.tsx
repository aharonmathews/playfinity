import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { useScore } from "../contexts/ScoreContext";
import { topics } from "../App";
import TypeQuestGame from "../components/games/TypeQuestGame";
import RhymeRoundupGame from "../components/games/RhymeRoundupGame";
import SyllableSplitterGame from "../components/games/SyllableSplitterGame";
import WordWrestleGame from "../components/games/WordWrestleGame";

interface Game {
  id: string;
  name: string;
  icon: string;
  type: "dynamic" | "static";
  component?: string;
}

// 🎯 Game sequence configuration based on disability
function getGameSequenceForDisability(disability: string) {
  const gameSequences = {
    ADHD: {
      dynamic: [
        {
          id: "gallery",
          name: "Image Gallery Game",
          icon: "🖼️",
          type: "dynamic" as const,
        },
        {
          id: "quiz",
          name: "General Knowledge Game",
          icon: "🧠",
          type: "dynamic" as const,
        },
      ],
      static: [
        {
          id: "typequest",
          name: "TypeQuest",
          icon: "⚔️",
          component: "TypeQuest",
          type: "static" as const,
        },
        {
          id: "wordwrestle",
          name: "Word Wrestle",
          icon: "💪",
          component: "WordWrestle",
          type: "static" as const,
        },
      ],
    },
    Dyslexia: {
      dynamic: [
        {
          id: "spelling",
          name: "Spelling Game",
          icon: "📝",
          type: "dynamic" as const,
        },
        {
          id: "drawing",
          name: "Drawing Game",
          icon: "🎨",
          type: "dynamic" as const,
        },
        {
          id: "gallery",
          name: "Image Gallery Game",
          icon: "🖼️",
          type: "dynamic" as const,
        },
      ],
      static: [
        {
          id: "rhyme",
          name: "Rhyming Words",
          icon: "🎵",
          component: "RhymeRoundup",
          type: "static" as const,
        },
        {
          id: "syllable",
          name: "Syllable Splitter",
          icon: "📖",
          component: "SyllableSplitter",
          type: "static" as const,
        },
      ],
    },
    Visual: {
      dynamic: [
        {
          id: "spelling",
          name: "Spelling Game",
          icon: "📝",
          type: "dynamic" as const,
        },
        {
          id: "drawing",
          name: "Drawing Game",
          icon: "🎨",
          type: "dynamic" as const,
        },
        {
          id: "gallery",
          name: "Image Gallery Game",
          icon: "🖼️",
          type: "dynamic" as const,
        },
        {
          id: "quiz",
          name: "General Knowledge Game",
          icon: "🧠",
          type: "dynamic" as const,
        },
      ],
      static: [
        {
          id: "syllable",
          name: "Syllable Splitter",
          icon: "📖",
          component: "SyllableSplitter",
          type: "static" as const,
        },
      ],
    },
    Autism: {
      dynamic: [
        {
          id: "spelling",
          name: "Spelling Game",
          icon: "📝",
          type: "dynamic" as const,
        },
        {
          id: "drawing",
          name: "Drawing Game",
          icon: "🎨",
          type: "dynamic" as const,
        },
        {
          id: "gallery",
          name: "Image Gallery Game",
          icon: "🖼️",
          type: "dynamic" as const,
        },
        {
          id: "quiz",
          name: "General Knowledge Game",
          icon: "🧠",
          type: "dynamic" as const,
        },
      ],
      static: [
        {
          id: "typequest",
          name: "TypeQuest",
          icon: "⚔️",
          component: "TypeQuest",
          type: "static" as const,
        },
      ],
    },
    None: {
      dynamic: [
        {
          id: "spelling",
          name: "Spelling Game",
          icon: "📝",
          type: "dynamic" as const,
        },
        {
          id: "drawing",
          name: "Drawing Game",
          icon: "🎨",
          type: "dynamic" as const,
        },
        {
          id: "gallery",
          name: "Image Gallery Game",
          icon: "🖼️",
          type: "dynamic" as const,
        },
        {
          id: "quiz",
          name: "General Knowledge Game",
          icon: "🧠",
          type: "dynamic" as const,
        },
      ],
      static: [
        {
          id: "typequest",
          name: "TypeQuest",
          icon: "⚔️",
          component: "TypeQuest",
          type: "static" as const,
        },
        {
          id: "rhyme",
          name: "Rhyming Words",
          icon: "🎵",
          component: "RhymeRoundup",
          type: "static" as const,
        },
        {
          id: "syllable",
          name: "Syllable Splitter",
          icon: "📖",
          component: "SyllableSplitter",
          type: "static" as const,
        },
      ],
    },
    Other: {
      dynamic: [
        {
          id: "spelling",
          name: "Spelling Game",
          icon: "📝",
          type: "dynamic" as const,
        },
        {
          id: "drawing",
          name: "Drawing Game",
          icon: "🎨",
          type: "dynamic" as const,
        },
        {
          id: "gallery",
          name: "Image Gallery Game",
          icon: "🖼️",
          type: "dynamic" as const,
        },
        {
          id: "quiz",
          name: "General Knowledge Game",
          icon: "🧠",
          type: "dynamic" as const,
        },
      ],
      static: [
        {
          id: "typequest",
          name: "TypeQuest",
          icon: "⚔️",
          component: "TypeQuest",
          type: "static" as const,
        },
        {
          id: "rhyme",
          name: "Rhyming Words",
          icon: "🎵",
          component: "RhymeRoundup",
          type: "static" as const,
        },
        {
          id: "syllable",
          name: "Syllable Splitter",
          icon: "📖",
          component: "SyllableSplitter",
          type: "static" as const,
        },
      ],
    },
  };

  return gameSequences[disability] || gameSequences.None;
}

const GameSelectionPage: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const { addPoints } = useScore();

  // Find the topic from your existing topics array
  const topic = topics.find((t) => t.id === topicId) || {
    id: topicId || "",
    name: topicId?.replace("t", "Topic ") || "Learning Topic",
    icon: "📚",
    description: "Learn about this topic",
  };

  const userDisability = user?.disability || "None";
  const gameSequence = getGameSequenceForDisability(userDisability);
  const allGames = [...gameSequence.dynamic, ...gameSequence.static];

  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [completedGames, setCompletedGames] = useState<string[]>([]);
  const [showStaticGame, setShowStaticGame] = useState<string | null>(null);
  const [dynamicGamesCompleted, setDynamicGamesCompleted] = useState(0);

  const currentGame = allGames[currentGameIndex];
  const isLastGame = currentGameIndex >= allGames.length - 1;
  const dynamicGamesCount = gameSequence.dynamic.length;
  const staticGamesCount = gameSequence.static.length;
  const isCurrentGameStatic = currentGame?.type === "static";

  const handleGameComplete = () => {
    setCompletedGames((prev) => [...prev, currentGame.id]);

    // Add points based on game type
    const points = isCurrentGameStatic ? 20 : 15;
    addPoints(points);

    if (isLastGame) {
      // All games completed
      navigate("/", {
        state: {
          message: `🎉 Congratulations! You completed all ${allGames.length} games for ${topic.name}!`,
          completedTopic: topic.name,
        },
      });
    } else {
      // Move to next game
      setCurrentGameIndex((prev) => prev + 1);
      setShowStaticGame(null);
    }
  };

  const handleSkipGame = () => {
    if (isLastGame) {
      navigate("/");
    } else {
      setCurrentGameIndex((prev) => prev + 1);
      setShowStaticGame(null);
    }
  };

  // Update dynamic games completion count
  useEffect(() => {
    const completedDynamicGames = completedGames.filter((gameId) =>
      gameSequence.dynamic.some((game) => game.id === gameId)
    ).length;
    setDynamicGamesCompleted(completedDynamicGames);
  }, [completedGames, gameSequence.dynamic]);

  const getThemeForDisability = (disability: string) => {
    const themes = {
      ADHD: {
        primary: "emerald",
        gradient: "from-emerald-500 to-teal-600",
        text: "text-emerald-900",
        bg: "bg-emerald-50",
      },
      Dyslexia: {
        primary: "blue",
        gradient: "from-blue-500 to-indigo-600",
        text: "text-blue-900",
        bg: "bg-blue-50",
      },
      Visual: {
        primary: "yellow",
        gradient: "from-yellow-500 to-orange-600",
        text: "text-yellow-900",
        bg: "bg-yellow-50",
      },
      Autism: {
        primary: "slate",
        gradient: "from-slate-500 to-gray-600",
        text: "text-slate-900",
        bg: "bg-slate-50",
      },
      None: {
        primary: "indigo",
        gradient: "from-indigo-500 to-purple-600",
        text: "text-indigo-900",
        bg: "bg-indigo-50",
      },
      Other: {
        primary: "violet",
        gradient: "from-violet-500 to-purple-600",
        text: "text-violet-900",
        bg: "bg-violet-50",
      },
    };

    return themes[disability] || themes.None;
  };

  const theme = getThemeForDisability(userDisability);

  const renderStaticGame = () => {
    if (!showStaticGame) return null;

    switch (showStaticGame) {
      case "TypeQuest":
        return <TypeQuestGame onGameComplete={handleGameComplete} />;
      case "RhymeRoundup":
        return <RhymeRoundupGame onGameComplete={handleGameComplete} />;
      case "SyllableSplitter":
        return <SyllableSplitterGame onGameComplete={handleGameComplete} />;
      case "WordWrestle":
        return <WordWrestleGame onGameComplete={handleGameComplete} />;
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen ${theme.bg} py-8`}>
      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 mb-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Home
          </button>

          <div className="text-center">
            <h1
              className={`text-3xl font-bold ${theme.text} flex items-center justify-center gap-2`}
            >
              <span className="text-4xl">{topic.icon}</span>
              {topic.name} Learning Journey
            </h1>
            <p className="text-gray-600 mt-2">
              {userDisability !== "None" &&
                `♿ Optimized for ${userDisability}`}
            </p>
          </div>

          <div className="text-right">
            <div className={`text-sm ${theme.text} font-semibold`}>
              Game {currentGameIndex + 1} of {allGames.length}
            </div>
            <div className="text-xs text-gray-500">
              {completedGames.length} completed
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="max-w-6xl mx-auto px-6 mb-8">
        <div className="bg-white rounded-full h-4 shadow-inner">
          <div
            className={`bg-gradient-to-r ${theme.gradient} h-4 rounded-full transition-all duration-500 ease-out`}
            style={{
              width: `${(completedGames.length / allGames.length) * 100}%`,
            }}
          ></div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>
            Dynamic Games ({dynamicGamesCount}) - {dynamicGamesCompleted}{" "}
            completed
          </span>
          <span>
            Static Games ({staticGamesCount}) -{" "}
            {Math.max(0, completedGames.length - dynamicGamesCompleted)}{" "}
            completed
          </span>
        </div>
      </div>

      {/* Current Game Section */}
      <div className="max-w-6xl mx-auto px-6">
        {showStaticGame ? (
          // Static Game Display
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div
              className={`bg-gradient-to-r ${theme.gradient} text-white p-6`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{currentGame.icon}</span>
                  <div>
                    <h2 className="text-2xl font-bold">{currentGame.name}</h2>
                    <p className="text-white/80">
                      Static Game - Interactive Challenge
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowStaticGame(null)}
                  className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                >
                  ← Back
                </button>
              </div>
            </div>
            <div className="p-6">{renderStaticGame()}</div>
          </div>
        ) : (
          // Game Overview Display
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div
              className={`bg-gradient-to-r ${theme.gradient} text-white p-6`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{currentGame.icon}</span>
                  <div>
                    <h2 className="text-2xl font-bold">{currentGame.name}</h2>
                    <p className="text-white/80">
                      {isCurrentGameStatic
                        ? "Static Game - Pre-built Challenge"
                        : `Dynamic Game - Topic: ${topic.name}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSkipGame}
                  className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                >
                  Skip Game
                </button>
              </div>
            </div>

            <div className="p-8 text-center">
              <div className="text-6xl mb-6">{currentGame.icon}</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                {currentGame.name}
              </h3>

              {/* Game Phase Indicator */}
              <div className="mb-6">
                {currentGameIndex < dynamicGamesCount ? (
                  <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full inline-block">
                    🎨 Dynamic Game Phase ({dynamicGamesCompleted + 1}/
                    {dynamicGamesCount})
                  </div>
                ) : (
                  <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full inline-block">
                    🎮 Static Game Phase (
                    {completedGames.length - dynamicGamesCompleted + 1}/
                    {staticGamesCount})
                  </div>
                )}
              </div>

              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                {isCurrentGameStatic ? (
                  <>
                    This is a pre-built interactive challenge designed
                    specifically for your {userDisability} learning profile.
                    Static games provide focused skill practice after dynamic
                    learning.
                  </>
                ) : (
                  <>
                    This dynamic game will be personalized based on the{" "}
                    <strong>{topic.name}</strong> topic. The game adapts to your{" "}
                    {userDisability} learning needs and will be generated just
                    for you!
                  </>
                )}
              </p>

              <div className="flex gap-4 justify-center">
                {isCurrentGameStatic ? (
                  <button
                    onClick={() => setShowStaticGame(currentGame.component!)}
                    className={`px-8 py-4 bg-gradient-to-r ${theme.gradient} text-white rounded-xl font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all`}
                  >
                    🎮 Play {currentGame.name}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      navigate(`/dynamic-game/${currentGame.id}`, {
                        state: {
                          topic,
                          gameType: currentGame.id,
                          onComplete: handleGameComplete,
                        },
                      });
                    }}
                    className={`px-8 py-4 bg-gradient-to-r ${theme.gradient} text-white rounded-xl font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all`}
                  >
                    🚀 Generate {currentGame.name}
                  </button>
                )}

                <button
                  onClick={handleSkipGame}
                  className="px-8 py-4 bg-gray-200 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-300 transition-colors"
                >
                  ⏭️ Skip This Game
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Game Sequence Overview */}
      <div className="max-w-6xl mx-auto px-6 mt-8">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            🎮 Your Learning Sequence ({userDisability} Optimized)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {allGames.map((game, index) => (
              <div
                key={game.id}
                className={`p-3 rounded-lg text-center transition-all ${
                  index === currentGameIndex
                    ? `bg-gradient-to-r ${theme.gradient} text-white transform scale-105 shadow-lg`
                    : completedGames.includes(game.id)
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <div className="text-2xl mb-1">{game.icon}</div>
                <div className="text-xs font-medium">{game.name}</div>
                <div className="text-xs opacity-75">
                  {game.type === "static" ? "Static" : "Dynamic"}
                </div>
                {index === currentGameIndex && (
                  <div className="text-xs font-bold">← Current</div>
                )}
                {completedGames.includes(game.id) && (
                  <div className="text-xs">✓ Done</div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-center">
              <p className="mb-2">
                <strong className="text-green-600">
                  🎯 Phase 1 - Dynamic Games ({dynamicGamesCount}):
                </strong>
                AI-generated and personalized for <strong>{topic.name}</strong>
              </p>
              <p>
                <strong className="text-purple-600">
                  🎮 Phase 2 - Static Games ({staticGamesCount}):
                </strong>
                Pre-built challenges optimized for{" "}
                <strong>{userDisability}</strong> learning
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameSelectionPage;
