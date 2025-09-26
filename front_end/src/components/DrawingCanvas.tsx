import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

interface Tag {
  name: string;
  confidence: number;
}

interface AnalysisResult {
  success: boolean;
  tags: Tag[];
  description: string;
  analysis: any;
  primary_label?: string;
  all_related_topics?: string[];
  flattened_topics?: string[];
  domain_topics?: any;
  auto_generated_topics?: boolean;
  // Enhanced properties for better display
  displayTopics?: string[];
  originalDrawing?: string;
  totalTopicCount?: number;
}

const GAME_ACCESS = {
  ADHD: {
    allowedGames: ["imageReordering", "quiz"],
    restrictedMessage:
      "Games focused on attention and logical thinking for ADHD learners.",
  },
  Dyslexia: {
    allowedGames: ["spelling", "drawing", "imageReordering"],
    restrictedMessage:
      "Games focused on reading, phonics, and visual processing for dyslexic learners.",
  },
  Visual: {
    allowedGames: ["quiz", "audio"],
    restrictedMessage: "Audio-focused games for visual impairment support.",
  },
  Autism: {
    allowedGames: ["drawing", "quiz", "pattern"],
    restrictedMessage:
      "Structured games suitable for autism spectrum learners.",
  },
  None: {
    allowedGames: [
      "imageReordering",
      "quiz",
      "spelling",
      "drawing",
      "pattern",
      "audio",
    ],
    restrictedMessage: "All games available.",
  },
  Other: {
    allowedGames: ["imageReordering", "quiz", "drawing"],
    restrictedMessage: "Curated games for your learning needs.",
  },
};

