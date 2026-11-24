import { useState, useRef, useEffect, useCallback } from 'react'
import { ZoomIn, ZoomOut, RotateCw, RefreshCw, X, Check } from 'lucide-react'
import Button from './Button'

interface ImageCropModalProps {
  isOpen: boolean
  imageSrc: string
  onClose: () => void
  onApply: (croppedBlob: Blob) => Promise<void> | void
  loading?: boolean
}

const CROP_CONTAINER_SIZE = 280
const CROP_DIAMETER = 240
// 1024px high-res square output for crystal-sharp avatars on all screen densities
const EXPORT_SIZE = 1024

export default function ImageCropModal({
  isOpen,
  imageSrc,
  onClose,
  onApply,
  loading = false,
}: ImageCropModalProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0) // 0, 90, 180, 270
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [startOffset, setStartOffset] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  // Reset state when a new image is loaded
  useEffect(() => {
    if (!imageSrc || !isOpen) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imageRef.current = img
      setImageLoaded(true)
      setZoom(1)
      setRotation(0)
      setOffset({ x: 0, y: 0 })
    }
    img.src = imageSrc

    return () => {
      imageRef.current = null
      setImageLoaded(false)
    }
  }, [imageSrc, isOpen])

  // Draw preview canvas with high-DPI sharpness
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current
    const img = imageRef.current
    if (!canvas || !img || !imageLoaded) return

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

    // Scale canvas buffer for high-DPI screens so preview is never blurry
    if (canvas.width !== CROP_CONTAINER_SIZE * dpr || canvas.height !== CROP_CONTAINER_SIZE * dpr) {
      canvas.width = CROP_CONTAINER_SIZE * dpr
      canvas.height = CROP_CONTAINER_SIZE * dpr
      canvas.style.width = `${CROP_CONTAINER_SIZE}px`
      canvas.style.height = `${CROP_CONTAINER_SIZE}px`
    }

    ctx.save()
    ctx.scale(dpr, dpr)

    // Fill dark background
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, CROP_CONTAINER_SIZE, CROP_CONTAINER_SIZE)

    // Enable highest quality image smoothing
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // Calculate dimensions taking rotation into account
    const isRotated = rotation % 180 !== 0
    const effWidth = isRotated ? img.naturalHeight : img.naturalWidth
    const effHeight = isRotated ? img.naturalWidth : img.naturalHeight

    const baseScale = Math.max(CROP_DIAMETER / effWidth, CROP_DIAMETER / effHeight)
    const currentScale = baseScale * zoom

    // Move to center of container + pan offset
    ctx.translate(CROP_CONTAINER_SIZE / 2 + offset.x, CROP_CONTAINER_SIZE / 2 + offset.y)
    ctx.rotate((rotation * Math.PI) / 180)

    // Draw the image centered
    const drawW = img.naturalWidth * currentScale
    const drawH = img.naturalHeight * currentScale
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH)

    ctx.restore()
  }, [zoom, rotation, offset, imageLoaded])

  useEffect(() => {
    drawPreview()
  }, [drawPreview])

  // Dragging handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setStartOffset({ ...offset })
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y
    setOffset({
      x: startOffset.x + dx,
      y: startOffset.y + dy,
    })
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false)
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}
  }

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    const delta = e.deltaY < 0 ? 0.1 : -0.1
    setZoom((prev) => Math.min(3, Math.max(1, +(prev + delta).toFixed(2))))
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const handleReset = () => {
    setZoom(1)
    setRotation(0)
    setOffset({ x: 0, y: 0 })
  }

  const handleCropApply = () => {
    const img = imageRef.current
    if (!img || !imageLoaded) return

    // 1024x1024 high resolution output canvas
    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = EXPORT_SIZE
    exportCanvas.height = EXPORT_SIZE
    const ctx = exportCanvas.getContext('2d', { alpha: false })
    if (!ctx) return

    // Fill background (white or neutral black) in case any edges show
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, EXPORT_SIZE, EXPORT_SIZE)

    // Force maximum smoothing quality for ultra-sharp down/upscaling
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // Scale ratio from preview crop window (CROP_DIAMETER) to export canvas
    const exportRatio = EXPORT_SIZE / CROP_DIAMETER

    const isRotated = rotation % 180 !== 0
    const effWidth = isRotated ? img.naturalHeight : img.naturalWidth
    const effHeight = isRotated ? img.naturalWidth : img.naturalHeight

    const baseScale = Math.max(CROP_DIAMETER / effWidth, CROP_DIAMETER / effHeight)
    const currentScale = baseScale * zoom

    ctx.save()
    // Move to center of export canvas
    ctx.translate(
      EXPORT_SIZE / 2 + offset.x * exportRatio,
      EXPORT_SIZE / 2 + offset.y * exportRatio
    )
    ctx.rotate((rotation * Math.PI) / 180)

    const finalW = img.naturalWidth * currentScale * exportRatio
    const finalH = img.naturalHeight * currentScale * exportRatio
    ctx.drawImage(img, -finalW / 2, -finalH / 2, finalW, finalH)

    ctx.restore()

    // Export as high-quality JPEG (quality 0.96 for near-lossless clarity)
    exportCanvas.toBlob(
      (blob) => {
        if (blob) {
          onApply(blob)
        }
      },
      'image/jpeg',
      0.96
    )
  }

  if (!isOpen) return null

  const center = CROP_CONTAINER_SIZE / 2
  const radius = CROP_DIAMETER / 2

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Crop profile picture"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-full max-w-sm rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)] shadow-2xl overflow-hidden p-5 flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg leading-tight">Crop Profile Picture</h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Drag to position, use slider to zoom
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] transition-colors"
            aria-label="Close cropper"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cropping Canvas Preview */}
        <div
          className="relative rounded-xl overflow-hidden touch-none select-none bg-neutral-950 flex items-center justify-center cursor-grab active:cursor-grabbing border border-[var(--color-border)]"
          style={{ width: CROP_CONTAINER_SIZE, height: CROP_CONTAINER_SIZE }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
        >
          <canvas
            ref={canvasRef}
            className="block"
          />

          {/* Mask overlay for crop circle */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={CROP_CONTAINER_SIZE}
            height={CROP_CONTAINER_SIZE}
          >
            <defs>
              <mask id="hk-crop-mask">
                <rect width={CROP_CONTAINER_SIZE} height={CROP_CONTAINER_SIZE} fill="white" />
                <circle cx={center} cy={center} r={radius} fill="black" />
              </mask>
            </defs>
            {/* Dark vignette outside the crop circle */}
            <rect
              width={CROP_CONTAINER_SIZE}
              height={CROP_CONTAINER_SIZE}
              fill="rgba(0, 0, 0, 0.65)"
              mask="url(#hk-crop-mask)"
            />
            {/* Clean guideline circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeDasharray="4 4"
              opacity="0.8"
            />
          </svg>
        </div>

        {/* Zoom Slider */}
        <div className="w-full mt-4 flex items-center gap-3">
          <ZoomOut size={16} className="text-[var(--color-text-muted)] shrink-0" />
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            aria-label="Zoom image"
            className="w-full accent-[var(--color-primary)] cursor-pointer h-1.5 bg-[var(--color-surface-muted)] rounded-lg"
          />
          <ZoomIn size={16} className="text-[var(--color-text-muted)] shrink-0" />
          <span className="text-xs font-mono text-[var(--color-text-muted)] w-8 text-right">
            {zoom.toFixed(1)}x
          </span>
        </div>

        {/* Rotation & Reset Actions */}
        <div className="w-full flex items-center justify-between mt-3 pt-3 border-t border-[var(--color-border)]">
          <button
            type="button"
            onClick={handleRotate}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] transition-colors"
          >
            <RotateCw size={14} /> Rotate 90°
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            <RefreshCw size={13} /> Reset
          </button>
        </div>

        {/* Modal Footer Buttons */}
        <div className="w-full flex gap-2.5 mt-5">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="flex-1 text-sm py-2"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCropApply}
            loading={loading}
            className="flex-1 text-sm py-2 flex items-center justify-center gap-1.5"
          >
            {!loading && <Check size={16} />}
            Apply & Save
          </Button>
        </div>
      </div>
    </div>
  )
}
