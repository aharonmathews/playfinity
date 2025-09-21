import { useState, useRef, useEffect } from "react";

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

    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1f2937";
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
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    setLastCheckResult(null);
  };

  // ✅ New function to check letter with Azure OCR
  const checkCurrentLetter = async () => {
    if (!canvasRef.current || isCheckingLetter) return;

    const canvas = canvasRef.current;
    const expectedLetter = letters[currentLetterIndex];

    try {
      setIsCheckingLetter(true);
      setLastCheckResult(null);

      // Convert canvas to base64
      const imageData = canvas.toDataURL("image/png");

      console.log(`🔤 Checking letter: expected '${expectedLetter}'`);

      // Send to backend for OCR
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
        // ✅ Letter is correct!
        const newCompleted = [...completedLetters];
        newCompleted[currentLetterIndex] = true;
        setCompletedLetters(newCompleted);

        // Move to next letter or complete game
        if (currentLetterIndex < letters.length - 1) {
          setTimeout(() => {
            setCurrentLetterIndex(currentLetterIndex + 1);
            clearCanvas();
            setLastCheckResult(null);
          }, 2000); // Show result for 2 seconds
        } else {
          // All letters completed!
          setTimeout(() => {
            if (prompts && prompts.length > 0) {
              setGameMode("prompts");
              clearCanvas();
              setLastCheckResult(null);
            } else {
              onGameComplete();
            }
          }, 2000);
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
    // Allow skipping if OCR fails multiple times
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
    <div className="text-center bg-[#f8fafc] text-gray-900 p-6 rounded-lg border border-gray-200">
      {gameMode === "letters" ? (
        <>
          <h2 className="text-2xl font-bold mb-4">✏️ Draw Each Letter</h2>
          <p className="text-lg mb-4">
            Word: <span className="font-bold">{gameWord}</span>
          </p>

          {/* Progress indicator */}
          <div className="flex justify-center gap-2 mb-4">
            {letters.map((letter, index) => (
              <div
                key={index}
                className={`w-8 h-8 rounded border-2 flex items-center justify-center text-sm font-bold ${
                  completedLetters[index]
                    ? "bg-green-500 text-white border-green-500"
                    : index === currentLetterIndex
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-gray-200 text-gray-600 border-gray-300"
                }`}
              >
                {letter}
              </div>
            ))}
          </div>

          <div className="mb-4">
            <p className="text-lg mb-2">
              Draw the letter:{" "}
              <span className="text-3xl font-bold text-blue-600">
                {letters[currentLetterIndex]}
              </span>
            </p>

            {/* OCR Result Display */}
            {lastCheckResult && (
              <div
                className={`p-3 rounded-lg mb-4 ${
                  lastCheckResult.success && lastCheckResult.correct
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {lastCheckResult.success && lastCheckResult.correct ? (
                  <div>
                    <div className="text-lg font-bold">✅ Correct!</div>
                    <div className="text-sm">
                      Detected: "{lastCheckResult.detected}"
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-lg font-bold">❌ Try Again</div>
                    <div className="text-sm">
                      Expected: "{lastCheckResult.expected}" | Detected: "
                      {lastCheckResult.detected || "Nothing clear"}"
                    </div>
                    {lastCheckResult.error && (
                      <div className="text-xs mt-1">
                        Error: {lastCheckResult.error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mb-4">
            <canvas
              ref={canvasRef}
              width={400}
              height={300}
              className="border-2 border-gray-300 rounded-lg bg-white cursor-crosshair mx-auto block"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              style={{ touchAction: "none" }}
            />
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={clearCanvas}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              🗑️ Clear
            </button>

            <button
              onClick={handleLetterSubmit}
              disabled={isCheckingLetter}
              className={`px-6 py-2 rounded-md font-semibold ${
                isCheckingLetter
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isCheckingLetter ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Checking...
                </div>
              ) : (
                `✅ Check Letter "${letters[currentLetterIndex]}"`
              )}
            </button>

            {/* Skip button (show after failed attempts) */}
            {lastCheckResult && !lastCheckResult.correct && (
              <button
                onClick={skipLetter}
                className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
              >
                ⏭️ Skip
              </button>
            )}
          </div>
        </>
      ) : (
        // Existing prompts mode code...
        <>
          <h2 className="text-2xl font-bold mb-4">🎨 Creative Drawing</h2>
          <p className="text-lg mb-4 italic">
            {prompts?.[currentPromptIndex] ||
              `Draw something related to ${topic}`}
          </p>

          <div className="mb-4">
            <canvas
              ref={canvasRef}
              width={400}
              height={300}
              className="border-2 border-gray-300 rounded-lg bg-white cursor-crosshair mx-auto block"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              style={{ touchAction: "none" }}
            />
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={clearCanvas}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              🗑️ Clear
            </button>

            <button
              onClick={handlePromptNext}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold"
            >
              {currentPromptIndex < (prompts?.length || 0) - 1
                ? "➡️ Next Drawing"
                : "✅ Complete Drawing Game"}
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-2">
            Drawing {currentPromptIndex + 1} of {prompts?.length || 1}
          </p>
        </>
      )}
    </div>
  );
}
