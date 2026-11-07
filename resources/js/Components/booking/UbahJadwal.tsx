import DateStrip, { HariItem } from '@/Components/booking/DateStrip';
import {
    awalHari,
    HARI_KE_DEPAN,
    isoTanggal,
    jamKosong,
    jamSudahLewat,
    Lapangan,
    sisaHariIni,
    tambahHari,
    Terisi,
} from '@/Components/booking/jadwal';
import KartuJam from '@/Components/booking/KartuJam';
import { BookingPenyewa } from '@/Components/booking/pembayaran';
import { kelasPopup } from '@/Components/booking/popup';
import InputError from '@/Components/InputError';
import { Button, buttonVariants } from '@/Components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/Components/ui/dialog';
import { formatRupiah, formatTanggal, toMinutes } from '@/Components/ui/format';
import { Skeleton } from '@/Components/ui/skeleton';
import { TimeRange } from '@/Components/ui/slot-picker';
import { Link, router } from '@inertiajs/react';
import { cn } from 'cn';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

const BATAS_TERBATAS = 3;

/**
 * Dialog Ubah jadwal: tanggal dan jam di lapangan yang sama. Batas bayar tidak dihitung ulang.
 * `terisi` dimuat lewat partial reload saat dialog dibuka pertama kali.
 */
