import { useState, useRef, useEffect } from "react";

type Props = {
  topic: string;
  onGameComplete?: () => void;
  word?: string; // ✅ The word from game1 (spelling game)
  prompts?: string[]; // ✅ Dynamic prompts from JSON (fallback)
};

export function DrawingGame({ topic, onGameComplete, word, prompts }: Props) {
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<null | "correct" | "wrong">(null);
  const [message, setMessage] = useState<string>("");
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ✅ Use the word from spelling game, or topic name, or fallback prompts
  const gameWord =
    word || topic.toUpperCase().replace(/[^A-Z]/g, "") || "HEART";
  const letters = gameWord.split("");
  const currentLetter = letters[currentLetterIndex] || "H";

  // ✅ If no word provided, fall back to concept prompts
  const shouldDrawLetters = word || !prompts;

  const navigateHome = () => (window.location.href = "/");

  const uploadDrawing = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const imageData = canvas.toDataURL("image/png");

    try {
      const response = await fetch("http://127.0.0.1:8000/upload/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: imageData,
          label: shouldDrawLetters
            ? `Letter ${currentLetter}`
            : `Concept: ${prompts?.[currentLetterIndex]}`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Image saved successfully:", data);
        alert("Drawing saved to backend ✅");
      } else {
        console.error("Failed to upload:", response.statusText);
        alert("Upload failed ❌");
      }
    } catch (err) {
      console.error("Error uploading drawing:", err);
      alert("Error while uploading ❌");
    }
  };

  // ✅ Letter recognition (simplified)
  const validateLetterDrawing = (drawnData: ImageData): boolean => {
    const data = drawnData.data;
    let drawingPixels = 0;

    // Count non-transparent pixels
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) {
        // alpha > 0
        drawingPixels++;
      }
    }

    // Must have substantial drawing (at least 100 pixels for a letter)
    return drawingPixels >= 100;
  };

  // ✅ General drawing validation
  const validateConceptDrawing = (drawnData: ImageData): boolean => {
    const data = drawnData.data;
    let drawingPixels = 0;

    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) {
        drawingPixels++;
      }
    }

    return drawingPixels >= 150; // Slightly higher threshold for concepts
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const checkDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // ✅ Use appropriate validation based on mode
    const isValid = shouldDrawLetters
      ? validateLetterDrawing(imageData)
      : validateConceptDrawing(imageData);

    if (isValid) {
      setFeedback("correct");
      setMessage(
        shouldDrawLetters
          ? `Great job drawing the letter "${currentLetter}"!`
          : "Excellent drawing!"
      );
      setScore((s) => s + 1);

      setTimeout(() => {
        setFeedback(null);
        setMessage("");
        clearCanvas();

        const maxIndex = shouldDrawLetters
          ? letters.length
          : prompts?.length || 1;

        if (currentLetterIndex < maxIndex - 1) {
          setCurrentLetterIndex((i) => i + 1);
        } else {
          // All letters/prompts completed!
          onGameComplete?.();
        }
      }, 1500);
    } else {
      setFeedback("wrong");
      setMessage(
        shouldDrawLetters
          ? `Try drawing the letter "${currentLetter}" more clearly!`
          : "Please draw something more substantial!"
      );
      setTimeout(() => {
        setFeedback(null);
        setMessage("");
      }, 1500);
    }
  };

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  // ✅ Calculate progress based on mode
  const totalSteps = shouldDrawLetters ? letters.length : prompts?.length || 1;
  const progress = Math.round(((currentLetterIndex + 1) / totalSteps) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {shouldDrawLetters
            ? `Letter ${currentLetterIndex + 1} of ${letters.length}`
            : `Step ${currentLetterIndex + 1} of ${prompts?.length || 1}`}
        </div>
        <div className="text-sm font-medium">Score: {score}</div>
      </div>

      <div className="h-2 bg-gray-200 rounded">
        <div
          className="h-2 bg-emerald-600 rounded"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Topic: <span className="text-indigo-600">{topic}</span>
        </h2>

        {shouldDrawLetters ? (
          // ✅ Letter Drawing Mode
          <div className="space-y-3">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-lg font-medium text-yellow-800 mb-2">
                Draw the letter:
              </p>
              <div className="text-6xl font-bold text-indigo-600 tracking-wider">
                {currentLetter}
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700">
                Word: <span className="font-semibold">{gameWord}</span>
                <span className="ml-2">
                  ({currentLetterIndex + 1}/{letters.length})
                </span>
              </p>
              <div className="text-lg tracking-widest mt-1">
                {letters.map((letter, idx) => (
                  <span
                    key={idx}
                    className={
                      idx === currentLetterIndex
                        ? "text-indigo-600 underline font-bold"
                        : idx < currentLetterIndex
                        ? "text-green-600 font-bold"
                        : "text-gray-400"
                    }
                  >
                    {letter}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // ✅ Concept Drawing Mode (fallback)
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-lg font-medium text-blue-800">
              {prompts?.[currentLetterIndex] ||
                `Draw something related to ${topic}`}
            </p>
          </div>
        )}
      </div>

      {message && (
        <div
          className={`text-center py-2 text-lg font-medium ${
            feedback === "correct" ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {message}
        </div>
      )}

      <div className="flex justify-center">
        <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
          <canvas
            ref={canvasRef}
            width={400}
            height={300}
            className="border border-gray-200 rounded cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <div className="absolute top-6 right-6 z-50">
          <button
            onClick={navigateHome}
            className="rounded bg-indigo-600 text-white px-4 py-2 shadow-lg hover:bg-indigo-700"
          >
            Home
          </button>
        </div>
        <button
          onClick={clearCanvas}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Clear Canvas
        </button>
        <button
          onClick={checkDrawing}
          disabled={feedback !== null}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Submit Letter
        </button>
        <button
          onClick={uploadDrawing}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Save Drawing
        </button>
      </div>

      <div className="text-center text-sm text-gray-500">
        {shouldDrawLetters ? (
          <div>
            <p>
              Draw the letter <strong>{currentLetter}</strong> clearly in the
              canvas above
            </p>
            <p>Try to make it as recognizable as possible!</p>
            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-xs">
              <p className="font-medium text-blue-800 dark:text-blue-200">
                Letter Drawing Tips:
              </p>
              <p>• Draw the letter large and clear</p>
              <p>• Use proper letter formation</p>
              <p>• Make sure lines connect properly</p>
            </div>
          </div>
        ) : (
          <div>
            <p>Follow the prompt above and draw in the canvas</p>
            <p>Click "Submit Drawing" when you're done</p>
          </div>
        )}
      </div>
    </div>
  );
}
