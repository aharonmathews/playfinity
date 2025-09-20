import { useEffect, useRef, useState } from 'react'

export function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState('#ef4444')
  const [brush, setBrush] = useState(5)

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
    </div>
  )
}


