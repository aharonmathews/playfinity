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
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

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
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      const prev = canvas.width && canvas.height ? canvas.toDataURL() : null
      canvas.width = Math.max(1, Math.floor(rect.width * dpr))
      canvas.height = Math.max(1, Math.floor(rect.height * dpr))
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(dpr, dpr)
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
    ctx.strokeStyle = color
    ctx.lineWidth = brush
    ctx.lineCap = 'round'
    ctx.stroke()
  }

  function handlePointerUp() {
    setIsDrawing(false)
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    const ctx = getCtx()
    if (!canvas || !ctx) return
    // Reset to white background
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.restore()
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    ctx.scale(dpr, dpr)
    fillWhiteBackground(ctx, rect.width, rect.height)
  }

  async function saveImage() {
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
        setSaveMsg('Image saved to backend!')
      } else {
        setSaveMsg('Failed to save image to backend.')
      }
    } catch (err) {
      setSaveMsg('Error while saving image.')
    }
    setTimeout(() => setSaveMsg(null), 2000)
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <label className="text-sm">Color
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="ml-2 align-middle" />
        </label>
        <label className="text-sm">Brush
          <input type="range" min={1} max={24} value={brush} onChange={(e) => setBrush(Number(e.target.value))} className="ml-2 align-middle" />
          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{brush}px</span>
        </label>
  <button type="button" onClick={clearCanvas} className="ml-auto rounded border px-3 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-900">Clear</button>
  <button type="button" onClick={uploadDrawing} className="rounded border px-3 py-1 text-sm bg-green-600 text-white hover:bg-green-700 ml-2">Save Drawing</button>
  <button type="button" onClick={uploadDrawing} className="rounded border px-3 py-1 text-sm bg-green-600 text-white hover:bg-green-700 ml-2">Save Image</button>
      </div>
      {saveMsg && <div className="mb-2 text-green-700 dark:text-green-400 text-sm text-center">{saveMsg}</div>}
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
    </div>
  )
}


