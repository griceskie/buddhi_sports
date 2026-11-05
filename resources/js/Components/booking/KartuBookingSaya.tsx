import { IKON_JENIS } from '@/Components/booking/jadwal';
import { BookingPenyewa, keadaan, sebabBatal, useSisaWaktu } from '@/Components/booking/pembayaran';
import { Button } from '@/Components/ui/button';
import { durationHours, formatRupiah, formatTanggal } from '@/Components/ui/format';
import { Popover, PopoverContent, PopoverTrigger } from '@/Components/ui/popover';
import { cn } from 'cn';
import { Check, CircleCheck, CircleX, Clock, Copy, Info } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type StatusKartu = {
    label: string;
    warna: string;
    Ikon: typeof Clock;
    info: string;
};

/**
 * Satu booking di Booking saya: ikon olahraga, nama lapangan, kode (bisa disalin), status dengan info,
 * jam, harga, dan satu tombol yang membuka pop-up pembayaran.
 */
export default function KartuBookingSaya({
    booking,
    riwayat,
    habisLokal,
    onBuka,
    onHabis,
}: {
    booking: BookingPenyewa;
    /** Tampilan Riwayat: tanggal ikut di jam, tanpa durasi, ikon diredupkan. */
    riwayat: boolean;
    /** Batas bayar habis selagi halaman terbuka. */
    habisLokal: boolean;
    onBuka: () => void;
    onHabis: (idBooking: number) => void;
}) {
    const k0 = keadaan(booking);
    const sisa = useSisaWaktu(k0 === 'belumBayar' && !habisLokal ? booking.batasBayar : null);
    const habis = habisLokal || (k0 === 'belumBayar' && !!sisa?.habis);
    const k = habis ? 'dibatalkan' : k0;
    const genting = !!sisa?.genting;

    useEffect(() => {
        if (habis && !habisLokal) onHabis(booking.idBooking);
    }, [habis, habisLokal, onHabis, booking.idBooking]);

    const [tersalin, setTersalin] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout>>();
    useEffect(() => () => clearTimeout(timer.current), []);
    const salin = () => {
        navigator.clipboard?.writeText(booking.kode).catch(() => {});
        setTersalin(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setTersalin(false), 1600);
    };

    const lewat = booking.tanggal < formatTanggal(new Date(), 'yyyy-MM-dd');
    const sebab = habis ? 'otomatis' : sebabBatal(booking);
    const status: StatusKartu = {
        belumBayar: {
            label: 'Belum dibayar',
            warna: genting ? 'text-destructive' : 'text-accessible-orange',
            Ikon: Clock,
            info: `Bayar sebelum pukul ${sisa?.jamBatas}, atau booking dibatalkan otomatis.`,
        },
        menungguVerifikasi: {
            label: 'Menunggu verifikasi',
            warna: 'text-accessible-orange',
            Ikon: Clock,
            info: 'Bukti transfer sudah dikirim. Pengelola sedang memeriksanya.',
        },
        ditolak: {
            label: 'Bukti ditolak',
            warna: 'text-destructive',
            Ikon: CircleX,
            info: `Alasan: ${booking.alasanTolak ?? 'bukti tidak sesuai.'} Kirim bukti yang baru.`,
        },
        dikonfirmasi: lewat
            ? { label: 'Selesai', warna: 'text-success', Ikon: CircleCheck, info: 'Jadwal sudah lewat.' }
            : {
                  label: 'Dikonfirmasi',
                  warna: 'text-success',
                  Ikon: CircleCheck,
                  info: 'Pembayaran terverifikasi. Jadwal ini milik Anda.',
              },
        dibatalkan: {
            label: habis ? 'Dibatalkan otomatis' : 'Dibatalkan',
            warna: 'text-destructive',
            Ikon: CircleX,
            info:
                sebab === 'penyewa'
                    ? 'Dibatalkan oleh Anda sebelum membayar. Tidak ada biaya.'
                    : sebab === 'otomatis'
                      ? 'Dibatalkan otomatis karena bukti tidak terkirim sebelum batas bayar.'
                      : 'Dibatalkan oleh pengelola. Ada pertanyaan? Hubungi pengelola.',
        },
    }[k];

    const durasi = durationHours(booking.jamMulai, booking.jamSelesai);
    const rentang = `${booking.jamMulai}–${booking.jamSelesai}`;
    const ikon = IKON_JENIS[booking.jenisLapangan];

    const badge = (hp: boolean) => (
        <Popover>
            <PopoverTrigger
                openOnHover
                delay={100}
                className={cn(
                    'inline-flex h-6 cursor-help items-center gap-1.5 px-0.5 text-footnote font-semibold whitespace-nowrap tabular-nums underline-offset-4 outline-none hover:underline hover:decoration-dotted focus-visible:underline focus-visible:decoration-dotted',
                    status.warna,
                )}
            >
                <status.Ikon className="size-4" strokeWidth={2.2} aria-hidden="true" />
                {status.label}
                {k === 'belumBayar' && sisa && (
                    <span role="timer" aria-label={`Sisa waktu bayar ${sisa.sisa.slice(0, 2)} menit`}>
                        · {sisa.sisa}
                    </span>
                )}
                <Info className="size-3.5 opacity-70" aria-hidden="true" />
            </PopoverTrigger>
            <PopoverContent
                side={hp ? 'bottom' : 'top'}
                align={hp ? 'start' : 'end'}
                sideOffset={8}
                collisionPadding={16}
                className="w-max max-w-[248px] rounded-lg border-0 bg-foreground px-3 py-2 text-footnote leading-[1.4] text-background shadow-[0_8px_16px_-4px_rgb(0_0_0/0.2)] max-sm:max-w-[240px]"
            >
                {status.info}
            </PopoverContent>
        </Popover>
    );

    const aksi =
        k === 'belumBayar' ? 'Bayar sekarang' : k === 'ditolak' ? 'Kirim ulang bukti' : 'Lihat detail';

    return (
        <article
            aria-label={`${booking.namaLapangan}, ${formatTanggal(booking.tanggal, 'EEE, d MMM')} pukul ${rentang}, ${status.label}`}
            className="flex flex-col gap-4 rounded-2xl border bg-card px-5 py-4 shadow-xs max-sm:gap-3 max-sm:p-4"
        >
            <div className="-my-1 self-start sm:hidden">{badge(true)}</div>

            <div className="flex items-start gap-3">
                <span
                    className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-xl bg-canvas',
                        riwayat && 'opacity-55',
                    )}
                >
                    {ikon && <img src={ikon} alt="" width={24} height={24} className="size-6 object-contain" />}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                    <p className="truncate text-callout font-semibold max-sm:text-subheadline max-sm:leading-[1.4] max-sm:whitespace-normal">
                        {booking.namaLapangan}
                    </p>
                    <button
                        type="button"
                        onClick={salin}
                        aria-label={tersalin ? 'Kode booking tersalin' : `Salin kode booking ${booking.kode}`}
                        className="-ml-1 inline-flex cursor-pointer items-center gap-1 self-start rounded-sm px-1 py-0.5 text-footnote tracking-[0.2px] text-muted-foreground tabular-nums hover:bg-foreground/6 hover:text-foreground max-sm:-ml-1.5 max-sm:min-h-6 max-sm:px-1.5 max-sm:py-1"
                    >
                        {tersalin ? 'Tersalin' : booking.kode}
                        {tersalin ? (
                            <Check className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
                        ) : (
                            <Copy className="size-3.5" aria-hidden="true" />
                        )}
                    </button>
                </div>
                <div className="shrink-0 max-sm:hidden">{badge(false)}</div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 max-sm:gap-y-4 max-sm:pt-1">
                <p className="min-w-0 flex-auto text-subheadline tabular-nums">
                    {riwayat ? (
                        `${formatTanggal(booking.tanggal, 'd MMM')}, ${rentang}`
                    ) : (
                        <>
                            <span className="font-bold">{rentang}</span>{' '}
                            <span className="text-footnote text-muted-foreground">({durasi} jam)</span>
                        </>
                    )}
                </p>
                <div className="ml-auto flex shrink-0 items-center gap-4 max-sm:contents">
                    <p
                        className={cn(
                            'text-callout font-semibold whitespace-nowrap tabular-nums max-sm:text-subheadline',
                            k === 'dibatalkan' && 'text-muted-foreground line-through',
                        )}
                    >
                        {formatRupiah(booking.totalBayar)}
                    </p>
                    <div className="flex shrink-0 justify-end gap-2 max-sm:basis-full">
                        <Button
                            variant={aksi === 'Lihat detail' ? 'outline' : 'default'}
                            size="lg"
                            onClick={onBuka}
                            className="px-3.5 text-subheadline font-semibold max-sm:h-10 max-sm:w-full"
                        >
                            {aksi}
                        </Button>
                    </div>
                </div>
            </div>
        </article>
    );
}
