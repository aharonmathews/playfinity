import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { SpellingGame } from "../components/games/SpellingGame";
import { DrawingGame } from "../components/games/DrawingGame";
import { ImageGalleryGame } from "../components/games/ImageGalleryGame";
import GeneralKnowledgeGame from "../components/games/GeneralKnowledgeGame";
import { useScore } from "../contexts/ScoreContext";
import { useUser } from "../contexts/UserContext";
import { celebrate } from "../App";
import TypeQuestGame from "../components/games/TypeQuestGame";
import WordWrestleGame from "../components/games/WordWrestleGame";
import RhymeRoundupGame from "../components/games/RhymeRoundupGame";
import SyllableSplitterGame from "../components/games/SyllableSplitterGame";

// Game access restrictions
const GAME_ACCESS = {
  ADHD: {
    allowedGames: ["imageReordering", "quiz", "typequest", "wordwrestle"], // ✅ Added new games
    restrictedMessage:
      "Games focused on attention and logical thinking for ADHD learners.",
  },
  Dyslexia: {
    allowedGames: [
      "spelling",
      "drawing",
      "imageReordering",
      "rhyming",
      "syllable",
    ], // ✅ Added new games
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
      "typequest", // ✅ Available for general users
      "wordwrestle", // ✅ Available for general users
      "rhyming", // ✅ Available for general users
      "syllable", // ✅ Available for general users
    ],
    restrictedMessage: "All games available.",
  },
  Other: {
    allowedGames: ["imageReordering", "quiz", "drawing"],
    restrictedMessage: "Curated games for your learning needs.",
  },
};

const GAME_PHASE_TO_TYPE = {
  spelling: "spelling",
  drawing: "drawing",
  gallery: "imageReordering",
  gk: "quiz",
  typequest: "typequest", // ✅ New ADHD game
  wordwrestle: "wordwrestle", // ✅ New ADHD game
  rhyming: "rhyming", // ✅ New Dyslexia game
  syllable: "syllable", // ✅ New Dyslexia game
};

