import * as React from "react"
import { cn } from "cn"
import { Button } from "./button"

type SignaturePadProps = {
  /** JPEG data URL on a white background, or "" after clearing. JPEG so dompdf can embed it without the GD extension. */
  onChange?: (dataUrl: string) => void
  height?: number
  "aria-invalid"?: boolean
  className?: string
}

type Particle = { x: number; y: number; vx: number; vy: number; delay: number; size: number }

const INK = "17, 17, 17"
const MAX_PARTICLES = 2500
const FADE_MS = 650
// px per ms²; cukup pelan supaya butiran pudar sebelum mencapai dasar kotak (canvas tidak bisa menggambar di luar dirinya)
const GRAVITY = 0.0005

/** Draw-with-finger/mouse signature box for documents such as the payment report PDF. */
function SignaturePad({ onChange, height = 160, className, ...rest }: SignaturePadProps) {
  const ref = React.useRef<HTMLCanvasElement>(null)
  const dust = React.useRef<HTMLCanvasElement>(null)
  const drawing = React.useRef(false)
  const frame = React.useRef<number | null>(null)
  const [empty, setEmpty] = React.useState(true)

  const size = (c: HTMLCanvasElement) => {
    const ratio = window.devicePixelRatio || 1
    c.width = c.offsetWidth * ratio
    c.height = height * ratio
    const ctx = c.getContext("2d")!
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    return ctx
  }

  const paintBlank = React.useCallback(() => {
    const c = ref.current
    if (!c) return
    const ctx = size(c)
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, c.offsetWidth, height)
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.strokeStyle = `rgb(${INK})`
  }, [height])

  React.useEffect(paintBlank, [paintBlank])
  React.useEffect(() => () => {
    if (frame.current) cancelAnimationFrame(frame.current)
  }, [])

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const finish = () => {
    if (!drawing.current || !ref.current) return
    drawing.current = false
    setEmpty(false)
    onChange?.(ref.current.toDataURL("image/jpeg", 0.9))
  }

  // Ink pixels become particles that crumble left-to-right and fall while fading out.
  const crumble = () => {
    const c = ref.current
    const d = dust.current
    if (!c || !d) return
    const ratio = window.devicePixelRatio || 1
    const { width: w, height: h } = c
    const pixels = c.getContext("2d")!.getImageData(0, 0, w, h).data

    let ink = 0
    for (let i = 0; i < pixels.length; i += 4) if (pixels[i] < 128) ink++
    const step = Math.max(1, Math.ceil(Math.sqrt(ink / MAX_PARTICLES)))

    const particles: Particle[] = []
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        if (pixels[(y * w + x) * 4] >= 128) continue
        particles.push({
          x: x / ratio,
          y: y / ratio,
          vx: (Math.random() - 0.5) * 0.12,
          vy: -Math.random() * 0.08,
          delay: (x / w) * 280 + Math.random() * 120,
          size: (step / ratio) * (0.8 + Math.random() * 0.7),
        })
      }
    }

    const ctx = size(d)
    const start = performance.now()
    let last = start
    const tick = (now: number) => {
      const dt = now - last
      last = now
      ctx.clearRect(0, 0, d.offsetWidth, height)
      let alive = false
      for (const p of particles) {
        const t = now - start - p.delay
        let alpha = 1
        if (t > 0) {
          p.vy += GRAVITY * dt
          p.x += p.vx * dt
          p.y += p.vy * dt
          alpha = 1 - t / FADE_MS
        }
        if (alpha <= 0) continue
        alive = true
        ctx.fillStyle = `rgba(${INK}, ${alpha})`
        ctx.fillRect(p.x, p.y, p.size, p.size)
      }
      frame.current = alive ? requestAnimationFrame(tick) : null
      if (!alive) ctx.clearRect(0, 0, d.offsetWidth, height)
    }
    if (frame.current) cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(tick)
  }

  const clear = () => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) crumble()
    paintBlank()
    setEmpty(true)
    onChange?.("")
  }

  return (
    <div data-slot="signature-pad" className={cn("grid gap-1.5", className)}>
      <div className="relative">
        <canvas
          ref={ref}
          role="img"
          aria-label={empty ? "Kotak tanda tangan, masih kosong" : "Kotak tanda tangan, sudah diisi"}
          aria-invalid={rest["aria-invalid"]}
          style={{ height }}
          className="block w-full cursor-crosshair touch-none rounded-lg border border-input bg-white aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            const ctx = e.currentTarget.getContext("2d")!
            const p = point(e)
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p.x + 0.1, p.y + 0.1)
            ctx.stroke()
            drawing.current = true
          }}
          onPointerMove={(e) => {
            if (!drawing.current) return
            const ctx = e.currentTarget.getContext("2d")!
            const p = point(e)
            ctx.lineTo(p.x, p.y)
            ctx.stroke()
          }}
          onPointerUp={finish}
          onPointerLeave={finish}
        />
        <canvas
          ref={dust}
          aria-hidden="true"
          data-slot="signature-pad-dust"
          style={{ height }}
          className="pointer-events-none absolute inset-0 w-full"
        />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{empty ? "Tanda tangani di dalam kotak." : "Tanda tangan siap dipakai."}</span>
        <Button type="button" variant="ghost" size="xs" onClick={clear} disabled={empty}>
          Hapus
        </Button>
      </div>
    </div>
  )
}

export { SignaturePad }
export type { SignaturePadProps }
