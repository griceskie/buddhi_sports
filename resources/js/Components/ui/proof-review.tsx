import * as React from "react"
import { cn } from "cn"
import { CircleAlert, CircleCheck, ExternalLink, FileText, ImageOff } from "lucide-react"
import { Button, buttonVariants } from "./button"
import { PaymentStatusBadge } from "./badge"
import { formatRupiah, formatTanggal } from "./format"
import { Label } from "./label"
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "./sheet"
import { Textarea } from "./textarea"

type ProofReviewPayment = {
  idPembayaran: number
  idBooking: number
  tglBayar: string
  jumlahBayar: number
  /** URL of the uploaded proof (image or PDF), or null when nothing was uploaded. */
  buktiBayar: string | null
  /** Set when the URL has no file extension, e.g. a route that streams a private file. */
  buktiPdf?: boolean
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
  /** Called with the reason the renter will see; rejecting without a reason is not possible. */
  onReject?: (reason: string) => void
  /** Server validation message for the reason, e.g. Inertia `errors.alasan`. */
  rejectError?: string
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

/** The uploaded proof (image, or a PDF placeholder) with a link to open it full size. */
function ProofPreview({ src, pdf }: { src: string | null; pdf?: boolean }) {
  const isPdf = !!src && (pdf ?? /\.pdf($|\?)/i.test(src))
  return (
    <div className="grid gap-2">
      <div className="overflow-hidden rounded-lg border bg-muted">
        {!src ? (
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
          <img src={src} alt="Bukti pembayaran" className="max-h-80 w-full object-contain" />
        )}
      </div>
      {src && (
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit")}
        >
          <ExternalLink />
          Buka ukuran penuh
        </a>
      )}
    </div>
  )
}

/** Admin verification panel: the proof next to the amounts, then Terima / Tolak (PRD §4 Pembayaran, §9 risks). */
function ProofReview({ open, defaultOpen, onOpenChange, payment, onApprove, onReject, rejectError, processing }: ProofReviewProps) {
  const p = payment
  // "Tolak" first asks for the reason; only the second button sends it
  const [rejecting, setRejecting] = React.useState(false)
  const [reason, setReason] = React.useState("")
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
          <ProofPreview src={p.buktiBayar} pdf={p.buktiPdf} />

          <dl className="grid gap-2 text-sm">
            {row("Status", <PaymentStatusBadge status={p.status} />)}
            {row("Tanggal bayar", formatTanggal(p.tglBayar, "d MMMM yyyy"))}
            {row("Total booking", formatRupiah(p.totalBayar))}
            {row("Jumlah dibayar", formatRupiah(p.jumlahBayar))}
          </dl>
          <AmountCheck paid={p.jumlahBayar} due={p.totalBayar} />

          {rejecting && (
            <div className="grid gap-1.5 pb-4">
              <Label htmlFor="alasan-tolak">Alasan penolakan</Label>
              <Textarea
                id="alasan-tolak"
                autoFocus
                rows={3}
                maxLength={500}
                placeholder="Contoh: nominal transfer kurang Rp50.000, atau foto bukti tidak terbaca."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                aria-invalid={!!rejectError}
              />
              {rejectError ? (
                <p className="text-sm text-destructive">{rejectError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Ditampilkan ke penyewa agar bisa mengunggah ulang bukti yang benar.</p>
              )}
            </div>
          )}
        </SheetBody>

        <SheetFooter>
          {rejecting ? (
            <>
              <Button variant="outline" disabled={processing} onClick={() => setRejecting(false)}>
                Batal
              </Button>
              <Button variant="destructive" disabled={processing || !reason.trim()} onClick={() => onReject?.(reason.trim())}>
                Tolak pembayaran
              </Button>
            </>
          ) : (
            <>
              <Button variant="destructive" disabled={processing || decided || !p.buktiBayar} onClick={() => setRejecting(true)}>
                Tolak
              </Button>
              <Button disabled={processing || decided || !p.buktiBayar} onClick={onApprove}>
                Terima pembayaran
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export { ProofReview, ProofPreview }
export type { ProofReviewProps, ProofReviewPayment }
