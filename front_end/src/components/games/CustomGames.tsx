import React, { useState, useEffect } from "react";
import { useUser } from "../../contexts/UserContext";

// Define game access based on disabilities - UPDATED with new games
const GAME_ACCESS = {
  ADHD: {
    allowedGames: ["imageReordering", "quiz", "typequest", "wordwrestle"], // ✅ Added 2 new games
    restrictedMessage:
      "These games are specially designed for ADHD learners to help with focus and attention.",
    description:
      "Games focused on attention, organization, and logical thinking patterns.",
  },
  Dyslexia: {
    allowedGames: [
      "spelling",
      "drawing",
      "imageReordering",
      "rhyming",
      "syllable",
    ], // ✅ Added 2 new games
    restrictedMessage:
      "These games are specially designed for dyslexic learners to help with reading and language skills.",
    description:
      "Games focused on phonics, visual processing, and language development.",
  },
  Visual: {
    allowedGames: ["quiz", "audio"], // Audio-focused games
    restrictedMessage:
      "These games are designed to be accessible for visual impairments with audio support.",
    description: "Audio-rich games that don't rely heavily on visual elements.",
  },
  Autism: {
    allowedGames: ["drawing", "quiz", "pattern"],
    restrictedMessage:
      "These games provide structured learning suitable for autism spectrum learners.",
    description:
      "Structured, predictable games with clear patterns and routines.",
  },
  None: {
    allowedGames: [
      "imageReordering",
      "quiz",
      "spelling",
      "drawing",
      "pattern",
      "audio",
      "typequest", // ✅ Available for general users too
      "wordwrestle", // ✅ Available for general users too
      "rhyming", // ✅ Available for general users too
      "syllable", // ✅ Available for general users too
    ],
    restrictedMessage: "All games are available for you!",
    description: "Complete access to all learning games and activities.",
  },
  Other: {
    allowedGames: ["imageReordering", "quiz", "drawing"],
    restrictedMessage: "A curated selection of learning games for your needs.",
    description:
      "Carefully selected games that work well for various learning needs.",
  },
};

// All possible games that can be generated - UPDATED with new games
const ALL_AVAILABLE_GAMES = [
  {
    id: "imageReordering",
    title: "Image Sequence Game",
    description: "Put images in the correct order",
    emoji: "🔄",
    difficulty: "Medium",
    estimatedTime: "5-10 min",
    skills: ["Logic", "Sequencing", "Attention"],
  },
  {
    id: "quiz",
    title: "Knowledge Quiz",
    description: "Answer questions about the topic",
    emoji: "❓",
    difficulty: "Easy",
    estimatedTime: "3-5 min",
    skills: ["Memory", "Comprehension", "Focus"],
  },
  {
    id: "spelling",
    title: "Spelling Challenge",
    description: "Spell words related to the topic",
    emoji: "📝",
    difficulty: "Medium",
    estimatedTime: "5-8 min",
    skills: ["Spelling", "Phonics", "Language"],
  },
  {
    id: "drawing",
    title: "Drawing Activity",
    description: "Draw and create related to the topic",
    emoji: "🎨",
    difficulty: "Easy",
    estimatedTime: "10-15 min",
    skills: ["Creativity", "Fine Motor", "Expression"],
  },
  {
    id: "pattern",
    title: "Pattern Recognition",
    description: "Find and complete patterns",
    emoji: "🧩",
    difficulty: "Hard",
    estimatedTime: "8-12 min",
    skills: ["Pattern Recognition", "Logic", "Analysis"],
  },
  {
    id: "audio",
    title: "Audio Challenge",
    description: "Listen and respond to audio content",
    emoji: "🔊",
    difficulty: "Medium",
    estimatedTime: "5-7 min",
    skills: ["Listening", "Audio Processing", "Memory"],
  },
  // ✅ NEW ADHD GAMES
  {
    id: "typequest",
    title: "Type Quest",
    description: "Fast typing adventure with focus challenges",
    emoji: "⌨️",
    difficulty: "Medium",
    estimatedTime: "6-10 min",
    skills: ["Focus", "Typing Speed", "Attention Control"],
    specialFeature: "ADHD Optimized",
  },
  {
    id: "wordwrestle",
    title: "Word Wrestle",
    description: "Wrestle with words in rapid-fire challenges",
    emoji: "🤼",
    difficulty: "Hard",
    estimatedTime: "7-12 min",
    skills: ["Quick Thinking", "Word Recognition", "Mental Agility"],
    specialFeature: "ADHD Optimized",
  },
  // ✅ NEW DYSLEXIA GAMES
  {
    id: "rhyming",
    title: "Rhyming Words",
    description: "Find and match rhyming word patterns",
    emoji: "🎵",
    difficulty: "Medium",
    estimatedTime: "5-9 min",
    skills: ["Phonological Awareness", "Sound Patterns", "Language"],
    specialFeature: "Dyslexia Friendly",
  },
  {
    id: "syllable",
    title: "Syllable Splitter",
    description: "Break words into syllables and rebuild them",
    emoji: "✂️",
    difficulty: "Medium",
    estimatedTime: "6-10 min",
    skills: ["Phonemic Awareness", "Word Structure", "Reading"],
    specialFeature: "Dyslexia Friendly",
  },
];

