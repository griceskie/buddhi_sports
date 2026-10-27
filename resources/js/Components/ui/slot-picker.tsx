import * as React from "react"
import { cn } from "cn"
import { CircleAlert } from "lucide-react"
import { buttonVariants } from "./button"
import { toMinutes } from "./format"

type TimeRange = { start: string; end: string }

type SlotPickerProps = {
  /** First hour of play, "HH:MM". */
  open?: string
  /** Closing time, "HH:MM"; the last slot ends here. */
  close?: string
  /** Bookings on this court and date that still hold their slot (Dipesan, Dikonfirmasi). */
  booked?: TimeRange[]
  /** jamMulai / jamSelesai */
  value?: TimeRange | null
  defaultValue?: TimeRange | null
  onValueChange?: (value: TimeRange | null) => void
  /** Slots that have already started (start "HH:MM"); shown disabled as "Lewat". */
  isPast?: (start: string) => boolean
  /** Courts that are still free for the slot the renter tried, shown when they hit a booked hour. */
  alternatives?: { id: string | number; label: string }[]
  onPickAlternative?: (id: string | number) => void
  disabled?: boolean
  /**
   * `compact`: one-line 44px slots without the sub-line, the chosen hours merged into one capsule
   * (click it to clear the choice), and no legend or summary line (the parent shows them).
   */
  variant?: "default" | "compact"
  className?: string
}

