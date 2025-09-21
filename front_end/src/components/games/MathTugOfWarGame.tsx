import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";

// --- Sound setup ---
// It's good practice to create the audio object once and reuse it.
const applauseSound = typeof window !== 'undefined' ? new window.Audio("https://cdn.pixabay.com/audio/2022/03/15/audio_2b22b62174.mp3") : null;
if (applauseSound) {
  applauseSound.volume = 0.6;
  applauseSound.load(); // Preload the sound
}

const wrongSound = typeof window !== 'undefined' ? new window.Audio("https://cdn.pixabay.com/audio/2021/08/04/audio_c6ccf348d8.mp3") : null;
if (wrongSound) {
    wrongSound.volume = 0.5;
    wrongSound.load();
}

const pullSound = typeof window !== 'undefined' ? new window.Audio("https://cdn.pixabay.com/audio/2022/03/10/audio_e0828b8a0e.mp3") : null;
if (pullSound) {
    pullSound.volume = 0.7;
    pullSound.load();
}


// --- Game constants ---
const WINNING_SCORE = 5; // Steps needed to win
const MIN_NUMBER = 1;
const MAX_NUMBER = 20;

// --- Helper functions ---
function generateQuestion() {
  const a = Math.floor(Math.random() * (MAX_NUMBER - MIN_NUMBER + 1)) + MIN_NUMBER;
  const b = Math.floor(Math.random() * (MAX_NUMBER - MIN_NUMBER + 1)) + MIN_NUMBER;
  return { a, b, answer: a + b };
}

function celebrate() {
  confetti({
    particleCount: 150,
    spread: 90,
    origin: { y: 0.6 },
    colors: ["#22c55e", "#fde047", "#3b82f6", "#ec4899"]
  });
  applauseSound?.play().catch(e => console.error("Error playing sound:", e));
}


// --- Main Game Component ---
export default function MathTugOfWarGame() {
  const [question, setQuestion] = useState(generateQuestion());
  const [inputValue, setInputValue] = useState("");
  // Position: 0 is center. Positive is user winning, negative is computer winning.
  const [position, setPosition] = useState(0); 
  const [gameState, setGameState] = useState("playing"); // 'playing', 'won', 'lost'
  const [feedback, setFeedback] = useState(""); // 'correct', 'wrong', ''
  const inputRef = useRef(null);

  // Focus the input field on new questions
  useEffect(() => {
    if (gameState === "playing" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [question, gameState]);
  
  // Handle answer submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (gameState !== "playing" || !inputValue) return;

    const isCorrect = parseInt(inputValue) === question.answer;

    if (isCorrect) {
      pullSound?.play().catch(e => console.error("Error playing sound:", e));
      setFeedback("correct");
      const newPosition = position + 1;
      setPosition(newPosition);
      if (newPosition >= WINNING_SCORE) {
        setGameState("won");
        celebrate();
      }
    } else {
      wrongSound?.play().catch(e => console.error("Error playing sound:", e));
      setFeedback("wrong");
      const newPosition = position - 1;
      setPosition(newPosition);
      if (newPosition <= -WINNING_SCORE) {
        setGameState("lost");
      }
    }
    
    // Reset for the next question, but only if the game is still on
    if (gameState === 'playing' && (position + 1 < WINNING_SCORE) && (position - 1 > -WINNING_SCORE)) {
        setQuestion(generateQuestion());
    }
    setInputValue("");
    
    // Flash feedback message
    setTimeout(() => setFeedback(""), 800);
  };

  // Reset the game to its initial state
  const handlePlayAgain = () => {
    setPosition(0);
    setQuestion(generateQuestion());
    setInputValue("");
    setGameState("playing");
    setFeedback("");
  };

  // Calculate the rope's position for styling
  // The rope moves 10% for each step. 50% is center.
  const ropeKnotPosition = 50 + position * 10;

  return (
    <div className="bg-sky-100 min-h-screen flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-6 md:p-8 text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-slate-800 mb-2">Math Tug of War</h1>
        <p className="text-slate-500 mb-6">Answer correctly to pull the rope!</p>

        {/* Game Visualizer */}
        <div className="relative w-full h-48 bg-green-500 rounded-lg overflow-hidden border-4 border-green-600 mb-6 flex items-center justify-between px-4">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-1.5 bg-white/50 z-0"></div>
          {/* Computer side */}
          <div className="z-10 text-center">
            <span className="text-6xl">🤖</span>
            <div className="bg-red-500 text-white px-3 py-1 rounded-full font-semibold mt-1">Computer</div>
          </div>
          {/* User side */}
          <div className="z-10 text-center">
            <span className="text-6xl">🧑‍🚀</span>
            <div className="bg-blue-500 text-white px-3 py-1 rounded-full font-semibold mt-1">You</div>
          </div>

          {/* Rope */}
          <div className="absolute top-1/2 left-0 w-full h-2 bg-yellow-900/80 transform -translate-y-1/2"></div>
          <div
            className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 transition-all duration-500 ease-out z-20"
            style={{ left: `${ropeKnotPosition}%` }}
          >
            <span className="text-5xl drop-shadow-lg">🪢</span>
          </div>
        </div>
        
        {/* Game State Display */}
        <div className="h-44 flex items-center justify-center">
        {gameState === "playing" && (
          <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto">
            <div className={`transition-transform duration-300 ${feedback === 'correct' ? 'scale-110' : ''} ${feedback === 'wrong' ? 'animate-shake' : ''}`}>
                <p className="text-2xl md:text-3xl font-semibold text-slate-600 mb-4">What is...</p>
                <div className="text-5xl md:text-6xl font-bold text-slate-800 mb-5 tracking-wider">
                  {question.a} + {question.b} ?
                </div>
            </div>
            <div className="flex gap-2 justify-center">
                <input
                  ref={inputRef}
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-32 text-center text-2xl font-bold p-3 border-4 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 transition"
                  autoFocus
                  required
                />
                <button type="submit" className="px-8 py-3 bg-green-500 text-white font-bold text-xl rounded-lg hover:bg-green-600 active:scale-95 transition-transform">
                  Pull!
                </button>
            </div>
          </form>
        )}

        {gameState !== "playing" && (
            <div className="flex flex-col items-center justify-center animate-fade-in">
                <h2 className={`text-6xl font-extrabold mb-4 ${gameState === 'won' ? 'text-green-500' : 'text-red-500'}`}>
                    {gameState === 'won' ? "You Win!" : "Computer Wins!"}
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
        
        {/* Simple CSS for animations */}
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

