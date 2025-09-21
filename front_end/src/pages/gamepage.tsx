import { SpellingGame } from "../components/games/SpellingGame";
import { DrawingGame } from "../components/games/DrawingGame";
import { ImageGalleryGame } from "../components/games/ImageGalleryGame";
import { GeneralKnowledgeGame } from "../components/games/GeneralKnowledgeGame";
import { useMemo, useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { topics, celebrate } from "../App";
import { useScore } from "../contexts/ScoreContext";

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

  if (!currentTopic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Topic not found</h1>
          <button
            onClick={() => navigate("/")}
            className="rounded-md bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-500"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9] text-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
          <p className="mb-4">{error}</p>
          <button
            onClick={() => generateGames(currentTopic.title)}
            className="rounded-md bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-500 mr-2"
          >
            Retry
          </button>
          <button
            onClick={() => navigate("/")}
            className="rounded-md bg-gray-300 text-gray-900 px-4 py-2 hover:bg-gray-400"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (gamePhase === "loading" || !gameData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9] text-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold">
            Generating games for {currentTopic.title}...
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            This may take a few moments
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
    setGamePhase("completed");
  };

  return (
    <div className="min-h-full bg-[#f8fafc] text-gray-900">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-[#f1f5f9]/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="font-semibold text-gray-900">UST Learning</div>
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
              {currentTopic.title} –{" "}
              {gamePhase === "spelling"
                ? "Spelling Game"
                : gamePhase === "drawing"
                ? "Drawing Game"
                : gamePhase === "matching"
                ? "Matching Game"
                : gamePhase === "gallery"
                ? "Image Gallery"
                : gamePhase === "gk"
                ? "Quiz Time"
                : "All Games Completed!"}
            </h1>
            <p className="text-sm text-gray-500">
              {gamePhase === "spelling" &&
                "Practice spelling with generated words"}
              {gamePhase === "drawing" && "Draw each step of the process"}
              {gamePhase === "matching" &&
                "Match the word to the correct image"}
              {gamePhase === "gallery" && "Explore images related to the topic"}
              {gamePhase === "gk" && "Answer quiz questions about the topic"}
              {gamePhase === "completed" &&
                "Congratulations! You completed all games!"}
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 p-6 bg-[#f1f5f9] shadow-2xl">
            {gamePhase === "spelling" && (
              <SpellingGame
                topic={currentTopic.title}
                word={gameData.game1.word}
                onGameComplete={handleSpellingComplete}
              />
            )}
            {gamePhase === "drawing" && (
              <DrawingGame
                topic={currentTopic.title}
                prompts={gameData.game2.prompts}
                onGameComplete={handleDrawingComplete}
              />
            )}
            {gamePhase === "gallery" && (
              <ImageGalleryGame
                topic={currentTopic.title}
                onGameComplete={handleGalleryComplete}
              />
            )}
            {gamePhase === "gk" && (
              <GeneralKnowledgeGame
                topic={currentTopic.title}
                questions={gameData.game3.questions}
                onGameComplete={handleGKComplete}
              />
            )}
            {gamePhase === "completed" && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold mb-2 text-gray-900">
                  Congratulations!
                </h2>
                <p className="text-gray-500 mb-6">
                  You have successfully completed all games for{" "}
                  {currentTopic.title}!
                </p>
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <h3 className="font-semibold mb-2">What you learned:</h3>
                  <p className="text-sm text-gray-600">
                    Math Connection: {gameData.game4.calculation}
                  </p>
                </div>
                <button
                  onClick={() => navigate("/")}
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
  );
}

export { GamePage };