// ... existing interfaces ...
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

  const userGameAccess =
    user && user.disability
      ? GAME_ACCESS[user.disability] || GAME_ACCESS["None"]
      : GAME_ACCESS["None"];

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

  const isGamePhaseAllowed = (phase: string): boolean => {
    const gameType =
      GAME_PHASE_TO_TYPE[phase as keyof typeof GAME_PHASE_TO_TYPE];
    return userGameAccess.allowedGames.includes(gameType);
  };

  const getAllowedGamePhases = (): string[] => {
    // Define the complete game sequences for each disability
    const gameSequences = {
      ADHD: ["gallery", "gk", "typequest", "wordwrestle"], // ✅ 4 games for ADHD
      Dyslexia: ["spelling", "drawing", "gallery", "rhyming", "syllable"], // ✅ 5 games for Dyslexia
      Visual: ["gk"], // Only quiz games for visual impairment
      Autism: ["drawing", "gk"], // Structured games
      None: [
        "spelling",
        "drawing",
        "gallery",
        "gk",
        "typequest",
        "wordwrestle",
        "rhyming",
        "syllable",
      ], // All games
      Other: ["gallery", "gk", "drawing"], // Curated selection
    };

    // Get the sequence for the user's disability
    const userDisability = user?.disability || "None";
    const sequence = gameSequences[userDisability] || gameSequences["None"];

    // Filter to only include games that are actually allowed
    return sequence.filter((phase) => isGamePhaseAllowed(phase));
  };

  const handleTypeQuestComplete = () => handleGameComplete("typequest");
  const handleWordWrestleComplete = () => handleGameComplete("wordwrestle");
  const handleRhymingComplete = () => handleGameComplete("rhyming");
  const handleSyllableComplete = () => handleGameComplete("syllable");

  const allowedPhases = getAllowedGamePhases();

  const [gamePhase, setGamePhase] = useState<
    | "spelling"
    | "drawing"
    | "gallery"
    | "gk"
    | "typequest"
    | "wordwrestle"
    | "rhyming"
    | "syllable"
    | "completed"
  >((allowedPhases[0] as any) || "completed");

  const locationState = location.state || {};
  const {
    topic,
    gameData,
    images,
    source,
    userDisability,
    allowedGames,
    disabilityMessage,
  } = locationState;

  // ... existing data normalization code (keeping the same logic) ...
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

  // ... existing image normalization code (keeping the same logic) ...
  const normalizedImages = (() => {
    if (Array.isArray(images) && images.length > 0) {
      return images.map((img, idx) => {
        let imageUrl = img.url;
        if (!imageUrl && img.image_base64) {
          imageUrl = img.image_base64.startsWith("data:")
            ? img.image_base64
            : `data:image/png;base64,${img.image_base64}`;
        }

        if (!imageUrl) {
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
      return parsedGameData.gallery.images.map((img, idx) => {
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
      return images.images.map((img, idx) => ({
        url: `data:image/png;base64,${img.image_base64}`,
        prompt: img.prompt || `Image ${idx + 1}`,
        index: idx,
        filename: img.filename || `generated_${idx}.png`,
      }));
    }

    return null;
  })();

  if (normalizedImages && parsedGameData) {
    parsedGameData.gallery.images = normalizedImages;
  }

  const finalGameData = parsedGameData;

  const handleGameComplete = (currentPhase: string) => {
    const currentIndex = allowedPhases.indexOf(currentPhase);
    const nextIndex = currentIndex + 1;

    const points =
      {
        spelling: 10,
        drawing: 15,
        gallery: 5,
        gk: 20,
        typequest: 15, // ✅ New
        wordwrestle: 20, // ✅ New
        rhyming: 12, // ✅ New
        syllable: 14, // ✅ New
      }[currentPhase as keyof typeof points] || 10;

    addPoints(points);

    if (nextIndex < allowedPhases.length) {
      setGamePhase(allowedPhases[nextIndex] as any);
    } else {
      setGamePhase("completed");
    }
  };

  const handleSpellingComplete = () => handleGameComplete("spelling");
  const handleDrawingComplete = () => handleGameComplete("drawing");
  const handleGalleryComplete = () => handleGameComplete("gallery");
  const handleGKComplete = () => handleGameComplete("gk");

  const getGameProgress = () => {
    const currentIndex = allowedPhases.indexOf(gamePhase);
    return allowedPhases.map((phase, index) => ({
      phase,
      icon: {
        spelling: "🔤",
        drawing: "🎨",
        gallery: "🖼️",
        gk: "🧠",
        typequest: "⌨️", // ✅ New icon
        wordwrestle: "🤼", // ✅ New icon
        rhyming: "🎵", // ✅ New icon
        syllable: "✂️", // ✅ New icon
      }[phase],
      name: {
        spelling: "Spelling",
        drawing: "Drawing",
        gallery: "Gallery",
        gk: "Quiz",
        typequest: "Type Quest", // ✅ New name
        wordwrestle: "Word Wrestle", // ✅ New name
        rhyming: "Rhyming", // ✅ New name
        syllable: "Syllables", // ✅ New name
      }[phase],
      status:
        index < currentIndex
          ? "completed"
          : index === currentIndex
          ? "current"
          : "upcoming",
    }));
  };

  useEffect(() => {
    if (!topic || !finalGameData) {
      navigate("/");
    }
  }, [topic, finalGameData, navigate]);

  const getCurrentGameTitle = () => {
    const titles = {
      spelling: "Spelling Challenge",
      drawing: "Creative Drawing",
      gallery: "Image Discovery",
      gk: "Knowledge Quiz",
      typequest: "Type Quest Adventure", // ✅ New title
      wordwrestle: "Word Wrestling Match", // ✅ New title
      rhyming: "Rhyming Words Game", // ✅ New title
      syllable: "Syllable Splitter", // ✅ New title
      completed: "Mission Complete!",
    };
    return titles[gamePhase] || "Learning Game";
  };

  const getCurrentGameDescription = () => {
    const descriptions = {
      spelling:
        finalGameData?.spelling?.instructions ||
        `Master spelling for "${topic}"`,
      drawing:
        finalGameData?.drawing?.instructions ||
        `Express creativity through drawing`,
      gallery:
        finalGameData?.gallery?.instructions ||
        `Explore visual learning materials`,
      gk:
        finalGameData?.quiz?.instructions ||
        `Test your knowledge about "${topic}"`,
      typequest: `Fast-paced typing adventure focused on "${topic}"`, // ✅ New description
      wordwrestle: `Wrestling match with words related to "${topic}"`, // ✅ New description
      rhyming: `Find rhyming patterns and sounds in "${topic}" words`, // ✅ New description
      syllable: `Break down and rebuild words about "${topic}"`, // ✅ New description
      completed: `Congratulations! You've mastered "${topic}"!`,
    };
    return descriptions[gamePhase] || "";
  };

  if (allowedPhases.length === 0) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${theme.bg} ${theme.textPrimary}`}
      >
        <div
          className={`text-center max-w-lg mx-auto p-12 ${theme.cardBg} rounded-3xl ${theme.shadow} ${theme.border} border`}
        >
          <div className="text-6xl mb-6">🚫</div>
          <h1 className={`text-3xl font-bold mb-4 ${theme.textPrimary}`}>
            No Games Available
          </h1>
          <p className={`${theme.textSecondary} mb-6 ${theme.fontSize}`}>
            No games are currently available for your{" "}
            <strong>{user?.disability || "General"}</strong> learning profile.
          </p>
          <div className={`bg-${theme.primary}-100 rounded-2xl p-4 mb-6`}>
            <p className={`text-sm ${theme.textSecondary}`}>
              <strong>Learning Profile:</strong>{" "}
              {userGameAccess.restrictedMessage}
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className={`${theme.button} text-white px-8 py-4 rounded-2xl font-bold ${theme.animations} ${theme.focusRing} ${theme.shadow}`}
          >
            🏠 Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (!topic || !finalGameData) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${theme.bg} ${theme.textPrimary}`}
      >
        <div
          className={`text-center max-w-lg mx-auto p-12 ${theme.cardBg} rounded-3xl ${theme.shadow} ${theme.border} border`}
        >
          <div className="text-6xl mb-6">❌</div>
          <h1 className={`text-3xl font-bold mb-4 ${theme.textPrimary}`}>
            No Game Data Found
          </h1>
          <p className={`${theme.textSecondary} mb-6 ${theme.fontSize}`}>
            Please draw something first to generate custom games.
          </p>
          <button
            onClick={() => navigate("/")}
            className={`${theme.button} text-white px-8 py-4 rounded-2xl font-bold ${theme.animations} ${theme.focusRing} ${theme.shadow}`}
          >
            🎨 Start Drawing
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (gamePhase !== "spelling" && gamePhase !== "completed") celebrate();
  }, [gamePhase]);

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.textPrimary}`}>
      {/* Enhanced Header */}
      <header
        className={`sticky top-0 z-20 ${theme.headerBg} backdrop-blur-md ${theme.border} border-b ${theme.shadow}`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div
                className={`text-xl font-bold ${theme.textPrimary} flex items-center gap-2`}
              >
                <span className="text-2xl">🎮</span>
                <span>Playfinity Learning</span>
              </div>
              <div
                className={`hidden sm:flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-${theme.primary}-100 to-${theme.secondary}-100 rounded-full`}
              >
                <span className="text-sm">🎨 Custom Topic</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {user && (
                <div
                  className={`hidden md:flex items-center gap-2 px-3 py-1 bg-${theme.primary}-100 rounded-full`}
                >
                  <span className="text-sm font-medium">
                    👤 {user.disability || "General"} Profile
                  </span>
                </div>
              )}
              <button
                onClick={() => navigate("/")}
                className={`flex items-center gap-2 px-4 py-2 ${theme.border} border rounded-xl ${theme.textSecondary} hover:${theme.textPrimary} ${theme.animations} ${theme.focusRing}`}
              >
                <span>←</span>
                <span className="hidden sm:inline">Back to Home</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="space-y-8">
          {/* Enhanced Topic Header */}
          <div
            className={`${theme.cardBg} rounded-3xl p-8 ${theme.shadow} ${theme.border} border`}
          >
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-4xl">✨</span>
                <h1
                  className={`text-4xl font-bold ${theme.textPrimary} capitalize`}
                >
                  {topic}
                </h1>
                <span className="text-4xl">✨</span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
                <span
                  className={`px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 rounded-full font-medium ${theme.fontSize}`}
                >
                  🎨 AI Generated Topic
                </span>
                {source && (
                  <span
                    className={`px-4 py-2 rounded-full font-medium ${
                      theme.fontSize
                    } ${
                      source === "firebase"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {source === "firebase"
                      ? "📚 From Database"
                      : "✨ Freshly Generated"}
                  </span>
                )}
                {normalizedImages && normalizedImages.length > 0 && (
                  <span
                    className={`px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full font-medium ${theme.fontSize}`}
                  >
                    🖼️ {normalizedImages.length} Images
                  </span>
                )}
              </div>

              <div className={`text-xl ${theme.textSecondary} mb-6`}>
                <span className="font-bold">{getCurrentGameTitle()}</span> •{" "}
                {getCurrentGameDescription()}
              </div>

              {/* Enhanced Progress Indicator */}
              <div
                className={`flex items-center justify-center gap-4 p-4 bg-gradient-to-r from-${theme.primary}-50 to-${theme.secondary}-50 rounded-2xl`}
              >
                {getGameProgress().map((game, index) => (
                  <React.Fragment key={game.phase}>
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                          game.status === "completed"
                            ? `bg-green-500 text-white`
                            : game.status === "current"
                            ? `bg-gradient-to-r from-${theme.primary}-500 to-${theme.secondary}-500 text-white animate-pulse`
                            : `bg-gray-200 text-gray-500`
                        } ${theme.animations}`}
                      >
                        {game.status === "completed" ? "✓" : game.icon}
                      </div>
                      <span
                        className={`text-xs font-medium ${
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
                        className={`w-8 h-0.5 ${
                          index < allowedPhases.indexOf(gamePhase)
                            ? "bg-green-500"
                            : "bg-gray-300"
                        } ${theme.animations}`}
                      ></div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Learning Profile Info */}
              <div
                className={`mt-6 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl`}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-xl">🎯</span>
                  <span className={`font-bold ${theme.textPrimary}`}>
                    Learning Profile Active
                  </span>
                </div>
                <p className={`text-sm ${theme.textSecondary} mb-2`}>
                  <strong>Profile:</strong> {user?.disability || "General"} •{" "}
                  <strong>Available Games:</strong> {allowedPhases.length}/
                  {user?.disability === "ADHD"
                    ? "4"
                    : user?.disability === "Dyslexia"
                    ? "5"
                    : "8"}
                </p>
                <p className={`text-xs ${theme.textMuted}`}>
                  {userGameAccess.restrictedMessage}
                  {user?.disability === "ADHD" &&
                    " Focus & attention games included in sequence."}
                  {user?.disability === "Dyslexia" &&
                    " Reading & language games included in sequence."}
                </p>
              </div>
            </div>
          </div>

          {/* Enhanced Game Container */}
          <div
            className={`${theme.cardBg} rounded-3xl p-8 ${theme.shadow} ${theme.border} border min-h-[600px]`}
          >
            {/* Only render games that are allowed */}
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

            {gamePhase === "typequest" && isGamePhaseAllowed("typequest") && (
              <TypeQuestGame
                topic={topic}
                onGameComplete={handleTypeQuestComplete}
              />
            )}

            {gamePhase === "wordwrestle" &&
              isGamePhaseAllowed("wordwrestle") && (
                <WordWrestleGame
                  topic={topic}
                  onGameComplete={handleWordWrestleComplete}
                />
              )}

            {/* ✅ NEW DYSLEXIA GAMES */}
            {gamePhase === "rhyming" && isGamePhaseAllowed("rhyming") && (
              <RhymeRoundupGame
                topic={topic}
                onGameComplete={handleRhymingComplete}
              />
            )}

            {gamePhase === "syllable" && isGamePhaseAllowed("syllable") && (
              <SyllableSplitterGame
                topic={topic}
                onGameComplete={handleSyllableComplete}
              />
            )}

            {gamePhase === "completed" && (
              <div className="text-center py-12">
                <div className="text-8xl mb-6 animate-bounce">🎉</div>
                <h2 className={`text-4xl font-bold mb-4 ${theme.textPrimary}`}>
                  Mission Accomplished!
                </h2>
                <p className={`${theme.textSecondary} mb-8 text-xl`}>
                  You've successfully completed all available games for{" "}
                  <strong>"{topic}"</strong>
                  using your <strong>
                    {user?.disability || "General"}
                  </strong>{" "}
                  learning profile!
                </p>

                {/* Game Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-2xl mx-auto">
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
                      typequest: {
                        icon: "⌨️",
                        name: "Type Quest",
                        points: 15,
                        color: "emerald",
                      }, // ✅ New
                      wordwrestle: {
                        icon: "🤼",
                        name: "Word Wrestle",
                        points: 20,
                        color: "teal",
                      }, // ✅ New
                      rhyming: {
                        icon: "🎵",
                        name: "Rhyming",
                        points: 12,
                        color: "pink",
                      }, // ✅ New
                      syllable: {
                        icon: "✂️",
                        name: "Syllables",
                        points: 14,
                        color: "cyan",
                      }, // ✅ New
                    }[phase];

                    if (!gameInfo) return null;

                    return (
                      <div
                        key={phase}
                        className={`bg-gradient-to-br from-${gameInfo.color}-100 to-${gameInfo.color}-200 p-4 rounded-2xl ${theme.animations} hover:scale-105`}
                      >
                        <div className="text-3xl mb-2">{gameInfo.icon}</div>
                        <div
                          className={`text-sm font-medium ${theme.textPrimary} mb-1`}
                        >
                          {gameInfo.name}
                        </div>
                        <div
                          className={`text-lg font-bold text-${gameInfo.color}-600`}
                        >
                          +{gameInfo.points} pts
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Learning Achievement Summary */}
                <div
                  className={`bg-gradient-to-r from-${theme.primary}-100 to-${theme.secondary}-100 p-6 rounded-2xl mb-8 ${theme.border} border`}
                >
                  <h3
                    className={`text-xl font-bold ${theme.textPrimary} mb-3 flex items-center justify-center gap-2`}
                  >
                    <span className="text-2xl">📚</span>
                    Learning Achievement Summary
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 text-left max-w-md mx-auto">
                    <div>
                      <p className={`${theme.textSecondary} text-sm`}>
                        <strong>Learning Profile:</strong>{" "}
                        {user?.disability || "General"}
                      </p>
                      <p className={`${theme.textSecondary} text-sm`}>
                        <strong>Games Completed:</strong> {allowedPhases.length}
                        /
                        {user?.disability === "ADHD"
                          ? "4"
                          : user?.disability === "Dyslexia"
                          ? "5"
                          : "8"}
                      </p>
                    </div>
                    <div>
                      <p className={`${theme.textSecondary} text-sm`}>
                        <strong>Total Points:</strong>{" "}
                        {allowedPhases.reduce(
                          (sum, phase) =>
                            sum +
                            ({
                              spelling: 10,
                              drawing: 15,
                              gallery: 5,
                              gk: 20,
                              typequest: 15, // ✅ New
                              wordwrestle: 20, // ✅ New
                              rhyming: 12, // ✅ New
                              syllable: 14, // ✅ New
                            }[phase] || 0),
                          0
                        )}
                      </p>
                      <p className={`${theme.textSecondary} text-sm`}>
                        <strong>Images Generated:</strong>{" "}
                        {normalizedImages?.length || 0}
                      </p>
                    </div>
                  </div>
                  <p className={`${theme.textMuted} text-xs mt-3`}>
                    {userGameAccess.restrictedMessage}
                  </p>
                </div>

                {/* Generated Images Preview */}
                {normalizedImages && normalizedImages.length > 0 && (
                  <div
                    className={`bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-2xl mb-8 border border-emerald-200`}
                  >
                    <h3
                      className={`text-xl font-bold ${theme.textPrimary} mb-4 flex items-center justify-center gap-2`}
                    >
                      <span className="text-2xl">🎨</span>
                      AI Generated Learning Images
                    </h3>
                    <div className="flex flex-wrap justify-center gap-4">
                      {normalizedImages.slice(0, 6).map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={img.url}
                            alt={img.prompt}
                            className="w-20 h-20 object-cover rounded-xl border-2 border-white shadow-lg hover:scale-110 transition-transform cursor-pointer"
                            title={img.prompt}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-xl transition-all flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium">
                              View
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className={`text-xs ${theme.textMuted} mt-4`}>
                      Generated {normalizedImages.length} unique educational
                      images for enhanced learning!
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <button
                    onClick={() => navigate("/")}
                    className={`${theme.button} text-white px-8 py-4 rounded-2xl font-bold ${theme.animations} ${theme.focusRing} ${theme.shadow} hover:shadow-2xl flex items-center gap-2`}
                  >
                    <span className="text-xl">🎨</span>
                    <span>Create New Topic</span>
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className={`px-8 py-4 rounded-2xl font-bold ${theme.animations} ${theme.focusRing} border-2 ${theme.border} ${theme.textPrimary} hover:bg-gray-50 flex items-center gap-2`}
                  >
                    <span className="text-xl">🔄</span>
                    <span>Play Again</span>
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