const pad = (n: number) => String(n).padStart(2, "0")
const toTime = (min: number) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`

function SlotPicker({
  open = "08:00",
  close = "22:00",
  booked = [],
  value,
  defaultValue = null,
  onValueChange,
  isPast,
  alternatives,
  onPickAlternative,
  disabled,
  variant = "default",
  className,
}: SlotPickerProps) {
  const [inner, setInner] = React.useState<TimeRange | null>(defaultValue)
  const [anchor, setAnchor] = React.useState<number | null>(null)
  const [conflict, setConflict] = React.useState<string | null>(null)
  const range = value !== undefined ? value : inner
  const compact = variant === "compact"
  const columns = useGridColumns(compact)

  const slots = React.useMemo(() => {
    const out: number[] = []
    for (let m = toMinutes(open); m + 60 <= toMinutes(close); m += 60) out.push(m)
    return out
  }, [open, close])

  const isBooked = (m: number) =>
    booked.some((b) => m < toMinutes(b.end) && m + 60 > toMinutes(b.start))
  const isSelected = (m: number) =>
    !!range && m >= toMinutes(range.start) && m < toMinutes(range.end)

  const set = (r: TimeRange | null) => {
    setInner(r)
    onValueChange?.(r)
  }

  const pick = (m: number) => {
    if (isBooked(m)) {
      setConflict(`${toTime(m)}–${toTime(m + 60)}`)
      return
    }
    setConflict(null)
    // Second click after the anchor extends the range, as long as no booked hour sits between.
    if (anchor !== null && m > anchor && !slots.some((s) => s > anchor && s < m && isBooked(s))) {
      set({ start: toTime(anchor), end: toTime(m + 60) })
      setAnchor(null)
      return
    }
    set({ start: toTime(m), end: toTime(m + 60) })
    setAnchor(m)
  }

  const hours = range ? (toMinutes(range.end) - toMinutes(range.start)) / 60 : 0

  const clear = () => {
    setConflict(null)
    setAnchor(null)
    set(null)
  }

  const compactSlots = () =>
    slots.map((m) => {
      if (range && isSelected(m)) {
        // the whole range is one capsule, placed at its first hour
        if (m !== toMinutes(range.start)) return null
        return (
          <button
            key={m}
            type="button"
            disabled={disabled}
            aria-pressed={true}
            aria-label={`Dipilih ${range.start}–${range.end}, ${hours} jam. Ketuk untuk membatalkan`}
            data-state="selected"
            onClick={clear}
            style={{ gridColumn: `span ${Math.min(hours, columns.count)}` }}
            className="flex h-11 cursor-pointer items-center justify-between gap-2 rounded-md border border-primary bg-primary px-3.5 text-sm font-semibold text-primary-foreground tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
          >
            <span className="truncate">{range.start}–{range.end}</span>
            <span className="shrink-0 text-xs font-medium text-primary-foreground/90">{hours} jam</span>
          </button>
        )
      }
      const taken = isBooked(m)
      const past = !taken && !!isPast?.(toTime(m))
      return (
        <button
          key={m}
          type="button"
          disabled={disabled || past}
          aria-pressed={false}
          aria-disabled={taken || undefined}
          aria-label={taken ? `${toTime(m)}, terbooking` : past ? `${toTime(m)}, sudah lewat` : undefined}
          data-state={taken ? "booked" : past ? "past" : "free"}
          onClick={() => pick(m)}
          className={cn(
            "flex h-11 cursor-pointer items-center justify-center rounded-md border px-1 text-sm tabular-nums transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
            taken &&
              "cursor-not-allowed border-dashed border-input bg-transparent font-medium text-muted-foreground line-through decoration-muted-foreground/60",
            past && "border-transparent bg-canvas font-medium",
            !taken && !past && "border-transparent bg-canvas font-medium hover:bg-muted"
          )}
        >
          {toTime(m)}
        </button>
      )
    })

  return (
    <div data-slot="slot-picker" data-variant={variant} className={cn("grid gap-3", className)}>
      <div
        ref={columns.ref}
        role="group"
        aria-label="Pilih jam"
        className={cn(
          "grid gap-2",
          compact ? "grid-cols-[repeat(auto-fill,minmax(4.75rem,1fr))]" : "grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))]"
        )}
      >
        {compact ? compactSlots() : slots.map((m) => {
          const taken = isBooked(m)
          const selected = isSelected(m)
          const past = !taken && !!isPast?.(toTime(m))
          return (
            <button
              key={m}
              type="button"
              disabled={disabled || past}
              aria-pressed={selected}
              aria-disabled={taken || undefined}
              data-state={taken ? "booked" : past ? "past" : selected ? "selected" : "free"}
              onClick={() => pick(m)}
              className={cn(
                "flex h-auto cursor-pointer flex-col items-center gap-0.5 rounded-md border px-2 py-2 text-sm tabular-nums transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
                taken &&
                  "cursor-not-allowed border-dashed border-input bg-transparent text-muted-foreground",
                !taken && !selected && !past && "border-transparent bg-canvas hover:bg-muted",
                past && "border-transparent bg-canvas",
                selected && "border-primary bg-primary text-primary-foreground"
              )}
            >
              <span className={cn("font-medium", taken && "line-through decoration-muted-foreground/60")}>{toTime(m)}</span>
              <span className={cn("text-[11px]", selected ? "text-primary-foreground/80" : "text-muted-foreground")}>
                {taken ? "Terbooking" : past ? "Lewat" : `s/d ${toTime(m + 60)}`}
              </span>
            </button>
          )
        })}
      </div>

      {!compact && (
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-canvas ring-1 ring-border/60" />Kosong</span>
          <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-primary" />Dipilih</span>
          <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm border border-dashed border-input" />Terbooking</span>
        </div>
        <span aria-live="polite" className="font-medium text-foreground">
          {range ? `${range.start}–${range.end} · ${hours} jam` : "Klik jam mulai, lalu jam terakhir"}
        </span>
      </div>
      )}

      {conflict && (
        <div
          role="alert"
          className="grid gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm"
        >
          <p className="flex items-start gap-2 font-medium [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-destructive">
            <CircleAlert aria-hidden="true" />
            Lapangan sudah terbooking pada jam {conflict}.
          </p>
          {alternatives && alternatives.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 ps-6">
              <span className="text-muted-foreground">Masih kosong:</span>
              {alternatives.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onPickAlternative?.(a.id)}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/** Number of columns the auto-fill grid currently has, so a capsule never spans more than one row. */
function useGridColumns(active: boolean) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [count, setCount] = React.useState(7)
  React.useEffect(() => {
    const el = ref.current
    if (!active || !el) return
    const measure = () =>
      setCount(Math.max(1, getComputedStyle(el).gridTemplateColumns.split(" ").filter(Boolean).length))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [active])
  return { ref, count }
}

export { SlotPicker }
export type { SlotPickerProps, TimeRange }
