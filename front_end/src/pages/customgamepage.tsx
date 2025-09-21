import React from "react"; // ✅ Add this import
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { SpellingGame } from "../components/games/SpellingGame";
import { DrawingGame } from "../components/games/DrawingGame";
import { ImageGalleryGame } from "../components/games/ImageGalleryGame";
import GeneralKnowledgeGame from "../components/games/GeneralKnowledgeGame";
import { useScore } from "../contexts/ScoreContext";
import { useUser } from "../contexts/UserContext";
import { celebrate } from "../App";

// ✅ Define game access restrictions
const GAME_ACCESS = {
  ADHD: {
    allowedGames: ["imageReordering", "quiz"],
    restrictedMessage:
      "Games focused on attention and logical thinking for ADHD learners.",
  },
  Dyslexia: {
    allowedGames: ["spelling", "drawing", "imageReordering"],
    restrictedMessage:
      "Games focused on reading, phonics, and visual processing for dyslexic learners.",
  },
  Visual: {
    allowedGames: ["quiz", "audio"],
    restrictedMessage: "Audio-focused games for visual impairment support.",
  },
  Autism: {
    allowedGames: ["drawing", "quiz", "pattern"],
    restrictedMessage:
      "Structured games suitable for autism spectrum learners.",
  },
  None: {
    allowedGames: [
      "imageReordering",
      "quiz",
      "spelling",
      "drawing",
      "pattern",
      "audio",
    ],
    restrictedMessage: "All games available.",
  },
  Other: {
    allowedGames: ["imageReordering", "quiz", "drawing"],
    restrictedMessage: "Curated games for your learning needs.",
  },
};

// ✅ Map game phases to game types
const GAME_PHASE_TO_TYPE = {
  spelling: "spelling",
  drawing: "drawing",
  gallery: "imageReordering",
  gk: "quiz",
};

