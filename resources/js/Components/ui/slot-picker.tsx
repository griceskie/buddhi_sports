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
  /** Courts that are still free for the slot the renter tried, shown when they hit a booked hour. */
  alternatives?: { id: string | number; label: string }[]
  onPickAlternative?: (id: string | number) => void
  disabled?: boolean
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
  alternatives,
  onPickAlternative,
  disabled,
  className,
}: SlotPickerProps) {
  const [inner, setInner] = React.useState<TimeRange | null>(defaultValue)
  const [anchor, setAnchor] = React.useState<number | null>(null)
  const [conflict, setConflict] = React.useState<string | null>(null)
  const range = value !== undefined ? value : inner

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

  return (
    <div data-slot="slot-picker" className={cn("grid gap-3", className)}>
      <div
        role="group"
        aria-label="Pilih jam"
        className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2"
      >
        {slots.map((m) => {
          const taken = isBooked(m)
          const selected = isSelected(m)
          return (
            <button
              key={m}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              aria-disabled={taken || undefined}
              data-state={taken ? "booked" : selected ? "selected" : "free"}
              onClick={() => pick(m)}
              className={cn(
                "flex h-auto cursor-pointer flex-col items-center gap-0.5 rounded-md border px-2 py-2 text-sm tabular-nums transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
                taken &&
                  "cursor-not-allowed border-dashed bg-muted text-muted-foreground",
                !taken && !selected && "border-input bg-background hover:bg-muted",
                selected && "border-primary bg-primary text-primary-foreground"
              )}
            >
              <span className={cn("font-medium", taken && "line-through decoration-muted-foreground/60")}>{toTime(m)}</span>
              <span className={cn("text-[11px]", selected ? "text-primary-foreground/80" : "text-muted-foreground")}>
                {taken ? "Terbooking" : `s/d ${toTime(m + 60)}`}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm border border-input bg-background" />Kosong</span>
          <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-primary" />Dipilih</span>
          <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm border border-dashed bg-muted" />Terbooking</span>
        </div>
        <span aria-live="polite" className="font-medium text-foreground">
          {range ? `${range.start}–${range.end} · ${hours} jam` : "Klik jam mulai, lalu jam terakhir"}
        </span>
      </div>

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
