import { Button } from '@/Components/ui/button';
import { bookingTotal, formatRupiah, formatTanggal } from '@/Components/ui/format';
import { Popover, PopoverContent, PopoverTrigger } from '@/Components/ui/popover';
import { cn } from 'cn';
import { X } from 'lucide-react';
import { useState } from 'react';
import { jam, Lapangan, Pilihan } from './jadwal';

type Props = {
    lapangan: Lapangan | null;
    pilihan: Pilihan | null;
    tanggal: Date;
    onBook: () => void;
    memproses?: boolean;
};

const hitung = (lapangan: Lapangan | null, pilihan: Pilihan | null) =>
    lapangan && pilihan
        ? {
              durasi: pilihan.end - pilihan.start,
              total: bookingTotal(jam(pilihan.start), jam(pilihan.end), lapangan.tarifPerJam),
              rentang: `${jam(pilihan.start)}–${jam(pilihan.end)}`,
          }
        : null;

/** Harga bergaris bawah; diklik membuka "Rincian harga" (pola Airbnb, tanpa diskon). */
function HargaDenganRincian({
    lapangan,
    durasi,
    total,
    side,
    className,
}: {
    lapangan: Lapangan;
    durasi: number;
    total: number;
    side: 'top' | 'bottom';
    className?: string;
}) {
    const [buka, setBuka] = useState(false);
    return (
        <Popover open={buka} onOpenChange={setBuka}>
            <PopoverTrigger
                className={cn(
                    'cursor-pointer rounded-sm font-semibold tabular-nums underline decoration-1 underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                    className,
                )}
            >
                {formatRupiah(total)}
            </PopoverTrigger>
            <PopoverContent
                side={side}
                align="start"
                sideOffset={8}
                collisionPadding={16}
                className="grid w-80 max-w-[calc(100vw-2rem)] gap-3.5 rounded-2xl p-5 pl-6 tabular-nums"
            >
                <div className="flex items-center justify-between gap-3">
                    <p className="text-subheadline font-semibold">Rincian harga</p>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        className="-my-1 -mr-1.5 rounded-full"
                        aria-label="Tutup rincian harga"
                        onClick={() => setBuka(false)}
                    >
                        <X />
                    </Button>
                </div>
                <div className="flex justify-between gap-3 text-subheadline">
                    <span>
                        {durasi} jam x {formatRupiah(lapangan.tarifPerJam)}
                    </span>
                    <span>{formatRupiah(total)}</span>
                </div>
                <div className="flex justify-between gap-3 border-t pt-3.5 text-subheadline font-semibold">
                    <span>Total</span>
                    <span>{formatRupiah(total)}</span>
                </div>
            </PopoverContent>
        </Popover>
    );
}

/** Kartu ringkasan di kanan (mulai lg): harga, kotak IN · JAM · LAPANGAN, tombol booking. */
export default function RingkasanBooking({ lapangan, pilihan, tanggal, onBook, memproses }: Props) {
    const h = hitung(lapangan, pilihan);
    const label = 'text-caption-2 font-semibold uppercase';

    return (
        <div className="grid gap-4 rounded-2xl border bg-card p-5 text-card-foreground">
            {h && lapangan ? (
                <p className="text-body">
                    <HargaDenganRincian lapangan={lapangan} durasi={h.durasi} total={h.total} side="bottom" />{' '}
                    <span className="text-subheadline text-muted-foreground">untuk {h.durasi} jam</span>
                </p>
            ) : (
                <p className="text-body font-semibold">Pilih jam</p>
            )}

            <dl className="grid grid-cols-2 overflow-hidden rounded-xl border border-input">
                <div className="border-r border-input px-3 py-2.5">
                    <dt className={label}>In</dt>
                    <dd className="text-footnote whitespace-nowrap">{formatTanggal(tanggal, 'EEE, d MMM')}</dd>
                </div>
                <div className="px-3 py-2.5">
                    <dt className={label}>Jam</dt>
                    <dd className={cn('text-footnote tabular-nums', !h && 'text-muted-foreground')}>
                        {h ? h.rentang : 'Pilih jam'}
                    </dd>
                </div>
                <div className="col-span-2 border-t border-input px-3 py-2.5">
                    <dt className={label}>Lapangan</dt>
                    <dd className="truncate text-footnote">{lapangan?.namaLapangan ?? '-'}</dd>
                </div>
            </dl>

            <Button variant="elevated" className="h-11 w-full text-[15px]" disabled={!h || memproses} onClick={onBook}>
                {memproses ? 'Menyimpan…' : 'Booking sekarang'}
            </Button>
            <p className="text-center text-footnote text-muted-foreground">Anda belum dikenakan biaya</p>
        </div>
    );
}

/** Bar bawah di bawah lg: harga (membuka rincian ke atas) + tanggal dan jam, tombol booking. */
export function BarBookingMobile({ lapangan, pilihan, tanggal, onBook, memproses }: Props) {
    const h = hitung(lapangan, pilihan);

    return (
        <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 border-t bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
            <div className="min-w-0">
                {h && lapangan ? (
                    <>
                        <p className="text-subheadline">
                            <HargaDenganRincian lapangan={lapangan} durasi={h.durasi} total={h.total} side="top" />{' '}
                            <span className="text-muted-foreground">untuk {h.durasi} jam</span>
                        </p>
                        <p className="truncate text-caption-1 font-medium underline underline-offset-2">
                            {formatTanggal(tanggal, 'EEE, d MMM')} · {h.rentang}
                        </p>
                    </>
                ) : (
                    <>
                        <p className="text-subheadline font-semibold">Belum ada jam dipilih</p>
                        <p className="text-caption-1 text-muted-foreground">Klik jam yang kosong di atas.</p>
                    </>
                )}
            </div>
            <Button variant="elevated" className="h-11 shrink-0 text-[15px]" disabled={!h || memproses} onClick={onBook}>
                {memproses ? 'Menyimpan…' : 'Booking sekarang'}
            </Button>
        </div>
    );
}
