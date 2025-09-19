import { useMemo, useState } from 'react'

type Props = {
  topic: string
  onGameComplete?: () => void
}

// Topic-specific image data
const TOPIC_IMAGES: Record<string, string[]> = {
  'MATHEMATICS': [
    'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop'
  ],
  'SCIENCE': [
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=300&fit=crop'
  ],
  'HISTORY': [
    'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&h=300&fit=crop'
  ],
  'GEOGRAPHY': [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop'
  ],
  'ARTS': [
    'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop'
  ]
}

// Topic descriptions for each image
const TOPIC_DESCRIPTIONS: Record<string, string[]> = {
  'MATHEMATICS': [
    'Basic arithmetic operations and numbers',
    'Geometric shapes and patterns',
    'Algebraic equations and formulas',
    'Mathematical graphs and charts',
    'Probability and statistics concepts',
    'Advanced mathematical theories'
  ],
  'SCIENCE': [
    'Laboratory experiments and equipment',
    'Chemical reactions and molecules',
    'Physics principles and laws',
    'Biological organisms and cells',
    'Earth and space science',
    'Scientific research and discovery',
    'Technology and innovation'
  ],
  'HISTORY': [
    'Ancient civilizations and artifacts',
    'Historical monuments and buildings',
    'Important historical figures',
    'Major historical events',
    'Cultural heritage and traditions',
    'Historical documents and records'
  ],
  'GEOGRAPHY': [
    'World maps and continents',
    'Natural landscapes and formations',
    'Climate and weather patterns',
    'Countries and capitals',
    'Physical geography features'
  ],
  'ARTS': [
    'Classical paintings and masterpieces',
    'Sculptures and three-dimensional art',
    'Modern and contemporary art',
    'Artistic techniques and styles',
    'Cultural art forms',
    'Famous artists and their works',
    'Art galleries and museums',
    'Creative expression and imagination'
  ]
}

export function ImageGalleryGame({ topic, onGameComplete }: Props) {
  const topicKey = topic.toUpperCase()
  const images = TOPIC_IMAGES[topicKey] || []
  const descriptions = TOPIC_DESCRIPTIONS[topicKey] || []
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [viewedImages, setViewedImages] = useState<Set<number>>(new Set())

  const currentImage = images[currentImageIndex]
  const currentDescription = descriptions[currentImageIndex] || ''

  const nextImage = () => {
    const nextIndex = (currentImageIndex + 1) % images.length
    setCurrentImageIndex(nextIndex)
    setViewedImages(prev => new Set([...prev, nextIndex]))
    
    // Check if all images have been viewed
    if (viewedImages.size + 1 >= images.length) {
      setTimeout(() => {
        onGameComplete?.()
      }, 2000)
    }
  }

  const prevImage = () => {
    const prevIndex = currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1
    setCurrentImageIndex(prevIndex)
    setViewedImages(prev => new Set([...prev, prevIndex]))
  }

  const goToImage = (index: number) => {
    setCurrentImageIndex(index)
    setViewedImages(prev => new Set([...prev, index]))
  }

  if (!images.length) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 dark:text-gray-400">
          No images available for this topic.
        </div>
      </div>
    )
  }

  const progress = ((viewedImages.size + 1) / images.length) * 100
  const allImagesViewed = viewedImages.size >= images.length

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Image {currentImageIndex + 1} of {images.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded">
          <div 
            className="h-2 bg-blue-600 rounded transition-all duration-300" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Main image display */}
      <div className="relative">
        <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
          {currentImage ? (
            <img
              src={currentImage}
              alt={`${topic} - Image ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback for broken images
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                target.nextElementSibling?.classList.remove('hidden')
              }}
            />
          ) : null}
          <div className="hidden w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-2">🖼️</div>
              <div>Image not available</div>
            </div>
          </div>
        </div>

        {/* Navigation arrows */}
        <button
          onClick={prevImage}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
          disabled={images.length <= 1}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={nextImage}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
          disabled={images.length <= 1}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Image description */}
      {currentDescription && (
        <div className="text-center">
          <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">
            {currentDescription}
          </p>
        </div>
      )}

      {/* Thumbnail navigation */}
      <div className="flex justify-center space-x-2 overflow-x-auto pb-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToImage(index)}
            className={`flex-shrink-0 w-16 h-12 rounded border-2 transition-colors ${
              index === currentImageIndex
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
            }`}
          >
            <img
              src={images[index]}
              alt={`Thumbnail ${index + 1}`}
              className="w-full h-full object-cover rounded"
            />
          </button>
        ))}
      </div>

      {/* Completion message */}
      {allImagesViewed && (
        <div className="text-center py-4">
          <div className="text-green-600 dark:text-green-400 font-medium">
            🎉 Congratulations! You've viewed all images for {topic}!
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Use the arrow buttons or click thumbnails to navigate through the images</p>
        <p>Learn about {topic} through visual examples</p>
      </div>
    </div>
  )
}
