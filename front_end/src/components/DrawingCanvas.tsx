import { useEffect, useRef, useState } from 'react'

export function DrawingCanvas() {
  // Save Drawing button logic (same as DrawingGame)
  // ...existing code...
  // Upload drawing to backend (same as DrawingGame)
  const uploadDrawing = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const imageData = canvas.toDataURL('image/png')
    try {
      const response = await fetch('http://127.0.0.1:8000/upload/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData })
      })
      if (response.ok) {
        const data = await response.json()
        console.log('Image saved successfully:', data)
        alert('Drawing saved to backend ✅')
      } else {
        console.error('Failed to upload:', response.statusText)
        alert('Upload failed ❌')
      }
    } catch (err) {
      console.error('Error uploading drawing:', err)
      alert('Error while uploading ❌')
    }
  }
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState('#ef4444')
  const [brush, setBrush] = useState(5)
  const [isEraser, setIsEraser] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  function fillWhiteBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save()
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    ctx.restore()
  }

  useEffect(() => {
    function resize() {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const prev = canvas.width && canvas.height ? canvas.toDataURL() : null
      canvas.width = Math.max(1, Math.floor(rect.width))
      canvas.height = Math.max(1, Math.floor(rect.height))
      const ctx = canvas.getContext('2d')
      if (ctx) {
        // Always start from white background
        fillWhiteBackground(ctx, rect.width, rect.height)
        // Restore previous content best-effort
        if (prev) {
          const img = new Image()
          img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height)
          img.src = prev
        }
      }
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  function getCtx() {
    const canvas = canvasRef.current
    if (!canvas) return null
    return canvas.getContext('2d')
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = getCtx()
    if (!ctx) return
    setIsDrawing(true)
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing) return
    const ctx = getCtx()
    if (!ctx) return
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    ctx.lineTo(x, y)
    ctx.strokeStyle = isEraser ? '#ffffff' : color
    ctx.lineWidth = brush
    ctx.lineCap = 'round'
    ctx.globalCompositeOperation = isEraser ? 'source-over' : 'source-over'
    ctx.stroke()
  }

  function handlePointerUp() {
    setIsDrawing(false)
  }

  function clearCanvas() {
  const canvas = canvasRef.current
  const ctx = getCtx()
  if (!canvas || !ctx) return
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.restore()
  const rect = canvas.getBoundingClientRect()
  fillWhiteBackground(ctx, rect.width, rect.height)
  }
    async function handleSubmit() {
    const canvas = canvasRef.current
    if (!canvas) return

    setLoading(true)
    setResult(null)

    // Convert canvas to Blob (better than base64 for API calls)
    canvas.toBlob(async (blob) => {
      if (!blob) {
        setLoading(false)
        return
      }

      try {
        const formData = new FormData()
        formData.append('file', blob, 'drawing.png')

        const res = await fetch('http://localhost:8000/predict', {
          method: 'POST',
          body: formData,
        })

        const data = await res.json()
        setResult(JSON.stringify(data))
      } catch (err) {
        console.error('Error submitting image:', err)
        setResult('Error submitting image')
      } finally {
        setLoading(false)
      }
    }, 'image/png')
  }
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <label className="text-sm">Color
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="ml-2 align-middle" disabled={isEraser} />
        </label>
        <label className="text-sm">Brush
          <input type="range" min={1} max={24} value={brush} onChange={(e) => setBrush(Number(e.target.value))} className="ml-2 align-middle" />
          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{brush}px</span>
        </label>
        <button
          type="button"
          onClick={() => setIsEraser(e => !e)}
          className={`rounded border px-3 py-1 text-sm ${isEraser ? 'bg-yellow-200' : ''} hover:bg-gray-50 dark:hover:bg-gray-900`}
        >
          {isEraser ? 'Eraser (On)' : 'Eraser'}
        </button>
        <button type="button" onClick={clearCanvas} className="ml-auto rounded border px-3 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-900">Clear</button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="rounded border px-3 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </div>
      <div className="h-[60vh] sm:h-[70vh]">
        <canvas
          ref={canvasRef}
          className="h-full w-full rounded-md bg-white touch-none"
          style={isEraser ? { cursor: `url('data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'${brush * 2}\' height=\'${brush * 2}\'><circle cx=\'${brush}\' cy=\'${brush}\' r=\'${brush}\' fill=\'white\' stroke=\'gray\' stroke-width=\'2\'/></svg>') ${brush} ${brush}, pointer` } : { cursor: 'crosshair' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onContextMenu={(e) => e.preventDefault()}
          onPointerCancel={handlePointerUp}
        />
      </div>
       {result && (
        <div className="mt-3 p-2 text-sm rounded bg-gray-100 dark:bg-gray-900">
          Prediction: {result}
        </div>
      )}
    </div>
  )
}