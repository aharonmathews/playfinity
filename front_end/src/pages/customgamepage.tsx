import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { SpellingGame } from "../components/games/SpellingGame";
import { DrawingGame } from "../components/games/DrawingGame";
import { ImageGalleryGame } from "../components/games/ImageGalleryGame";
import { GeneralKnowledgeGame } from "../components/games/GeneralKnowledgeGame";
import { useScore } from "../contexts/ScoreContext";
import { celebrate } from "../App";

// ✅ Updated interfaces for new structure
interface NewGameData {
  spelling: { word: string; instructions: string };
  drawing: { word: string; instructions: string };
  gallery: {
    images?: Array<{
      url: string;
      prompt: string;
      index: number;
      filename?: string;
    }>;
    instructions: string;
  };
  quiz: {
    questions: Array<{
      question: string;
      options: string[];
      correct_answer: string;
    }>;
    instructions: string;
  };
}

// ✅ Old structure for backward compatibility
interface OldGameData {
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
    source,
  }: {
    topic: string;
    gameData: NewGameData | OldGameData | string;
    images: ImageData | Array<any> | null;
    source?: string;
  } = locationState;

  // ✅ Debug log to see what we received
  console.log("🎮 CustomGamePage received:", {
    topic,
    gameData: typeof gameData,
    images: Array.isArray(images)
      ? `Array with ${images.length} items`
      : images?.success
      ? `Success with ${images.images?.length || 0} images`
      : "null",
    source,
  });

  // ✅ Normalize game data to new structure
  const normalizeGameData = (data: any): NewGameData | null => {
    if (!data) return null;

    // If it's already new structure
    if (data.spelling && data.drawing && data.gallery && data.quiz) {
      return data as NewGameData;
    }

    // If it's old structure, convert it
    if (data.game1 || data.game2 || data.game3 || data.game4) {
      const oldData = data as OldGameData;
      return {
        spelling: {
          word: oldData.game1?.word || topic.toUpperCase().slice(0, 8),
          instructions: `Spell the word related to ${topic}`,
        },
        drawing: {
          word: oldData.game1?.word || topic.toUpperCase().slice(0, 8),
          instructions: `Draw each letter of the word`,
        },
        gallery: {
          images: [], // Will be filled from images prop
          instructions: `Explore images related to ${topic}`,
        },
        quiz: {
          questions: oldData.game3?.questions || [
            {
              question: `What is ${topic}?`,
              options: ["A", "B", "C", "D"],
              correct_answer: "A",
            },
          ],
          instructions: `Answer questions about ${topic}`,
        },
      };
    }

    return null;
  };

  // ✅ Parse gameData if it's a string
  let parsedGameData: NewGameData | null = null;

  if (typeof gameData === "string") {
    console.log("🔧 gameData is string, attempting to parse...");
    try {
      const jsonMatch = gameData.match(/```(?:json)?\s*(\{.*\})\s*```/s);
      if (jsonMatch) {
        parsedGameData = normalizeGameData(JSON.parse(jsonMatch[1]));
      } else {
        const directMatch = gameData.match(/(\{.*\})/s);
        if (directMatch) {
          parsedGameData = normalizeGameData(JSON.parse(directMatch[1]));
        }
      }
    } catch (error) {
      console.error("❌ Failed to parse gameData:", error);
    }
  } else if (typeof gameData === "object") {
    parsedGameData = normalizeGameData(gameData);
  }

  // ✅ Create fallback if parsing failed
  if (!parsedGameData) {
    console.log("🔧 Creating fallback game data");
    parsedGameData = {
      spelling: {
        word: topic?.toUpperCase().slice(0, 8) || "HEART",
        instructions: `Spell the word related to ${topic || "heart"}`,
      },
      drawing: {
        word: topic?.toUpperCase().slice(0, 8) || "HEART",
        instructions: `Draw each letter of the word`,
      },
      gallery: {
        images: [],
        instructions: `Explore images related to ${topic || "heart"}`,
      },
      quiz: {
        questions: [
          {
            question: `What is ${topic || "heart"}?`,
            options: ["A", "B", "C", "D"],
            correct_answer: "A",
          },
        ],
        instructions: `Answer questions about ${topic || "heart"}`,
      },
    };
  }

  // ✅ Handle images - normalize different image formats
  const normalizedImages = (() => {
    console.log("🔍 DEBUG: Processing images:");
    console.log("- images:", images);
    console.log("- images type:", typeof images);
    console.log("- images is array:", Array.isArray(images));
    console.log(
      "- parsedGameData?.gallery?.images:",
      parsedGameData?.gallery?.images
    );

    // ✅ Handle Firebase Storage URLs (array format)
    if (Array.isArray(images) && images.length > 0) {
      console.log("📦 Processing array of images from Firebase Storage");

      return images.map((img, idx) => {
        console.log(`🔍 Image ${idx}:`, {
          has_url: !!img.url,
          url_preview: img.url?.substring(0, 50) + "...",
          prompt: img.prompt,
          is_firebase_storage: img.url?.includes(
            "firebasestorage.googleapis.com"
          ),
        });

        // ✅ Firebase Storage URLs can be used directly
        let imageUrl = img.url;

        // Fallback to base64 if URL doesn't exist
        if (!imageUrl && img.image_base64) {
          imageUrl = img.image_base64.startsWith("data:")
            ? img.image_base64
            : `data:image/png;base64,${img.image_base64}`;
        }

        // Final fallback
        if (!imageUrl) {
          console.log(`❌ No image data found for image ${idx}`);
          imageUrl = `data:image/svg+xml;base64,${btoa(
            '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#f0f0f0"/><text x="200" y="200" text-anchor="middle" fill="#666">Image Loading...</text></svg>'
          )}`;
        }

        return {
          url: imageUrl,
          prompt: img.prompt || `Image ${idx + 1}`,
          index: idx,
          filename: img.filename || `image_${idx}.png`,
        };
      });
    }

    // ✅ Handle gallery.images from parsedGameData (Firebase Storage URLs)
    if (
      parsedGameData?.gallery?.images &&
      Array.isArray(parsedGameData.gallery.images)
    ) {
      console.log("📦 Processing gallery.images from Firebase Storage");

      return parsedGameData.gallery.images.map((img, idx) => {
        console.log(
          `🖼️ Gallery Image ${idx}: URL=${img.url?.substring(0, 50)}...`
        );

        let imageUrl = img.url;

        if (!imageUrl && img.image_base64) {
          imageUrl = img.image_base64.startsWith("data:")
            ? img.image_base64
            : `data:image/png;base64,${img.image_base64}`;
        }

        return {
          url:
            imageUrl ||
            `data:image/svg+xml;base64,${btoa(
              '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#f0f0f0"/><text x="200" y="200" text-anchor="middle" fill="#666">No Image Data</text></svg>'
            )}`,
          prompt: img.prompt || `Image ${idx + 1}`,
          index: idx,
          filename: img.filename || `image_${idx}.png`,
        };
      });
    }

    // ✅ Handle generation result format (base64)
    if (images?.success && images.images) {
      console.log("📦 Processing generation result images");
      return images.images.map((img, idx) => ({
        url: `data:image/png;base64,${img.image_base64}`,
        prompt: img.prompt || `Image ${idx + 1}`,
        index: idx,
        filename: img.filename || `generated_${idx}.png`,
      }));
    }

    console.log("❌ No valid image format found, returning null");
    return null;
  })();

  // Debug the final result
  console.log("🔍 Final normalizedImages:", normalizedImages);
  if (normalizedImages && normalizedImages.length > 0) {
    console.log("🔍 First image URL:", normalizedImages[0].url);
    console.log(
      "🔍 Is Firebase Storage URL:",
      normalizedImages[0].url?.includes("firebasestorage.googleapis.com")
    );
  }

  // ✅ Add images to gallery if we have them
  if (normalizedImages && parsedGameData) {
    parsedGameData.gallery.images = normalizedImages;
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
        return (
          finalGameData?.spelling?.instructions ||
          `Spell the word related to "${topic}"`
        );
      case "drawing":
        return (
          finalGameData?.drawing?.instructions || `Draw each letter of the word`
        );
      case "gallery":
        return (
          finalGameData?.gallery?.instructions ||
          `Explore images related to "${topic}"`
        );
      case "gk":
        return (
          finalGameData?.quiz?.instructions ||
          `Answer questions about "${topic}"`
        );
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

              {/* ✅ Show data source */}
              {source && (
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    source === "firebase"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {source === "firebase"
                    ? "📚 From Database"
                    : "✨ Freshly Generated"}
                </span>
              )}

              {/* ✅ Show image count */}
              {normalizedImages && normalizedImages.length > 0 && (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                  🖼️ {normalizedImages.length} Images
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
            {gamePhase === "spelling" && finalGameData?.spelling && (
              <SpellingGame
                topic={topic}
                word={finalGameData.spelling.word}
                onGameComplete={handleSpellingComplete}
              />
            )}

            {gamePhase === "drawing" && finalGameData?.drawing && (
              <DrawingGame
                topic={topic}
                word={finalGameData.drawing.word}
                onGameComplete={handleDrawingComplete}
              />
            )}

            {gamePhase === "gallery" && finalGameData?.gallery && (
              <ImageGalleryGame
                topic={topic}
                images={finalGameData.gallery.images || null}
                onGameComplete={handleGalleryComplete}
              />
            )}

            {gamePhase === "gk" && finalGameData?.quiz && (
              <GeneralKnowledgeGame
                topic={topic}
                questions={finalGameData.quiz.questions}
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

                {/* ✅ Show generated images */}
                {normalizedImages && normalizedImages.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg mb-6">
                    <h3 className="font-semibold mb-2">
                      🎨 AI Generated Images:
                    </h3>
                    <div className="flex flex-wrap justify-center gap-2">
                      {normalizedImages.slice(0, 4).map((img, idx) => (
                        <img
                          key={idx}
                          src={img.url}
                          alt={img.prompt}
                          className="w-16 h-16 object-cover rounded border"
                          title={img.prompt}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Generated {normalizedImages.length} unique images for this
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
