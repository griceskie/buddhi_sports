import { BookingPenyewa, keadaan, waktuSingkat } from '@/Components/booking/pembayaran';
import { kelasPopup } from '@/Components/booking/popup';
import { PaymentStatusBadge } from '@/Components/ui/badge';
import { buttonVariants } from '@/Components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/Components/ui/dialog';
import { formatRupiah } from '@/Components/ui/format';
import { cn } from 'cn';
import { ImageOff, X } from 'lucide-react';
import { useState } from 'react';

/** Bukti transfer yang sudah dikirim (atau yang ditolak), dengan status dan jumlahnya. */
export default function DialogBukti({
    booking,
    open,
    onOpenChange,
}: {
    booking: BookingPenyewa;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const k = keadaan(booking);
    const ditolak = k === 'ditolak';
    const [gagal, setGagal] = useState(false);

    const catatan = ditolak
        ? 'Kirim bukti yang baru dari langkah 2. Butuh bantuan? '
        : k === 'dikonfirmasi'
          ? 'Ada yang tidak sesuai? '
          : 'Salah kirim? ';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className={cn(
                    kelasPopup,
                    'flex flex-col gap-5 bg-background px-7 pt-7 sm:w-[min(520px,calc(100%-4rem))] sm:max-w-none',
                    'max-sm:gap-4 max-sm:px-4 max-sm:pt-5',
                )}
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="grid min-w-0 gap-1">
                        <DialogTitle className="text-title-3 max-sm:text-body">
                            {ditolak ? 'Bukti sebelumnya' : 'Bukti transfer'}
                        </DialogTitle>
                        <DialogDescription className="text-subheadline max-sm:text-footnote">
                            {booking.dikirimPada ? `Dikirim ${waktuSingkat(booking.dikirimPada)}` : 'Bukti transfer'}
                            {ditolak && ' · ditolak pengelola'}
                        </DialogDescription>
                    </div>
                    <DialogClose aria-label="Tutup" className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}>
                        <X className="size-[18px]" />
                    </DialogClose>
                </div>

                <div className="flex items-center justify-center rounded-2xl bg-[color-mix(in_oklab,var(--foreground)_6%,var(--canvas))] p-4">
                    {booking.buktiUrl && !gagal ? (
                        <img
                            src={booking.buktiUrl}
                            alt="Bukti transfer"
                            onError={() => setGagal(true)}
                            className="aspect-[9/16] w-full max-w-[232px] rounded-xl border bg-card object-contain max-sm:max-w-[168px]"
                        />
                    ) : (
                        // bukti lama bisa berupa PDF; pratinjaunya dibuka di tab baru
                        <div className="flex aspect-[9/16] w-full max-w-[232px] flex-col items-center justify-center gap-2 rounded-xl border bg-card px-4 text-center text-muted-foreground max-sm:max-w-[168px]">
                            <ImageOff className="size-7" strokeWidth={1.6} aria-hidden="true" />
                            <span className="text-footnote">Pratinjau tidak tersedia</span>
                        </div>
                    )}
                </div>

                <dl className="grid">
                    <div className="flex min-h-11 items-center justify-between gap-3">
                        <dt className="text-subheadline text-muted-foreground">Status</dt>
                        <dd>
                            <PaymentStatusBadge status={booking.statusPembayaran ?? 'Menunggu Verifikasi'} />
                        </dd>
                    </div>
                    <div className="flex min-h-11 items-center justify-between gap-3 border-t">
                        <dt className="text-subheadline text-muted-foreground">Jumlah dibayar</dt>
                        <dd className="text-subheadline font-semibold tabular-nums">{formatRupiah(booking.totalBayar)}</dd>
                    </div>
                    {ditolak && booking.alasanTolak && (
                        <div className="flex items-start justify-between gap-3 border-t py-3">
                            <dt className="shrink-0 text-subheadline text-muted-foreground">Alasan ditolak</dt>
                            <dd className="text-right text-subheadline font-semibold">{booking.alasanTolak}</dd>
                        </div>
                    )}
                </dl>

                <div className="sticky bottom-0 z-[1] -mx-7 mt-auto flex flex-wrap items-center justify-between gap-3 border-t bg-background px-7 pt-4 pb-5 max-sm:-mx-4 max-sm:px-4 max-sm:pt-3 max-sm:pb-4">
                    <p className="min-w-0 text-footnote text-muted-foreground">
                        {catatan}
                        <HubungiPengelola awalBesar />.
                    </p>
                    <div className="ml-auto flex gap-2 max-sm:w-full max-sm:*:flex-1">
                        {booking.buktiUrl && (
                            <a
                                href={booking.buktiUrl}
                                target="_blank"
                                rel="noopener"
                                className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
                            >
                                Buka di tab baru
                            </a>
                        )}
                        <DialogClose className={cn(buttonVariants({ size: 'lg' }))}>Tutup</DialogClose>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

/** Belum ada kontak pengelola di aplikasi, jadi ditampilkan sebagai teks tebal, bukan tautan. */
export function HubungiPengelola({ awalBesar = false }: { awalBesar?: boolean }) {
    return <span className="font-semibold text-foreground">{awalBesar ? 'Hubungi pengelola' : 'hubungi pengelola'}</span>;
}
