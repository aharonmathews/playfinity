import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";

// --- Sound Engine (Web Audio API) ---
const SoundEngine = {
  audioContext: null,

  init() {
    if (typeof window !== "undefined" && !this.audioContext) {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
    }
  },

  playSound(type: string) {
    if (!this.audioContext) return;

    // Resume context on user interaction if needed
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(
      0.5,
      this.audioContext.currentTime + 0.01
    );

    switch (type) {
      case "win":
        this.playTones([
          { freq: 440, duration: 0.1, delay: 0 },
          { freq: 587.33, duration: 0.1, delay: 0.1 },
          { freq: 659.25, duration: 0.15, delay: 0.2 },
        ]);
        break;
      case "lose":
        this.playTones([
          { freq: 349.23, duration: 0.1, delay: 0 },
          { freq: 261.63, duration: 0.1, delay: 0.1 },
          { freq: 196, duration: 0.2, delay: 0.2 },
        ]);
        break;
      case "wrong":
        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.0001,
          this.audioContext.currentTime + 0.2
        );
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
        break;
      case "pull":
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.0001,
          this.audioContext.currentTime + 0.15
        );
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.15);
        break;
      case "uiClick":
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.0001,
          this.audioContext.currentTime + 0.1
        );
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
        break;
      default:
        break;
    }
  },

  playTones(tones: { freq: number; duration: number; delay: number }[]) {
    tones.forEach((tone) => {
      if (!this.audioContext) return;
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(
        tone.freq,
        this.audioContext.currentTime + tone.delay
      );
      gainNode.gain.setValueAtTime(
        0.5,
        this.audioContext.currentTime + tone.delay
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.0001,
        this.audioContext.currentTime + tone.delay + tone.duration
      );

      oscillator.start(this.audioContext.currentTime + tone.delay);
      oscillator.stop(
        this.audioContext.currentTime + tone.delay + tone.duration
      );
    });
  },
};

// --- Game constants ---
const WINNING_SCORE = 10;

