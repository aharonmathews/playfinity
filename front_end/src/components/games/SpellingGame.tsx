import { useMemo, useState } from "react";
import { useUser } from "../../contexts/UserContext";

type Props = {
  topic: string;
  onGameComplete?: () => void;
  word?: string;
};

// Mirror reflections: [left_mirror, right_mirror, bottom_mirror]
const MIRROR_MAP: Record<string, string[]> = {
  A: ["∀", "A", "ɐ"],
  B: ["ᗺ", "B", "𐐒"],
  C: ["Ↄ", "C", "ɔ"],
  D: ["ꓷ", "D", "◖"],
  E: ["Ǝ", "E", "ɘ"],
  F: ["ᖵ", "F", "Ⅎ"],
  G: ["⅁", "G", "ɓ"],
  H: ["H", "H", "H"],
  I: ["I", "I", "I"],
  J: ["ᒐ", "J", "ſ"],
  K: ["ꓘ", "K", "ʞ"],
  L: ["⅃", "L", "⅂"],
  M: ["W", "M", "ɯ"],
  N: ["И", "N", "ᴎ"],
  O: ["O", "O", "O"],
  P: ["Ԁ", "P", "ρ"],
  Q: ["Ϙ", "Q", "Ọ"],
  R: ["ꓤ", "R", "Я"],
  S: ["Ƨ", "S", "ƨ"],
  T: ["⊥", "T", "┴"],
  U: ["Ս", "U", "∩"],
  V: ["Λ", "V", "⋁"],
  W: ["M", "W", "w"],
  X: ["X", "X", "X"],
  Y: ["⅄", "Y", "ʎ"],
  Z: ["Ƹ", "Z", "ɀ"],
};

