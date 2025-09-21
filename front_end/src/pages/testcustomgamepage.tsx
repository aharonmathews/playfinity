import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { SpellingGame } from "../components/games/SpellingGame";
import { DrawingGame } from "../components/games/DrawingGame";
import { ImageGalleryGame } from "../components/games/ImageGalleryGame";
import { GeneralKnowledgeGame } from "../components/games/GeneralKnowledgeGame";
import { useScore } from "../contexts/ScoreContext";
import { celebrate } from "../App";

// ✅ Hardcoded test data - no API calls needed!
const TEST_GAME_DATA = {
  game1: {
    word: "HEART",
  },
  game2: {
    prompts: [
      "Draw the letter H",
      "Draw the letter E",
      "Draw the letter A",
      "Draw the letter R",
      "Draw the letter T",
    ],
  },
  game3: {
    questions: [
      {
        question: "What is the main function of the heart?",
        options: [
          "To breathe",
          "To pump blood",
          "To digest food",
          "To filter waste",
        ],
        correct_answer: "To pump blood",
      },
      {
        question: "How many chambers does the heart have?",
        options: ["2", "4", "6", "8"],
        correct_answer: "4",
      },
      {
        question: "What carries blood away from the heart?",
        options: ["Veins", "Arteries", "Capillaries", "Nerves"],
        correct_answer: "Arteries",
      },
    ],
  },
  game4: {
    calculation:
      "If a heart beats 80 times per minute, how many times in 5 minutes? 80 × 5 = 400 beats!",
  },
};

function TestCustomGamePage() {
  const navigate = useNavigate();
  const { addPoints } = useScore();

  const [gamePhase, setGamePhase] = useState<
    "spelling" | "drawing" | "gallery" | "gk" | "completed"
  >("spelling");

  // ✅ Use hardcoded test data
  const topic = "heart";
  const gameData = TEST_GAME_DATA;

  useEffect(() => {
    if (gamePhase !== "spelling") celebrate();
  }, [gamePhase]);

  const handleSpellingComplete = () => {
    addPoints(10);
    setGamePhase("drawing");
  };

  const handleDrawingComplete = () => {
    addPoints(15);
    setGamePhase("gallery");
  };

  const handleGalleryComplete = () => {
    addPoints(5);
    setGamePhase("gk");
  };

  const handleGKComplete = () => {
    addPoints(20);
    setGamePhase("completed");
  };

  const getCurrentGameTitle = () => {
    switch (gamePhase) {
      case "spelling":
        return "Spelling Game";
      case "drawing":
        return "Drawing Game";
      case "gallery":
        return "Image Gallery";
      case "gk":
        return "Quiz Time";
      case "completed":
        return "All Games Completed!";
      default:
        return "Loading...";
    }
  };

  const getCurrentGameDescription = () => {
    switch (gamePhase) {
      case "spelling":
        return `Spell the word related to "${topic}"`;
      case "drawing":
        return `Draw each letter of the word`;
      case "gallery":
        return `Explore images related to "${topic}"`;
      case "gk":
        return `Answer questions about "${topic}"`;
      case "completed":
        return `Congratulations! You mastered "${topic}"!`;
      default:
        return "";
    }
  };

  return (
    <div className="min-h-full bg-[#f8fafc] text-gray-900">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-[#f1f5f9]/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="font-semibold text-gray-900">
            UST Learning - Test Mode
          </div>
          <button
            onClick={() => navigate("/")}
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
              {topic.charAt(0).toUpperCase() + topic.slice(1)} –{" "}
              {getCurrentGameTitle()}
            </h1>
            <div className="flex items-center gap-3 text-sm text-gray-500 mt-2">
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                🧪 Test Mode - No API Calls
              </span>
              <span>{getCurrentGameDescription()}</span>
            </div>

            {/* Game Progress Indicator */}
            <div className="flex items-center gap-2 mt-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  gamePhase === "spelling" ? "bg-blue-500" : "bg-green-500"
                }`}
              ></div>
              <span className="text-xs">Spelling</span>

              <div
                className={`w-3 h-3 rounded-full ${
                  gamePhase === "drawing"
                    ? "bg-blue-500"
                    : ["gallery", "gk", "completed"].includes(gamePhase)
                    ? "bg-green-500"
                    : "bg-gray-300"
                }`}
              ></div>
              <span className="text-xs">Drawing</span>

              <div
                className={`w-3 h-3 rounded-full ${
                  gamePhase === "gallery"
                    ? "bg-blue-500"
                    : ["gk", "completed"].includes(gamePhase)
                    ? "bg-green-500"
                    : "bg-gray-300"
                }`}
              ></div>
              <span className="text-xs">Gallery</span>

              <div
                className={`w-3 h-3 rounded-full ${
                  gamePhase === "gk"
                    ? "bg-blue-500"
                    : gamePhase === "completed"
                    ? "bg-green-500"
                    : "bg-gray-300"
                }`}
              ></div>
              <span className="text-xs">Quiz</span>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-6 bg-[#f1f5f9] shadow-2xl">
            {/* Spelling Game */}
            {gamePhase === "spelling" && (
              <SpellingGame
                topic={topic}
                word={gameData.game1.word}
                onGameComplete={handleSpellingComplete}
              />
            )}

            {/* Drawing Game */}
            {gamePhase === "drawing" && (
              <DrawingGame
                topic={topic}
                word={gameData.game1.word}
                onGameComplete={handleDrawingComplete}
              />
            )}

            {/* Gallery Game */}
            {gamePhase === "gallery" && (
              <ImageGalleryGame
                topic={topic}
                onGameComplete={handleGalleryComplete}
              />
            )}

            {/* Quiz Game */}
            {gamePhase === "gk" && (
              <GeneralKnowledgeGame
                topic={topic}
                questions={gameData.game3.questions}
                onGameComplete={handleGKComplete}
              />
            )}

            {/* Completion Screen */}
            {gamePhase === "completed" && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold mb-2 text-gray-900">
                  Amazing Work!
                </h2>
                <p className="text-gray-500 mb-6">
                  You completed all test games for "{topic}"!
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6 max-w-md mx-auto">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">🔤</div>
                    <div className="text-sm text-gray-600">Spelling</div>
                    <div className="text-lg font-semibold">+10 pts</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">🎨</div>
                    <div className="text-sm text-gray-600">Drawing</div>
                    <div className="text-lg font-semibold">+15 pts</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">🖼️</div>
                    <div className="text-sm text-gray-600">Gallery</div>
                    <div className="text-lg font-semibold">+5 pts</div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">🧠</div>
                    <div className="text-sm text-gray-600">Quiz</div>
                    <div className="text-lg font-semibold">+20 pts</div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <h3 className="font-semibold mb-2">🧮 Math Connection:</h3>
                  <p className="text-sm text-gray-600">
                    {gameData.game4.calculation}
                  </p>
                </div>

                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => navigate("/")}
                    className="rounded-md bg-indigo-600 text-white px-6 py-2 hover:bg-indigo-700"
                  >
                    Back to Home
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="rounded-md bg-gray-200 text-gray-900 px-6 py-2 hover:bg-gray-300"
                  >
                    Test Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export { TestCustomGamePage };
