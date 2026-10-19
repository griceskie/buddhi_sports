import * as React from "react"
import { cn } from "cn"
import { bookingTotal, durationHours, formatRupiah, formatTanggal } from "./format"

type BookingSummaryProps = {
  /** lapangans.namaLapangan */
  court: string
  /** lapangans.jenis */
  type?: string
  /** bookings.tanggal */
  date: Date | string
  /** bookings.jamMulai / jamSelesai, "HH:MM" */
  start: string
  end: string
  /** lapangans.tarifPerJam */
  rate: number
  /** Extra rows or a footer, e.g. the submit button. */
  children?: React.ReactNode
  className?: string
}

/** Shows the computed totalBayar: tarifPerJam × duration. Send the same figure to the server. */
function BookingSummary({ court, type, date, start, end, rate, children, className }: BookingSummaryProps) {
  const hours = durationHours(start, end)
  const total = bookingTotal(start, end, rate)
  const row = (label: React.ReactNode, value: React.ReactNode) => (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
  return (
    <div
      data-slot="booking-summary"
      className={cn("grid gap-4 rounded-lg border bg-card p-4 text-sm text-card-foreground shadow-sm", className)}
    >
      <p className="font-semibold">Ringkasan booking</p>
      <dl className="grid gap-2">
        {row("Lapangan", type ? `${court} · ${type}` : court)}
        {row("Tanggal", formatTanggal(date))}
        {row("Jam", <span className="tabular-nums">{start}–{end}</span>)}
        {row("Tarif", <span className="tabular-nums">{formatRupiah(rate)} × {hours.toLocaleString("id-ID")} jam</span>)}
      </dl>
      <div className="flex items-baseline justify-between gap-4 border-t pt-3">
        <span className="font-medium">Total bayar</span>
        <span data-slot="booking-total" className="text-lg font-semibold tabular-nums">
          {formatRupiah(total)}
        </span>
      </div>
      {children}
    </div>
  )
}

export { BookingSummary }
export type { BookingSummaryProps }
