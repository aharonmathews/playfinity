import { useState, useRef, useEffect } from "react";
import { useUser } from "../../contexts/UserContext";

type GameProps = {
  topic: string;
  word?: string;
  prompts?: string[];
  onGameComplete: () => void;
};

export function DrawingGame({
  topic,
  word,
  prompts,
  onGameComplete,
}: GameProps) {
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
          canvasBorder: "border-4 border-emerald-300 shadow-emerald-200/50",
          button:
            "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white",
          buttonSecondary:
            "bg-gradient-to-r from-gray-500 to-slate-500 hover:from-gray-600 hover:to-slate-600 text-white",
          successBg: "bg-emerald-100 text-emerald-800 border-emerald-300",
          errorBg: "bg-red-100 text-red-800 border-red-300",
          glow: "drop-shadow-[0_0_25px_rgba(16,185,129,0.4)]",
          fontSize: "text-lg",
          letterDisplay: "bg-gradient-to-br from-emerald-50 to-teal-50",
        };
      case "Dyslexia":
        return {
          ...baseTheme,
          bg: "bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100",
          cardBg: "bg-white/98 backdrop-blur-xl border border-blue-200/50",
          textPrimary: "text-blue-900",
          textSecondary: "text-blue-700",
          accent: "text-indigo-600",
          canvasBorder: "border-4 border-blue-300 shadow-blue-200/50",
          button:
            "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white",
          buttonSecondary:
            "bg-gradient-to-r from-gray-500 to-slate-500 hover:from-gray-600 hover:to-slate-600 text-white",
          successBg: "bg-blue-100 text-blue-800 border-blue-300",
          errorBg: "bg-red-100 text-red-800 border-red-300",
          glow: "drop-shadow-[0_0_25px_rgba(59,130,246,0.4)]",
          fontSize: "text-xl",
          letterDisplay: "bg-gradient-to-br from-blue-50 to-indigo-50",
        };
      case "Visual":
        return {
          ...baseTheme,
          bg: "bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100",
          cardBg: "bg-white/98 backdrop-blur-xl border border-amber-300/70",
          textPrimary: "text-gray-900",
          textSecondary: "text-gray-800",
          accent: "text-amber-700",
          canvasBorder: "border-6 border-amber-400 shadow-amber-300/60",
          button:
            "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white",
          buttonSecondary:
            "bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700 text-white",
          successBg: "bg-amber-100 text-amber-900 border-amber-400",
          errorBg: "bg-red-100 text-red-900 border-red-400",
          glow: "drop-shadow-[0_0_30px_rgba(245,158,11,0.5)]",
          fontSize: "text-2xl",
          letterDisplay: "bg-gradient-to-br from-amber-50 to-orange-50",
        };
      case "Autism":
        return {
          ...baseTheme,
          bg: "bg-gradient-to-br from-slate-100 via-gray-50 to-zinc-100",
          cardBg: "bg-white/98 backdrop-blur-xl border border-slate-200/50",
          textPrimary: "text-slate-900",
          textSecondary: "text-slate-700",
          accent: "text-slate-600",
          canvasBorder: "border-4 border-slate-300 shadow-slate-200/50",
          button:
            "bg-gradient-to-r from-slate-500 to-gray-600 hover:from-slate-600 hover:to-gray-700 text-white",
          buttonSecondary:
            "bg-gradient-to-r from-gray-500 to-slate-500 hover:from-gray-600 hover:to-slate-600 text-white",
          successBg: "bg-slate-100 text-slate-800 border-slate-300",
          errorBg: "bg-red-100 text-red-800 border-red-300",
          glow: "drop-shadow-[0_0_20px_rgba(100,116,139,0.3)]",
          fontSize: "text-lg",
          letterDisplay: "bg-gradient-to-br from-slate-50 to-gray-50",
        };
      default:
        return {
          ...baseTheme,
          bg: "bg-gradient-to-br from-violet-100 via-purple-50 to-fuchsia-100",
          cardBg: "bg-white/95 backdrop-blur-xl border border-violet-200/50",
          textPrimary: "text-violet-900",
          textSecondary: "text-violet-700",
          accent: "text-purple-600",
          canvasBorder: "border-4 border-violet-300 shadow-violet-200/50",
          button:
            "bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white",
          buttonSecondary:
            "bg-gradient-to-r from-gray-500 to-slate-500 hover:from-gray-600 hover:to-slate-600 text-white",
          successBg: "bg-violet-100 text-violet-800 border-violet-300",
          errorBg: "bg-red-100 text-red-800 border-red-300",
          glow: "drop-shadow-[0_0_25px_rgba(139,92,246,0.4)]",
          fontSize: "text-lg",
          letterDisplay: "bg-gradient-to-br from-violet-50 to-purple-50",
        };
    }
  };

  const theme = getTheme();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [completedLetters, setCompletedLetters] = useState<boolean[]>([]);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [gameMode, setGameMode] = useState<"letters" | "prompts">("letters");
  const [isCheckingLetter, setIsCheckingLetter] = useState(false);
  const [lastCheckResult, setLastCheckResult] = useState<{
    success: boolean;
    correct: boolean;
    detected: string;
    expected: string;
    error?: string;
  } | null>(null);

  const gameWord = word || topic.toUpperCase().slice(0, 8);
  const letters = gameWord.split("");

  useEffect(() => {
    setCompletedLetters(new Array(letters.length).fill(false));
  }, [letters.length]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Enhanced drawing style based on disability
    ctx.lineWidth =
      user?.disability === "Visual" ? 12 : user?.disability === "ADHD" ? 6 : 8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Disability-specific colors
    const strokeColors = {
      ADHD: "#059669",
      Dyslexia: "#3b82f6",
      Visual: "#f59e0b",
      Autism: "#64748b",
      default: "#7c3aed",
    };

    ctx.strokeStyle =
      strokeColors[user?.disability as keyof typeof strokeColors] ||
      strokeColors.default;
    ctx.shadowBlur = 2;
    ctx.shadowColor = "rgba(0,0,0,0.1)";

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.beginPath();
      }
    }
  };

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        // Premium canvas background
        const gradient = ctx.createLinearGradient(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
        gradient.addColorStop(0, "#ffffff");
        gradient.addColorStop(1, "#f8fafc");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    setLastCheckResult(null);
  };

  // Initialize canvas with premium background
  useEffect(() => {
    clearCanvas();
  }, []);

  const checkCurrentLetter = async () => {
    if (!canvasRef.current || isCheckingLetter) return;

    const canvas = canvasRef.current;
    const expectedLetter = letters[currentLetterIndex];

    try {
      setIsCheckingLetter(true);
      setLastCheckResult(null);

      const imageData = canvas.toDataURL("image/png");
      console.log(`🔤 Checking letter: expected '${expectedLetter}'`);

      const response = await fetch("http://127.0.0.1:8000/check-letter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: imageData,
          expected_letter: expectedLetter,
        }),
      });

      const result = await response.json();
      console.log("🎯 OCR Result:", result);

      setLastCheckResult(result);

      if (result.success && result.correct) {
        const newCompleted = [...completedLetters];
        newCompleted[currentLetterIndex] = true;
        setCompletedLetters(newCompleted);

        if (currentLetterIndex < letters.length - 1) {
          setTimeout(() => {
            setCurrentLetterIndex(currentLetterIndex + 1);
            clearCanvas();
            setLastCheckResult(null);
          }, 3000);
        } else {
          setTimeout(() => {
            if (prompts && prompts.length > 0) {
              setGameMode("prompts");
              clearCanvas();
              setLastCheckResult(null);
            } else {
              onGameComplete();
            }
          }, 3000);
        }
      }
    } catch (error) {
      console.error("❌ Error checking letter:", error);
      setLastCheckResult({
        success: false,
        correct: false,
        detected: "",
        expected: expectedLetter,
        error: "Network error - please try again",
      });
    } finally {
      setIsCheckingLetter(false);
    }
  };

  const handleLetterSubmit = () => {
    checkCurrentLetter();
  };

  const handlePromptNext = () => {
    if (currentPromptIndex < (prompts?.length || 0) - 1) {
      setCurrentPromptIndex(currentPromptIndex + 1);
      clearCanvas();
    } else {
      onGameComplete();
    }
  };

  const skipLetter = () => {
    const newCompleted = [...completedLetters];
    newCompleted[currentLetterIndex] = true;
    setCompletedLetters(newCompleted);

    if (currentLetterIndex < letters.length - 1) {
      setCurrentLetterIndex(currentLetterIndex + 1);
      clearCanvas();
      setLastCheckResult(null);
    } else {
      if (prompts && prompts.length > 0) {
        setGameMode("prompts");
        clearCanvas();
        setLastCheckResult(null);
      } else {
        onGameComplete();
      }
    }
  };

  return (
    <div className={`min-h-[90vh] ${theme.bg} p-6 rounded-3xl ${theme.shadow}`}>
      <div
        className={`${theme.cardBg} rounded-2xl p-8 ${theme.shadow} backdrop-blur-xl`}
      >
        {gameMode === "letters" ? (
          <>
            {/* Elegant Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-5xl animate-bounce">🎨</span>
                <h1
                  className={`text-4xl font-bold ${theme.textPrimary} ${theme.glow}`}
                >
                  Artistic Letter Creation
                </h1>
                <span
                  className="text-5xl animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                >
                  ✏️
                </span>
              </div>
              <p
                className={`${theme.textSecondary} ${theme.fontSize} font-medium italic`}
              >
                Express your creativity while mastering letter formation
              </p>
            </div>

            {/* Premium Word Display */}
            <div className="text-center mb-8">
              <div
                className={`inline-block px-8 py-4 ${theme.letterDisplay} rounded-2xl ${theme.shadow} border-2`}
              >
                <p
                  className={`${theme.textSecondary} text-sm font-medium mb-2`}
                >
                  Masterpiece Word:
                </p>
                <span className={`text-3xl font-bold ${theme.accent}`}>
                  {gameWord}
                </span>
              </div>
            </div>

            {/* Luxurious Progress Indicator */}
            <div className="flex justify-center gap-3 mb-8 flex-wrap">
              {letters.map((letter, index) => (
                <div
                  key={index}
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold ${
                    theme.animations
                  } ${theme.shadow} ${
                    completedLetters[index]
                      ? `${theme.successBg} border-2 scale-110 animate-pulse`
                      : index === currentLetterIndex
                      ? `${theme.accent} bg-white text-white border-2 scale-125 animate-bounce`
                      : `bg-gray-100 text-gray-500 border-2`
                  }`}
                  style={{
                    background: completedLetters[index]
                      ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                      : index === currentLetterIndex
                      ? `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accent} 100%)`
                      : "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)",
                  }}
                >
                  {letter}
                </div>
              ))}
            </div>

            {/* Current Letter Challenge */}
            <div className="mb-8">
              <div
                className={`text-center p-6 ${theme.letterDisplay} rounded-3xl ${theme.shadow} border-2`}
              >
                <p
                  className={`${theme.textSecondary} ${theme.fontSize} font-medium mb-4`}
                >
                  Create this letter with artistic flair:
                </p>
                <div
                  className={`text-9xl font-bold ${theme.accent} ${theme.glow} animate-pulse`}
                >
                  {letters[currentLetterIndex]}
                </div>
              </div>
            </div>

            {/* OCR Result Display */}
            {lastCheckResult && (
              <div className="mb-6">
                <div
                  className={`p-6 rounded-2xl ${theme.shadow} border-2 ${
                    theme.animations
                  } ${
                    lastCheckResult.success && lastCheckResult.correct
                      ? `${theme.successBg} animate-bounce`
                      : `${theme.errorBg} animate-pulse`
                  }`}
                >
                  {lastCheckResult.success && lastCheckResult.correct ? (
                    <div className="text-center">
                      <div className="text-6xl mb-2">🎉</div>
                      <div className={`text-2xl font-bold mb-2`}>
                        Magnificent Creation!
                      </div>
                      <div className={`${theme.fontSize}`}>
                        Perfect detection: "{lastCheckResult.detected}"
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-4xl mb-2">🎯</div>
                      <div className={`text-xl font-bold mb-2`}>
                        Let's refine your masterpiece!
                      </div>
                      <div className={`text-sm`}>
                        Expected: "{lastCheckResult.expected}" | Detected: "
                        {lastCheckResult.detected || "Not clear enough"}
                      </div>
                      {lastCheckResult.error && (
                        <div className="text-xs mt-2 opacity-80">
                          {lastCheckResult.error}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Premium Drawing Canvas */}
            <div className="mb-8">
              <div className="flex justify-center">
                <div className={`p-4 rounded-3xl ${theme.shadow} bg-white/90`}>
                  <canvas
                    ref={canvasRef}
                    width={user?.disability === "Visual" ? 500 : 400}
                    height={user?.disability === "Visual" ? 400 : 300}
                    className={`${theme.canvasBorder} rounded-2xl bg-gradient-to-br from-white to-gray-50 cursor-crosshair ${theme.shadow} hover:shadow-2xl ${theme.animations}`}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    style={{ touchAction: "none" }}
                  />
                </div>
              </div>
            </div>

            {/* Luxurious Control Buttons */}
            <div className="flex justify-center gap-4 flex-wrap">
              <button
                onClick={clearCanvas}
                className={`px-8 py-4 rounded-2xl font-bold ${theme.buttonSecondary} ${theme.shadow} ${theme.animations} hover:scale-105 active:scale-95 flex items-center gap-3`}
              >
                <span className="text-2xl">🗑️</span>
                <span className={theme.fontSize}>Clear Canvas</span>
              </button>

              <button
                onClick={handleLetterSubmit}
                disabled={isCheckingLetter}
                className={`px-8 py-4 rounded-2xl font-bold ${theme.shadow} ${
                  theme.animations
                } hover:scale-105 active:scale-95 flex items-center gap-3 ${
                  isCheckingLetter
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : theme.button
                }`}
              >
                {isCheckingLetter ? (
                  <>
                    <div className="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full"></div>
                    <span className={theme.fontSize}>Analyzing Art...</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">✨</span>
                    <span className={theme.fontSize}>
                      Verify Letter "{letters[currentLetterIndex]}"
                    </span>
                  </>
                )}
              </button>

              {lastCheckResult && !lastCheckResult.correct && (
                <button
                  onClick={skipLetter}
                  className={`px-8 py-4 rounded-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white ${theme.shadow} ${theme.animations} hover:scale-105 active:scale-95 flex items-center gap-3`}
                >
                  <span className="text-2xl">⏭️</span>
                  <span className={theme.fontSize}>Continue Journey</span>
                </button>
              )}
            </div>
          </>
        ) : (
          // Creative Prompts Mode
          <>
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-5xl animate-bounce">🎨</span>
                <h1
                  className={`text-4xl font-bold ${theme.textPrimary} ${theme.glow}`}
                >
                  Creative Expression
                </h1>
                <span
                  className="text-5xl animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                >
                  🖌️
                </span>
              </div>
              <p
                className={`${theme.textSecondary} ${theme.fontSize} font-medium italic`}
              >
                Let your imagination flow freely
              </p>
            </div>

            <div className="text-center mb-8">
              <div
                className={`inline-block px-8 py-6 ${theme.letterDisplay} rounded-3xl ${theme.shadow} border-2`}
              >
                <p
                  className={`${theme.fontSize} font-medium ${theme.accent} italic leading-relaxed`}
                >
                  {prompts?.[currentPromptIndex] ||
                    `Create a beautiful artwork inspired by ${topic}`}
                </p>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex justify-center">
                <div className={`p-4 rounded-3xl ${theme.shadow} bg-white/90`}>
                  <canvas
                    ref={canvasRef}
                    width={user?.disability === "Visual" ? 500 : 400}
                    height={user?.disability === "Visual" ? 400 : 300}
                    className={`${theme.canvasBorder} rounded-2xl bg-gradient-to-br from-white to-gray-50 cursor-crosshair ${theme.shadow} hover:shadow-2xl ${theme.animations}`}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    style={{ touchAction: "none" }}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4 flex-wrap">
              <button
                onClick={clearCanvas}
                className={`px-8 py-4 rounded-2xl font-bold ${theme.buttonSecondary} ${theme.shadow} ${theme.animations} hover:scale-105 active:scale-95 flex items-center gap-3`}
              >
                <span className="text-2xl">🗑️</span>
                <span className={theme.fontSize}>Fresh Canvas</span>
              </button>

              <button
                onClick={handlePromptNext}
                className={`px-8 py-4 rounded-2xl font-bold ${theme.button} ${theme.shadow} ${theme.animations} hover:scale-105 active:scale-95 flex items-center gap-3`}
              >
                <span className="text-2xl">
                  {currentPromptIndex < (prompts?.length || 0) - 1
                    ? "➡️"
                    : "🏆"}
                </span>
                <span className={theme.fontSize}>
                  {currentPromptIndex < (prompts?.length || 0) - 1
                    ? "Next Creation"
                    : "Complete Masterpiece"}
                </span>
              </button>
            </div>

            <div className="text-center mt-6">
              <div
                className={`inline-block px-6 py-3 bg-white/60 rounded-full ${theme.shadow}`}
              >
                <span className={`${theme.textSecondary} text-sm font-medium`}>
                  Artwork {currentPromptIndex + 1} of {prompts?.length || 1}
                </span>
              </div>
            </div>
          </>
        )}

        {/* Accessibility Info */}
        {user?.disability && (
          <div className="mt-8 text-center">
            <div
              className={`inline-block px-6 py-3 bg-white/60 rounded-full ${theme.shadow}`}
            >
              <span className={`${theme.textSecondary} text-sm font-medium`}>
                🎯 Enhanced for {user.disability} creativity
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
