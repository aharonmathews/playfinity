type GameProps = { topic: string; onGameComplete: () => void; };

const topicImages: Record<string, string[]> = {
  Mathematics: [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1465101178521-c1a2b3c7c8c5?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=400&q=80'
  ],
  Science: [
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1465101178521-c1a2b3c7c8c5?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80'
  ],
  History: [
    'https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1465101178521-c1a2b3c7c8c5?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80'
  ],
  Geography: [
    'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1465101178521-c1a2b3c7c8c5?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80'
  ],
  Arts: [
    'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=400&q=80'
  ]
};

import { useState } from 'react';

export function ImageGalleryGame({ topic, onGameComplete }: GameProps) {
  const images = topicImages[topic] || [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showArrange, setShowArrange] = useState(false);
  const [arranged, setArranged] = useState<number[]>(images.map((_, i) => i));
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const correctOrder = images.map((_, i) => i);
  const goPrev = () => setCurrentIdx(idx => Math.max(0, idx - 1));
  const goNext = () => setCurrentIdx(idx => Math.min(images.length - 1, idx + 1));

  function shuffle(array: number[]): number[] {
    let arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      if (typeof arr[i] === 'number' && typeof arr[j] === 'number') {
        const temp: number = arr[i] as number;
        arr[i] = arr[j] as number;
        arr[j] = temp;
      }
    }
    return arr;
  }

  function handleCompleteGallery() {
    setShowArrange(true);
    setArranged(shuffle(correctOrder));
  }

  function handleDragStart(idx: number) {
    setDraggedIdx(idx);
  }
  function handleDrop(idx: number) {
    if (draggedIdx === null || draggedIdx === idx) return;
    const newArr = [...arranged];
    const removedArr = newArr.splice(draggedIdx, 1);
    if (removedArr.length > 0 && typeof removedArr[0] === 'number') {
      newArr.splice(idx, 0, removedArr[0]);
      setArranged(newArr);
    }
    setDraggedIdx(null);
  }

  function isCorrectOrder() {
    return arranged.length === correctOrder.length && arranged.every((v, i) => v === i);
  }

  return (
    <div className="text-center bg-[#f8fafc] text-gray-900 p-6 rounded-lg border border-gray-200">
      <h2 className="text-2xl font-bold mb-4">{topic} Gallery</h2>
      <div className="fixed bottom-6 right-6 z-50">
        <button onClick={() => window.location.href = '/'} className="rounded bg-indigo-600 text-white px-4 py-2 shadow-lg hover:bg-indigo-700">Home</button>
      </div>
      {!showArrange ? (
        <>
          <div className="flex items-center justify-center mb-6 gap-4">
            <button
              onClick={goPrev}
              disabled={currentIdx === 0}
              className={`px-3 py-2 rounded bg-gray-200 text-gray-700 font-bold text-xl ${currentIdx === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-300'}`}
              aria-label="Previous image"
            >&#8592;</button>
            {images.length > 0 ? (
              <img
                src={images[currentIdx]}
                alt={topic + ' image ' + (currentIdx + 1)}
                className="rounded-lg w-80 h-48 object-cover border border-gray-300"
              />
            ) : (
              <div className="text-gray-500">No images available for this topic.</div>
            )}
            <button
              onClick={goNext}
              disabled={currentIdx === images.length - 1}
              className={`px-3 py-2 rounded bg-gray-200 text-gray-700 font-bold text-xl ${currentIdx === images.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-300'}`}
              aria-label="Next image"
            >&#8594;</button>
          </div>
          <div className="mb-4 text-sm text-gray-500">Image {images.length ? currentIdx + 1 : 0} of {images.length}</div>
          {currentIdx === images.length - 1 && (
            <button onClick={handleCompleteGallery} className="rounded-md bg-purple-600 text-white px-4 py-2 hover:bg-purple-500">
              Arrange Images to Complete
            </button>
          )}
        </>
      ) : (
        <div>
          <h3 className="text-lg font-semibold mb-2">Arrange the images in the correct order</h3>
          <div className="flex flex-wrap justify-center gap-4 mb-4">
            {arranged.map((imgIdx, idx) => (
              <div
                key={imgIdx}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleDrop(idx)}
                className="rounded-lg w-32 h-20 object-cover border-2 border-gray-300 cursor-move bg-white flex items-center justify-center"
                style={{ opacity: draggedIdx === idx ? 0.5 : 1 }}
              >
                <img src={images[imgIdx]} alt={topic + ' image ' + (imgIdx + 1)} className="w-full h-full object-cover rounded" />
              </div>
            ))}
          </div>
          <button
            onClick={isCorrectOrder() ? onGameComplete : undefined}
            disabled={!isCorrectOrder()}
            className={`rounded-md px-6 py-2 font-semibold ${isCorrectOrder() ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          >
            {isCorrectOrder() ? 'Complete Gallery Game' : 'Arrange Correctly to Complete'}
          </button>
        </div>
      )}
    </div>
  );
}
