import { BookingPenyewa, keadaan, Rekening, useSisaWaktu } from '@/Components/booking/pembayaran';
import RekeningTransfer from '@/Components/booking/RekeningTransfer';
import StatusBooking from '@/Components/booking/StatusBooking';
import InputError from '@/Components/InputError';
import { Alert, AlertDescription, AlertTitle } from '@/Components/ui/alert';
import { BookingSummary } from '@/Components/ui/booking-summary';
import { Button, buttonVariants } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { FileUpload } from '@/Components/ui/file-upload';
import { formatRupiah } from '@/Components/ui/format';
import { Stepper } from '@/Components/ui/stepper';
import PenyewaLayout from '@/Layouts/PenyewaLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { cn } from 'cn';
import { ArrowLeft, CircleCheck, CircleX, Clock } from 'lucide-react';
import { useState } from 'react';

const LANGKAH = ['Pilih jadwal', 'Transfer', 'Unggah bukti'];

export default function Bayar({ booking, rekening }: { booking: BookingPenyewa; rekening: Rekening }) {
    const k = keadaan(booking);
    const belumBayar = k === 'belumBayar';
    const ditolak = k === 'ditolak';
    const [langkah, setLangkah] = useState<'transfer' | 'unggah'>('transfer');
    const sisa = useSisaWaktu(belumBayar ? booking.batasBayar : null);
    const form = useForm<{ bukti: File | null }>({ bukti: null });

    const diTransfer = belumBayar && langkah === 'transfer';
    const diUnggah = (belumBayar && langkah === 'unggah') || ditolak;

    const kirim = () =>
        form.post(route('booking.bukti', booking.idBooking), { forceFormData: true, preserveScroll: true });

    const aksi = (className?: string) => {
        if (k === 'dibatalkan') {
            return (
                <Link href={route('dashboard')} className={cn(buttonVariants({ size: 'lg' }), className)}>
                    Pesan lapangan lagi
                </Link>
            );
        }
        if (!belumBayar && !ditolak) {
            return (
                <Link href={route('booking')} className={cn(buttonVariants({ size: 'lg' }), className)}>
                    Lihat booking saya
                </Link>
            );
        }
        if (diTransfer) {
            return (
                <Button size="lg" className={className} onClick={() => setLangkah('unggah')}>
                    Saya sudah transfer
                </Button>
            );
        }
        return (
            <Button variant="elevated" size="lg" className={className} disabled={!form.data.bukti || form.processing} onClick={kirim}>
                {form.processing ? 'Mengirim…' : 'Kirim bukti pembayaran'}
            </Button>
        );
    };

    const judul = diTransfer ? 'Konfirmasi & bayar' : k === 'dibatalkan' ? 'Booking dibatalkan' : 'Unggah bukti';
    const subjudul = diTransfer
        ? 'Cek ringkasan, lalu transfer sesuai total.'
        : k === 'dibatalkan'
          ? booking.dibatalkanPenyewa
            ? 'Anda membatalkan booking ini.'
            : 'Booking ini melewati batas bayar.'
          : 'Unggah bukti transfer agar admin bisa memverifikasi.';

    return (
        <PenyewaLayout>
            <Head title={judul} />

            <div className="grid gap-6 pb-24 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:pb-0">
                <section aria-labelledby="judul-bayar" className="grid min-w-0 gap-4">
                    <div>
                        {diTransfer && (
                            <Link
                                href={route('dashboard')}
                                className="mb-3 inline-flex items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground"
                            >
                                <ArrowLeft className="size-4" />
                                Ubah jadwal
                            </Link>
                        )}
                        {belumBayar && langkah === 'unggah' && (
                            <button
                                type="button"
                                onClick={() => setLangkah('transfer')}
                                className="mb-3 inline-flex cursor-pointer items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground"
                            >
                                <ArrowLeft className="size-4" />
                                Kembali ke rekening
                            </button>
                        )}
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <h1 id="judul-bayar" className="text-xl leading-7 font-semibold tracking-tight">
                                    {judul}
                                </h1>
                                <p className="mt-0.5 text-muted-foreground">{subjudul}</p>
                            </div>
                            <StatusBooking booking={booking} />
                        </div>
                    </div>

                    {k !== 'dibatalkan' && (
                        <Stepper
                            className="max-w-md"
                            steps={LANGKAH}
                            current={diTransfer ? 1 : diUnggah ? 2 : LANGKAH.length}
                        />
                    )}

                    {k === 'dibatalkan' && (
                        <Alert variant="destructive">
                            <CircleX />
                            <AlertTitle>
                                {booking.dibatalkanPenyewa ? 'Booking dibatalkan' : 'Booking dibatalkan otomatis'}
                            </AlertTitle>
                            <AlertDescription>
                                {booking.dibatalkanPenyewa
                                    ? 'Anda membatalkan booking ini. Silakan pesan lagi bila perlu.'
                                    : 'Bukti transfer tidak diunggah sebelum batas waktu, jadi jadwal ini dilepas. Silakan pesan lagi.'}
                            </AlertDescription>
                        </Alert>
                    )}

                    {diTransfer && sisa && (
                        <>
                            <Alert variant="warning">
                                <Clock />
                                <AlertTitle>Bayar sebelum {sisa.jamBatas}</AlertTitle>
                                <AlertDescription>
                                    {sisa.habis
                                        ? 'Batas bayar sudah lewat.'
                                        : `Sisa ${sisa.sisa}. Booking dibatalkan otomatis jika bukti belum diunggah dalam 1 jam.`}
                                </AlertDescription>
                            </Alert>

                            <Card>
                                <CardContent className="grid gap-3">
                                    <h2 className="text-[15px] font-semibold">Transfer ke rekening</h2>
                                    <RekeningTransfer rekening={rekening} total={booking.totalBayar} />
                                </CardContent>
                            </Card>

                            <p className="text-center text-xs text-muted-foreground">
                                Setelah transfer, lanjut ke langkah berikutnya untuk mengunggah bukti.
                            </p>
                        </>
                    )}

                    {(diUnggah || (!belumBayar && k !== 'dibatalkan')) && (
                        <Card>
                            <CardContent className="grid gap-3">
                                <h2 className="text-[15px] font-semibold">Unggah bukti transfer</h2>

                                {diUnggah && (
                                    <>
                                        {ditolak && (
                                            <Alert variant="destructive">
                                                <CircleX />
                                                <AlertTitle>Bukti sebelumnya ditolak admin</AlertTitle>
                                                <AlertDescription>
                                                    {booking.alasanTolak
                                                        ? `Alasan: ${booking.alasanTolak}. Perbaiki lalu unggah ulang bukti yang benar.`
                                                        : 'Periksa jumlah dan rekening tujuan, lalu unggah ulang bukti yang benar.'}
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                        <p className="text-muted-foreground">
                                            Transfer {formatRupiah(booking.totalBayar)} ke {rekening.bank} {rekening.nomor}
                                            {sisa && ` · bayar sebelum ${sisa.jamBatas}`}.
                                        </p>
                                        <FileUpload
                                            value={form.data.bukti}
                                            onChange={(f) => form.setData('bukti', f)}
                                            accept="image/jpeg,image/png,application/pdf"
                                            label="Foto atau tangkapan layar bukti transfer"
                                            description="JPG, PNG, atau PDF · maks. 2 MB"
                                            aria-invalid={!!form.errors.bukti}
                                        />
                                        <InputError message={form.errors.bukti} />
                                    </>
                                )}

                                {(k === 'menungguVerifikasi' || k === 'dikonfirmasi') && (
                                    <Alert variant="success">
                                        <CircleCheck />
                                        <AlertTitle>
                                            {k === 'dikonfirmasi' ? 'Pembayaran terverifikasi' : 'Bukti terkirim'}
                                        </AlertTitle>
                                        <AlertDescription>
                                            {k === 'dikonfirmasi'
                                                ? 'Booking Anda sudah dikonfirmasi admin.'
                                                : 'Admin akan memverifikasi pembayaran Anda. Statusnya bisa dilihat di Booking saya.'}
                                        </AlertDescription>
                                    </Alert>
                                )}                            </CardContent>
                        </Card>
                    )}
                </section>

                <aside className="order-first lg:sticky lg:top-24 lg:order-none">
                    <BookingSummary
                        court={booking.namaLapangan}
                        type={booking.jenisLapangan}
                        date={booking.tanggal}
                        start={booking.jamMulai}
                        end={booking.jamSelesai}
                        rate={booking.tarifPerJam}
                    >
                        <p className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Kode booking</span>
                            <span className="font-medium tabular-nums">{booking.kode}</span>
                        </p>
                        {aksi('hidden w-full lg:inline-flex')}
                    </BookingSummary>
                </aside>
            </div>

            <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 border-t bg-background px-4 py-3 lg:hidden">
                <div className="min-w-0">
                    <div className="font-semibold tabular-nums">{formatRupiah(booking.totalBayar)}</div>
                    <div className="truncate text-xs text-muted-foreground">
                        {diTransfer && sisa
                            ? `Bayar sebelum ${sisa.jamBatas}`
                            : diUnggah
                              ? form.data.bukti
                                  ? 'Siap dikirim'
                                  : 'Unggah bukti transfer'
                              : k === 'menungguVerifikasi'
                                ? 'Menunggu verifikasi admin'
                                : booking.kode}
                    </div>
                </div>
                {aksi()}
            </div>
        </PenyewaLayout>
    );
}
