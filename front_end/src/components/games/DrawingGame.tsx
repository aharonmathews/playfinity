  const navigateHome = () => window.location.href = '/';
import { useMemo, useState, useRef, useEffect } from 'react'

type Props = {
  topic: string
  onGameComplete?: () => void
}

export function DrawingGame({ topic, onGameComplete }: Props) {
  const word = useMemo(() => (topic || 'TOPIC').toUpperCase().replace(/[^A-Z]/g, ''), [topic])
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<null | 'correct' | 'wrong'>(null)
  const [message, setMessage] = useState<string>('')
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState('#000000')
  const [brush, setBrush] = useState(3)
  const [isEraser, setIsEraser] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const currentChar = word[index] || ''
  const uploadDrawing = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Convert canvas to Base64 PNG
    const imageData = canvas.toDataURL("image/png")

    try {
      const response = await fetch("http://127.0.0.1:8000/upload/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          image: imageData,
          label: currentChar   // optional, store which letter was drawn
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Image saved successfully:", data)
        alert("Drawing saved to backend ✅")
      } else {
        console.error("Failed to upload:", response.statusText)
        alert("Upload failed ❌")
      }
    } catch (err) {
      console.error("Error uploading drawing:", err)
      alert("Error while uploading ❌")
    }
  }
  // Simple character recognition based on drawing patterns
  const recognizeCharacter = (drawnData: ImageData): boolean => {
    // This is a simplified demo recognition
    // In a real app, you'd use machine learning or more sophisticated algorithms
    
    const data = drawnData.data
    let hasDrawing = false
    let drawingPixels = 0
    
    // Count non-transparent pixels
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) { // alpha > 0
        hasDrawing = true
        drawingPixels++
      }
    }
    
    // Basic validation: must have substantial drawing
    if (!hasDrawing || drawingPixels < 100) {
      return false
    }
    
    // For demo purposes, we'll use a simple pattern-based recognition
    // Check if the drawing has some basic structure (not just random scribbles)
    const width = drawnData.width
    const height = drawnData.height
    
    // Check for vertical lines (common in letters like A, B, C, D, etc.)
    let verticalLines = 0
    for (let x = 0; x < width; x++) {
      let lineLength = 0
      for (let y = 0; y < height; y++) {
        const idx = (y * width + x) * 4
        if (data[idx + 3] > 0) { // alpha > 0
          lineLength++
        } else {
          if (lineLength > height * 0.3) { // Line covers at least 30% of height
            verticalLines++
          }
          lineLength = 0
        }
      }
      if (lineLength > height * 0.3) {
        verticalLines++
      }
    }
    
    // Check for horizontal lines
    let horizontalLines = 0
    for (let y = 0; y < height; y++) {
      let lineLength = 0
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4
        if (data[idx + 3] > 0) { // alpha > 0
          lineLength++
        } else {
          if (lineLength > width * 0.3) { // Line covers at least 30% of width
            horizontalLines++
          }
          lineLength = 0
        }
      }
      if (lineLength > width * 0.3) {
        horizontalLines++
      }
    }
    
    // Check for diagonal lines (for letters like A, V, W, X, Y, Z)
    let diagonalLines = 0
    // Check diagonal from top-left to bottom-right
    for (let i = 0; i < Math.min(width, height); i++) {
      const idx = (i * width + i) * 4
      if (data[idx + 3] > 0) {
        diagonalLines++
      }
    }
    // Check diagonal from top-right to bottom-left
    for (let i = 0; i < Math.min(width, height); i++) {
      const idx = (i * width + (width - 1 - i)) * 4
      if (data[idx + 3] > 0) {
        diagonalLines++
      }
    }
    
    // Check for curves (for letters like C, D, G, O, P, Q, S)
    let curvePixels = 0
    const centerX = width / 2
    const centerY = height / 2
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const idx = (y * width + x) * 4
        if (data[idx + 3] > 0) {
          const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
          const radius = Math.min(width, height) / 3
          if (Math.abs(distance - radius) < radius * 0.3) {
            curvePixels++
          }
        }
      }
    }
    
    // Simple scoring system
    let score = 0
    if (verticalLines >= 1) score += 2
    if (horizontalLines >= 1) score += 2
    if (diagonalLines >= Math.min(width, height) * 0.2) score += 2
    if (curvePixels >= 20) score += 2
    
    // Must have at least some structure to be considered "correct"
    return score >= 2 && drawingPixels >= 100
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      ctx.moveTo(x, y)
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.lineTo(x, y)
      ctx.strokeStyle = isEraser ? '#ffffff' : color
      ctx.lineWidth = brush
      ctx.lineCap = 'round'
      ctx.globalCompositeOperation = 'source-over'
      ctx.stroke()
    }
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  const checkDrawing = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const isCorrect = recognizeCharacter(imageData)
    
    if (isCorrect) {
      setFeedback('correct')
      setMessage('Correct! Well done!')
      setScore((s) => s + 1)
      setTimeout(() => {
        setFeedback(null)
        setMessage('')
        clearCanvas()
        if (index < word.length - 1) {
          setIndex((i) => i + 1)
        } else {
          // Game completed!
          onGameComplete?.()
        }
      }, 1500)
    } else {
      setFeedback('wrong')
      setMessage('Not quite right. Try again!')
      setTimeout(() => {
        setFeedback(null)
        setMessage('')
      }, 1500)
    }
  }

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
  ctx.strokeStyle = color
  ctx.lineWidth = brush
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  }, [])

  if (!word) {
    return <div className="text-sm text-gray-500 dark:text-gray-400">Select a topic to start the game.</div>
  }

  const progress = word.length ? Math.round(((index + 1) / word.length) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
  <div className="text-sm text-gray-500">Character {index + 1} of {word.length}</div>
        <div className="text-sm font-medium">Score: {score}</div>
      </div>

  <div className="h-2 bg-gray-200 rounded">
        <div className="h-2 bg-emerald-600 rounded" style={{ width: `${progress}%` }} />
      </div>

      <div className="text-center">
  <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Draw the letter: <span className="text-4xl text-indigo-600">{currentChar}</span>
        </h2>
  <p className="text-sm text-gray-500">
          Use your mouse to draw the letter in the canvas below
        </p>
      </div>

      {message && (
        <div className={`text-center py-2 text-lg font-medium ${
          feedback === 'correct' ? 'text-emerald-600' : 'text-red-600'
        }`}>
          {message}
        </div>
      )}

      <div className="flex justify-center">
        <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
          <canvas
            ref={canvasRef}
            width={300}
            height={200}
            className="border border-gray-200 rounded"
            style={isEraser ? { cursor: `url('data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'${brush * 2}\' height=\'${brush * 2}\'><circle cx=\'${brush}\' cy=\'${brush}\' r=\'${brush}\' fill=\'white\' stroke=\'gray\' stroke-width=\'2\'/></svg>') ${brush} ${brush}, pointer` } : { cursor: 'crosshair' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <div className="absolute top-6 right-6 z-50">
          <button onClick={navigateHome} className="rounded bg-indigo-600 text-white px-4 py-2 shadow-lg hover:bg-indigo-700">Home</button>
        </div>
        <label className="text-sm">Color
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="ml-2 align-middle" disabled={isEraser} />
        </label>
        <label className="text-sm">{isEraser ? 'Eraser Size' : 'Brush'}
          <input type="range" min={4} max={48} value={brush} onChange={(e) => setBrush(Number(e.target.value))} className="ml-2 align-middle" />
          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{brush}px</span>
        </label>
        <button
          type="button"
          onClick={() => setIsEraser(e => !e)}
          className={`rounded border px-3 py-1 text-sm ${isEraser ? 'bg-yellow-200' : ''} hover:bg-gray-50 dark:hover:bg-gray-900`}
        >
          {isEraser ? 'Eraser (On)' : 'Eraser'}
        </button>
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
          Check Drawing
        </button>
         <button
          onClick={uploadDrawing}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Save Drawing
        </button>
      </div>

  <div className="text-center text-sm text-gray-500">
        <p>Draw the letter <strong>{currentChar}</strong> in the canvas above</p>
        <p>Click "Check Drawing" when you're done</p>
        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-xs">
          <p className="font-medium text-blue-800 dark:text-blue-200">Drawing Tips:</p>
          <p>• Draw clear lines and shapes</p>
          <p>• Make sure your drawing covers enough of the canvas</p>
          <p>• Try to match the letter structure (lines, curves, etc.)</p>
        </div>
      </div>
    </div>
  )
}
