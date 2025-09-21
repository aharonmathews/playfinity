import React, { useState, useEffect } from "react";

// --- AMAZE: AI-Powered Phonetic Word Bank ---
const PHONETIC_WORD_BANK = {
  banana: {
    syllables: ["ba", "na", "na"],
    pronunciations: ["buh", "nan", "uh"],
    stress: 1,
    rule: "In American English, it's often pronounced with a short 'a' sound in the middle, like buh-NAN-uh.",
  },
  potato: {
    syllables: ["po", "ta", "to"],
    pronunciations: ["puh", "tay", "toe"],
    stress: 1,
    rule: "Each vowel sound often forms a syllable.",
  },
  carrot: {
    syllables: ["car", "rot"],
    pronunciations: ["care", "rot"],
    stress: 0,
    rule: "Split between two middle consonants.",
  },
  cinnamon: {
    syllables: ["cin", "na", "mon"],
    pronunciations: ["sin", "nuh", "mon"],
    stress: 0,
    rule: "Words can have many syllables.",
  },
  international: {
    syllables: ["in", "ter", "na", "tion", "al"],
    pronunciations: ["in", "ter", "nay", "shun", "ul"],
    stress: 2,
    rule: "The 'na' sounds like in 'nation', and 'tion' becomes 'shun'.",
  },
  creature: {
    syllables: ["crea", "ture"],
    pronunciations: ["kree", "cher"],
    stress: 0,
    rule: "The ending 'ture' sounds like 'cher'.",
  },
  vision: {
    syllables: ["vi", "sion"],
    pronunciations: ["vi", "zhun"],
    stress: 0,
    rule: "The ending 'sion' can sound like 'zhun'.",
  },
  elephant: {
    syllables: ["el", "e", "phant"],
    pronunciations: ["el", "uh", "fant"],
    stress: 0,
    rule: "The letters 'ph' sound like 'f'.",
  },
  giraffe: {
    syllables: ["gi", "raffe"],
    pronunciations: ["jih", "raff"],
    stress: 1,
    rule: "Sometimes 'g' sounds like 'j'.",
  },
  bamboo: {
    syllables: ["bam", "boo"],
    pronunciations: ["bam", "boo"],
    stress: 1,
    rule: "Split between double consonants.",
  },
  comprehension: {
    syllables: ["com", "pre", "hen", "sion"],
    pronunciations: ["com", "pre", "hen", "shun"],
    stress: 2,
    rule: "Another word with the 'sion' -> 'shun' sound.",
  },
  adventure: {
    syllables: ["ad", "ven", "ture"],
    pronunciations: ["ad", "ven", "cher"],
    stress: 1,
    rule: "Another 'ture' -> 'cher' word!",
  },
  anemone: {
    syllables: ["a", "nem", "o", "ne"],
    pronunciations: ["uh", "nem", "uh", "nee"],
    stress: 1,
    rule: "This word has four syllables, and the 'o' has a soft 'uh' sound.",
  },
  mischievous: {
    syllables: ["mis", "chie", "vous"],
    pronunciations: ["mis", "chuh", "vus"],
    stress: 0,
    rule: "It's three syllables, not four! The 'ie' makes one sound.",
  },
  bouquet: {
    syllables: ["bou", "quet"],
    pronunciations: ["boo", "kay"],
    stress: 1,
    rule: "The 'qu' sounds like 'k' and the 't' is silent.",
    silentLetters: ["t"],
  },
  colonel: {
    syllables: ["colo", "nel"],
    pronunciations: ["ker", "nul"],
    stress: 0,
    rule: "Looks strange! This word is pronounced just like 'kernel'.",
    silentLetters: ["l", "o", "o"],
  },
  yacht: {
    syllables: ["yacht"],
    pronunciations: ["yot"],
    stress: 0,
    rule: "A single syllable, where the 'ch' is silent.",
    silentLetters: ["c", "h"],
  },
  indict: {
    syllables: ["in", "dict"],
    pronunciations: ["in", "dite"],
    stress: 1,
    rule: "The 'c' is silent, making it sound like 'in-dite'.",
    silentLetters: ["c"],
  },
  rhinoceros: {
    syllables: ["rhi", "noc", "er", "os"],
    pronunciations: ["rye", "nah", "sir", "us"],
    stress: 1,
    rule: "The 'h' is silent and the 'c' sounds like 's'.",
    silentLetters: ["h"],
  },
  thumb: {
    syllables: ["thumb"],
    pronunciations: ["thum"],
    stress: 0,
    rule: "A single syllable where the final 'b' is silent.",
    silentLetters: ["b"],
  },
  pronunciation: {
    syllables: ["pro", "nun", "ci", "a", "tion"],
    pronunciations: ["pro", "nun", "see", "ay", "shun"],
    stress: 3,
    rule: "A long word where 'ci' sounds like 'see' and 'tion' sounds like 'shun'.",
  },
  bourgeois: {
    syllables: ["bour", "geois"],
    pronunciations: ["boor", "zhwah"],
    stress: 1,
    rule: "A French word where 'geois' sounds like 'zhwah' and the 's' is silent.",
    silentLetters: ["s"],
  },
  ballet: {
    syllables: ["bal", "let"],
    pronunciations: ["ba", "lay"],
    stress: 1,
    rule: "From French, the first syllable is short and the final 't' is silent.",
    silentLetters: ["t"],
  },
};

