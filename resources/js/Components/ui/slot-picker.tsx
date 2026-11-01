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
   * `compact`: one-line 44px slots without the sub-line, the chosen range shown like a date-range
   * calendar (first and last hour filled, hours between tinted; clicking a lone chosen hour clears it),
   * and no legend or summary line (the parent shows them).
   */
  variant?: "default" | "compact"
  /** Extra classes for the grid of hours, e.g. the number of columns per breakpoint. */
  gridClassName?: string
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
  gridClassName,
  className,
}: SlotPickerProps) {
  const [inner, setInner] = React.useState<TimeRange | null>(defaultValue)
  const [anchor, setAnchor] = React.useState<number | null>(null)
  const [conflict, setConflict] = React.useState<string | null>(null)
  const [hover, setHover] = React.useState<number | null>(null)
  const range = value !== undefined ? value : inner
  const compact = variant === "compact"

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

  // A lone chosen hour set from outside (e.g. preselected by the page) also acts as the anchor.
  const start =
    anchor ??
    (range && toMinutes(range.end) - toMinutes(range.start) === 60 ? toMinutes(range.start) : null)
  const canExtendTo = (m: number) =>
    start !== null && m > start && !slots.some((s) => s > start && s <= m && isBooked(s))

  const pick = (m: number) => {
    if (isBooked(m)) {
      setConflict(`${toTime(m)}–${toTime(m + 60)}`)
      return
    }
    setConflict(null)
    // Second click after the anchor extends the range, as long as no booked hour sits between.
    if (canExtendTo(m)) {
      set({ start: toTime(start!), end: toTime(m + 60) })
      setAnchor(null)
      setHover(null)
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

  // Like a date-range calendar: the first and last hour are filled, the hours between are tinted.
  // While a start is set, hovering a later free hour previews the range up to it.
  const preview = hover !== null && canExtendTo(hover) ? { from: start!, to: hover } : null
  const compactSlots = () =>
    slots.map((m) => {
      const taken = isBooked(m)
      const past = !taken && !!isPast?.(toTime(m))
      const selected = preview ? m >= preview.from && m <= preview.to : isSelected(m)
      const edge =
        selected &&
        (preview
          ? m === preview.from || m === preview.to
          : m === toMinutes(range!.start) || m + 60 === toMinutes(range!.end))
      const middle = selected && !edge
      // the only chosen hour, clicked again, clears the choice
      const single = !preview && selected && hours === 1
      const label = `${toTime(m)}–${toTime(m + 60)}`
      return (
        <button
          key={m}
          type="button"
          disabled={disabled || past}
          aria-pressed={selected}
          aria-disabled={taken || undefined}
          aria-label={taken ? `${label}, terbooking` : past ? `${label}, sudah lewat` : label}
          data-state={taken ? "booked" : past ? "past" : selected ? "selected" : "free"}
          data-range-edge={edge || undefined}
          data-range-middle={middle || undefined}
          onClick={() => (single ? clear() : pick(m))}
          onMouseEnter={() => setHover(m)}
          onMouseLeave={() => setHover(null)}
          className={cn(
            "flex h-11 cursor-pointer items-center justify-center rounded-md border px-1 text-sm whitespace-nowrap tabular-nums transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
            taken &&
              "cursor-not-allowed border-[1.5px] border-dashed border-foreground/32 bg-transparent font-medium text-muted-foreground line-through decoration-muted-foreground/60",
            past && "border-transparent bg-canvas font-medium",
            !taken && !past && !selected && "border-transparent bg-canvas font-medium hover:bg-muted",
            edge && "border-primary bg-primary font-semibold text-primary-foreground",
            middle && "border-transparent bg-primary/15 font-medium text-foreground"
          )}
        >
          {label}
        </button>
      )
    })

  return (
    <div data-slot="slot-picker" data-variant={variant} className={cn("grid gap-3", className)}>
      <div
        role="group"
        aria-label="Pilih jam"
        className={cn(
          "grid gap-2",
          compact ? "grid-cols-[repeat(auto-fill,minmax(6rem,1fr))]" : "grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))]",
          gridClassName
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

export { SlotPicker }
export type { SlotPickerProps, TimeRange }
