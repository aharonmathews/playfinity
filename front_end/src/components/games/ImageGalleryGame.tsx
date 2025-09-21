import { useState, useEffect } from "react";
import { useUser } from "../../contexts/UserContext";

type GameProps = {
  topic: string;
  onGameComplete: () => void;
  images?: Array<{
    url?: string;
    image_base64?: string;
    prompt: string;
    index: number;
  }> | null;
};

const fallbackImageUrls = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80",
];

export function ImageGalleryGame({ topic, onGameComplete, images }: GameProps) {
  const { user } = useUser();

  // Get disability-specific theme
  const getTheme = () => {
    const baseTheme = {
      animations: "transition-all duration-700 ease-in-out",
      shadow: "shadow-2xl drop-shadow-xl",
      glow: "drop-shadow-[0_0_30px_rgba(139,92,246,0.4)]",
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
          button:
            "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white",
          imageFrame: "border-4 border-emerald-300 shadow-emerald-200/50",
          dragFrame: "border-4 border-emerald-400 bg-emerald-50/80",
          glow: "drop-shadow-[0_0_30px_rgba(16,185,129,0.5)]",
          fontSize: "text-lg",
          imageSize: "w-96 h-64",
          gridSize: "w-40 h-28",
        };
      case "Dyslexia":
        return {
          ...baseTheme,
          bg: "bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100",
          cardBg: "bg-white/98 backdrop-blur-xl border border-blue-200/50",
          textPrimary: "text-blue-900",
          textSecondary: "text-blue-700",
          accent: "text-indigo-600",
          button:
            "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white",
          imageFrame: "border-4 border-blue-300 shadow-blue-200/50",
          dragFrame: "border-4 border-blue-400 bg-blue-50/80",
          glow: "drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]",
          fontSize: "text-xl",
          imageSize: "w-96 h-64",
          gridSize: "w-40 h-28",
        };
      case "Visual":
        return {
          ...baseTheme,
          bg: "bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100",
          cardBg: "bg-white/98 backdrop-blur-xl border border-amber-300/70",
          textPrimary: "text-gray-900",
          textSecondary: "text-gray-800",
          accent: "text-amber-700",
          button:
            "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white",
          imageFrame: "border-6 border-amber-400 shadow-amber-300/60",
          dragFrame: "border-6 border-amber-500 bg-amber-100/90",
          glow: "drop-shadow-[0_0_40px_rgba(245,158,11,0.6)]",
          fontSize: "text-2xl",
          imageSize: "w-[480px] h-80",
          gridSize: "w-48 h-36",
        };
      case "Autism":
        return {
          ...baseTheme,
          bg: "bg-gradient-to-br from-slate-100 via-gray-50 to-zinc-100",
          cardBg: "bg-white/98 backdrop-blur-xl border border-slate-200/50",
          textPrimary: "text-slate-900",
          textSecondary: "text-slate-700",
          accent: "text-slate-600",
          button:
            "bg-gradient-to-r from-slate-500 to-gray-600 hover:from-slate-600 hover:to-gray-700 text-white",
          imageFrame: "border-4 border-slate-300 shadow-slate-200/50",
          dragFrame: "border-4 border-slate-400 bg-slate-50/80",
          glow: "drop-shadow-[0_0_25px_rgba(100,116,139,0.4)]",
          fontSize: "text-lg",
          imageSize: "w-96 h-64",
          gridSize: "w-40 h-28",
        };
      default:
        return {
          ...baseTheme,
          bg: "bg-gradient-to-br from-violet-100 via-purple-50 to-fuchsia-100",
          cardBg: "bg-white/95 backdrop-blur-xl border border-violet-200/50",
          textPrimary: "text-violet-900",
          textSecondary: "text-violet-700",
          accent: "text-purple-600",
          button:
            "bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white",
          imageFrame: "border-4 border-violet-300 shadow-violet-200/50",
          dragFrame: "border-4 border-violet-400 bg-violet-50/80",
          glow: "drop-shadow-[0_0_30px_rgba(139,92,246,0.5)]",
          fontSize: "text-lg",
          imageSize: "w-96 h-64",
          gridSize: "w-40 h-28",
        };
    }
  };

  const theme = getTheme();

  const [gameImages, setGameImages] = useState<
    Array<{ url: string; prompt?: string; index: number }>
  >([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showArrange, setShowArrange] = useState(false);
  const [arranged, setArranged] = useState<number[]>([]);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("🖼️ ImageGalleryGame received images:", images);

    let imagesToUse: Array<{ url: string; prompt?: string; index: number }> =
      [];

    if (images && images.length > 0) {
      console.log("🎨 Using generated images:", images.length);

      imagesToUse = images.map((img, idx) => {
        const imageUrl =
          img.url ||
          (img.image_base64 && img.image_base64.startsWith("data:")
            ? img.image_base64
            : `data:image/png;base64,${img.image_base64}`);

        return {
          url: imageUrl || fallbackImageUrls[idx % fallbackImageUrls.length],
          prompt: img.prompt,
          index: idx,
        };
      });
    } else {
      console.log("🖼️ Using fallback images for topic:", topic);
      imagesToUse = fallbackImageUrls.slice(0, 4).map((url, idx) => ({
        url,
        prompt: `${topic} inspiration ${idx + 1}`,
        index: idx,
      }));
    }

    setGameImages(imagesToUse);
    setArranged(imagesToUse.map((_, i) => i));
    setIsLoading(false);
  }, [images, topic]);

  const goPrev = () => setCurrentIdx((idx) => Math.max(0, idx - 1));
  const goNext = () =>
    setCurrentIdx((idx) => Math.min(gameImages.length - 1, idx + 1));

  function shuffle(array: number[]): number[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function handleCompleteGallery() {
    setShowArrange(true);
    setArranged(shuffle([...Array(gameImages.length).keys()]));
  }

  function handleDragStart(idx: number) {
    setDraggedIdx(idx);
  }

  function handleDrop(idx: number) {
    if (draggedIdx === null || draggedIdx === idx) return;
    const newArr = [...arranged];
    const [removed] = newArr.splice(draggedIdx, 1);
    newArr.splice(idx, 0, removed);
    setArranged(newArr);
    setDraggedIdx(null);
  }

  function isCorrectOrder() {
    return arranged.every((value, index) => value === index);
  }

  if (isLoading) {
    return (
      <div
        className={`min-h-[80vh] ${theme.bg} p-6 rounded-3xl ${theme.shadow} flex items-center justify-center`}
      >
        <div
          className={`${theme.cardBg} rounded-2xl p-12 text-center ${theme.shadow}`}
        >
          <div className="flex items-center justify-center mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-current opacity-75"></div>
          </div>
          <h2 className={`text-2xl font-bold mb-4 ${theme.textPrimary}`}>
            Curating Your Gallery
          </h2>
          <p className={`${theme.textSecondary} ${theme.fontSize}`}>
            Preparing exquisite visuals for {topic}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-[90vh] ${theme.bg} p-6 rounded-3xl ${theme.shadow}`}>
      <div
        className={`${theme.cardBg} rounded-2xl p-8 ${theme.shadow} backdrop-blur-xl`}
      >
        {/* Elegant Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="text-6xl animate-pulse">🖼️</span>
            <h1
              className={`text-4xl font-bold ${theme.textPrimary} ${theme.glow}`}
            >
              Curated Gallery Experience
            </h1>
            <span
              className="text-6xl animate-pulse"
              style={{ animationDelay: "0.3s" }}
            >
              🎨
            </span>
          </div>
          <p
            className={`${theme.textSecondary} ${theme.fontSize} font-medium italic`}
          >
            Immerse yourself in the visual journey of {topic}
          </p>
        </div>

        {/* Premium Source Indicator */}
        <div className="text-center mb-8">
          {images && images.length > 0 ? (
            <div
              className={`inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full ${theme.shadow} border-2 border-green-200`}
            >
              <span className="text-2xl">✨</span>
              <span className={`text-green-800 ${theme.fontSize} font-bold`}>
                AI Masterpieces Collection ({gameImages.length})
              </span>
            </div>
          ) : (
            <div
              className={`inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full ${theme.shadow} border-2 border-blue-200`}
            >
              <span className="text-2xl">📷</span>
              <span className={`text-blue-800 ${theme.fontSize} font-bold`}>
                Curated Collection ({gameImages.length})
              </span>
            </div>
          )}
        </div>

        {!showArrange ? (
          <>
            {/* Luxurious Gallery Viewer */}
            <div className="flex items-center justify-center mb-8 gap-8">
              <button
                onClick={goPrev}
                disabled={currentIdx === 0}
                className={`px-6 py-4 rounded-full ${theme.animations} ${
                  theme.shadow
                } ${
                  currentIdx === 0
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed opacity-50"
                    : `${theme.button} hover:scale-110 active:scale-95`
                } font-bold text-2xl flex items-center justify-center w-16 h-16`}
                aria-label="Previous image"
              >
                ←
              </button>

              {gameImages.length > 0 ? (
                <div className="text-center">
                  <div
                    className={`relative ${theme.imageSize} mx-auto mb-6 ${theme.glow}`}
                  >
                    <img
                      src={gameImages[currentIdx].url}
                      alt={
                        gameImages[currentIdx].prompt ||
                        `${topic} masterpiece ${currentIdx + 1}`
                      }
                      className={`${theme.imageSize} object-cover rounded-2xl ${theme.imageFrame} ${theme.shadow} ${theme.animations} hover:scale-105`}
                      onError={(e) => {
                        console.error(
                          "❌ Image failed to load:",
                          gameImages[currentIdx].url
                        );
                        e.currentTarget.src =
                          fallbackImageUrls[
                            currentIdx % fallbackImageUrls.length
                          ];
                      }}
                      onLoad={() => {
                        console.log(
                          "✅ Image loaded successfully:",
                          gameImages[currentIdx].url.substring(0, 50)
                        );
                      }}
                    />
                    <div className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg shadow-lg">
                      {currentIdx + 1}
                    </div>
                  </div>

                  {/* Image Title and Description */}
                  {gameImages[currentIdx].prompt &&
                    images &&
                    images.length > 0 && (
                      <div
                        className={`max-w-md mx-auto p-4 ${theme.cardBg} rounded-xl ${theme.shadow} mb-4`}
                      >
                        <h3
                          className={`${theme.textPrimary} font-bold mb-2 ${theme.fontSize}`}
                        >
                          Featured Artwork
                        </h3>
                        <p
                          className={`${theme.textSecondary} text-sm italic leading-relaxed`}
                        >
                          "{gameImages[currentIdx].prompt}"
                        </p>
                      </div>
                    )}
                </div>
              ) : (
                <div
                  className={`text-center ${theme.cardBg} rounded-2xl p-12 ${theme.shadow}`}
                >
                  <span className="text-6xl mb-4 block opacity-50">🖼️</span>
                  <p className={`${theme.textSecondary} ${theme.fontSize}`}>
                    No masterpieces available for this collection.
                  </p>
                </div>
              )}

              <button
                onClick={goNext}
                disabled={currentIdx === gameImages.length - 1}
                className={`px-6 py-4 rounded-full ${theme.animations} ${
                  theme.shadow
                } ${
                  currentIdx === gameImages.length - 1
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed opacity-50"
                    : `${theme.button} hover:scale-110 active:scale-95`
                } font-bold text-2xl flex items-center justify-center w-16 h-16`}
                aria-label="Next image"
              >
                →
              </button>
            </div>

            {/* Elegant Progress Indicator */}
            <div className="flex justify-center mb-8">
              <div
                className={`flex items-center gap-3 px-6 py-3 ${theme.cardBg} rounded-full ${theme.shadow}`}
              >
                <span className={`${theme.textSecondary} font-medium`}>
                  Viewing
                </span>
                <div className="flex items-center gap-2">
                  {gameImages.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-3 h-3 rounded-full ${theme.animations} ${
                        idx === currentIdx
                          ? `bg-gradient-to-r from-emerald-500 to-teal-500 scale-125`
                          : "bg-gray-300 hover:bg-gray-400"
                      }`}
                      onClick={() => setCurrentIdx(idx)}
                      style={{ cursor: "pointer" }}
                    />
                  ))}
                </div>
                <span className={`${theme.accent} font-bold text-lg`}>
                  {gameImages.length ? currentIdx + 1 : 0} / {gameImages.length}
                </span>
              </div>
            </div>

            {/* Proceed to Arrangement Button */}
            {currentIdx === gameImages.length - 1 && gameImages.length > 0 && (
              <div className="text-center">
                <button
                  onClick={handleCompleteGallery}
                  className={`${theme.button} ${theme.animations} px-12 py-4 rounded-2xl font-bold text-xl ${theme.shadow} hover:scale-105 active:scale-95 flex items-center justify-center gap-3 mx-auto ${theme.glow}`}
                >
                  <span className="text-2xl">🎯</span>
                  <span>Begin Masterpiece Arrangement</span>
                  <span className="text-2xl">🎨</span>
                </button>
                <p className={`${theme.textSecondary} text-sm mt-3 italic`}>
                  Complete your gallery experience with our signature
                  arrangement challenge
                </p>
              </div>
            )}
          </>
        ) : (
          /* Luxury Arrangement Phase */
          <div>
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-5xl">🎭</span>
                <h2
                  className={`text-3xl font-bold ${theme.textPrimary} ${theme.glow}`}
                >
                  Masterpiece Curation
                </h2>
                <span className="text-5xl">🎪</span>
              </div>
              <p
                className={`${theme.textSecondary} ${theme.fontSize} font-medium max-w-2xl mx-auto leading-relaxed`}
              >
                Arrange these exquisite pieces in their original sequence to
                complete your gallery experience
              </p>
              <div
                className={`inline-flex items-center gap-2 mt-4 px-6 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full border-2 border-purple-200 ${theme.shadow}`}
              >
                <span className="text-purple-600 font-bold">
                  Gallery Status:
                </span>
                <span
                  className={`${
                    isCorrectOrder() ? "text-green-600" : "text-orange-600"
                  } font-bold`}
                >
                  {isCorrectOrder()
                    ? "Perfect Harmony ✨"
                    : "Awaiting Arrangement 🔄"}
                </span>
              </div>
            </div>

            {/* Luxury Drag and Drop Grid */}
            <div className="flex flex-wrap justify-center gap-6 mb-8 p-6 bg-gradient-to-r from-gray-50 to-white rounded-2xl border-2 border-gray-200 shadow-inner">
              {arranged.map((imgIdx, idx) => (
                <div
                  key={`${imgIdx}-${idx}`}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(idx)}
                  className={`${theme.gridSize} ${theme.dragFrame} rounded-xl ${theme.shadow} cursor-move ${theme.animations} hover:scale-105 active:scale-95 relative group overflow-hidden`}
                  style={{ opacity: draggedIdx === idx ? 0.6 : 1 }}
                >
                  <img
                    src={gameImages[imgIdx].url}
                    alt={
                      gameImages[imgIdx].prompt ||
                      `${topic} piece ${imgIdx + 1}`
                    }
                    className={`${theme.gridSize} object-cover rounded-lg`}
                    draggable={false}
                    onError={(e) => {
                      e.currentTarget.src =
                        fallbackImageUrls[imgIdx % fallbackImageUrls.length];
                    }}
                  />

                  {/* Drag Indicator */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg flex items-center justify-center transition-all">
                    <div className="opacity-0 group-hover:opacity-100 bg-white bg-opacity-90 rounded-full p-2 transform scale-75 group-hover:scale-100 transition-all">
                      <span className="text-2xl">⚡</span>
                    </div>
                  </div>

                  {/* Position Number */}
                  <div className="absolute top-2 right-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                    {idx + 1}
                  </div>
                </div>
              ))}
            </div>

            {/* Completion Status and Button */}
            <div className="text-center">
              {isCorrectOrder() ? (
                <div
                  className={`p-6 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl ${theme.shadow} mb-6 border-2 border-green-200`}
                >
                  <div className="text-6xl mb-3">🎉</div>
                  <h3 className={`text-2xl font-bold text-green-800 mb-2`}>
                    Magnificent Curation!
                  </h3>
                  <p className={`text-green-700 ${theme.fontSize}`}>
                    Your artistic vision has restored perfect harmony to this
                    gallery
                  </p>
                </div>
              ) : (
                <div
                  className={`p-6 bg-gradient-to-r from-orange-100 to-yellow-100 rounded-2xl ${theme.shadow} mb-6 border-2 border-orange-200`}
                >
                  <div className="text-6xl mb-3">🎨</div>
                  <h3 className={`text-2xl font-bold text-orange-800 mb-2`}>
                    Continue Arranging
                  </h3>
                  <p className={`text-orange-700 ${theme.fontSize}`}>
                    Drag and drop the pieces to restore their original sequence
                  </p>
                </div>
              )}

              <button
                onClick={isCorrectOrder() ? onGameComplete : undefined}
                disabled={!isCorrectOrder()}
                className={`px-12 py-4 rounded-2xl font-bold text-xl ${
                  theme.animations
                } ${
                  theme.shadow
                } flex items-center justify-center gap-3 mx-auto ${
                  isCorrectOrder()
                    ? `${theme.button} hover:scale-105 active:scale-95 ${theme.glow}`
                    : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                }`}
              >
                <span className="text-2xl">
                  {isCorrectOrder() ? "🏆" : "🎯"}
                </span>
                <span>
                  {isCorrectOrder()
                    ? "Complete Gallery Masterpiece"
                    : "Arrange All Pieces First"}
                </span>
                <span className="text-2xl">
                  {isCorrectOrder() ? "✨" : "🔄"}
                </span>
              </button>

              {isCorrectOrder() && (
                <p
                  className={`${theme.textSecondary} text-sm mt-4 italic opacity-75`}
                >
                  Congratulations on completing this exclusive gallery
                  experience
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
