import * as React from "react"
import { cn } from "cn"
import { CircleAlert, CircleCheck, ExternalLink, FileText, ImageOff } from "lucide-react"
import { Button, buttonVariants } from "./button"
import { PaymentStatusBadge } from "./badge"
import { formatRupiah, formatTanggal } from "./format"
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "./sheet"

type ProofReviewPayment = {
  idPembayaran: number
  idBooking: number
  tglBayar: string
  jumlahBayar: number
  /** URL of the uploaded proof (image or PDF), or null when nothing was uploaded. */
  buktiBayar: string | null
  status: string
  /** From the joined booking / penyewa / lapangan rows, when the controller provides them. */
  namaPenyewa?: string
  namaLapangan?: string
  /** bookings.totalBayar — what should have been paid. */
  totalBayar: number
}

type ProofReviewProps = {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  payment: ProofReviewPayment
  onApprove?: () => void
  onReject?: () => void
  /** Disables both buttons while the request runs (Inertia `processing`). */
  processing?: boolean
}

function AmountCheck({ paid, due }: { paid: number; due: number }) {
  const diff = paid - due
  if (diff === 0)
    return (
      <p className="flex items-center gap-1.5 text-sm font-medium text-success [&_svg]:size-4">
        <CircleCheck aria-hidden="true" />
        Jumlah sesuai total booking
      </p>
    )
  return (
    <p className="flex items-center gap-1.5 text-sm font-medium text-destructive [&_svg]:size-4">
      <CircleAlert aria-hidden="true" />
      {diff < 0 ? `Kurang ${formatRupiah(-diff)}` : `Lebih ${formatRupiah(diff)}`} dari total booking
    </p>
  )
}

/** Admin verification panel: the proof next to the amounts, then Terima / Tolak (PRD §4 Pembayaran, §9 risks). */
function ProofReview({ open, defaultOpen, onOpenChange, payment, onApprove, onReject, processing }: ProofReviewProps) {
  const p = payment
  const isPdf = !!p.buktiBayar && /\.pdf($|\?)/i.test(p.buktiBayar)
  const decided = p.status.toLowerCase() !== "menunggu verifikasi"
  const row = (label: string, value: React.ReactNode) => (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium tabular-nums">{value}</dd>
    </div>
  )

  return (
    <Sheet open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Verifikasi pembayaran</SheetTitle>
          <SheetDescription>
            Booking #{p.idBooking}
            {p.namaPenyewa && ` · ${p.namaPenyewa}`}
            {p.namaLapangan && ` · ${p.namaLapangan}`}
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="grid content-start gap-5">
          <div className="overflow-hidden rounded-lg border bg-muted">
            {!p.buktiBayar ? (
              <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 text-sm text-muted-foreground [&_svg]:size-6">
                <ImageOff aria-hidden="true" />
                Belum ada bukti pembayaran
              </div>
            ) : isPdf ? (
              <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 text-sm [&_svg]:size-6">
                <FileText aria-hidden="true" className="text-muted-foreground" />
                Bukti berupa PDF
              </div>
            ) : (
              <img src={p.buktiBayar} alt="Bukti pembayaran" className="max-h-80 w-full object-contain" />
            )}
          </div>
          {p.buktiBayar && (
            <a
              href={p.buktiBayar}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "-mt-3 w-fit")}
            >
              <ExternalLink />
              Buka ukuran penuh
            </a>
          )}

          <dl className="grid gap-2 text-sm">
            {row("Status", <PaymentStatusBadge status={p.status} />)}
            {row("Tanggal bayar", formatTanggal(p.tglBayar, "d MMMM yyyy"))}
            {row("Total booking", formatRupiah(p.totalBayar))}
            {row("Jumlah dibayar", formatRupiah(p.jumlahBayar))}
          </dl>
          <AmountCheck paid={p.jumlahBayar} due={p.totalBayar} />
        </SheetBody>

        <SheetFooter>
          <Button variant="destructive" disabled={processing || decided || !p.buktiBayar} onClick={onReject}>
            Tolak
          </Button>
          <Button disabled={processing || decided || !p.buktiBayar} onClick={onApprove}>
            Terima pembayaran
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export { ProofReview }
export type { ProofReviewProps, ProofReviewPayment }