const LEVELS = [
  {
    theme: "Syllable Chef 👨‍🍳",
    words: ["potato", "carrot", "cinnamon", "banana"],
  },
  { theme: "Jungle Explorer 🗺", words: ["elephant", "giraffe", "bamboo"] },
  {
    theme: "Advanced Words 🧠",
    words: [
      "international",
      "creature",
      "vision",
      "comprehension",
      "adventure",
    ],
  },
  {
    theme: "Tricky Words ✨",
    words: [
      "colonel",
      "mischievous",
      "bouquet",
      "indict",
      "rhinoceros",
      "anemone",
      "yacht",
      "thumb",
      "pronunciation",
      "bourgeois",
      "ballet",
    ],
    emoji: "✨",
  },
];

const SOUNDBOARD_ITEMS = [
  { group: "-tion", sound: "shun", example: "nation" },
  { group: "-ture", sound: "cher", example: "future" },
  { group: "-sion", sound: "zhun / shun", example: "vision" },
  { group: "-ight", sound: "ite", example: "light" },
  { group: "ph", sound: "fff", example: "phone" },
  { group: "-ough", sound: "uff / o / ow", example: "tough" },
  { group: "-ea-", sound: "ee / eh", example: "read / bread" },
  { group: "-kn-", sound: "n", example: "knight" },
];

function analyzeCustomWord(word: string) {
  if (PHONETIC_WORD_BANK[word]) return PHONETIC_WORD_BANK[word];
  const vowelGroups = word.match(/[aeiouy]+/gi);
  if (word.length <= 3 || (vowelGroups && vowelGroups.length <= 1)) {
    return {
      syllables: [word],
      pronunciations: [word],
      stress: 0,
      rule: "This is a single-syllable word.",
    };
  }
  let syllables = word.match(
    /[^aeiouy]*[aeiouy]+(?:[^aeiouy](?![aeiouy]))?/gi
  ) || [word];
  let pronunciations = [...syllables];
  let analysis = [];
  let silentLetters = [];
  syllables.forEach((syll, i) => {
    if (syll.endsWith("tion")) {
      pronunciations[i] = syll.replace("tion", "shun");
      analysis.push("Detected '-tion' ending (sounds like 'shun').");
    }
    if (syll.endsWith("ture")) {
      pronunciations[i] = syll.replace("ture", "cher");
      analysis.push("Detected '-ture' ending (sounds like 'cher').");
    }
  });
  if (word.endsWith("mb")) {
    silentLetters.push("b");
    analysis.push("Detected silent 'b' after 'm' at the end.");
  }
  if (word.startsWith("kn")) {
    silentLetters.push("k");
    analysis.push("Detected silent 'k' before 'n' at the start.");
  }
  const rule =
    analysis.length > 0
      ? analysis.join(" ")
      : "Syllables are a best guess based on vowel sounds.";
  return { syllables, pronunciations, stress: 0, rule, silentLetters };
}

function speak(text: string, rate = 0.9) {
  if ("speechSynthesis" in window) {
    const utter = new window.SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = rate;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }
}

const popSound =
  typeof window !== "undefined"
    ? new window.Audio(
        "https://cdn.pixabay.com/audio/2022/03/15/audio_2c52561934.mp3"
      )
    : null;
if (popSound) popSound.volume = 0.7;

const levelCompleteSound =
  typeof window !== "undefined"
    ? new window.Audio(
        "https://cdn.pixabay.com/audio/2022/01/18/audio_45b4c84f4a.mp3"
      )
    : null;