export default function UbahJadwal({
    booking,
    terisi,
    jamBatas,
    open,
    onOpenChange,
}: {
    booking: BookingPenyewa;
    terisi?: Terisi[];
    jamBatas: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    useEffect(() => {
        if (open && !terisi) router.reload({ only: ['terisi'] });
    }, [open, terisi]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className={cn(
                    kelasPopup,
                    'flex flex-col gap-5 bg-background px-7 pt-7 sm:max-w-none sm:w-[min(880px,calc(100%-4rem))]',
                    'max-sm:gap-4 max-sm:px-4 max-sm:pt-5',
                )}
            >
                {open && <IsiUbahJadwal booking={booking} terisi={terisi} jamBatas={jamBatas} onTutup={() => onOpenChange(false)} />}
            </DialogContent>
        </Dialog>
    );
}

function IsiUbahJadwal({
    booking,
    terisi,
    jamBatas,
    onTutup,
}: {
    booking: BookingPenyewa;
    terisi?: Terisi[];
    jamBatas: string | null;
    onTutup: () => void;
}) {
    const sekarang = new Date();
    const hariIni = awalHari(sekarang);
    const [tanggal, setTanggal] = useState(() => new Date(booking.tanggal + 'T00:00:00'));
    const [pilihan, setPilihan] = useState<TimeRange | null>({ start: booking.jamMulai, end: booking.jamSelesai });
    const [galat, setGalat] = useState<string | null>(null);
    const [memproses, setMemproses] = useState(false);

    // status lapangan tidak dikirim ke halaman ini; perbaikan ditolak oleh server saat menyimpan
    const lapangan: Lapangan = {
        idLapangan: booking.idLapangan,
        namaLapangan: booking.namaLapangan,
        jenisLapangan: booking.jenisLapangan,
        tarifPerJam: booking.tarifPerJam,
        status: 'Tersedia',
        foto: [],
    };
    const data = terisi ?? [];
    const booked = (d: Date): TimeRange[] =>
        data
            .filter((t) => t.idLapangan === booking.idLapangan && t.tanggal === isoTanggal(d))
            .map((t) => ({ start: t.jamMulai.slice(0, 5), end: t.jamSelesai.slice(0, 5) }));
    const muat = (r: TimeRange, d: Date) =>
        !booked(d).some((b) => toMinutes(r.start) < toMinutes(b.end) && toMinutes(r.end) > toMinutes(b.start)) &&
        !jamSudahLewat(toMinutes(r.start) / 60, d, sekarang);

    const hari: HariItem[] = Array.from({ length: HARI_KE_DEPAN }, (_, i) => {
        const d = tambahHari(hariIni, i);
        const akhir = i === 0 ? sisaHariIni(sekarang) : null;
        return {
            tanggal: d,
            kosong: jamKosong(data, lapangan, d, sekarang),
            tutup: akhir ? (akhir === 'tutup' ? 'Tutup' : 'Lewat') : undefined,
        };
    });

    // pindah tanggal: jam pilihan dipertahankan bila masih kosong di tanggal baru
    const ubahTanggal = (d: Date) => {
        setTanggal(d);
        setPilihan((p) => (p && muat(p, d) ? p : null));
        setGalat(null);
    };

    const durasi = pilihan ? (toMinutes(pilihan.end) - toMinutes(pilihan.start)) / 60 : 0;
    const sama =
        !!pilihan &&
        isoTanggal(tanggal) === booking.tanggal &&
        pilihan.start === booking.jamMulai &&
        pilihan.end === booking.jamSelesai;

    const simpan = () => {
        if (!pilihan) return;
        if (sama) return onTutup();
        router.patch(
            route('booking.jadwal', booking.idBooking),
            { tanggal: isoTanggal(tanggal), jamMulai: pilihan.start, jamSelesai: pilihan.end },
            {
                preserveScroll: true,
                onStart: () => {
                    setMemproses(true);
                    setGalat(null);
                },
                onFinish: () => setMemproses(false),
                onSuccess: (page) => {
                    // gagal karena aturan (mis. sudah ada bukti) datang sebagai flash error, bukan galat field
                    if (!(page.props as { flash?: { error?: string } }).flash?.error) onTutup();
                },
                onError: (e) => setGalat(Object.values(e)[0] ?? 'Jadwal gagal disimpan.'),
            },
        );
    };

    return (
        <>
            <div className="flex items-start justify-between gap-4">
                <div className="grid min-w-0 gap-1">
                    <DialogTitle className="text-title-3 max-sm:text-body">Ubah jadwal</DialogTitle>
                    <DialogDescription className="text-subheadline max-sm:text-footnote">
                        Pilih tanggal, lalu jam yang masih kosong.
                        {jamBatas && ` Batas bayar tetap pukul ${jamBatas}.`}
                    </DialogDescription>
                </div>
                <DialogClose aria-label="Tutup" className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}>
                    <X className="size-[18px]" />
                </DialogClose>
            </div>

            {terisi ? (
                <>
                    <DateStrip hari={hari} terpilih={tanggal} batasTerbatas={BATAS_TERBATAS} onSelect={ubahTanggal} />
                    <KartuJam
                        key={isoTanggal(tanggal)}
                        lapangan={lapangan}
                        perbaikan={false}
                        jamKosong={jamKosong(data, lapangan, tanggal, sekarang)}
                        booked={booked(tanggal)}
                        isPast={(start) => jamSudahLewat(toMinutes(start) / 60, tanggal, sekarang)}
                        value={pilihan}
                        kataAksi="simpan"
                        onValueChange={(r) => {
                            setPilihan(r);
                            setGalat(null);
                        }}
                    />
                </>
            ) : (
                <div className="grid gap-4" aria-busy="true" aria-label="Memuat jadwal">
                    <Skeleton className="h-32 rounded-2xl" />
                    <Skeleton className="h-64 rounded-2xl" />
                </div>
            )}

            <InputError message={galat ?? undefined} />

            <p className="text-footnote text-muted-foreground">
                Mau pindah lapangan?{' '}
                <Link href={route('dashboard')} className="text-primary underline-offset-4 hover:underline">
                    Pilih di halaman pesan
                </Link>
            </p>

            <div className="sticky bottom-0 z-[1] -mx-7 mt-auto flex flex-wrap items-center justify-between gap-3 border-t bg-background px-7 pt-4 pb-5 max-sm:-mx-4 max-sm:px-4 max-sm:pt-3 max-sm:pb-4">
                <div className="grid min-w-0 gap-0.5 tabular-nums">
                    <p className="text-subheadline font-semibold">{formatRupiah(durasi * booking.tarifPerJam)}</p>
                    <p className="text-footnote text-muted-foreground">
                        {pilihan
                            ? `${formatTanggal(tanggal, 'EEE, d MMM')} · ${pilihan.start}–${pilihan.end} · ${durasi} jam`
                            : 'Belum ada jam dipilih'}
                    </p>
                </div>
                <div className="flex gap-2 max-sm:w-full max-sm:*:flex-1">
                    <Button variant="outline" size="lg" onClick={onTutup}>
                        Batal
                    </Button>
                    <Button size="lg" disabled={!pilihan || memproses} onClick={simpan}>
                        {memproses ? 'Menyimpan…' : 'Simpan jadwal'}
                    </Button>
                </div>
            </div>
        </>
    );
}