// --- Word Bank with Synonyms and Antonyms ---
const WORD_BANK = {
  happy: {
    synonyms: ["joyful", "cheerful", "elated"],
    antonyms: ["sad", "unhappy", "miserable"],
  },
  strong: {
    synonyms: ["powerful", "mighty", "sturdy"],
    antonyms: ["weak", "frail", "feeble"],
  },
  fast: {
    synonyms: ["quick", "rapid", "swift"],
    antonyms: ["slow", "leisurely", "sluggish"],
  },
  smart: {
    synonyms: ["intelligent", "clever", "bright"],
    antonyms: ["dull", "unintelligent", "foolish"],
  },
  brave: {
    synonyms: ["courageous", "fearless", "bold"],
    antonyms: ["cowardly", "fearful", "timid"],
  },
  bright: {
    synonyms: ["shining", "luminous", "radiant"],
    antonyms: ["dim", "dark", "dull"],
  },
  calm: {
    synonyms: ["peaceful", "serene", "tranquil"],
    antonyms: ["agitated", "excited", "chaotic"],
  },
  kind: {
    synonyms: ["considerate", "gentle", "thoughtful"],
    antonyms: ["unkind", "cruel", "mean"],
  },
  large: {
    synonyms: ["big", "huge", "enormous"],
    antonyms: ["small", "tiny", "little"],
  },
  old: {
    synonyms: ["ancient", "aged", "mature"],
    antonyms: ["new", "young", "modern"],
  },
  rich: {
    synonyms: ["wealthy", "affluent", "prosperous"],
    antonyms: ["poor", "needy", "broke"],
  },
  angry: {
    synonyms: ["furious", "irate", "enraged"],
    antonyms: ["calm", "pleased", "happy"],
  },
  beautiful: {
    synonyms: ["gorgeous", "lovely", "stunning"],
    antonyms: ["ugly", "unattractive", "hideous"],
  },
  good: {
    synonyms: ["excellent", "fine", "wonderful"],
    antonyms: ["bad", "terrible", "awful"],
  },
  new: {
    synonyms: ["modern", "recent", "fresh"],
    antonyms: ["old", "ancient", "antique"],
  },
  interesting: {
    synonyms: ["fascinating", "engaging", "captivating"],
    antonyms: ["boring", "dull", "uninteresting"],
  },
  scared: {
    synonyms: ["afraid", "frightened", "terrified"],
    antonyms: ["brave", "courageous", "confident"],
  },
  funny: {
    synonyms: ["humorous", "comical", "hilarious"],
    antonyms: ["serious", "somber", "grave"],
  },
  quiet: {
    synonyms: ["silent", "hushed", "still"],
    antonyms: ["loud", "noisy", "boisterous"],
  },
  clean: {
    synonyms: ["spotless", "pure", "neat"],
    antonyms: ["dirty", "soiled", "messy"],
  },
  easy: {
    synonyms: ["simple", "effortless", "straightforward"],
    antonyms: ["hard", "difficult", "challenging"],
  },
  hot: {
    synonyms: ["burning", "scalding", "fiery"],
    antonyms: ["cold", "chilly", "icy"],
  },
  lazy: {
    synonyms: ["idle", "lethargic", "inactive"],
    antonyms: ["busy", "active", "energetic"],
  },
  polite: {
    synonyms: ["courteous", "respectful", "civil"],
    antonyms: ["rude", "impolite", "discourteous"],
  },
  difficult: {
    synonyms: ["hard", "challenging", "tough"],
    antonyms: ["easy", "simple", "effortless"],
  },
  huge: {
    synonyms: ["enormous", "giant", "massive"],
    antonyms: ["tiny", "small", "minuscule"],
  },
  create: {
    synonyms: ["build", "make", "construct"],
    antonyms: ["destroy", "demolish", "ruin"],
  },
  love: {
    synonyms: ["adore", "cherish", "treasure"],
    antonyms: ["hate", "despise", "detest"],
  },
  begin: {
    synonyms: ["start", "commence", "initiate"],
    antonyms: ["end", "finish", "conclude"],
  },
  wet: {
    synonyms: ["damp", "soaked", "soggy"],
    antonyms: ["dry", "arid", "parched"],
  },
  smooth: {
    synonyms: ["even", "flat", "sleek"],
    antonyms: ["rough", "bumpy", "coarse"],
  },
  true: {
    synonyms: ["correct", "right", "accurate"],
    antonyms: ["false", "wrong", "incorrect"],
  },
  dark: {
    synonyms: ["gloomy", "murky", "shadowy"],
    antonyms: ["bright", "light", "luminous"],
  },
  sad: {
    synonyms: ["unhappy", "sorrowful", "dejected"],
    antonyms: ["happy", "joyful", "cheerful"],
  },
  weak: {
    synonyms: ["frail", "feeble", "puny"],
    antonyms: ["strong", "powerful", "mighty"],
  },
};

let lastWord = "";

// --- Helper functions ---
function generateQuestion() {
  const words = Object.keys(WORD_BANK);
  let randomWord = "";
  do {
    randomWord = words[Math.floor(Math.random() * words.length)];
  } while (randomWord === lastWord);
  lastWord = randomWord;

  const questionType = Math.random() < 0.5 ? "synonym" : "antonym";
  const correctAnswers =
    WORD_BANK[randomWord as keyof typeof WORD_BANK][
      questionType === "synonym" ? "synonyms" : "antonyms"
    ];
  const correctAnswer =
    correctAnswers[Math.floor(Math.random() * correctAnswers.length)];

  const options = [correctAnswer];
  const allPossibleAnswersForWord = [
    ...WORD_BANK[randomWord as keyof typeof WORD_BANK].synonyms,
    ...WORD_BANK[randomWord as keyof typeof WORD_BANK].antonyms,
  ];
  const distractorWords = words.filter((w) => w !== randomWord);

  for (let i = 0; i < 2; i++) {
    let distractor = null;
    while (!distractor) {
      const randomDistractorPoolWord =
        distractorWords[Math.floor(Math.random() * distractorWords.length)];
      const distractorType = Math.random() < 0.5 ? "synonyms" : "antonyms";
      const possibleDistractors =
        WORD_BANK[randomDistractorPoolWord as keyof typeof WORD_BANK][
          distractorType
        ];
      const potentialDistractor =
        possibleDistractors[
          Math.floor(Math.random() * possibleDistractors.length)
        ];

      if (
        !allPossibleAnswersForWord.includes(potentialDistractor) &&
        !options.includes(potentialDistractor)
      ) {
        distractor = potentialDistractor;
      }
    }
    options.push(distractor);
  }

  // Shuffle options
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return {
    text: `What is an ${questionType} for "${randomWord}"?`,
    answer: correctAnswer,
    options: options,
    type: questionType,
  };
}

