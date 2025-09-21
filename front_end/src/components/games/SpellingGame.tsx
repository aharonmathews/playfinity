import { useMemo, useState } from "react";

type Props = {
  topic: string;
  onGameComplete?: () => void;
  word?: string; // ✅ Dynamic word from JSON
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
  // ✅ Use provided word or generate from topic
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
    // Create options: correct character + 3 mirror reflections
    const opts = [currentChar, ...mirrors];
    // Shuffle the options
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
      setMessage("Correct! Great job!");
      setScore((s) => s + 1);
      setTimeout(() => {
        setFeedback(null);
        setMessage("");
        if (index < gameWord.length - 1) {
          setIndex((i) => i + 1);
        } else {
          // Game completed!
          onGameComplete?.();
        }
      }, 1500);
    } else {
      setFeedback("wrong");
      setMessage("Not quite right - Try again!");
      setTimeout(() => {
        setFeedback(null);
        setMessage("");
      }, 1500);
    }
  }

  if (!gameWord) {
    return (
      <div className="text-sm text-gray-500">
        No word available for spelling.
      </div>
    );
  }

  const progress = gameWord.length
    ? Math.round(((index + 1) / gameWord.length) * 100)
    : 0;
  const navigateHome = () => (window.location.href = "/");

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] relative">
      <div className="flex items-center justify-center gap-10 mb-4">
        <div className="text-sm text-gray-500">
          Letter {index + 1} of {gameWord.length}
        </div>
        <div className="text-sm font-medium">Score: {score}</div>
      </div>

      <div className="h-2 bg-gray-200 rounded mb-6 w-64">
        <div
          className="h-2 bg-emerald-600 rounded"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-2">
          Topic: <span className="text-indigo-600">{topic}</span>
        </h2>
        <div className="bg-yellow-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Spelling:</p>
          <div className="text-2xl font-bold tracking-widest">
            {gameWord.split("").map((char, idx) => (
              <span
                key={idx}
                className={
                  idx === index
                    ? "text-indigo-600 underline"
                    : idx < index
                    ? "text-green-600"
                    : "text-gray-400"
                }
              >
                {idx < index ? char : idx === index ? "?" : "_"}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div
        className={`text-5xl font-semibold tracking-widest text-center py-6 ${
          feedback === "correct"
            ? "text-emerald-600"
            : feedback === "wrong"
            ? "text-red-600"
            : "text-gray-900"
        }`}
      >
        {currentChar}
      </div>

      {message && (
        <div
          className={`text-center py-2 text-lg font-medium mb-4 ${
            feedback === "correct" ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {message}
        </div>
      )}

      <div className="text-center mb-6">
        <p className="text-sm text-gray-600">
          Which character matches the letter above?
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 justify-center">
        <div className="absolute top-6 right-6 z-50">
          <button
            onClick={navigateHome}
            className="rounded bg-indigo-600 text-white px-4 py-2 shadow-lg hover:bg-indigo-700"
          >
            Home
          </button>
        </div>
        {options.map((opt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handlePick(opt)}
            className={`rounded-lg border px-6 py-6 text-2xl font-semibold hover:bg-gray-50 transition-colors ${
              feedback === "correct" && opt === currentChar
                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                : feedback === "wrong" && opt !== currentChar
                ? "border-gray-200 hover:bg-gray-50"
                : "border-gray-200"
            }`}
            disabled={feedback !== null}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