export function SpellingGame({
  topic,
  onGameComplete,
  word: providedWord,
}: Props) {
  const { user } = useUser();

  // Get disability-specific theme
  const getTheme = () => {
    const baseTheme = {
      animations: "transition-all duration-500 ease-in-out",
      shadow: "shadow-2xl drop-shadow-lg",
      glow: "drop-shadow-[0_0_20px_rgba(139,92,246,0.3)]",
    };

    switch (user?.disability) {
      case "ADHD":
        return {
          ...baseTheme,
          bg: "bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100",
          cardBg: "bg-white/95 backdrop-blur-xl border border-emerald-200/50",
          textPrimary: "text-emerald-900",
          textSecondary: "text-emerald-700",
          accent: "text-teal-600",
          button:
            "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white",
          buttonSecondary:
            "bg-gradient-to-r from-teal-100 to-emerald-100 hover:from-teal-200 hover:to-emerald-200 text-emerald-700 border-2 border-emerald-300",
          progress: "bg-gradient-to-r from-emerald-400 to-teal-400",
          correct: "text-emerald-600 bg-emerald-50",
          wrong: "text-red-600 bg-red-50",
          letterDisplay:
            "bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200",
          glow: "drop-shadow-[0_0_25px_rgba(16,185,129,0.4)]",
          fontSize: "text-lg",
          focusRing: "focus:ring-4 focus:ring-emerald-300",
        };
      case "Dyslexia":
        return {
          ...baseTheme,
          bg: "bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100",
          cardBg: "bg-white/98 backdrop-blur-xl border border-blue-200/50",
          textPrimary: "text-blue-900",
          textSecondary: "text-blue-700",
          accent: "text-indigo-600",
          button:
            "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white",
          buttonSecondary:
            "bg-gradient-to-r from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200 text-blue-700 border-2 border-blue-300",
          progress: "bg-gradient-to-r from-blue-400 to-indigo-400",
          correct: "text-blue-600 bg-blue-50",
          wrong: "text-red-600 bg-red-50",
          letterDisplay:
            "bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200",
          glow: "drop-shadow-[0_0_25px_rgba(59,130,246,0.4)]",
          fontSize: "text-xl",
          focusRing: "focus:ring-4 focus:ring-blue-300",
        };
      case "Visual":
        return {
          ...baseTheme,
          bg: "bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100",
          cardBg: "bg-white/98 backdrop-blur-xl border border-amber-300/70",
          textPrimary: "text-gray-900",
          textSecondary: "text-gray-800",
          accent: "text-amber-700",
          button:
            "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white",
          buttonSecondary:
            "bg-gradient-to-r from-amber-100 to-orange-100 hover:from-amber-200 hover:to-orange-200 text-amber-800 border-3 border-amber-400",
          progress: "bg-gradient-to-r from-amber-500 to-orange-500",
          correct: "text-amber-700 bg-amber-100",
          wrong: "text-red-700 bg-red-100",
          letterDisplay:
            "bg-gradient-to-br from-amber-50 to-orange-50 border-3 border-amber-300",
          glow: "drop-shadow-[0_0_30px_rgba(245,158,11,0.5)]",
          fontSize: "text-2xl",
          focusRing: "focus:ring-6 focus:ring-amber-400",
        };
      case "Autism":
        return {
          ...baseTheme,
          bg: "bg-gradient-to-br from-slate-100 via-gray-50 to-zinc-100",
          cardBg: "bg-white/98 backdrop-blur-xl border border-slate-200/50",
          textPrimary: "text-slate-900",
          textSecondary: "text-slate-700",
          accent: "text-slate-600",
          button:
            "bg-gradient-to-r from-slate-500 to-gray-600 hover:from-slate-600 hover:to-gray-700 text-white",
          buttonSecondary:
            "bg-gradient-to-r from-slate-100 to-gray-100 hover:from-slate-200 hover:to-gray-200 text-slate-700 border-2 border-slate-300",
          progress: "bg-gradient-to-r from-slate-400 to-gray-500",
          correct: "text-slate-600 bg-slate-50",
          wrong: "text-red-600 bg-red-50",
          letterDisplay:
            "bg-gradient-to-br from-slate-50 to-gray-50 border-2 border-slate-200",
          glow: "drop-shadow-[0_0_20px_rgba(100,116,139,0.3)]",
          fontSize: "text-lg",
          focusRing: "focus:ring-4 focus:ring-slate-300",
        };
      default:
        return {
          ...baseTheme,
          bg: "bg-gradient-to-br from-violet-100 via-purple-50 to-fuchsia-100",
          cardBg: "bg-white/95 backdrop-blur-xl border border-violet-200/50",
          textPrimary: "text-violet-900",
          textSecondary: "text-violet-700",
          accent: "text-purple-600",
          button:
            "bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white",
          buttonSecondary:
            "bg-gradient-to-r from-violet-100 to-purple-100 hover:from-violet-200 hover:to-purple-200 text-violet-700 border-2 border-violet-300",
          progress: "bg-gradient-to-r from-violet-400 to-purple-400",
          correct: "text-violet-600 bg-violet-50",
          wrong: "text-red-600 bg-red-50",
          letterDisplay:
            "bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200",
          glow: "drop-shadow-[0_0_25px_rgba(139,92,246,0.4)]",
          fontSize: "text-lg",
          focusRing: "focus:ring-4 focus:ring-violet-300",
        };
    }
  };

  const theme = getTheme();

  const gameWord = useMemo(() => {
    if (providedWord) {
      return providedWord.toUpperCase().replace(/[^A-Z]/g, "");
    }
    return (topic || "TOPIC").toUpperCase().replace(/[^A-Z]/g, "");
  }, [topic, providedWord]);

  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<null | "correct" | "wrong">(null);
  const [message, setMessage] = useState<string>("");

  const currentChar = gameWord[index] || "";

  const options = useMemo(() => {
    if (!currentChar) return [];
    const mirrors = MIRROR_MAP[currentChar] || [
      currentChar,
      currentChar,
      currentChar,
    ];
    const opts = [currentChar, ...mirrors];
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return opts;
  }, [currentChar]);

  function handlePick(choice: string) {
    if (!currentChar) return;
    const isCorrect = choice === currentChar;

    if (isCorrect) {
      setFeedback("correct");
      setMessage("Excellent! Perfect match! 🌟");
      setScore((s) => s + 1);
      setTimeout(() => {
        setFeedback(null);
        setMessage("");
        if (index < gameWord.length - 1) {
          setIndex((i) => i + 1);
        } else {
          onGameComplete?.();
        }
      }, 2000);
    } else {
      setFeedback("wrong");
      setMessage("Not quite right - Try again! 💪");
      setTimeout(() => {
        setFeedback(null);
        setMessage("");
      }, 2000);
    }
  }

  if (!gameWord) {
    return (
      <div className={`text-sm ${theme.textSecondary} text-center p-8`}>
        <div className="text-4xl mb-4">🔤</div>
        No word available for spelling.
      </div>
    );
  }

  const progress = gameWord.length
    ? Math.round(((index + 1) / gameWord.length) * 100)
    : 0;

  return (
    <div className={`min-h-[80vh] ${theme.bg} p-6 rounded-3xl ${theme.shadow}`}>
      <div
        className={`${theme.cardBg} rounded-2xl p-8 ${theme.shadow} backdrop-blur-xl`}
      >
        {/* Elegant Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-4xl animate-bounce">📝</span>
            <h1
              className={`text-3xl font-bold ${theme.textPrimary} ${theme.glow}`}
            >
              Spelling Mastery
            </h1>
            <span
              className="text-4xl animate-bounce"
              style={{ animationDelay: "0.2s" }}
            >
              ✨
            </span>
          </div>
          <p className={`${theme.textSecondary} ${theme.fontSize} font-medium`}>
            Master the art of perfect spelling with {topic}
          </p>
        </div>

        {/* Luxurious Progress Section */}
        <div className="flex items-center justify-center gap-8 mb-8">
          <div
            className={`px-6 py-3 rounded-full ${theme.letterDisplay} ${theme.shadow}`}
          >
            <span
              className={`${theme.textSecondary} ${theme.fontSize} font-medium`}
            >
              Letter {index + 1} of {gameWord.length}
            </span>
          </div>
          <div
            className={`px-6 py-3 rounded-full ${theme.letterDisplay} ${theme.shadow}`}
          >
            <span className={`${theme.accent} ${theme.fontSize} font-bold`}>
              Score: {score} ⭐
            </span>
          </div>
        </div>

        {/* Enhanced Progress Bar */}
        <div className="mb-8">
          <div className="relative">
            <div className="h-4 bg-gray-200/50 rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full ${theme.progress} ${theme.animations} relative overflow-hidden`}
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
            <div
              className={`text-center mt-2 ${theme.textSecondary} text-sm font-medium`}
            >
              {progress}% Complete
            </div>
          </div>
        </div>

        {/* Premium Topic Display */}
        <div className="text-center mb-8">
          <div
            className={`inline-block px-8 py-4 ${theme.letterDisplay} rounded-2xl ${theme.shadow} border-2`}
          >
            <p className={`${theme.textSecondary} text-sm font-medium mb-2`}>
              Spelling Challenge for:
            </p>
            <h2 className={`text-2xl font-bold ${theme.accent} mb-4`}>
              {topic}
            </h2>

            {/* Elegant Word Display */}
            <div className="flex justify-center items-center gap-2 flex-wrap">
              {gameWord.split("").map((char, idx) => (
                <div
                  key={idx}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold ${
                    theme.animations
                  } ${
                    idx === index
                      ? `${theme.accent} bg-white ${theme.shadow} scale-110 animate-pulse`
                      : idx < index
                      ? `${theme.correct} ${theme.shadow}`
                      : `${theme.textSecondary} bg-gray-100 ${theme.shadow}`
                  }`}
                >
                  {idx < index ? char : idx === index ? "?" : "_"}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Majestic Current Letter Display */}
        <div className="text-center mb-8">
          <div
            className={`inline-block p-8 ${theme.letterDisplay} rounded-3xl ${theme.shadow} ${theme.glow} border-2`}
          >
            <p
              className={`${theme.textSecondary} ${theme.fontSize} font-medium mb-4`}
            >
              Identify this letter:
            </p>
            <div
              className={`text-8xl font-bold ${theme.animations} ${
                feedback === "correct"
                  ? `${theme.correct} animate-bounce`
                  : feedback === "wrong"
                  ? `${theme.wrong} animate-shake`
                  : theme.textPrimary
              }`}
            >
              {currentChar}
            </div>
          </div>
        </div>

        {/* Feedback Message */}
        {message && (
          <div className="text-center mb-8">
            <div
              className={`inline-block px-8 py-4 rounded-2xl ${theme.shadow} ${
                theme.animations
              } ${
                feedback === "correct"
                  ? `${theme.correct} border-2 border-green-300 animate-pulse`
                  : `${theme.wrong} border-2 border-red-300 animate-bounce`
              }`}
            >
              <span className={`${theme.fontSize} font-bold`}>{message}</span>
            </div>
          </div>
        )}

        {/* Instruction Text */}
        <div className="text-center mb-8">
          <p
            className={`${theme.textSecondary} ${theme.fontSize} font-medium italic`}
          >
            Choose the character that perfectly matches the letter above
          </p>
        </div>

        {/* Luxurious Option Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 justify-center max-w-4xl mx-auto">
          {options.map((opt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePick(opt)}
              className={`relative group ${theme.animations} ${
                theme.focusRing
              } ${
                feedback === "correct" && opt === currentChar
                  ? `${theme.correct} border-4 border-green-400 ${theme.shadow} scale-105`
                  : feedback === "wrong" && opt !== currentChar
                  ? `${theme.buttonSecondary} hover:scale-105`
                  : `${theme.buttonSecondary} hover:scale-110 active:scale-95`
              }`}
              style={{
                minHeight: user?.disability === "Visual" ? "120px" : "100px",
                fontSize: user?.disability === "Visual" ? "3rem" : "2rem",
              }}
              disabled={feedback !== null}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl"></div>
              <div className="relative z-10 p-6 flex items-center justify-center">
                <span className="font-bold drop-shadow-sm">{opt}</span>
              </div>
              {feedback !== "correct" && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white/10 rounded-xl transition-opacity"></div>
              )}
            </button>
          ))}
        </div>

        {/* Accessibility Info */}
        {user?.disability && (
          <div className="mt-8 text-center">
            <div
              className={`inline-block px-6 py-3 bg-white/60 rounded-full ${theme.shadow}`}
            >
              <span className={`${theme.textSecondary} text-sm font-medium`}>
                🎯 Optimized for {user.disability} learning
              </span>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
