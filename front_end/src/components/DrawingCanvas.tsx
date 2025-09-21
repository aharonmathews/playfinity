import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Tag {
  name: string;
  confidence: number;
}

interface AnalysisResult {
  success: boolean;
  tags: Tag[];
  description: string;
  analysis: any;
}

export function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#ef4444");
  const [brush, setBrush] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [generatingGames, setGeneratingGames] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>("");

  const navigate = useNavigate();

  function fillWhiteBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) {
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  useEffect(() => {
    function resize() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const prev = canvas.width && canvas.height ? canvas.toDataURL() : null;
      canvas.width = Math.max(1, Math.floor(rect.width));
      canvas.height = Math.max(1, Math.floor(rect.height));
      const ctx = canvas.getContext("2d");
      if (ctx) {
        fillWhiteBackground(ctx, rect.width, rect.height);
        if (prev) {
          const img = new Image();
          img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
          img.src = prev;
        }
      }
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  function getCtx() {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d");
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = getCtx();
    if (!ctx) return;
    setIsDrawing(true);
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    const ctx = getCtx();
    if (!ctx) return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = brush;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  function handlePointerUp() {
    setIsDrawing(false);
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    const rect = canvas.getBoundingClientRect();
    fillWhiteBackground(ctx, rect.width, rect.height);
    setResult(null);
    setSelectedTag("");
  }

  async function handleSubmit() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setLoading(true);
    setResult(null);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setLoading(false);
        return;
      }

      try {
        const formData = new FormData();
        formData.append("file", blob, "drawing.png");

        console.log("🔍 Sending image to backend for analysis...");
        const res = await fetch("http://127.0.0.1:8000/predict", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data: AnalysisResult = await res.json();
        console.log("✅ Analysis result:", data);
        setResult(data);
      } catch (err) {
        console.error("❌ Error submitting image:", err);
        setResult({
          success: false,
          tags: [],
          description: `Error: ${
            err instanceof Error ? err.message : "Unknown error"
          }. Make sure the backend is running on http://127.0.0.1:8000`,
          analysis: null,
        });
      } finally {
        setLoading(false);
      }
    }, "image/png");
  }

  // ✅ Single unified function for handling topic clicks
  const handleTagClick = async (tagName: string) => {
    console.log(`🎯 Topic selected: ${tagName}`);
    setSelectedTag(tagName);
    setGeneratingGames(true);

    try {
      // Step 1: Check if topic exists in Firebase
      console.log(`🔍 Validating topic: ${tagName}`);
      const validateResponse = await fetch(
        "http://127.0.0.1:8000/validate-topic",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: tagName,
            age_group: "7-11",
          }),
        }
      );

      if (!validateResponse.ok) {
        throw new Error(`Validation failed: ${validateResponse.status}`);
      }

      const validation = await validateResponse.json();
      console.log("📋 Validation result:", validation);

      if (validation.success) {
        if (validation.games_exist) {
          // ✅ Games exist in Firebase, use them directly
          console.log("✅ Using existing games from Firebase");
          navigate("/custom-games", {
            state: {
              topic: tagName,
              gameData: validation.games,
              images: validation.games.gallery?.images || null,
              source: "firebase",
            },
          });
        } else {
          // ❌ Games don't exist, generate new ones
          console.log("🎨 Generating new games and images...");
          const generateResponse = await fetch(
            "http://127.0.0.1:8000/generate-games",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                topic: tagName,
                age_group: "7-11",
              }),
            }
          );

          if (!generateResponse.ok) {
            throw new Error(`Generation failed: ${generateResponse.status}`);
          }

          const gameResult = await generateResponse.json();
          console.log("🎮 Generation result:", gameResult);

          if (gameResult.success) {
            navigate("/custom-games", {
              state: {
                topic: tagName,
                gameData: gameResult.games,
                images: gameResult.images || null,
                source: "generated",
              },
            });
          } else {
            throw new Error(gameResult.error || "Failed to generate games");
          }
        }
      } else {
        throw new Error(validation.error || "Topic validation failed");
      }
    } catch (error) {
      console.error("❌ Error handling topic:", error);
      alert(
        `Failed to load games for "${tagName}". Error: ${error.message}. Please make sure the backend is running.`
      );
    } finally {
      setGeneratingGames(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <label className="text-sm">
          Color
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="ml-2 align-middle"
          />
        </label>
        <label className="text-sm">
          Brush
          <input
            type="range"
            min={1}
            max={24}
            value={brush}
            onChange={(e) => setBrush(Number(e.target.value))}
            className="ml-2 align-middle"
          />
          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
            {brush}px
          </span>
        </label>
        <button
          type="button"
          onClick={clearCanvas}
          className="ml-auto rounded border px-3 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-900"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="rounded border px-3 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Analyze Drawing"}
        </button>
      </div>

      <div className="h-[60vh] sm:h-[70vh]">
        <canvas
          ref={canvasRef}
          className="h-full w-full rounded-md bg-white touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onContextMenu={(e) => e.preventDefault()}
          onPointerCancel={handlePointerUp}
        />
      </div>

      {/* ✅ Connection status indicator */}
      <div className="mt-2 text-xs text-gray-500">
        Backend Status:
        <span className="ml-1 px-2 py-1 rounded text-white text-xs bg-green-500">
          {loading || generatingGames ? "🟢 Connected" : "⚪ Ready"}
        </span>
      </div>

      {/* ✅ Loading state for game generation */}
      {generatingGames && (
        <div className="mt-3 p-3 rounded bg-yellow-100 border border-yellow-300">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
            <span className="text-yellow-800 text-sm font-medium">
              🎮{" "}
              {selectedTag
                ? `Processing "${selectedTag}"...`
                : "Loading games..."}
            </span>
          </div>
          <p className="text-xs text-yellow-700 mt-1">
            Checking database and generating content...
          </p>
        </div>
      )}

      {result && !generatingGames && (
        <div className="mt-3 p-3 rounded bg-gray-100 dark:bg-gray-900">
          {result.success ? (
            <div>
              <h4 className="font-semibold text-green-600 mb-2">
                ✅ Analysis Results:
              </h4>

              {result.description && (
                <div className="mb-3">
                  <strong>Description:</strong>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {result.description}
                  </p>
                </div>
              )}

              {result.tags && result.tags.length > 0 && (
                <div>
                  <strong>
                    Click on a topic to generate educational games:
                  </strong>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {result.tags.map((tag, index) => (
                      <button
                        key={index}
                        onClick={() => handleTagClick(tag.name)}
                        disabled={generatingGames}
                        className={`px-3 py-2 text-white rounded text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed ${
                          selectedTag === tag.name
                            ? "bg-purple-600 hover:bg-purple-700"
                            : "bg-blue-500 hover:bg-blue-600"
                        } ${generatingGames ? "bg-blue-300" : ""}`}
                      >
                        🎮 {tag.name} ({tag.confidence}%)
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Click any topic above to start learning games!
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-red-600">
              <strong>❌ Error:</strong> {result.description}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
