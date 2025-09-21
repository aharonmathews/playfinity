import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";

// --- Game Data ---
const RHYME_PAIRS = [
  {
    word: "cat",
    rhymes: ["hat", "bat", "mat", "rat"],
    wrong: ["dog", "car", "sun", "pen"],
  },
  {
    word: "sun",
    rhymes: ["run", "fun", "bun", "one"],
    wrong: ["moon", "star", "book", "sky"],
  },
  {
    word: "cake",
    rhymes: ["lake", "rake", "snake", "make"],
    wrong: ["pie", "fork", "cup", "eat"],
  },
  {
    word: "tree",
    rhymes: ["bee", "see", "free", "three"],
    wrong: ["leaf", "bark", "root", "seed"],
  },
  {
    word: "ball",
    rhymes: ["call", "fall", "hall", "wall"],
    wrong: ["bat", "run", "bounce", "kick"],
  },
  {
    word: "book",
    rhymes: ["look", "cook", "hook", "took"],
    wrong: ["read", "pen", "page", "write"],
  },
  {
    word: "star",
    rhymes: ["car", "far", "jar", "bar"],
    wrong: ["moon", "sky", "night", "light"],
  },
  {
    word: "mouse",
    rhymes: ["house", "blouse"],
    wrong: ["cheese", "trap", "cat", "tail"],
  },
  {
    word: "dog",
    rhymes: ["log", "fog", "jog", "hog"],
    wrong: ["cat", "bark", "leash", "bone"],
  },
  {
    word: "pen",
    rhymes: ["hen", "ten", "men", "den"],
    wrong: ["pencil", "ink", "write", "paper"],
  },
  {
    word: "pig",
    rhymes: ["wig", "dig", "big", "fig"],
    wrong: ["oink", "mud", "farm", "cow"],
  },
  {
    word: "bug",
    rhymes: ["rug", "hug", "mug", "jug"],
    wrong: ["insect", "fly", "ant", "crawl"],
  },
  {
    word: "duck",
    rhymes: ["truck", "luck", "stuck", "cluck"],
    wrong: ["quack", "pond", "feather", "bird"],
  },
  {
    word: "fox",
    rhymes: ["box", "socks", "rocks"],
    wrong: ["orange", "tail", "den", "sly"],
  },
];

const LEARNING_DATA_POOLS = [
  {
    title: "Perfect Rhymes",
    icon: "🎵",
    explanation: "These words have the exact same ending sound.",
    allPairs: [
      ["cat", "hat"],
      ["tree", "bee"],
      ["star", "car"],
      ["cake", "lake"],
      ["dog", "log"],
      ["pen", "hen"],
      ["pig", "wig"],
      ["bug", "rug"],
    ],
  },
  {
    title: "Sound-Alikes",
    icon: "💡",
    explanation: "Different letters can make the same sound!",
    allPairs: [
      ["fun", "phone"],
      ["cat", "kite"],
      ["gem", "jam"],
      ["write", "right"],
      ["cent", "sent"],
      ["knight", "night"],
      ["ate", "eight"],
      ["jeans", "genes"],
    ],
  },
  {
    title: "Word Twins",
    icon: "👯",
    explanation: "These words sound the same but have different meanings!",
    allPairs: [
      ["see", "sea"],
      ["sun", "son"],
      ["two", "too"],
      ["their", "there"],
      ["flour", "flower"],
      ["pear", "pair"],
      ["one", "won"],
      ["bare", "bear"],
    ],
  },
];

const applauseSound =
  typeof window !== "undefined"
    ? new (window as any).Audio(
        "https://cdn.pixabay.com/audio/2022/03/15/audio_2b22b62174.mp3"
      )
    : null;
if (applauseSound) applauseSound.volume = 0.6;
const wrongSound =
  typeof window !== "undefined"
    ? new (window as any).Audio(
        "https://cdn.pixabay.com/audio/2021/08/04/audio_c6ccf348d8.mp3"
      )
    : null;
if (wrongSound) wrongSound.volume = 0.5;

function getRandomRhymeSet() {
  const idx = Math.floor(Math.random() * RHYME_PAIRS.length);
  const set = RHYME_PAIRS[idx];
  const rhyme = set.rhymes[Math.floor(Math.random() * set.rhymes.length)];
  const wrongs = [...set.wrong].sort(() => 0.5 - Math.random()).slice(0, 3);
  const options = [...wrongs, rhyme].sort(() => 0.5 - Math.random());
  return { word: set.word, rhyme, options };
}

