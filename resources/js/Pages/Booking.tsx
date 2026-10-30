import { isoTanggal } from '@/Components/booking/jadwal';
import { BookingPenyewa, keadaan, Rekening, useSisaWaktu } from '@/Components/booking/pembayaran';
import RekeningTransfer from '@/Components/booking/RekeningTransfer';
import StatusBooking from '@/Components/booking/StatusBooking';
import InputError from '@/Components/InputError';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/Components/ui/alert-dialog';
import { Badge } from '@/Components/ui/badge';
import { BookingSummary } from '@/Components/ui/booking-summary';
import { Button, buttonVariants } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/Components/ui/empty';
import { FileUpload } from '@/Components/ui/file-upload';
import { formatRupiah, formatTanggal } from '@/Components/ui/format';
import { Tabs, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import PenyewaLayout from '@/Layouts/PenyewaLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { cn } from 'cn';
import { CalendarX, Clock } from 'lucide-react';
import { useState } from 'react';

type Props = { bookings: BookingPenyewa[]; rekening: Rekening };

export default function Booking({ bookings, rekening }: Props) {
    if (bookings.length === 0) {
        return (
            <PenyewaLayout
                header={
                    <h2 className="text-xl leading-tight font-semibold text-foreground">
                        Booking saya
                    </h2>
                }
            >
                <Head title="Booking saya" />

                <Empty>
                    <EmptyHeader>
                        <EmptyMedia>
                            <CalendarX aria-hidden="true" />
                        </EmptyMedia>
                        <EmptyTitle>Belum ada booking</EmptyTitle>
                        <EmptyDescription>
                            Pilih lapangan dan jam di Home untuk mulai memesan.
                        </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        <Link href={route('dashboard')} className={buttonVariants()}>
                            Pesan lapangan
                        </Link>
                    </EmptyContent>
                </Empty>
            </PenyewaLayout>
        );
    }

    return <DaftarBooking bookings={bookings} rekening={rekening} />;
}

function DaftarBooking({ bookings, rekening }: Props) {
    const hariIni = isoTanggal(new Date());
    const aktif = bookings.filter((b) => b.tanggal >= hariIni && b.status !== 'Dibatalkan');
    const riwayat = bookings.filter((b) => !aktif.includes(b));
    const [tab, setTab] = useState<'aktif' | 'riwayat'>(aktif.length ? 'aktif' : 'riwayat');
    const [unggah, setUnggah] = useState<BookingPenyewa | null>(null);
    const tampil = tab === 'aktif' ? aktif : riwayat;

    return (
        <PenyewaLayout>
            <Head title="Booking saya" />

            <div className="mx-auto grid max-w-3xl gap-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-xl leading-7 font-semibold tracking-tight">Booking saya</h1>
                        <p className="mt-0.5 text-muted-foreground">
                            Pantau status booking dan unggah bukti pembayaran.
                        </p>
                    </div>
                    <Tabs value={tab} onValueChange={(v) => setTab(v as 'aktif' | 'riwayat')}>
                        <TabsList aria-label="Filter booking">
                            <TabsTrigger value="aktif">Aktif ({aktif.length})</TabsTrigger>
                            <TabsTrigger value="riwayat">Riwayat ({riwayat.length})</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {tampil.length === 0 && (
                    <Card className="p-4 text-muted-foreground">Belum ada booking di tab ini.</Card>
                )}

                <div className="grid gap-3">
                    {tampil.map((b) => (
                        <KartuBooking key={b.idBooking} booking={b} onUnggah={() => setUnggah(b)} />
                    ))}
                </div>
            </div>

            {unggah && (
                <DialogUnggah
                    key={unggah.idBooking}
                    booking={unggah}
                    rekening={rekening}
                    onClose={() => setUnggah(null)}
                />
            )}
        </PenyewaLayout>
    );
}

function KartuBooking({ booking: b, onUnggah }: { booking: BookingPenyewa; onUnggah: () => void }) {
    const k = keadaan(b);
    const sisa = useSisaWaktu(k === 'belumBayar' ? b.batasBayar : null);
    const [detail, setDetail] = useState(false);

    return (
        <Card className="grid gap-0 overflow-hidden py-0 sm:grid-cols-[minmax(0,1fr)_150px]">
            <div className="min-w-0 p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="text-[15px] font-semibold">{b.namaLapangan}</h3>
                    <Badge variant="secondary">{b.jenisLapangan}</Badge>
                    <span className="ml-auto">
                        <StatusBooking booking={b} />
                    </span>
                </div>
                <p className="font-medium tabular-nums">
                    {formatTanggal(b.tanggal, 'EEE, d MMM')} · {b.jamMulai}–{b.jamSelesai}
                </p>
                <button
                    type="button"
                    onClick={() => setDetail(true)}
                    className="mt-0.5 text-xs font-medium text-primary hover:underline"
                >
                    Detail booking
                </button>
                {sisa && !sisa.habis && (
                    <p className="mt-2.5 flex items-center gap-1.5 text-xs text-accessible-orange">
                        <Clock className="size-4 shrink-0" aria-hidden="true" />
                        Bayar sebelum {sisa.jamBatas} · sisa {sisa.sisa}
                    </p>
                )}
                {k === 'ditolak' && (
                    <p className="mt-2.5 text-xs text-destructive">
                        Bukti ditolak admin{b.alasanTolak ? `: ${b.alasanTolak}` : ''}. Silakan unggah ulang.
                    </p>
                )}
                {k === 'menungguVerifikasi' && (
                    <p className="mt-0.5 text-xs text-muted-foreground">Bukti terkirim, menunggu pengecekan admin.</p>
                )}
                {k === 'dibatalkan' && b.dibatalkanPenyewa && (
                    <p className="mt-0.5 text-xs text-muted-foreground">Anda membatalkan booking ini.</p>
                )}
                {k === 'dibatalkan' && !b.dibatalkanPenyewa && b.batasBayar && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        Dibatalkan otomatis karena melewati batas bayar.
                    </p>
                )}
            </div>
            <div className="flex items-center justify-between gap-2 border-t px-4 py-3 sm:flex-col sm:justify-center sm:border-t-0 sm:border-l sm:p-4">
                <span className="grid sm:text-center">
                    <span className="text-xs text-muted-foreground">Total bayar</span>
                    <span className="text-[22px] leading-[30px] font-semibold tabular-nums">
                        {formatRupiah(b.totalBayar)}
                    </span>
                </span>
                {k === 'belumBayar' && sisa && !sisa.habis && <Button onClick={onUnggah}>Unggah bukti</Button>}
                {k === 'ditolak' && <Button onClick={onUnggah}>Unggah ulang</Button>}
            </div>

            <Dialog open={detail} onOpenChange={setDetail}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Booking {b.kode}</DialogTitle>
                        <DialogDescription className="flex items-center gap-2">
                            Status <StatusBooking booking={b} />
                        </DialogDescription>
                    </DialogHeader>
                    <BookingSummary
                        court={b.namaLapangan}
                        type={b.jenisLapangan}
                        date={b.tanggal}
                        start={b.jamMulai}
                        end={b.jamSelesai}
                        rate={b.tarifPerJam}
                    >
                        {k === 'ditolak' && b.alasanTolak && (
                            <p className="rounded-md bg-destructive/10 p-2.5 text-destructive">
                                Alasan bukti ditolak: {b.alasanTolak}
                            </p>
                        )}
                    </BookingSummary>
                    {k === 'belumBayar' && <BatalkanBooking booking={b} onSelesai={() => setDetail(false)} />}
                    {(k === 'menungguVerifikasi' || k === 'ditolak' || k === 'dikonfirmasi') &&
                        b.tanggal >= isoTanggal(new Date()) && (
                            <p className="text-center text-xs text-muted-foreground">
                                Bukti bayar sudah dikirim. Untuk membatalkan, hubungi pengelola.
                            </p>
                        )}
                </DialogContent>
            </Dialog>
        </Card>
    );
}