// ... rest of your interfaces remain the same ...
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
  const { user } = useUser();

  // ✅ Get user's allowed games
  const userGameAccess =
    user && user.disability
      ? GAME_ACCESS[user.disability] || GAME_ACCESS["None"]
      : GAME_ACCESS["None"];

  // ✅ Function to check if a game phase is allowed
  const isGamePhaseAllowed = (phase: string): boolean => {
    const gameType =
      GAME_PHASE_TO_TYPE[phase as keyof typeof GAME_PHASE_TO_TYPE];
    return userGameAccess.allowedGames.includes(gameType);
  };

  // ✅ Get allowed game phases in order
  const getAllowedGamePhases = (): string[] => {
    const allPhases = ["spelling", "drawing", "gallery", "gk"];
    return allPhases.filter((phase) => isGamePhaseAllowed(phase));
  };

  const allowedPhases = getAllowedGamePhases();

  // ✅ Start with the first allowed game phase
  const [gamePhase, setGamePhase] = useState<
    "spelling" | "drawing" | "gallery" | "gk" | "completed"
  >((allowedPhases[0] as any) || "completed");

  // ✅ Extract ALL data from navigation state
  const locationState = location.state || {};
  const {
    topic,
    gameData,
    images,
    source,
    userDisability,
    allowedGames,
    disabilityMessage,
  }: {
    topic: string;
    gameData: NewGameData | OldGameData | string;
    images: ImageData | Array<any> | null;
    source?: string;
    userDisability?: string;
    allowedGames?: string[];
    disabilityMessage?: string;
  } = locationState;

  // ✅ Debug log
  console.log("🎮 CustomGamePage received:", {
    topic,
    gameData: typeof gameData,
    images: Array.isArray(images)
      ? `Array with ${images.length} items`
      : images?.success
      ? `Success with ${images.images?.length || 0} images`
      : "null",
    source,
    userDisability: userDisability || user?.disability,
    allowedPhases: allowedPhases.join(", "),
  });

  // ... existing game data normalization code remains the same ...
  const normalizeGameData = (data: any): NewGameData | null => {
    if (!data) return null;

    if (data.spelling && data.drawing && data.gallery && data.quiz) {
      return data as NewGameData;
    }

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
          images: [],
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

  // ... existing image normalization code remains the same ...
  const normalizedImages = (() => {
    console.log("🔍 DEBUG: Processing images:");
    console.log("- images:", images);
    console.log("- images type:", typeof images);
    console.log("- images is array:", Array.isArray(images));
    console.log(
      "- parsedGameData?.gallery?.images:",
      parsedGameData?.gallery?.images
    );

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

        let imageUrl = img.url;
        if (!imageUrl && img.image_base64) {
          imageUrl = img.image_base64.startsWith("data:")
            ? img.image_base64
            : `data:image/png;base64,${img.image_base64}`;
        }

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

  console.log("🔍 Final normalizedImages:", normalizedImages);
  if (normalizedImages && normalizedImages.length > 0) {
    console.log("🔍 First image URL:", normalizedImages[0].url);
    console.log(
      "🔍 Is Firebase Storage URL:",
      normalizedImages[0].url?.includes("firebasestorage.googleapis.com")
    );
  }

  if (normalizedImages && parsedGameData) {
    parsedGameData.gallery.images = normalizedImages;
  }

  const finalGameData = parsedGameData;

  // ✅ Updated game completion handlers
  const handleGameComplete = (currentPhase: string) => {
    const currentIndex = allowedPhases.indexOf(currentPhase);
    const nextIndex = currentIndex + 1;

    // Award points based on game type
    const points =
      {
        spelling: 10,
        drawing: 15,
        gallery: 5,
        gk: 20,
      }[currentPhase as keyof typeof points] || 10;

    addPoints(points);

    if (nextIndex < allowedPhases.length) {
      // Move to next allowed game
      setGamePhase(allowedPhases[nextIndex] as any);
    } else {
      // All allowed games completed
      setGamePhase("completed");
    }
  };

  const handleSpellingComplete = () => handleGameComplete("spelling");
  const handleDrawingComplete = () => handleGameComplete("drawing");
  const handleGalleryComplete = () => handleGameComplete("gallery");
  const handleGKComplete = () => handleGameComplete("gk");

  // ✅ Updated progress indicator
  const getGameProgress = () => {
    const currentIndex = allowedPhases.indexOf(gamePhase);
    return allowedPhases.map((phase, index) => ({
      phase,
      status:
        index < currentIndex
          ? "completed"
          : index === currentIndex
          ? "current"
          : "upcoming",
    }));
  };

  // Redirect if no data
  useEffect(() => {
    if (!topic || !finalGameData) {
      console.log("⚠️ Missing data, redirecting to home");
      navigate("/");
    }
  }, [topic, finalGameData, navigate]);

  // ✅ Show message if no games are available
  if (allowedPhases.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9] text-gray-900">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">No Games Available</h1>
          <p className="text-gray-600 mb-4">
            No games are currently available for your learning profile (
            {user?.disability || "General"}).
          </p>
          <p className="text-sm text-gray-500 mb-6">
            {userGameAccess.restrictedMessage}
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
    if (gamePhase !== "spelling" && gamePhase !== "completed") celebrate();
  }, [gamePhase]);

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

              {/* ✅ Show learning profile */}
              {user?.disability && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                  👤 {user.disability} Profile
                </span>
              )}

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

              {normalizedImages && normalizedImages.length > 0 && (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                  🖼️ {normalizedImages.length} Images
                </span>
              )}
            </div>

            {/* ✅ Updated progress indicator - only show allowed games */}
            <div className="flex items-center gap-2 mt-3">
              {getGameProgress().map((game, index) => (
                <React.Fragment key={game.phase}>
                  <div
                    className={`w-3 h-3 rounded-full ${
                      game.status === "completed"
                        ? "bg-green-500"
                        : game.status === "current"
                        ? "bg-blue-500"
                        : "bg-gray-300"
                    }`}
                  ></div>
                  <span
                    className={`text-xs ${
                      game.status === "current"
                        ? "font-semibold text-blue-600"
                        : ""
                    }`}
                  >
                    {game.phase === "spelling"
                      ? "Spelling"
                      : game.phase === "drawing"
                      ? "Drawing"
                      : game.phase === "gallery"
                      ? "Gallery"
                      : "Quiz"}
                  </span>
                  {index < getGameProgress().length - 1 && (
                    <span className="text-gray-300">→</span>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* ✅ Show restricted message */}
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                <span className="font-medium">Learning Profile:</span>{" "}
                {userGameAccess.restrictedMessage}
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Playing {allowedPhases.length} out of 4 available games
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-6 bg-[#f1f5f9] shadow-2xl">
            {/* ✅ Only render games that are allowed */}
            {gamePhase === "spelling" &&
              isGamePhaseAllowed("spelling") &&
              finalGameData?.spelling && (
                <SpellingGame
                  topic={topic}
                  word={finalGameData.spelling.word}
                  onGameComplete={handleSpellingComplete}
                />
              )}

            {gamePhase === "drawing" &&
              isGamePhaseAllowed("drawing") &&
              finalGameData?.drawing && (
                <DrawingGame
                  topic={topic}
                  word={finalGameData.drawing.word}
                  onGameComplete={handleDrawingComplete}
                />
              )}

            {gamePhase === "gallery" &&
              isGamePhaseAllowed("gallery") &&
              finalGameData?.gallery && (
                <ImageGalleryGame
                  topic={topic}
                  images={finalGameData.gallery.images || null}
                  onGameComplete={handleGalleryComplete}
                />
              )}

            {gamePhase === "gk" &&
              isGamePhaseAllowed("gk") &&
              finalGameData?.quiz && (
                <GeneralKnowledgeGame
                  topic={topic}
                  onGameComplete={handleGKComplete}
                  gameData={finalGameData.quiz}
                />
              )}

            {gamePhase === "completed" && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold mb-2 text-gray-900">
                  Amazing Work!
                </h2>
                <p className="text-gray-500 mb-6">
                  You completed all available games for the topic "{topic}" in
                  your learning profile!
                </p>

                {/* ✅ Show only completed games */}
                <div className="grid grid-cols-2 gap-4 mb-6 max-w-md mx-auto">
                  {allowedPhases.map((phase) => {
                    const gameInfo = {
                      spelling: {
                        icon: "🔤",
                        name: "Spelling",
                        points: 10,
                        color: "blue",
                      },
                      drawing: {
                        icon: "🎨",
                        name: "Drawing",
                        points: 15,
                        color: "green",
                      },
                      gallery: {
                        icon: "🖼️",
                        name: "Gallery",
                        points: 5,
                        color: "purple",
                      },
                      gk: {
                        icon: "🧠",
                        name: "Quiz",
                        points: 20,
                        color: "orange",
                      },
                    }[phase];

                    if (!gameInfo) return null;

                    return (
                      <div
                        key={phase}
                        className={`bg-${gameInfo.color}-50 p-3 rounded-lg`}
                      >
                        <div
                          className={`text-2xl font-bold text-${gameInfo.color}-600`}
                        >
                          {gameInfo.icon}
                        </div>
                        <div className="text-sm text-gray-600">
                          {gameInfo.name}
                        </div>
                        <div className="text-lg font-semibold">
                          +{gameInfo.points} pts
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ✅ Show learning profile summary */}
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <h3 className="font-semibold mb-2">
                    📚 Learning Profile Summary
                  </h3>
                  <p className="text-sm text-gray-600">
                    Profile:{" "}
                    <span className="font-medium">
                      {user?.disability || "General"}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Games Completed:{" "}
                    <span className="font-medium">{allowedPhases.length}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {userGameAccess.restrictedMessage}
                  </p>
                </div>

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