interface CustomGamesProps {
  topic: string;
  onClose: () => void;
}

export function CustomGames({ topic, onClose }: CustomGamesProps) {
  const { user } = useUser();
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Get user's allowed games based on their disability
  const userGameAccess = React.useMemo(() => {
    if (!user || !user.disability) return GAME_ACCESS["None"];
    return GAME_ACCESS[user.disability] || GAME_ACCESS["None"];
  }, [user]);

  // Filter games based on user's disability
  const availableGames = ALL_AVAILABLE_GAMES.filter((game) =>
    userGameAccess.allowedGames.includes(game.id)
  );

  const handleGameStart = async (gameId: string) => {
    setLoading(true);
    setSelectedGame(gameId);

    try {
      console.log(`Starting ${gameId} game for topic: ${topic}`);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Here you would navigate to specific game components
      // For now, we'll just simulate the game start
      alert(
        `🎮 Starting ${gameId} game for "${topic}"!\n\nThis would navigate to the specific game component.`
      );
    } catch (error) {
      console.error("Error starting game:", error);
    } finally {
      setLoading(false);
      setSelectedGame(null);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // ✅ Get special feature color
  const getSpecialFeatureColor = (feature: string) => {
    switch (feature) {
      case "ADHD Optimized":
        return "bg-emerald-100 text-emerald-700 border-emerald-300";
      case "Dyslexia Friendly":
        return "bg-blue-100 text-blue-700 border-blue-300";
      default:
        return "bg-purple-100 text-purple-700 border-purple-300";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Learning Games: {topic}
              </h2>
              <p className="text-indigo-100 text-sm">
                {userGameAccess.description}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* User Learning Profile */}
        <div className="bg-blue-50 border-b border-blue-200 p-4">
          <div className="flex items-center gap-3">
            <span className="text-lg">🎯</span>
            <div>
              <h3 className="font-semibold text-blue-900">
                Your Learning Profile
              </h3>
              <p className="text-blue-700 text-sm">
                <strong>Support Type:</strong>{" "}
                {user?.disability || "General Learning"} •{" "}
                <strong>Available Games:</strong> {availableGames.length}
                {user?.disability === "ADHD" && (
                  <span className="ml-2 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                    ⚡ Focus & Attention Games
                  </span>
                )}
                {user?.disability === "Dyslexia" && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    📚 Language & Reading Games
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Games Grid */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {availableGames.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">🚫</span>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No Games Available
              </h3>
              <p className="text-gray-500">
                No games are currently available for your learning profile.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Recommended Games for "{topic}"
                </h3>
                <p className="text-gray-600 text-sm">
                  These games are specifically curated for your learning needs
                  and the topic you drew.{" "}
                  {user?.disability === "ADHD" &&
                    "Focus-enhancing games included!"}
                  {user?.disability === "Dyslexia" &&
                    "Reading-support games included!"}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableGames.map((game) => (
                  <div
                    key={game.id}
                    className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-indigo-300 hover:shadow-lg transition-all duration-200 group relative"
                  >
                    {/* ✅ Special Feature Badge */}
                    {game.specialFeature && (
                      <div
                        className={`absolute top-3 right-3 px-2 py-1 text-xs font-medium rounded-full border ${getSpecialFeatureColor(
                          game.specialFeature
                        )}`}
                      >
                        {game.specialFeature === "ADHD Optimized" && "⚡"}
                        {game.specialFeature === "Dyslexia Friendly" && "📚"}
                        {game.specialFeature?.split(" ")[0]}
                      </div>
                    )}

                    <div className="text-center mb-4">
                      <span className="text-4xl mb-2 block group-hover:animate-bounce">
                        {game.emoji}
                      </span>
                      <h4 className="text-lg font-bold text-gray-900 mb-1">
                        {game.title}
                      </h4>
                      <p className="text-gray-600 text-sm mb-3">
                        {game.description}
                      </p>
                    </div>

                    {/* Game Info */}
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          Difficulty:
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                            game.difficulty
                          )}`}
                        >
                          {game.difficulty}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Duration:</span>
                        <span className="text-sm text-gray-700 font-medium">
                          {game.estimatedTime}
                        </span>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2">
                        Skills you'll practice:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {game.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Play Button */}
                    <button
                      onClick={() => handleGameStart(game.id)}
                      disabled={loading && selectedGame === game.id}
                      className={`w-full py-3 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        game.specialFeature === "ADHD Optimized"
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : game.specialFeature === "Dyslexia Friendly"
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white"
                      }`}
                    >
                      {loading && selectedGame === game.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Loading Game...
                        </span>
                      ) : (
                        "Start Game"
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>
              Showing {availableGames.length} games optimized for your learning
              style
              {user?.disability === "ADHD" &&
                " • Including focus-enhancement games"}
              {user?.disability === "Dyslexia" &&
                " • Including reading-support games"}
            </span>
            <button
              onClick={onClose}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Close Games
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
