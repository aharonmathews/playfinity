import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

interface LocationState {
  topic: any;
  gameType: string;
  onComplete: () => void;
}

const DynamicGamePage: React.FC = () => {
  const { gameType } = useParams<{ gameType: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();

  const state = location.state as LocationState;
  const { topic } = state || {};

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getTheme = () => {
    const themes = {
      ADHD: {
        gradient: "from-emerald-500 to-teal-600",
        text: "text-emerald-900",
        bg: "bg-emerald-50",
      },
      Dyslexia: {
        gradient: "from-blue-500 to-indigo-600",
        text: "text-blue-900",
        bg: "bg-blue-50",
      },
      Visual: {
        gradient: "from-yellow-500 to-orange-600",
        text: "text-yellow-900",
        bg: "bg-yellow-50",
      },
      Autism: {
        gradient: "from-slate-500 to-gray-600",
        text: "text-slate-900",
        bg: "bg-slate-50",
      },
      None: {
        gradient: "from-indigo-500 to-purple-600",
        text: "text-indigo-900",
        bg: "bg-indigo-50",
      },
      Other: {
        gradient: "from-violet-500 to-purple-600",
        text: "text-violet-900",
        bg: "bg-violet-50",
      },
    };

    return themes[user?.disability || "None"] || themes.None;
  };

  const theme = getTheme();

  useEffect(() => {
    if (!state || !topic || !gameType) {
      navigate("/");
      return;
    }

    const generateDynamicGame = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Navigate to your existing CustomGamePage with mock data
        navigate("/custom-game", {
          state: {
            topic: topic.name,
            gameData: generateMockGameData(gameType, topic),
            source: "dynamic",
            userDisability: user?.disability || "None",
            fromGameSequence: true,
            // Pass the callback to return to game sequence
            onSequenceComplete: () => {
              navigate(`/game/${topic.id}`, {
                state: {
                  completedGame: gameType,
                  topic: topic,
                },
              });
            },
          },
        });
      } catch (err) {
        console.error("Failed to generate dynamic game:", err);
        setError("Failed to generate the game. Please try again.");
      }
    };

    generateDynamicGame();
  }, [gameType, topic, navigate, user]);

  const generateMockGameData = (gameType: string, topic: any) => {
    const baseGameData = {
      spelling: {
        word: topic.name.toUpperCase().slice(0, 8),
        instructions: `Spell words related to ${topic.name}`,
      },
      drawing: {
        word: topic.name.toUpperCase().slice(0, 8),
        instructions: `Draw letters for ${topic.name}`,
      },
      gallery: {
        images: [
          `https://via.placeholder.com/400x300/FFB6C1/000000?text=${topic.name}+1`,
          `https://via.placeholder.com/400x300/98FB98/000000?text=${topic.name}+2`,
          `https://via.placeholder.com/400x300/87CEEB/000000?text=${topic.name}+3`,
          `https://via.placeholder.com/400x300/DDA0DD/000000?text=${topic.name}+4`,
        ],
        instructions: `Explore ${topic.name} images and arrange them in order`,
      },
      quiz: {
        questions: [
          {
            question: `What is the main characteristic of ${topic.name}?`,
            options: ["Feature A", "Feature B", "Feature C", "Feature D"],
            correct_answer: "Feature A",
          },
          {
            question: `Where can you typically find ${topic.name}?`,
            options: ["Place A", "Place B", "Place C", "Everywhere"],
            correct_answer: "Everywhere",
          },
        ],
        instructions: `Test your knowledge about ${topic.name}`,
      },
    };

    // Return data structure expected by CustomGamePage
    return {
      [gameType]: baseGameData[gameType] || baseGameData.quiz,
      // Include other game types for compatibility
      ...baseGameData,
    };
  };

  if (error) {
    return (
      <div
        className={`min-h-screen ${theme.bg} flex items-center justify-center py-12 px-4`}
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className={`text-2xl font-bold ${theme.text} mb-4`}>
            Generation Failed
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate(`/game/${topic?.id}`)}
              className={`px-6 py-3 bg-gradient-to-r ${theme.gradient} text-white rounded-lg font-semibold transition-colors`}
            >
              ← Back to Game Sequence
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
            >
              🔄 Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${theme.bg} flex items-center justify-center py-12 px-4`}
    >
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center">
        <div className="mb-8">
          <div
            className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r ${theme.gradient} rounded-full mb-4`}
          >
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-white border-t-transparent"></div>
          </div>

          <h2 className={`text-3xl font-bold ${theme.text} mb-4`}>
            🎮 Generating Dynamic Game
          </h2>

          <div className="space-y-3 text-left max-w-md mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-600">
                Analyzing topic: <strong>{topic?.name}</strong>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-gray-600">
                Creating <strong>{gameType}</strong> game
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-gray-600">
                Optimizing for <strong>{user?.disability || "General"}</strong>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="text-gray-600">
                Preparing interactive content...
              </span>
            </div>
          </div>
        </div>

        <div
          className={`bg-gradient-to-r ${theme.gradient} bg-opacity-10 rounded-lg p-4 mb-6`}
        >
          <p className="text-sm text-gray-600">
            🤖 <strong>AI Magic in Progress:</strong> Creating a personalized{" "}
            {gameType} game about {topic?.name} optimized for your learning
            style!
          </p>
        </div>

        <button
          onClick={() => navigate(`/game/${topic?.id}`)}
          className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
        >
          ← Cancel and go back
        </button>
      </div>
    </div>
  );
};

export default DynamicGamePage;