if (levelCompleteSound) levelCompleteSound.volume = 0.5;

const SyllableSoundboard = ({ onClose }: { onClose: () => void }) => (
  <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center animate-fade-in z-50">
    <div className="bg-amber-50 text-slate-800 p-6 rounded-lg shadow-xl max-w-md w-full">
      <h3 className="text-3xl font-bold text-center mb-4 text-indigo-600">
        Syllable Soundboard
      </h3>
      <p className="text-center text-slate-500 mb-6">
        Click on a sound to hear it and see an example.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SOUNDBOARD_ITEMS.map(({ group, sound, example }) => (
          <button
            key={group}
            onClick={() => {
              speak(sound, 0.8);
              setTimeout(() => speak(example), 600);
            }}
            className="p-3 bg-slate-100 rounded-lg text-center hover:bg-slate-200 transition"
          >
            <span className="font-bold text-xl text-indigo-600">{group}</span>
            <span className="block text-slate-600 text-sm">
              sounds like "{sound}"
            </span>
          </button>
        ))}
      </div>
      <div className="text-center mt-6">
        <button
          onClick={onClose}
          className="font-semibold py-2 px-6 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition"
        >
          Close
        </button>
      </div>
    </div>
  </div>
);

export default function SyllableSplitterGame() {
  const [level, setLevel] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [userSplit, setUserSplit] = useState<number[]>([]);
  const [completed, setCompleted] = useState(false);
  const [customWord, setCustomWord] = useState("");
  const [feedback, setFeedback] = useState("");
  const [gameState, setGameState] = useState("menu");
  const [wordAnimation, setWordAnimation] = useState("");
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [practiceData, setPracticeData] = useState<{
    word: string;
    data: any;
  } | null>(null);
  const [gameLevels, setGameLevels] = useState(LEVELS); // State for shuffled levels

  const word = isPracticeMode
    ? practiceData?.word
    : gameLevels[level]?.words[wordIdx] || "";
  const wordData = isPracticeMode
    ? practiceData?.data
    : PHONETIC_WORD_BANK[word] || {};
  const correctSplit = wordData.syllables || [];

  useEffect(() => {
    if (word && gameState === "playing") {
      setUserSplit([]);
      setCompleted(false);
      setWordAnimation("");
      speak(word);
    }
  }, [word, gameState, practiceData]);

  function handleSlice(syllablePart: string, index: number) {
    if (completed || userSplit.includes(index)) return;
    if (userSplit.length !== index) {
      setFeedback("shake");
      setTimeout(() => setFeedback(""), 400);
      return;
    }
    speak(wordData.pronunciations[index], 1.1);
    popSound?.play().catch((e) => console.error("Sound error", e));
    if (window.navigator.vibrate) window.navigator.vibrate(80);
    setUserSplit((prev) => [...prev, index]);
    if (userSplit.length + 1 === correctSplit.length) {
      setCompleted(true);
      if (!isPracticeMode) {
        setScore((s) => s + 1);
      }
      setWordAnimation("animate-pop");
      setTimeout(() => {
        correctSplit.forEach((syll, i) => {
          setTimeout(() => speak(wordData.pronunciations[i], 0.8), i * 400);
        });
        setTimeout(() => speak(word), correctSplit.length * 400 + 200);
      }, 600);
    }
  }

  function handleNext() {
    if (isPracticeMode) {
      setGameState("menu");
      return;
    }
    if (wordIdx + 1 < gameLevels[level].words.length) {
      setWordIdx((w) => w + 1);
    } else if (level + 1 < gameLevels.length) {
      levelCompleteSound?.play().catch((e) => console.error("Sound error", e));
      setLevel((l) => l + 1);
      setWordIdx(0);
    } else {
      levelCompleteSound?.play().catch((e) => console.error("Sound error", e));
      setGameState("gameOver");
    }
  }

  function handlePracticeWord() {
    const practiceWordStr = customWord.trim().toLowerCase();
    if (!practiceWordStr) return;
    const practiceWordData = analyzeCustomWord(practiceWordStr);
    setPracticeData({ word: practiceWordStr, data: practiceWordData });
    setIsPracticeMode(true);
    setGameState("playing");
  }

  function handleStartGame(isRestart = false) {
    // --- New Shuffling Logic ---
    // This shuffles both the order of the levels and the words within each level.
    const shuffleArray = (array: any[]) => {
      const newArr = [...array];
      for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
      }
      return newArr;
    };

    // Create a deep copy and shuffle it to ensure the original constant is not mutated.
    const shuffledLevels = shuffleArray(JSON.parse(JSON.stringify(LEVELS))).map(
      (level) => ({
        ...level,
        words: shuffleArray(level.words),
      })
    );

    setGameLevels(shuffledLevels);
    // --- End New Logic ---

    setIsPracticeMode(false);
    setLevel(0);
    setWordIdx(0);
    setScore(0);
    setGameState("playing");
  }

  const renderWordWithSilentLetters = () => {
    if (
      !completed ||
      !wordData.silentLetters ||
      wordData.silentLetters.length === 0
    )
      return word;
    let silentLetterCounts: { [key: string]: number } = {};
    wordData.silentLetters.forEach((l: string) => (silentLetterCounts[l] = 0));
    return word.split("").map((char, index) => {
      const lowerChar = char.toLowerCase();
      let isSilent = false;
      if (wordData.silentLetters.includes(lowerChar)) {
        const occurrences = word
          .substring(0, index + 1)
          .split("")
          .filter((c) => c.toLowerCase() === lowerChar).length;
        if (occurrences > silentLetterCounts[lowerChar]) {
          isSilent = true;
          silentLetterCounts[lowerChar]++;
        }
      }
      return (
        <span
          key={index}
          className={isSilent ? "text-slate-400 line-through" : ""}
        >
          {char}
        </span>
      );
    });
  };

  return (
    <div
      className={`max-w-md mx-auto my-10 p-5 rounded-lg shadow-lg border-2 transition-colors duration-300 bg-amber-50 border-slate-200 text-slate-800 font-opendyslexic`}
    >
      {gameState === "soundboard" && (
        <SyllableSoundboard onClose={() => setGameState("menu")} />
      )}

      {gameState === "menu" && (
        <div className="flex flex-col items-center justify-center h-[550px] text-center animate-fade-in">
          <span className="text-8xl mb-4">📖</span>
          <h1 className="text-4xl font-bold mb-2">Syllable Splitter</h1>
          <p className="text-slate-500 mb-6">
            Learn to decode words by slicing them into syllables!
          </p>
          <button
            onClick={() => handleStartGame(true)}
            className="w-full max-w-xs px-8 py-4 mb-3 bg-indigo-600 text-white font-bold text-xl rounded-lg hover:bg-indigo-700 active:scale-95 transition-transform"
          >
            Start Playing
          </button>
          <button
            onClick={() => setGameState("soundboard")}
            className="w-full max-w-xs px-8 py-3 mb-3 bg-teal-500 text-white font-bold text-lg rounded-lg hover:bg-teal-600 active:scale-95 transition-transform"
          >
            Syllable Soundboard
          </button>
          <div className="w-full max-w-xs mt-6 pt-4 border-t-2 border-slate-200">
            <p className="text-slate-500 mb-2">Or practice a specific word:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={customWord}
                onChange={(e) => setCustomWord(e.target.value)}
                placeholder="Type a word..."
                className={`flex-grow p-2 border-2 rounded-lg text-lg transition-colors bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                onKeyUp={(e) => e.key === "Enter" && handlePracticeWord()}
              />
              <button
                onClick={handlePracticeWord}
                className="px-4 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 active:scale-95 transition-transform disabled:bg-slate-400"
                disabled={!customWord}
              >
                Go
              </button>
            </div>
          </div>
        </div>
      )}

      {gameState === "gameOver" && (
        <div className="flex flex-col items-center justify-center h-[550px] text-center animate-fade-in">
          <span className="text-7xl mb-4">🎉</span>
          <h1 className="text-4xl font-bold text-indigo-600 mb-2">
            Congratulations!
          </h1>
          <p className="text-slate-500 mb-6">
            You've completed all the levels!
          </p>
          <div className="text-2xl mb-6">
            Final Score: <span className="font-bold">{score}</span>
          </div>
          <button
            onClick={() => handleStartGame(true)}
            className="w-full max-w-xs px-8 py-4 mb-4 bg-indigo-600 text-white font-bold text-xl rounded-lg hover:bg-indigo-700 active:scale-95 transition-transform"
          >
            Play Again
          </button>
          <button
            onClick={() => setGameState("menu")}
            className="text-slate-500 hover:underline"
          >
            Back to Menu
          </button>
        </div>
      )}

      {gameState === "playing" && (
        <>
          <div className="flex justify-between items-center mb-2">
            <button
              onClick={() => setGameState("menu")}
              className="font-semibold py-1 px-3 bg-slate-200 text-slate-600 rounded-md hover:bg-slate-300 transition text-sm"
            >
              ← Menu
            </button>
            <h2 className="text-2xl font-bold">
              {isPracticeMode ? "Practice Mode 📝" : gameLevels[level]?.theme}
            </h2>
            <div className="w-12"></div>
          </div>
          <div className="text-center text-lg mb-4">
            <strong>Score:</strong> {isPracticeMode ? "N/A" : score}
          </div>
          <div
            className={`relative text-center text-5xl font-bold p-4 mb-2 rounded-lg transition-transform duration-300 bg-slate-100 ${
              feedback === "shake" ? "animate-shake" : ""
            } ${wordAnimation}`}
          >
            <div>{renderWordWithSilentLetters()}</div>
            <button
              onClick={() => speak(word)}
              className={`absolute top-2 right-2 text-2xl text-slate-500 hover:scale-110 transition-transform`}
            >
              🔊
            </button>
          </div>
          <div className="flex justify-center flex-wrap gap-2 mb-4 min-h-[40px]">
            {correctSplit.map((_, idx) => (
              <div
                key={idx}
                className={`font-semibold text-center px-3 py-1 rounded-md transition-all duration-500 w-20 h-10 flex items-center justify-center ${
                  userSplit.length > idx
                    ? "bg-indigo-500 text-white"
                    : "bg-slate-200 text-slate-400"
                }`}
              >
                {userSplit.length > idx ? correctSplit[idx] : "???"}
              </div>
            ))}
          </div>
          <div className="flex justify-center flex-wrap gap-2 mb-4 min-h-[60px]">
            {correctSplit.map((syll, idx) => (
              <button
                key={idx}
                onClick={() => handleSlice(syll, idx)}
                className={`text-2xl font-semibold p-3 rounded-lg border-2 shadow-sm transition-all duration-300 ${
                  userSplit.includes(idx)
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-indigo-500 bg-white text-indigo-600"
                } ${
                  completed && "bg-slate-200 text-slate-500 border-slate-300"
                } ${
                  userSplit.includes(idx)
                    ? "!bg-green-500 !text-white ring-4 ring-green-300 animate-flash"
                    : ""
                }`}
                style={{ animationDelay: `${idx * 100}ms` }}
                disabled={completed}
              >
                {syll}
              </button>
            ))}
          </div>
          {completed && (
            <div
              className={`text-center my-4 p-3 rounded-lg animate-fade-in font-semibold min-h-[60px] flex items-center justify-center flex-col gap-2 bg-yellow-100 text-yellow-800`}
            >
              <div>
                <strong className="text-indigo-600">
                  {isPracticeMode ? "Phonetic Analysis:" : "Learning Tip:"}
                </strong>{" "}
                {wordData.rule}
              </div>
              {!isPracticeMode && (
                <div className="flex gap-2 items-center">
                  <span className="text-sm">STRESSED SYLLABLE:</span>
                  {wordData.syllables
                    .map((s: string, i: number) => (
                      <span
                        key={i}
                        className={`font-bold ${
                          i === wordData.stress
                            ? "text-indigo-600 underline"
                            : ""
                        }`}
                      >
                        {s}
                      </span>
                    ))
                    .reduce((prev: any, curr: any) => [prev, "-", curr])}
                </div>
              )}
            </div>
          )}
          {!completed && <div className="h-[92px]"></div>}
          {completed && (
            <div className="text-center my-4 animate-fade-in">
              <button
                onClick={handleNext}
                className="text-xl font-bold py-3 px-6 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 active:scale-95 transition-transform"
              >
                {isPracticeMode ? "Finish Practice" : "Next Word"}
              </button>
            </div>
          )}
          {!completed && <div className="h-[68px]"></div>}
          <div className="p-3 mt-4 border-t-2">
            <div className="flex justify-center gap-2 mb-4"></div>
          </div>
        </>
      )}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Dyslexic&display=swap');
        .font-opendyslexic { font-family: 'Open Dyslexic', sans-serif; }
        @keyframes fade-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 50%, 90% { transform: translateX(-5px); } 30%, 70% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        @keyframes pop { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
        .animate-pop { animation: pop 0.3s ease-out; }
        @keyframes flash { from, to { background-color: #22c55e; } 50% { background-color: #86efac; } }
        .animate-flash { animation: flash 0.5s ease-in-out; }
      `}</style>
    </div>
  );
}