function celebrate() {
  confetti({
    particleCount: 150,
    spread: 90,
    origin: { y: 0.6 },
    colors: ["#22c55e", "#fde047", "#3b82f6", "#ec4899"],
  });
}

// --- SVG Knot Component ---
const RopeKnot = () => (
  <svg width="60" height="60" viewBox="0 0 100 100" className="drop-shadow-lg">
    <defs>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <path
      d="M 50,20 C 30,20 30,50 50,50 C 70,50 70,20 50,20 Z"
      fill="none"
      stroke="#a16207"
      strokeWidth="10"
      strokeLinecap="round"
      transform="rotate(45 50 50)"
    />
    <path
      d="M 50,50 C 30,50 30,80 50,80 C 70,80 70,50 50,50 Z"
      fill="none"
      stroke="#a16207"
      strokeWidth="10"
      strokeLinecap="round"
      transform="rotate(45 50 50)"
    />
    <path
      d="M 20,50 C 20,30 50,30 50,50 C 50,70 20,70 20,50 Z"
      fill="none"
      stroke="#a16207"
      strokeWidth="10"
      strokeLinecap="round"
      transform="rotate(45 50 50)"
    />
    <path
      d="M 80,50 C 80,30 50,30 50,50 C 50,70 80,70 80,50 Z"
      fill="none"
      stroke="#a16207"
      strokeWidth="10"
      strokeLinecap="round"
      transform="rotate(45 50 50)"
    />
    <path
      d="M 50,20 C 30,20 30,50 50,50 C 70,50 70,20 50,20 Z"
      fill="none"
      stroke="#facc15"
      strokeWidth="5"
      strokeLinecap="round"
      transform="rotate(45 50 50)"
      filter="url(#glow)"
    />
    <path
      d="M 50,50 C 30,50 30,80 50,80 C 70,80 70,50 50,50 Z"
      fill="none"
      stroke="#facc15"
      strokeWidth="5"
      strokeLinecap="round"
      transform="rotate(45 50 50)"
      filter="url(#glow)"
    />
    <path
      d="M 20,50 C 20,30 50,30 50,50 C 50,70 20,70 20,50 Z"
      fill="none"
      stroke="#facc15"
      strokeWidth="5"
      strokeLinecap="round"
      transform="rotate(45 50 50)"
      filter="url(#glow)"
    />
    <path
      d="M 80,50 C 80,30 50,30 50,50 C 50,70 80,70 80,50 Z"
      fill="none"
      stroke="#facc15"
      strokeWidth="5"
      strokeLinecap="round"
      transform="rotate(45 50 50)"
      filter="url(#glow)"
    />
  </svg>
);