function speak(text: string, rate = 1.0) {
  if ("speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = rate;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } else {
    console.log("Text-to-speech not supported by this browser.");
  }
}

function celebrate() {
  applauseSound?.play().catch((e: any) => console.error("Sound error:", e));
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#6366f1", "#a78bfa", "#fde047", "#60a5fa"],
  });
}

// --- Main Game Component ---
export default function RhymeRoundupGame() {
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [rhymeSet, setRhymeSet] = useState(getRandomRhymeSet());
  const [fallingWords, setFallingWords] = useState<
    Array<{ word: string; y: number; id: string; x: number }>
  >([]);
  const [caught, setCaught] = useState<string | null>(null);
  const [gameState, setGameState] = useState("menu");
  const [combo, setCombo] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [wrongGuesses, setWrongGuesses] = useState<string[]>([]);
  const [learningCategories, setLearningCategories] = useState<
    Array<{
      title: string;
      icon: string;
      explanation: string;
      pairs: string[][];
    }>
  >([]);

  // --- NEW: Accessibility State ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState("light"); // 'light', 'cream', 'dark'
  const [font, setFont] = useState("lexend"); // 'lexend', 'arial'

  useEffect(() => {
    function shuffleAndPick(arr: string[][], count: number) {
      return [...arr].sort(() => 0.5 - Math.random()).slice(0, count);
    }
    const newLearningContent = LEARNING_DATA_POOLS.map((category) => ({
      ...category,
      pairs: shuffleAndPick(category.allPairs, 4),
    }));
    setLearningCategories(newLearningContent);
  }, []);

  useEffect(() => {
    if (gameState === "playing") {
      setTimeout(() => speak(`Find a rhyme for ${rhymeSet.word}`), 300);
    }
  }, [rhymeSet, gameState]);

  useEffect(() => {
    if (gameState === "playing") {
      setFallingWords(
        rhymeSet.options.map((word, i) => ({
          word,
          y: -60 * (i + 1.5),
          id: `${round}-${i}`,
          x: 20 + i * 90,
        }))
      );
    }
  }, [rhymeSet, round, gameState]);

  useEffect(() => {
    if (gameState !== "playing" || caught) return;
    const interval = setInterval(() => {
      setFallingWords((words) =>
        words.map((w) =>
          w.y > 400 ? { ...w, y: -60 } : { ...w, y: w.y + 5 + combo * 0.5 }
        )
      );
    }, 80);
    return () => clearInterval(interval);
  }, [fallingWords, gameState, caught, combo]);

  function handleCatch(word: string) {
    if (gameState !== "playing" || caught || wrongGuesses.includes(word))
      return;
    speak(word, 1.2);
    if (word === rhymeSet.rhyme) {
      setCaught(word);
      celebrate();
      setFeedback("correct");
      setScore((s) => s + 1 + combo);
      setCombo((c) => c + 1);
      setTimeout(() => {
        if (round >= 10) {
          setGameState("gameOver");
        } else {
          setRound((r) => r + 1);
          setRhymeSet(getRandomRhymeSet());
          setCaught(null);
          setWrongGuesses([]);
        }
      }, 1200);
    } else {
      wrongSound?.play().catch((e: any) => console.error("Sound error:", e));
      setFeedback("wrong");
      setCombo(0);
      setWrongGuesses((prev) => [...prev, word]);
    }
    setTimeout(() => setFeedback(""), 500);
  }

  function handleStartGame() {
    setScore(0);
    setRound(1);
    setCombo(0);
    setRhymeSet(getRandomRhymeSet());
    setCaught(null);
    setWrongGuesses([]);
    setGameState("playing");
  }

  const handleBackToMenu = () => setGameState("menu");

  const comboColor =
    combo >= 5
      ? "text-red-500"
      : combo >= 3
      ? "text-orange-500"
      : "text-slate-600";
  const mainContainerClasses = `p-4 rounded-lg shadow-lg max-w-md mx-auto my-10 border-2 relative transition-colors duration-300 bg-[rgb(var(--bg-primary))] border-[rgb(var(--border-primary))] ${
    feedback === "wrong" ? "animate-shake" : ""
  }`;

  return (
    <div className={`${mainContainerClasses} ${font} ${theme}`}>
      {gameState === "menu" && (
        <div className="flex flex-col items-center justify-center h-[500px] text-center animate-fade-in">
          <span className="text-8xl mb-4">🤠</span>
          <h2 className="text-4xl font-bold text-[rgb(var(--text-primary))] mb-2">
            Rhyme Roundup
          </h2>
          <p className="text-[rgb(var(--text-secondary))] mb-8">
            Catch the words that rhyme!
          </p>
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <button
              className="px-8 py-4 bg-[rgb(var(--bg-interactive))] text-[rgb(var(--text-interactive))] font-bold text-xl rounded-lg hover:bg-[rgb(var(--bg-interactive-hover))] active:scale-95 transition-transform"
              onClick={handleStartGame}
            >
              Start Game
            </button>
            <button
              className="px-8 py-4 bg-[rgb(var(--bg-interactive-alt))] text-[rgb(var(--text-interactive))] font-bold text-xl rounded-lg hover:bg-[rgb(var(--bg-interactive-alt-hover))] active:scale-95 transition-transform"
              onClick={() => setGameState("learning")}
            >
              Learn to Rhyme
            </button>
            <button
              className="mt-2 text-sm text-[rgb(var(--text-secondary))] hover:underline"
              onClick={() => setIsSettingsOpen(true)}
            >
              ⚙ Settings
            </button>
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-[rgb(var(--bg-tertiary))] p-6 sm:p-8 rounded-lg shadow-2xl w-full max-w-sm text-[rgb(var(--text-primary))]">
            <h3 className="text-2xl font-bold mb-6 text-center">Settings</h3>
            <div className="mb-6">
              <label className="block font-bold mb-2">Color Theme</label>
              <div className="flex justify-between gap-2">
                <button
                  onClick={() => setTheme("light")}
                  className={`w-full p-2 rounded-md border-2 ${
                    theme === "light"
                      ? "border-indigo-500 ring-2 ring-indigo-500"
                      : "border-gray-300"
                  } bg-sky-100`}
                >
                  Light
                </button>
                <button
                  onClick={() => setTheme("cream")}
                  className={`w-full p-2 rounded-md border-2 ${
                    theme === "cream"
                      ? "border-indigo-500 ring-2 ring-indigo-500"
                      : "border-gray-300"
                  } bg-amber-100`}
                >
                  Cream
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`w-full p-2 rounded-md border-2 ${
                    theme === "dark"
                      ? "border-indigo-500 ring-2 ring-indigo-500"
                      : "border-gray-300"
                  } bg-slate-700 text-white`}
                >
                  Dark
                </button>
              </div>
            </div>
            <div className="mb-8">
              <label className="block font-bold mb-2">Font Style</label>
              <div className="flex justify-between gap-2">
                <button
                  onClick={() => setFont("lexend")}
                  className={`w-full p-2 rounded-md border-2 ${
                    font === "lexend"
                      ? "border-indigo-500 ring-2 ring-indigo-500"
                      : "border-gray-300"
                  }`}
                >
                  Lexend
                </button>
                <button
                  onClick={() => setFont("arial")}
                  className={`w-full p-2 rounded-md border-2 ${
                    font === "arial"
                      ? "border-indigo-500 ring-2 ring-indigo-500"
                      : "border-gray-300"
                  } font-arial`}
                >
                  Arial
                </button>
              </div>
            </div>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="w-full px-8 py-3 bg-[rgb(var(--bg-interactive))] text-[rgb(var(--text-interactive))] font-bold text-lg rounded-lg hover:bg-[rgb(var(--bg-interactive-hover))] active:scale-95 transition-transform"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {gameState === "learning" && (
        <div className="animate-fade-in p-4 h-[500px] overflow-y-auto">
          <button
            onClick={handleBackToMenu}
            className="sticky top-0 left-0 bg-[rgb(var(--bg-menu-button))] hover:bg-[rgb(var(--bg-menu-button-hover))] text-[rgb(var(--text-menu-button))] font-bold py-1 px-3 rounded-lg transition-colors z-30 mb-4"
          >
            ← Menu
          </button>
          <h2 className="text-4xl font-bold text-[rgb(var(--text-primary))] text-center mb-6">
            Let's Learn Sounds!
          </h2>
          <div className="space-y-6">
            {learningCategories.map((category) => (
              <div
                key={category.title}
                className="bg-[rgb(var(--bg-tertiary))] p-4 rounded-lg shadow-md border-l-4 border-[rgb(var(--border-accent-alt))]"
              >
                <h3 className="text-2xl font-bold text-[rgb(var(--text-primary))] mb-2">
                  <span className="mr-2">{category.icon}</span> {category.title}
                </h3>
                <p className="text-[rgb(var(--text-secondary))] mb-4">
                  {category.explanation}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {category.pairs.map((pair) => (
                    <button
                      key={pair[0]}
                      onClick={() => {
                        speak(pair[0]);
                        setTimeout(() => speak(pair[1]), 500);
                      }}
                      className="flex justify-center items-center gap-2 p-2 bg-[rgb(var(--bg-secondary))] rounded-md hover:bg-[rgb(var(--border-primary))] transition text-[rgb(var(--text-accent))] font-semibold"
                    >
                      <span>{pair[0]}</span>
                      <span className="text-slate-400">&</span>
                      <span>{pair[1]}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(gameState === "playing" || gameState === "gameOver") && (
        <>
          <div className="text-center p-4">
            <button
              onClick={handleBackToMenu}
              className="absolute top-4 left-4 bg-[rgb(var(--bg-menu-button))] hover:bg-[rgb(var(--bg-menu-button-hover))] text-[rgb(var(--text-menu-button))] font-bold py-1 px-3 rounded-lg transition-colors z-30"
            >
              ← Menu
            </button>
            <h2 className="text-3xl font-bold text-[rgb(var(--text-primary))]">
              Rhyme Roundup
            </h2>
            <div className="flex justify-between items-center mt-4 text-xl">
              <strong className="text-[rgb(var(--text-secondary))]">
                Round {round}/10
              </strong>
              {combo > 1 && (
                <strong
                  className={`${comboColor} font-bold text-2xl animate-fade-in`}
                >
                  x{combo} Combo!
                </strong>
              )}
              <strong className="text-[rgb(var(--text-secondary))]">
                Score: {score}
              </strong>
            </div>
          </div>

          <div className="text-center text-2xl mb-4 p-4 bg-[rgb(var(--bg-accent))] border-2 border-[rgb(var(--border-accent))] rounded-lg shadow-inner tracking-wide">
            <span className="text-[rgb(var(--text-primary))]">
              Find a rhyme for:
            </span>
            <strong className="block text-[rgb(var(--text-accent))] text-5xl font-extrabold mt-1">
              {rhymeSet.word}
            </strong>
          </div>

          <div className="relative h-96 bg-[rgb(var(--bg-secondary))] rounded-lg border-2 border-[rgb(var(--border-primary))] overflow-hidden">
            {fallingWords.map((w) => {
              const isWrong = wrongGuesses.includes(w.word);
              return (
                <button
                  key={w.id}
                  onClick={() => handleCatch(w.word)}
                  className={`absolute w-24 h-12 text-xl tracking-wide font-bold rounded-lg shadow-md transition-all duration-200 border-2 ${
                    caught === w.word
                      ? w.word === rhymeSet.rhyme
                        ? "bg-green-500 border-green-700 text-white"
                        : "bg-red-500 border-red-700 text-white"
                      : isWrong
                      ? "bg-gray-400 border-gray-600 text-white cursor-not-allowed opacity-70"
                      : "bg-[rgb(var(--button-word-bg))] border-[rgb(var(--button-word-border))] text-[rgb(var(--button-word-text))] hover:bg-[rgb(var(--button-word-bg-hover))]"
                  }`}
                  style={{
                    left: `${w.x}px`,
                    top: `${w.y}px`,
                    transform: caught === w.word ? "scale(1.1)" : "scale(1)",
                  }}
                  disabled={!!caught || gameState === "gameOver" || isWrong}
                >
                  {w.word}
                </button>
              );
            })}
          </div>
        </>
      )}

      {gameState === "gameOver" && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white text-center rounded-lg animate-fade-in">
          <h3 className="text-4xl font-bold mb-4">
            {score >= 15 ? "Amazing!" : "Good Try!"}
          </h3>
          <p className="text-2xl mb-6">Final Score: {score}</p>
          <div className="flex gap-4">
            <button
              className="px-8 py-3 bg-[rgb(var(--bg-interactive))] text-[rgb(var(--text-interactive))] font-bold text-xl rounded-lg hover:bg-[rgb(var(--bg-interactive-hover))] active:scale-95 transition-transform"
              onClick={handleStartGame}
            >
              Play Again
            </button>
            <button
              className="px-8 py-3 bg-slate-600 text-white font-bold text-xl rounded-lg hover:bg-slate-500 active:scale-95 transition-transform"
              onClick={handleBackToMenu}
            >
              Menu
            </button>
          </div>
        </div>
      )}
      <style>{`
       @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;700;800&family=Arial&display=swap');
       
       .lexend { font-family: 'Lexend', sans-serif; }
       .arial { font-family: 'Arial', sans-serif; }

       :root {
          --bg-interactive: 79 70 229; /* indigo-600 */
          --bg-interactive-hover: 67 56 202; /* indigo-700 */
          --text-interactive: 255 255 255; /* white */
          --text-accent: 79 70 229; /* indigo-600 */
       }

       .light {
          --bg-primary: 240 249 255; /* sky-50 */
          --bg-secondary: 224 242 254; /* sky-200 */
          --bg-tertiary: 255 255 255; /* white */
          --bg-accent: 254 240 138; /* yellow-200 */
          --bg-interactive-alt: 20 184 166; /* teal-500 */
          --bg-interactive-alt-hover: 15 118 110; /* teal-600 */
          --bg-menu-button: 226 232 240; /* slate-200 */
          --bg-menu-button-hover: 203 213 225; /* slate-300 */
          --text-primary: 30 41 59; /* slate-800 */
          --text-secondary: 71 85 105; /* slate-600 */
          --text-menu-button: 51 65 85; /* slate-700 */
          --border-primary: 186 230 253; /* sky-300 */
          --border-accent: 253 224 71; /* yellow-400 */
          --border-accent-alt: 20 184 166; /* teal-500 */
          --button-word-bg: 255 255 255;
          --button-word-text: 79 70 229;
          --button-word-border: 99 102 241;
          --button-word-bg-hover: 239 246 255;
       }
       .cream {
          --bg-primary: 254 252 232; /* amber-50 */
          --bg-secondary: 254 249 195; /* yellow-200 */
          --bg-tertiary: 255 255 255; /* white */
          --bg-accent: 219 234 254; /* blue-100 */
          --bg-interactive-alt: 251 146 60; /* orange-400 */
          --bg-interactive-alt-hover: 249 115 22; /* orange-500 */
          --bg-menu-button: 228 228 231; /* stone-200 */
          --bg-menu-button-hover: 212 212 216; /* stone-300 */
          --text-primary: 68 64 60; /* stone-700 */
          --text-secondary: 120 113 108; /* stone-500 */
          --text-menu-button: 87 83 78; /* stone-600 */
          --border-primary: 254 240 138; /* yellow-300 */
          --border-accent: 147 197 253; /* blue-300 */
          --border-accent-alt: 251 146 60; /* orange-400 */
          --button-word-bg: 255 255 255;
          --button-word-text: 79 70 229;
          --button-word-border: 99 102 241;
          --button-word-bg-hover: 239 246 255;
       }
       .dark {
          --bg-primary: 30 41 59; /* slate-800 */
          --bg-secondary: 51 65 85; /* slate-700 */
          --bg-tertiary: 71 85 105; /* slate-600 */
          --bg-accent: 71 85 105; /* slate-600 */
          --bg-interactive-alt: 20 184 166; /* teal-500 */
          --bg-interactive-alt-hover: 15 118 110; /* teal-600 */
          --bg-menu-button: 100 116 139; /* slate-500 */
          --bg-menu-button-hover: 71 85 105; /* slate-600 */
          --text-primary: 241 245 249; /* slate-100 */
          --text-secondary: 148 163 184; /* slate-400 */
          --text-menu-button: 241 245 249; /* slate-100 */
          --border-primary: 71 85 105; /* slate-600 */
          --border-accent: 100 116 139; /* slate-500 */
          --border-accent-alt: 20 184 166; /* teal-500 */
          --button-word-bg: 30 41 59;
          --button-word-text: 241 245 249;
          --button-word-border: 148 163 184;
          --button-word-bg-hover: 51 65 85;
       }

       @keyframes fade-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
       .animate-fade-in { animation: fade-in 0.4s ease-out; }
       @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 50%, 90% { transform: translateX(-5px); } 30%, 70% { transform: translateX(5px); } }
       .animate-shake { animation: shake 0.4s ease-in-out; }
     `}</style>
    </div>
  );
}