export function DrawingCanvas({ theme }: { theme: any }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#ef4444");
  const [brush, setBrush] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [generatingGames, setGeneratingGames] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>(""); // Changed from selectedTag

  const navigate = useNavigate();
  const { user } = useUser();

  const userGameAccess =
    user && user.disability
      ? GAME_ACCESS[user.disability] || GAME_ACCESS["None"]
      : GAME_ACCESS["None"];

  // Color palette based on disability theme
  const colorPalette = {
    ADHD: ["#10B981", "#14B8A6", "#06B6D4", "#3B82F6", "#EF4444", "#F59E0B"],
    Dyslexia: [
      "#3B82F6",
      "#6366F1",
      "#8B5CF6",
      "#A855F7",
      "#EC4899",
      "#F59E0B",
    ],
    Visual: ["#000000", "#FFFFFF", "#F59E0B", "#EAB308", "#DC2626", "#059669"],
    Autism: ["#64748B", "#475569", "#334155", "#1E293B", "#0F172A", "#374151"],
    None: ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899"],
    Other: ["#8B5CF6", "#A855F7", "#C084FC", "#DDD6FE", "#EC4899", "#F472B6"],
  };

  const themeColors = colorPalette[user?.disability || "None"];

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
    setSelectedTopic(""); // Reset selected topic
  }

  // 🆕 Enhanced submit handler that processes flattened topics
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

        const res = await fetch("http://127.0.0.1:8000/predict", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data: AnalysisResult = await res.json();

        if (data.success) {
          // 🆕 Enhanced result processing
          const enhancedResult = {
            ...data,
            // Use flattened topics as the main display topics
            displayTopics: data.flattened_topics || [],
            originalDrawing: data.primary_label || "Drawing",
            totalTopicCount: (data.flattened_topics || []).length,
          };

          setResult(enhancedResult);

          // Enhanced logging
          console.log(`🎯 Original drawing detected: ${data.primary_label}`);
          console.log(
            `📚 Generated ${
              data.flattened_topics?.length || 0
            } educational topics from all detected elements`
          );
          console.log(
            `🎨 Educational topics: ${
              data.flattened_topics?.join(", ") || "None"
            }`
          );

          if (data.tags && data.tags.length > 0) {
            console.log(
              `🏷️ Original Azure tags: ${data.tags
                .map((t) => `${t.name}(${t.confidence}%)`)
                .join(", ")}`
            );
          }
        } else {
          setResult(data);
        }
      } catch (err) {
        setResult({
          success: false,
          tags: [],
          description: `Error: ${
            err instanceof Error ? err.message : "Unknown error"
          }. Make sure the backend is running on http://127.0.0.1:8000`,
          analysis: null,
          displayTopics: [],
          originalDrawing: "Error",
        });
      } finally {
        setLoading(false);
      }
    }, "image/png");
  }

  // 🆕 Updated topic click handler (changed from handleTagClick to handleTopicClick)
  const handleTopicClick = async (topicName: string) => {
    setSelectedTopic(topicName);
    setGeneratingGames(true);

    try {
      const validateResponse = await fetch(
        "http://127.0.0.1:8000/validate-topic",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: topicName,
            age_group: "7-11",
            user_disability: user?.disability || "None",
            allowed_games: userGameAccess.allowedGames,
          }),
        }
      );

      if (!validateResponse.ok) {
        throw new Error(`Validation failed: ${validateResponse.status}`);
      }

      const validation = await validateResponse.json();

      if (validation.success) {
        if (validation.games_exist) {
          navigate("/custom-games", {
            state: {
              topic: topicName,
              gameData: validation.games,
              images: validation.games.gallery?.images || null,
              source: "firebase",
              userDisability: user?.disability || "None",
              allowedGames: userGameAccess.allowedGames,
              disabilityMessage: userGameAccess.restrictedMessage,
              originalDrawing: result?.originalDrawing, // Pass original drawing context
            },
          });
        } else {
          const generateResponse = await fetch(
            "http://127.0.0.1:8000/generate-games",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                topic: topicName,
                age_group: "7-11",
                user_disability: user?.disability || "None",
                allowed_games: userGameAccess.allowedGames,
              }),
            }
          );

          if (!generateResponse.ok) {
            throw new Error(`Generation failed: ${generateResponse.status}`);
          }

          const gameResult = await generateResponse.json();

          if (gameResult.success) {
            navigate("/custom-games", {
              state: {
                topic: topicName,
                gameData: gameResult.games,
                images: gameResult.images || null,
                source: "generated",
                userDisability: user?.disability || "None",
                allowedGames: userGameAccess.allowedGames,
                disabilityMessage: userGameAccess.restrictedMessage,
                originalDrawing: result?.originalDrawing, // Pass original drawing context
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
      alert(
        `Failed to load games for "${topicName}". Error: ${error.message}. Please make sure the backend is running.`
      );
    } finally {
      setGeneratingGames(false);
    }
  };

  return (
    <div
      className={`rounded-3xl ${theme.border} border ${theme.cardBg} ${theme.shadow}`}
    >
      {/* ✅ Enhanced User Profile Display */}
      {user && (
        <div
          className={`m-6 mb-4 p-4 bg-gradient-to-r from-${theme.primary}-100 to-${theme.secondary}-100 rounded-2xl ${theme.border} border`}
        >
          <div className={`flex items-center gap-3 ${theme.fontSize}`}>
            <span className="text-2xl">🎯</span>
            <div>
              <span className={`font-bold ${theme.textPrimary}`}>
                Learning Profile:
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`px-3 py-1 bg-${theme.primary}-200 ${theme.textPrimary} rounded-full text-sm font-semibold`}
                >
                  {user.disability || "General"}
                </span>
                <span className={`${theme.textSecondary} text-sm`}>
                  {userGameAccess.restrictedMessage}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Enhanced Drawing Controls */}
      <div
        className={`flex flex-wrap items-center gap-6 mx-6 mb-6 ${theme.fontSize}`}
      >
        <div className="flex items-center gap-3">
          <label
            className={`font-semibold ${theme.textPrimary} flex items-center gap-2`}
          >
            <span className="text-xl">🎨</span>
            Color:
          </label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className={`w-12 h-12 rounded-xl border-2 ${theme.border} cursor-pointer ${theme.focusRing}`}
          />
        </div>

        {/* ✅ Theme Color Palette */}
        <div className="flex items-center gap-2">
          <span className={`text-sm ${theme.textMuted} font-medium`}>
            Quick colors:
          </span>
          <div className="flex gap-2">
            {themeColors.map((themeColor, index) => (
              <button
                key={index}
                onClick={() => setColor(themeColor)}
                className={`w-8 h-8 rounded-lg border-2 ${
                  color === themeColor
                    ? "ring-4 ring-offset-2"
                    : "hover:scale-110"
                } ${theme.animations} ${theme.focusRing}`}
                style={{ backgroundColor: themeColor }}
                title={`Color ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label
            className={`font-semibold ${theme.textPrimary} flex items-center gap-2`}
          >
            <span className="text-xl">🖌️</span>
            Brush:
          </label>
          <input
            type="range"
            min={1}
            max={user?.disability === "Visual" ? 32 : 24}
            value={brush}
            onChange={(e) => setBrush(Number(e.target.value))}
            className={`w-24 ${theme.focusRing}`}
          />
          <span
            className={`${theme.textMuted} text-sm font-mono bg-${theme.primary}-50 px-2 py-1 rounded-lg`}
          >
            {brush}px
          </span>
        </div>

        <div className="flex gap-3 ml-auto">
          <button
            type="button"
            onClick={clearCanvas}
            className={`px-6 py-3 rounded-2xl ${theme.border} border ${theme.textSecondary} hover:${theme.textPrimary} hover:bg-red-50 ${theme.animations} ${theme.focusRing} flex items-center gap-2 font-semibold`}
          >
            <span className="text-lg">🗑️</span>
            Clear
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className={`${theme.button} text-white px-8 py-3 rounded-2xl ${theme.animations} disabled:opacity-50 ${theme.focusRing} flex items-center gap-2 font-bold ${theme.shadow} hover:shadow-lg`}
          >
            <span className="text-lg">{loading ? "🔍" : "✨"}</span>
            {loading ? "Analyzing..." : "Analyze Drawing"}
          </button>
        </div>
      </div>

      {/* ✅ Enhanced Canvas */}
      <div className="mx-6 mb-6">
        <div
          className={`h-[60vh] sm:h-[70vh] rounded-2xl overflow-hidden ${theme.shadow} ring-1 ring-gray-200`}
        >
          <canvas
            ref={canvasRef}
            className="h-full w-full bg-white touch-none cursor-crosshair"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onContextMenu={(e) => e.preventDefault()}
            onPointerCancel={handlePointerUp}
            style={{
              backgroundImage:
                user?.disability === "Visual"
                  ? "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)"
                  : "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0)",
              backgroundSize: "20px 20px",
            }}
          />
        </div>
      </div>

      {/* ✅ Enhanced Status and Loading */}
      <div className="mx-6 mb-4">
        <div
          className={`flex items-center justify-between p-4 bg-${theme.primary}-50 rounded-2xl ${theme.border} border`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🔌</span>
            <span className={`text-sm font-semibold ${theme.textPrimary}`}>
              Backend Status:
            </span>
            <span
              className={`text-xs px-3 py-1 rounded-full font-medium ${
                loading || generatingGames
                  ? "bg-green-200 text-green-800"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {loading || generatingGames ? "🟢 Connected" : "⚪ Ready"}
            </span>
          </div>

          {(loading || generatingGames) && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              <span className={`text-sm ${theme.textSecondary}`}>
                {loading ? "Analyzing drawing..." : "Generating games..."}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ✅ Enhanced Game Generation Loading */}
      {generatingGames && (
        <div className="mx-6 mb-6">
          <div
            className={`p-6 rounded-2xl bg-gradient-to-r from-${theme.primary}-100 to-${theme.secondary}-100 ${theme.border} border`}
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-current border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl">🎮</span>
                </div>
              </div>
              <div>
                <h4 className={`text-lg font-bold ${theme.textPrimary} mb-1`}>
                  {selectedTopic
                    ? `Creating "${selectedTopic}" Games`
                    : "Processing Your Drawing"}
                </h4>
                <p className={`${theme.textSecondary} text-sm`}>
                  Generating personalized learning games from your "
                  {result?.originalDrawing}" drawing...
                </p>
                <div className={`flex items-center gap-2 mt-2`}>
                  <div
                    className={`w-2 h-2 bg-${theme.primary}-400 rounded-full animate-pulse`}
                  ></div>
                  <div
                    className={`w-2 h-2 bg-${theme.primary}-400 rounded-full animate-pulse`}
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className={`w-2 h-2 bg-${theme.primary}-400 rounded-full animate-pulse`}
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 Enhanced Results Display with Educational Topics */}
      {result && !generatingGames && (
        <div className="mx-6 mb-6">
          <div
            className={`rounded-2xl overflow-hidden ${theme.shadow} ${theme.border} border`}
          >
            {result.success ? (
              <div className={`${theme.cardBg}`}>
                {/* Success Header */}
                <div
                  className={`p-6 bg-gradient-to-r from-green-100 to-emerald-100 ${theme.border} border-b`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">✨</span>
                    <div>
                      <h4 className="text-lg font-bold text-green-800">
                        Your "{result.originalDrawing}" Drawing Analysis
                        Complete!
                      </h4>
                      <p className="text-sm text-green-700">
                        We've generated {result.totalTopicCount} educational
                        topics from all elements in your drawing
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Description */}
                  {result.description && (
                    <div>
                      <h5
                        className={`font-semibold ${theme.textPrimary} mb-2 flex items-center gap-2`}
                      >
                        <span className="text-lg">📝</span>
                        What We See:
                      </h5>
                      <p
                        className={`${theme.textSecondary} leading-relaxed bg-${theme.primary}-50 p-4 rounded-xl`}
                      >
                        {result.description}
                      </p>
                    </div>
                  )}

                  {/* 🆕 Educational Topics from All Detected Elements */}
                  {result.displayTopics && result.displayTopics.length > 0 && (
                    <div>
                      <h5
                        className={`font-semibold ${theme.textPrimary} mb-4 flex items-center gap-2`}
                      >
                        <span className="text-lg">📚</span>
                        Educational Learning Topics ({result.totalTopicCount}):
                        <span
                          className={`text-sm ${theme.textMuted} bg-${theme.primary}-100 px-3 py-1 rounded-full`}
                        >
                          Generated from your "{result.originalDrawing}" drawing
                        </span>
                      </h5>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {result.displayTopics.map((topic, index) => (
                          <button
                            key={index}
                            onClick={() => handleTopicClick(topic)}
                            disabled={generatingGames}
                            className={`group relative overflow-hidden rounded-2xl p-6 text-left ${
                              theme.animations
                            } ${
                              theme.shadow
                            } hover:shadow-lg transform hover:scale-105 ${
                              selectedTopic === topic
                                ? `bg-gradient-to-r from-${theme.primary}-600 to-${theme.secondary}-600 text-white`
                                : `${theme.cardBg} hover:bg-gradient-to-r hover:from-${theme.primary}-50 hover:to-${theme.secondary}-50`
                            } ${
                              generatingGames
                                ? "cursor-not-allowed opacity-50"
                                : "cursor-pointer"
                            }`}
                          >
                            <div className="relative z-10">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-2xl group-hover:animate-bounce">
                                  🎯
                                </span>
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    selectedTopic === topic
                                      ? "bg-white/20"
                                      : `bg-${theme.primary}-200 ${theme.textPrimary}`
                                  }`}
                                >
                                  Educational Topic
                                </span>
                              </div>
                              <h6 className="text-lg font-bold mb-2">
                                {topic}
                              </h6>
                              <p
                                className={`text-sm ${
                                  selectedTopic === topic
                                    ? "text-white/80"
                                    : theme.textSecondary
                                } mb-3`}
                              >
                                Learn about {topic.toLowerCase()} through
                                interactive games
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium opacity-75">
                                  {userGameAccess.allowedGames.length} game
                                  types • {user?.disability || "General"}{" "}
                                  optimized
                                </span>
                                <span className="text-lg ml-auto group-hover:translate-x-1 transition-transform">
                                  →
                                </span>
                              </div>
                            </div>

                            {/* Hover effect overlay */}
                            <div
                              className={`absolute inset-0 bg-gradient-to-r from-${theme.primary}-500/10 to-${theme.secondary}-500/10 opacity-0 group-hover:opacity-100 ${theme.animations}`}
                            ></div>
                          </button>
                        ))}
                      </div>

                      <div
                        className={`mt-4 p-4 bg-${theme.primary}-50 rounded-xl ${theme.border} border`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🎨</span>
                          <p className={`text-sm ${theme.textSecondary}`}>
                            <strong>Smart Topic Generation:</strong> We analyzed
                            your "{result.originalDrawing}" drawing and
                            generated {result.totalTopicCount} educational
                            topics from all detected elements, covering multiple
                            domains of learning relevant to your artwork.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Original detected elements for reference */}
                  {result.tags && result.tags.length > 0 && (
                    <div className="border-t pt-4">
                      <h6
                        className={`text-sm font-medium ${theme.textMuted} mb-3 flex items-center gap-2`}
                      >
                        <span className="text-base">🏷️</span>
                        Elements detected in your drawing:
                      </h6>
                      <div className="flex flex-wrap gap-2">
                        {result.tags.slice(0, 8).map((tag, index) => (
                          <span
                            key={index}
                            className={`px-3 py-1 bg-${theme.primary}-100 text-${theme.primary}-700 rounded-full text-xs font-medium`}
                          >
                            {tag.name} ({tag.confidence}%)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Error State */
              <div className={`${theme.cardBg} p-6`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">❌</span>
                  <div>
                    <h4 className="text-lg font-bold text-red-600">
                      Analysis Failed
                    </h4>
                    <p className="text-sm text-red-500">
                      We couldn't process your drawing
                    </p>
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-700 text-sm leading-relaxed">
                    <strong>Error:</strong> {result.description}
                  </p>
                  <div className="mt-3 text-xs text-red-600">
                    💡 <strong>Troubleshooting:</strong> Make sure you've drawn
                    something clear and the backend server is running on
                    http://127.0.0.1:8000
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ✅ Enhanced Instructions */}
      {!result && !loading && !generatingGames && (
        <div className="mx-6 mb-6">
          <div
            className={`p-6 bg-gradient-to-r from-${theme.primary}-50 to-${theme.secondary}-50 rounded-2xl ${theme.border} border`}
          >
            <div className="text-center">
              <span className="text-4xl mb-4 block">🎨</span>
              <h4 className={`text-xl font-bold ${theme.textPrimary} mb-2`}>
                Ready to Create & Learn?
              </h4>
              <p className={`${theme.textSecondary} mb-4 leading-relaxed`}>
                Draw anything you'd like to learn about! Our AI will analyze
                your drawing and create comprehensive educational topics from
                all detected elements, generating personalized learning games
                for your {user?.disability || "unique"} learning style.
              </p>
              <div
                className={`grid grid-cols-1 md:grid-cols-4 gap-4 text-sm ${theme.textSecondary}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">✏️</span>
                  <span>Draw anything</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔍</span>
                  <span>AI detects elements</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">📚</span>
                  <span>Generate topics</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎮</span>
                  <span>Play & learn</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
