import { useState, useEffect } from "react";

type GameProps = {
  topic: string;
  onGameComplete: () => void;
  images?: Array<{
    url?: string; // ✅ Firebase Storage URL
    image_base64?: string; // ✅ Fallback base64
    prompt: string;
    index: number;
  }> | null;
};

// Fallback images
const fallbackImageUrls = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80",
];

export function ImageGalleryGame({ topic, onGameComplete, images }: GameProps) {
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

    // Prepare images for the game
    let imagesToUse: Array<{ url: string; prompt?: string; index: number }> =
      [];

    if (images && images.length > 0) {
      // ✅ Use generated images - handle both Firebase Storage URLs and base64
      console.log("🎨 Using generated images:", images.length);

      imagesToUse = images.map((img, idx) => {
        // ✅ Prefer Firebase Storage URL over base64
        const imageUrl =
          img.url ||
          (img.image_base64 && img.image_base64.startsWith("data:")
            ? img.image_base64
            : `data:image/png;base64,${img.image_base64}`);

        console.log(`🔍 Image ${idx}:`, {
          hasUrl: !!img.url,
          hasBase64: !!img.image_base64,
          finalUrl: imageUrl?.substring(0, 50) + "...",
          prompt: img.prompt,
        });

        return {
          url: imageUrl || fallbackImageUrls[idx % fallbackImageUrls.length],
          prompt: img.prompt,
          index: idx,
        };
      });

      // ✅ Test if Firebase URLs load
      imagesToUse.forEach((img, idx) => {
        if (
          img.url.includes("firebasestorage") ||
          img.url.includes("storage.googleapis.com")
        ) {
          const testImg = new Image();
          testImg.onload = () =>
            console.log(`✅ Firebase image ${idx} loads successfully`);
          testImg.onerror = (e) => {
            console.error(`❌ Firebase image ${idx} failed to load:`, e);
            console.log(`🔗 Failed URL: ${img.url}`);
          };
          testImg.src = img.url;
        }
      });
    } else {
      // Use fallback images
      console.log("🖼️ Using fallback images for topic:", topic);
      imagesToUse = fallbackImageUrls.slice(0, 4).map((url, idx) => ({
        url,
        prompt: `${topic} image ${idx + 1}`,
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
      <div className="text-center bg-[#f8fafc] text-gray-900 p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-center mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading gallery...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center bg-[#f8fafc] text-gray-900 p-6 rounded-lg border border-gray-200">
      <h2 className="text-2xl font-bold mb-4">🖼️ {topic} Gallery</h2>

      {/* Show image source info */}
      <div className="mb-4 text-sm">
        {images && images.length > 0 ? (
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
            🎨 AI Generated Images ({gameImages.length})
          </span>
        ) : (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
            📷 Stock Images ({gameImages.length})
          </span>
        )}
      </div>

      {!showArrange ? (
        <>
          <div className="flex items-center justify-center mb-6 gap-4">
            <button
              onClick={goPrev}
              disabled={currentIdx === 0}
              className={`px-3 py-2 rounded bg-gray-200 text-gray-700 font-bold text-xl ${
                currentIdx === 0
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-300"
              }`}
              aria-label="Previous image"
            >
              &#8592;
            </button>

            {gameImages.length > 0 ? (
              <div className="text-center">
                <img
                  src={gameImages[currentIdx].url}
                  alt={
                    gameImages[currentIdx].prompt ||
                    `${topic} image ${currentIdx + 1}`
                  }
                  className="rounded-lg w-80 h-48 object-cover border border-gray-300 shadow-lg"
                  onError={(e) => {
                    console.error(
                      "❌ Image failed to load:",
                      gameImages[currentIdx].url
                    );
                    console.log("🔄 Trying fallback image...");
                    e.currentTarget.src =
                      fallbackImageUrls[currentIdx % fallbackImageUrls.length];
                  }}
                  onLoad={() => {
                    console.log(
                      "✅ Image loaded successfully:",
                      gameImages[currentIdx].url.substring(0, 50)
                    );
                  }}
                />
                {gameImages[currentIdx].prompt &&
                  images &&
                  images.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2 italic max-w-80 mx-auto">
                      "{gameImages[currentIdx].prompt}"
                    </p>
                  )}
              </div>
            ) : (
              <div className="text-gray-500">
                No images available for this topic.
              </div>
            )}

            <button
              onClick={goNext}
              disabled={currentIdx === gameImages.length - 1}
              className={`px-3 py-2 rounded bg-gray-200 text-gray-700 font-bold text-xl ${
                currentIdx === gameImages.length - 1
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-300"
              }`}
              aria-label="Next image"
            >
              &#8594;
            </button>
          </div>

          <div className="mb-4 text-sm text-gray-500">
            Image {gameImages.length ? currentIdx + 1 : 0} of{" "}
            {gameImages.length}
          </div>

          {currentIdx === gameImages.length - 1 && gameImages.length > 0 && (
            <button
              onClick={handleCompleteGallery}
              className="rounded-md bg-purple-600 text-white px-4 py-2 hover:bg-purple-500"
            >
              🔀 Arrange Images to Complete
            </button>
          )}
        </>
      ) : (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            🔄 Arrange the images in the correct order
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Drag and drop to rearrange the images back to their original
            sequence
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-6">
            {arranged.map((imgIdx, idx) => (
              <div
                key={`${imgIdx}-${idx}`}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(idx)}
                className="rounded-lg w-32 h-20 border-2 border-gray-300 cursor-move bg-white shadow-md hover:shadow-lg transition-shadow"
                style={{ opacity: draggedIdx === idx ? 0.5 : 1 }}
              >
                <img
                  src={gameImages[imgIdx].url}
                  alt={
                    gameImages[imgIdx].prompt || `${topic} image ${imgIdx + 1}`
                  }
                  className="w-full h-full object-cover rounded"
                  draggable={false}
                  onError={(e) => {
                    e.currentTarget.src =
                      fallbackImageUrls[imgIdx % fallbackImageUrls.length];
                  }}
                />
              </div>
            ))}
          </div>

          <button
            onClick={isCorrectOrder() ? onGameComplete : undefined}
            disabled={!isCorrectOrder()}
            className={`rounded-md px-6 py-2 font-semibold ${
              isCorrectOrder()
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isCorrectOrder()
              ? "✅ Complete Gallery Game"
              : "❌ Arrange Correctly to Complete"}
          </button>
        </div>
      )}
    </div>
  );
}