// Hanya untuk booking yang belum ada bukti bayarnya; server memeriksa ulang.
function BatalkanBooking({ booking: b, onSelesai }: { booking: BookingPenyewa; onSelesai: () => void }) {
    const [memproses, setMemproses] = useState(false);

    const batalkan = () =>
        router.post(
            route('booking.batal', b.idBooking),
            {},
            {
                preserveScroll: true,
                onStart: () => setMemproses(true),
                onFinish: () => setMemproses(false),
                onSuccess: onSelesai,
            },
        );

    return (
        <AlertDialog>
            <AlertDialogTrigger className={cn(buttonVariants({ variant: 'destructive', size: 'lg' }), 'w-full')}>
                Batalkan booking
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Batalkan booking {b.kode}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {b.namaLapangan}, {formatTanggal(b.tanggal, 'EEE, d MMM yyyy')} pukul {b.jamMulai}–
                        {b.jamSelesai}. Booking yang dibatalkan tidak bisa dipulihkan; pesan lagi dari Home bila
                        perlu.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Kembali</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" disabled={memproses} onClick={batalkan}>
                        {memproses ? 'Membatalkan…' : 'Ya, batalkan'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function DialogUnggah({
    booking: b,
    rekening,
    onClose,
}: {
    booking: BookingPenyewa;
    rekening: Rekening;
    onClose: () => void;
}) {
    const ulang = keadaan(b) === 'ditolak';
    const sisa = useSisaWaktu(ulang ? null : b.batasBayar);
    const form = useForm<{ bukti: File | null }>({ bukti: null });

    const kirim = () =>
        form.post(route('booking.bukti', b.idBooking), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: onClose,
        });

    return (
        <Dialog open onOpenChange={(buka) => !buka && onClose()}>
            <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{ulang ? 'Unggah ulang bukti pembayaran' : 'Unggah bukti pembayaran'}</DialogTitle>
                    <DialogDescription>
                        {b.namaLapangan} · {formatTanggal(b.tanggal, 'EEE, d MMM')} · {b.jamMulai}–{b.jamSelesai}
                    </DialogDescription>
                </DialogHeader>

                <RekeningTransfer rekening={rekening} total={b.totalBayar} />

                <div className="grid gap-2">
                    <FileUpload
                        value={form.data.bukti}
                        onChange={(f) => form.setData('bukti', f)}
                        accept="image/jpeg,image/png,application/pdf"
                        label="Foto atau tangkapan layar bukti transfer"
                        description="JPG, PNG, atau PDF · maks. 2 MB"
                        aria-invalid={!!form.errors.bukti}
                    />
                    <InputError message={form.errors.bukti} />
                </div>

                {sisa && (
                    <p className="flex items-center gap-1.5 text-xs text-accessible-orange">
                        <Clock className="size-4 shrink-0" aria-hidden="true" />
                        Bayar sebelum {sisa.jamBatas} · sisa {sisa.sisa}
                    </p>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Batal
                    </Button>
                    <Button disabled={!form.data.bukti || form.processing} onClick={kirim}>
                        {form.processing ? 'Mengirim…' : 'Kirim bukti'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
