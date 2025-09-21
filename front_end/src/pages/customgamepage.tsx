import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { SpellingGame } from "../components/games/SpellingGame";
import { DrawingGame } from "../components/games/DrawingGame";
import { ImageGalleryGame } from "../components/games/ImageGalleryGame";
import { GeneralKnowledgeGame } from "../components/games/GeneralKnowledgeGame";
import { useScore } from "../contexts/ScoreContext";
import { celebrate } from "../App";

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

interface ImageData {
  success: boolean;
  images?: Array<{
    image_base64: string;
    prompt: string;
    index: number;
    filename?: string;
    enhanced_prompt?: string;
  }>;
  error?: string;
}

function CustomGamePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addPoints } = useScore();

  const [gamePhase, setGamePhase] = useState<
    "spelling" | "drawing" | "gallery" | "gk" | "completed"
  >("spelling");

  // ✅ Extract ALL data from navigation state
  const locationState = location.state || {};
  const {
    topic,
    gameData,
    images,
  }: {
    topic: string;
    gameData: GameData | string;
    images: ImageData | null;
  } = locationState;

  // ✅ Debug log to see what we received
  console.log("🎮 CustomGamePage received:", {
    topic,
    gameData: typeof gameData,
    images: images
      ? `${images.success ? "success" : "failed"} with ${
          images.images?.length || 0
        } images`
      : "null",
  });

  // ✅ Parse gameData if it's a string (from Llama API)
  let parsedGameData: GameData | null = null;

  if (typeof gameData === "string") {
    console.log("🔧 gameData is string, attempting to parse...");
    try {
      const jsonMatch = gameData.match(/```(?:json)?\s*(\{.*\})\s*```/s);
      if (jsonMatch) {
        parsedGameData = JSON.parse(jsonMatch[1]);
      } else {
        const directMatch = gameData.match(/(\{.*\})/s);
        if (directMatch) {
          parsedGameData = JSON.parse(directMatch[1]);
        }
      }
    } catch (error) {
      console.error("❌ Failed to parse gameData:", error);
      // Create fallback data
      parsedGameData = {
        game1: { word: topic?.toUpperCase().slice(0, 8) || "HEART" },
        game2: { prompts: [`Draw something related to ${topic || "heart"}`] },
        game3: {
          questions: [
            {
              question: `What is ${topic || "heart"}?`,
              options: ["A", "B", "C", "D"],
              correct_answer: "A",
            },
          ],
        },
        game4: { calculation: "Simple math: 1 + 1 = 2" },
      };
    }
  } else if (typeof gameData === "object") {
    parsedGameData = gameData;
  }

  const finalGameData = parsedGameData;

  // Redirect if no data
  useEffect(() => {
    if (!topic || !finalGameData) {
      console.log("⚠️ Missing data, redirecting to home");
      navigate("/");
    }
  }, [topic, finalGameData, navigate]);

  if (!topic || !finalGameData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9] text-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No game data found</h1>
          <p className="text-gray-600 mb-4">
            Please draw something first to generate custom games.
          </p>
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
            UST Learning - Custom Topic
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
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                🎨 AI Generated Topic
              </span>
              <span>{getCurrentGameDescription()}</span>

              {/* ✅ Show image generation status */}
              {images?.success && (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                  🖼️ {images.images?.length || 0} AI Images
                </span>
              )}
            </div>

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
            {gamePhase === "spelling" && finalGameData?.game1 && (
              <SpellingGame
                topic={topic}
                word={finalGameData.game1.word}
                onGameComplete={handleSpellingComplete}
              />
            )}

            {gamePhase === "drawing" && (
              <DrawingGame
                topic={topic}
                word={finalGameData?.game1?.word}
                prompts={finalGameData?.game2?.prompts}
                onGameComplete={handleDrawingComplete}
              />
            )}

            {gamePhase === "gallery" && (
              <ImageGalleryGame
                topic={topic}
                images={images?.success ? images.images : null} // ✅ Pass the generated images!
                onGameComplete={handleGalleryComplete}
              />
            )}

            {gamePhase === "gk" && finalGameData?.game3 && (
              <GeneralKnowledgeGame
                topic={topic}
                questions={finalGameData.game3.questions}
                onGameComplete={handleGKComplete}
              />
            )}

            {gamePhase === "completed" && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold mb-2 text-gray-900">
                  Amazing Work!
                </h2>
                <p className="text-gray-500 mb-6">
                  You completed all games for the topic "{topic}" that you drew!
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

                {finalGameData?.game4 && (
                  <div className="bg-blue-50 p-4 rounded-lg mb-6">
                    <h3 className="font-semibold mb-2">🧮 Math Connection:</h3>
                    <p className="text-sm text-gray-600">
                      {finalGameData.game4.calculation}
                    </p>
                  </div>
                )}

                {/* ✅ Show image generation summary */}
                {images?.success &&
                  images.images &&
                  images.images.length > 0 && (
                    <div className="bg-green-50 p-4 rounded-lg mb-6">
                      <h3 className="font-semibold mb-2">
                        🎨 AI Generated Images:
                      </h3>
                      <div className="flex flex-wrap justify-center gap-2">
                        {images.images.slice(0, 4).map((img, idx) => (
                          <img
                            key={idx}
                            src={img.image_base64}
                            alt={img.prompt}
                            className="w-16 h-16 object-cover rounded border"
                            title={img.prompt}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        Generated {images.images.length} unique images for this
                        topic!
                      </p>
                    </div>
                  )}

                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => navigate("/")}
                    className="rounded-md bg-indigo-600 text-white px-6 py-2 hover:bg-indigo-700"
                  >
                    Draw Something New
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

export { CustomGamePage };
