type GameProps = { topic: string; onGameComplete: () => void; };
export function ImageGalleryGame({ onGameComplete }: GameProps) {
  return (
    <div className="text-center">
      <p className="mb-4">This is the Image Gallery Game. Click below to complete it.</p>
      <button onClick={onGameComplete} className="rounded-md bg-purple-600 text-white px-4 py-2 hover:bg-purple-500">
        Complete Gallery
      </button>
    </div>
  );
}