const TutorialModal = ({ onClose }: { onClose: () => void }) => {
  const handleClose = () => {
    SoundEngine.playSound("uiClick");
    onClose();
  };
  return (
    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="bg-white text-slate-800 p-6 rounded-lg shadow-xl max-w-lg w-full text-left">
        <h2 className="text-3xl font-bold text-center mb-4 text-slate-700">
          How to Play: Word Wrestle
        </h2>
        <div className="space-y-4 text-slate-600">
          <div>
            <h3 className="text-xl font-bold mb-1 text-blue-600">
              What are Synonyms? 🤔 (Same Meaning)
            </h3>
            <p>
              A <strong>synonym</strong> is a word that has the{" "}
              <strong>same or nearly the same meaning</strong> as another word.
              (Tip: <strong>S</strong>ynonym & <strong>S</strong>ame both start
              with S!)
            </p>
            <ul className="list-disc list-inside mt-1 pl-2">
              <li>A synonym for "happy" is "joyful."</li>
              <li>A synonym for "fast" is "quick."</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-1 text-purple-600">
              What are Antonyms? ⚔ (Opposite Meaning)
            </h3>
            <p>
              An <strong>antonym</strong> is a word that has the{" "}
              <strong>opposite meaning</strong> of another word. (Tip: Think
              "Anti" as in against).
            </p>
            <ul className="list-disc list-inside mt-1 pl-2">
              <li>An antonym for "hot" is "cold."</li>
              <li>An antonym for "easy" is "hard."</li>
            </ul>
          </div>
          <div className="pt-2">
            <h3 className="text-xl font-bold mb-1 text-green-600">
              The Goal 🎯
            </h3>
            <p>
              Read the question carefully to see if you need to find a{" "}
              <strong>synonym</strong> or an <strong>antonym</strong>. Choose
              the correct answer to pull the rope and defeat Gizmo!
            </p>
          </div>
        </div>
        <div className="text-center mt-6">
          <button
            onClick={handleClose}
            className="px-8 py-3 bg-blue-500 text-white font-bold text-xl rounded-lg hover:bg-blue-600 active:scale-95 transition-transform"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
};

const AiInsightModal = ({
  insight,
  onClose,
}: {
  insight: { word: string | null; content: string; loading: boolean };
  onClose: () => void;
}) => {
  const handleClose = () => {
    SoundEngine.playSound("uiClick");
    onClose();
  };
  return (
    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="bg-white text-slate-800 p-6 rounded-lg shadow-xl max-w-lg w-full text-left">
        <h2 className="text-3xl font-bold text-center mb-4 text-slate-700">
          Learn about:{" "}
          <span className="text-indigo-600 capitalize">{insight.word}</span>
        </h2>
        <div className="min-h-[120px] flex items-center justify-center">
          {insight.loading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
          ) : (
            <p className="text-slate-600 text-lg text-center">
              {insight.content}
            </p>
          )}
        </div>
        <div className="text-center mt-6">
          <button
            onClick={handleClose}
            className="px-8 py-3 bg-indigo-500 text-white font-bold text-xl rounded-lg hover:bg-indigo-600 active:scale-95 transition-transform"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Game Component ---
export default function WordWrestleGame() {
  const [question, setQuestion] = useState<any>(null);
  const [position, setPosition] = useState(0);
  const [gameState, setGameState] = useState("menu"); // menu, playing, won, lost
  const [feedback, setFeedback] = useState(""); // correct, wrong
  const [roundFeedbackText, setRoundFeedbackText] = useState(""); // "Correct!", "Incorrect!"
  const [answered, setAnswered] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [incorrectGuesses, setIncorrectGuesses] = useState<string[]>([]);
  const [aiInsight, setAiInsight] = useState({
    word: null as string | null,
    content: "",
    loading: false,
  });

  useEffect(() => {
    SoundEngine.init();
  }, []);

  // --- Gemini API Call ---
  async function fetchWordInsight(word: string) {
    SoundEngine.playSound("uiClick");
    setAiInsight({ word, content: "", loading: true });

    const apiKey = ""; // You can add your Gemini API key here
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    const prompt = `Define the word '${word}' in one simple sentence and provide one clear example sentence.`;

    try {
      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
      };

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) {
        setAiInsight({ word, content: text, loading: false });
      } else {
        setAiInsight({
          word,
          content: "Sorry, I couldn't get information for this word.",
          loading: false,
        });
      }
    } catch (error) {
      console.error("Gemini API error:", error);
      setAiInsight({
        word,
        content: "An error occurred. Please try again.",
        loading: false,
      });
    }
  }

  const handleOptionClick = (option: string) => {
    if (answered || incorrectGuesses.includes(option)) return;

    const isCorrect = option.toLowerCase() === question.answer.toLowerCase();

    if (isCorrect) {
      SoundEngine.playSound("pull");
      setAnswered(true);
      setFeedback("correct");
      setRoundFeedbackText("Correct!");
      const newPosition = position + 1;
      setPosition(newPosition);

      if (newPosition >= WINNING_SCORE) {
        setTimeout(() => {
          setGameState("won");
          SoundEngine.playSound("win");
          celebrate();
        }, 1000);
      }
    } else {
      SoundEngine.playSound("wrong");
      setFeedback("wrong");
      setRoundFeedbackText("Incorrect! Try Again.");
      setIncorrectGuesses((prev) => [...prev, option]);

      const newPosition = position - 1;
      setPosition(newPosition);

      if (newPosition <= -WINNING_SCORE) {
        setAnswered(true);
        setTimeout(() => {
          setGameState("lost");
          SoundEngine.playSound("lose");
        }, 1000);
      }
      setTimeout(() => setFeedback(""), 500); // Reset shake animation
    }
  };

  const handleNextQuestion = () => {
    SoundEngine.playSound("uiClick");
    setQuestion(generateQuestion());
    setAnswered(false);
    setRoundFeedbackText("");
    setIncorrectGuesses([]);
    setFeedback("");
  };

  const getOriginalWord = () => {
    const match = question?.text.match(/"([^"]+)"/);
    return match ? match[1] : null;
  };

  const handleStartGame = () => {
    SoundEngine.playSound("uiClick");
    setPosition(0);
    setGameState("playing");
    setFeedback("");
    setRoundFeedbackText("");
    setAnswered(false);
    setIncorrectGuesses([]);
    setQuestion(generateQuestion());
  };

  const handleBackToMenu = () => {
    SoundEngine.playSound("uiClick");
    setGameState("menu");
  };

  const handleShowTutorial = () => {
    SoundEngine.playSound("uiClick");
    setShowTutorial(true);
  };

  const handlePlayAgain = () => {
    SoundEngine.playSound("uiClick");
    handleStartGame();
  };

  const ropeKnotPosition = 50 + position * (50 / WINNING_SCORE);
  const progressBarWidth = 50 + position * (50 / WINNING_SCORE);

  return (
    <div className="bg-sky-100 min-h-screen flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-6 md:p-8 text-center relative overflow-hidden">
        {showTutorial && (
          <TutorialModal onClose={() => setShowTutorial(false)} />
        )}
        {aiInsight.word && (
          <AiInsightModal
            insight={aiInsight}
            onClose={() =>
              setAiInsight({ word: null, content: "", loading: false })
            }
          />
        )}

        {/* --- MENU STATE --- */}
        {gameState === "menu" && (
          <div className="flex flex-col items-center justify-center animate-fade-in min-h-[500px]">
            <span className="text-8xl mb-2">💪</span>
            <h1 className="text-5xl font-bold text-slate-800 mb-2">
              Word Wrestle
            </h1>
            <p className="text-slate-500 mb-6">
              Beat Gizmo! Find the right synonym or antonym.
            </p>

            <div className="flex flex-col gap-4 w-full max-w-xs mt-8">
              <button
                onClick={handleStartGame}
                className="px-8 py-4 bg-green-500 text-white font-bold text-xl rounded-lg hover:bg-green-600 active:scale-95 transition-transform"
              >
                Start Game
              </button>
              <button
                onClick={handleShowTutorial}
                className="px-8 py-3 bg-blue-500 text-white font-bold text-lg rounded-lg hover:bg-blue-600 active:scale-95 transition-transform"
              >
                How to Play
              </button>
            </div>
          </div>
        )}

        {/* --- GAME STATES --- */}
        {(gameState === "playing" ||
          gameState === "won" ||
          gameState === "lost") && (
          <>
            <button
              onClick={handleBackToMenu}
              className="absolute top-4 left-5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 px-4 rounded-lg transition-colors z-30"
            >
              ← Menu
            </button>

            <div className="min-h-[550px] flex flex-col">
              <h1 className="text-3xl md:text-5xl font-bold text-slate-800 mb-2">
                Word Wrestle
              </h1>
              <p className="text-slate-500 mb-6">
                Find the synonym or antonym to pull the rope!
              </p>

              <div className="relative w-full h-48 bg-green-200 rounded-lg overflow-hidden border-4 border-green-400 mb-2 flex items-center justify-between">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-1.5 bg-white/50 z-10"></div>

                {/* Characters Container */}
                <div className="absolute inset-0 flex items-center justify-between z-20 px-2">
                  <div className="text-center">
                    <span className="text-6xl">😈</span>
                    <div className="bg-purple-600 text-white px-3 py-1 rounded-full font-semibold mt-1 text-sm">
                      Gizmo
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-6xl">🦸</span>
                    <div className="bg-blue-500 text-white px-3 py-1 rounded-full font-semibold mt-1 text-sm">
                      You
                    </div>
                  </div>
                </div>

                {/* Rope and Knot */}
                <div className="absolute top-1/2 left-0 w-full h-2 bg-yellow-900/80 transform -translate-y-1/2 z-10"></div>
                <div
                  className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 transition-all duration-500 ease-out z-20"
                  style={{ left: `${ropeKnotPosition}%` }}
                >
                  <RopeKnot />
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-4 bg-purple-300 rounded-full mb-6 border-2 border-slate-300">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressBarWidth}%` }}
                ></div>
              </div>

              <div className="flex-grow flex items-center justify-center">
                {gameState === "playing" && question && (
                  <div className="w-full max-w-lg mx-auto">
                    <div
                      className={`transition-transform duration-300 min-h-[100px] flex flex-col items-center justify-center ${
                        feedback === "correct" ? "scale-110" : ""
                      } ${feedback === "wrong" ? "animate-shake" : ""}`}
                    >
                      <p className="text-xl md:text-2xl font-semibold text-slate-700 tracking-wide">
                        {question.text}
                      </p>
                      <p
                        className={`text-2xl font-bold mt-2 transition-opacity duration-300 ${
                          roundFeedbackText ? "opacity-100" : "opacity-0"
                        } ${
                          feedback === "correct"
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {roundFeedbackText || "..."}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 justify-center mt-4">
                      {question.options.map((option: string, index: number) => {
                        const isCorrectAnswer =
                          answered &&
                          option.toLowerCase() ===
                            question.answer.toLowerCase();
                        const wasGuessedIncorrectly =
                          incorrectGuesses.includes(option);
                        let buttonClass =
                          "w-full text-center text-xl font-bold p-4 border-4 rounded-lg transition-all duration-300";

                        if (isCorrectAnswer) {
                          buttonClass +=
                            " bg-green-500 border-green-700 text-white";
                        } else if (wasGuessedIncorrectly) {
                          buttonClass +=
                            " bg-red-500 border-red-700 text-white opacity-70";
                        } else if (answered) {
                          buttonClass +=
                            " opacity-70 bg-white border-slate-300 text-black";
                        } else {
                          buttonClass +=
                            " bg-white border-slate-300 text-black hover:bg-gray-100 hover:border-gray-400";
                        }

                        return (
                          <button
                            key={index}
                            onClick={() => handleOptionClick(option)}
                            className={buttonClass}
                            disabled={answered || wasGuessedIncorrectly}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                    {answered && feedback === "correct" && (
                      <div className="mt-4 flex justify-center gap-4 animate-fade-in">
                        <button
                          onClick={() => fetchWordInsight(getOriginalWord()!)}
                          className="px-6 py-3 bg-indigo-500 text-white font-bold text-lg rounded-lg hover:bg-indigo-600 active:scale-95 transition-transform"
                        >
                          ✨ Learn More
                        </button>
                        <button
                          onClick={handleNextQuestion}
                          className="px-6 py-3 bg-slate-500 text-white font-bold text-lg rounded-lg hover:bg-slate-600 active:scale-95 transition-transform"
                        >
                          Next Question →
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {(gameState === "won" || gameState === "lost") && (
                  <div className="flex flex-col items-center justify-center animate-fade-in">
                    <h2
                      className={`text-6xl font-extrabold mb-4 ${
                        gameState === "won" ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {gameState === "won" ? "You Win!" : "Gizmo Wins!"}
                    </h2>
                    <button
                      onClick={handlePlayAgain}
                      className="mt-4 px-10 py-4 bg-blue-500 text-white font-bold text-2xl rounded-lg hover:bg-blue-600 active:scale-95 transition-transform"
                    >
                      Play Again
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
            20%, 40%, 60%, 80% { transform: translateX(8px); }
          }
          .animate-shake { animation: shake 0.5s ease-in-out; }

          @keyframes fade-in {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-fade-in { animation: fade-in 0.5s ease-out; }
        `}</style>
      </div>
    </div>
  );
}
