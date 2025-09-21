import { SpellingGame } from "../components/games/SpellingGame";
import { DrawingGame } from "../components/games/DrawingGame";
import { ImageGalleryGame } from "../components/games/ImageGalleryGame";
import { GeneralKnowledgeGame } from "../components/games/GeneralKnowledgeGame";
import { useMemo, useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { topics, addToUserScore, celebrate } from "../App"; // ✅ Import from App.tsx

function SingleGamePage({
  gameType,
}: {
  gameType: "spelling" | "drawing" | "gallery" | "gk";
}) {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const currentTopic = topics.find((topic) => topic.id === topicId);
  const [completed, setCompleted] = useState(false);
  if (!currentTopic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9] text-gray-900">
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
  const handleComplete = () => setCompleted(true);
  const goToGame = (type: "spelling" | "drawing" | "gallery" | "gk") => {
    setCompleted(false);
    navigate(`/game/${topicId}/${type}`);
  };
  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9] text-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900">
            {gameType === "gk"
              ? "General Knowledge"
              : gameType.charAt(0).toUpperCase() + gameType.slice(1)}{" "}
            Game Completed!
          </h2>
          <p className="text-gray-500 mb-6">
            You have completed the{" "}
            {gameType === "gk" ? "General Knowledge" : gameType} game for{" "}
            {currentTopic.title}.
          </p>
          <div className="flex justify-center gap-4">
            {gameType !== "spelling" && (
              <button
                onClick={() => goToGame("spelling")}
                className="rounded bg-indigo-600 text-white px-4 py-2"
              >
                Previous Game
              </button>
            )}
            {gameType !== "gk" && (
              <button
                onClick={() =>
                  goToGame(
                    gameType === "spelling"
                      ? "drawing"
                      : gameType === "drawing"
                      ? "gallery"
                      : "gk"
                  )
                }
                className="rounded bg-indigo-600 text-white px-4 py-2"
              >
                Next Game
              </button>
            )}
            <button
              onClick={() => navigate("/")}
              className="rounded bg-gray-200 text-gray-900 px-4 py-2"
            >
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-full flex items-center justify-center bg-[#f1f5f9] text-gray-900">
      <div className="w-full max-w-xl">
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
  );
}

export { SingleGamePage };
