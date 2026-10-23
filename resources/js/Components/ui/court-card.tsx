import * as React from "react"
import { cn } from "cn"
import { Check } from "lucide-react"
import { CourtStatusBadge, type CourtStatus } from "./badge"
import { formatRupiah } from "./format"

type CourtCardProps = {
  /** lapangans.namaLapangan */
  name: string
  /** lapangans.jenis, e.g. "Bulutangkis" or "Basket" */
  type: string
  /** lapangans.tarifPerJam */
  rate: number
  /** Stored "Tersedia" / "Perbaikan", or "Dipesan" derived from bookings. */
  status: CourtStatus | string
  /** Overrides the badge label, e.g. "Dipesan 08:00–10:00" or "Penuh hari ini". */
  statusLabel?: React.ReactNode
  /** One supporting line, e.g. "3 slot kosong hari ini". */
  description?: React.ReactNode
  /** Makes the card a toggle button for picking a court. */
  selected?: boolean
  onSelect?: () => void
  /** Right-hand column (stacks under the body on phones), e.g. the price. Replaces the small rate line. Ignored when `onSelect` is set. */
  aside?: React.ReactNode
  /** Footer content, e.g. a Booking button. Ignored when `onSelect` is set. */
  action?: React.ReactNode
  className?: string
}

function CourtCard({
  name,
  type,
  rate,
  status,
  statusLabel,
  description,
  selected,
  onSelect,
  action,
  aside,
  className,
}: CourtCardProps) {
  const unavailable = String(status).toLowerCase() === "perbaikan"
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{type}</p>
          <p className="truncate font-semibold">{name}</p>
        </div>
        <CourtStatusBadge status={status}>{statusLabel}</CourtStatusBadge>
      </div>
      {!aside && (
        <p className="text-sm">
          <span className="font-semibold tabular-nums">{formatRupiah(rate)}</span>
          <span className="text-muted-foreground"> / jam</span>
        </p>
      )}
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </>
  )

  const base =
    "relative flex flex-col gap-3 rounded-lg border bg-card p-4 text-left text-card-foreground shadow-sm"

  if (onSelect) {
    return (
      <button
        type="button"
        data-slot="court-card"
        aria-pressed={!!selected}
        disabled={unavailable}
        onClick={onSelect}
        className={cn(
          base,
          "w-full cursor-pointer transition-colors outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-pressed:border-primary aria-pressed:ring-1 aria-pressed:ring-primary",
          className
        )}
      >
        {body}
        {selected && (
          <span className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground [&_svg]:size-3">
            <Check aria-hidden="true" />
          </span>
        )}
      </button>
    )
  }

  const footer = action && <div className="mt-1 flex gap-2">{action}</div>

  if (aside) {
    return (
      <div
        data-slot="court-card"
        className={cn(
          "grid overflow-hidden rounded-lg border bg-card text-left text-card-foreground shadow-sm sm:grid-cols-[minmax(0,1fr)_150px]",
          className
        )}
      >
        <div className="flex min-w-0 flex-col gap-3 p-4">
          {body}
          {footer}
        </div>
        <div
          data-slot="court-card-aside"
          className="flex items-baseline justify-between gap-2 border-t px-4 py-3 sm:flex-col sm:items-center sm:justify-center sm:border-t-0 sm:border-l sm:p-4 sm:text-center"
        >
          {aside}
        </div>
      </div>
    )
  }

  return (
    <div data-slot="court-card" className={cn(base, className)}>
      {body}
      {footer}
    </div>
  )
}

export { CourtCard }
export type { CourtCardProps }
