import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { CalendarClock, CheckCheck, CircleCheck, CircleX, Clock, Wrench } from "lucide-react"

/* -------------------------------------------------------------------------- */
/*  Badge                                                                     */
/* -------------------------------------------------------------------------- */

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        // Solid, like an iOS capsule: a 10 % tint with coloured text drops below 4.5:1 with the HIG colours.
        success: "border-transparent bg-success text-success-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "border-border text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------- */
/*  PaymentStatusBadge – the three payment states from the PRD                */
/* -------------------------------------------------------------------------- */

type PaymentStatus = "menunggu verifikasi" | "terverifikasi" | "ditolak"

const paymentStatus: Record<
  PaymentStatus,
  { variant: "outline" | "success" | "destructive"; Icon: typeof Clock; label: string }
> = {
  "menunggu verifikasi": { variant: "outline", Icon: Clock, label: "Menunggu verifikasi" },
  terverifikasi: { variant: "success", Icon: CircleCheck, label: "Terverifikasi" },
  ditolak: { variant: "destructive", Icon: CircleX, label: "Ditolak" },
}

function PaymentStatusBadge({
  status,
  className,
}: {
  status: PaymentStatus | string
  className?: string
}) {
  const key = String(status).toLowerCase() as PaymentStatus
  const s = paymentStatus[key] ?? { variant: "outline" as const, Icon: Clock, label: String(status) }
  return (
    <Badge variant={s.variant} className={className} data-status={key}>
      <s.Icon aria-hidden="true" />
      {s.label}
    </Badge>
  )
}

/* -------------------------------------------------------------------------- */
/*  BookingStatusBadge – bookings.status                                      */
/*  Dipesan and Dikonfirmasi hold the slot; Dibatalkan frees it.              */
/* -------------------------------------------------------------------------- */

type BookingStatus = "dipesan" | "dikonfirmasi" | "selesai" | "dibatalkan"
type BadgeVariant = "outline" | "secondary" | "success" | "destructive"

const bookingStatus: Record<BookingStatus, { variant: BadgeVariant; Icon: typeof Clock; label: string }> = {
  dipesan: { variant: "outline", Icon: CalendarClock, label: "Dipesan" },
  dikonfirmasi: { variant: "success", Icon: CircleCheck, label: "Dikonfirmasi" },
  selesai: { variant: "secondary", Icon: CheckCheck, label: "Selesai" },
  dibatalkan: { variant: "destructive", Icon: CircleX, label: "Dibatalkan" },
}

/** Booking states that still block the slot in the double-booking check. */
const SLOT_HOLDING_STATUSES: BookingStatus[] = ["dipesan", "dikonfirmasi"]

function BookingStatusBadge({ status, className }: { status: BookingStatus | string; className?: string }) {
  const key = String(status).toLowerCase() as BookingStatus
  const s = bookingStatus[key] ?? { variant: "outline" as const, Icon: CalendarClock, label: String(status) }
  return (
    <Badge variant={s.variant} className={className} data-status={key}>
      <s.Icon aria-hidden="true" />
      {s.label}
    </Badge>
  )
}

/* -------------------------------------------------------------------------- */
/*  CourtStatusBadge – lapangans.status (Tersedia / Perbaikan) plus Dipesan,  */
/*  which is derived from bookings for a date or slot, never stored.          */
/* -------------------------------------------------------------------------- */

type CourtStatus = "tersedia" | "dipesan" | "perbaikan"

const courtStatus: Record<CourtStatus, { variant: BadgeVariant; Icon: typeof Clock; label: string }> = {
  tersedia: { variant: "success", Icon: CircleCheck, label: "Tersedia" },
  dipesan: { variant: "outline", Icon: CalendarClock, label: "Dipesan" },
  perbaikan: { variant: "secondary", Icon: Wrench, label: "Perbaikan" },
}

function CourtStatusBadge({
  status,
  children,
  className,
}: {
  status: CourtStatus | string
  /** Replaces the label, e.g. "Dipesan 08:00–10:00". */
  children?: React.ReactNode
  className?: string
}) {
  const raw = String(status).toLowerCase()
  // The repo's Lapangan form still stores "Kosong" / "Terbooking"; read them as the new states.
  const key = (({ kosong: "tersedia", terbooking: "dipesan" }) as Record<string, CourtStatus>)[raw] ?? (raw as CourtStatus)
  const s = courtStatus[key] ?? { variant: "outline" as const, Icon: CircleCheck, label: String(status) }
  return (
    <Badge variant={s.variant} className={className} data-status={key}>
      <s.Icon aria-hidden="true" />
      {children ?? s.label}
    </Badge>
  )
}

export {
  Badge,
  badgeVariants,
  PaymentStatusBadge,
  BookingStatusBadge,
  CourtStatusBadge,
  SLOT_HOLDING_STATUSES,
}
export type { PaymentStatus, BookingStatus, CourtStatus }
