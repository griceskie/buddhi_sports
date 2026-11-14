import DialogBukti, { HubungiPengelola } from '@/Components/booking/DialogBukti';
import { IKON_JENIS, Terisi } from '@/Components/booking/jadwal';
import {
    BookingPenyewa,
    keadaan,
    Rekening,
    sebabBatal,
    useSisaWaktu,
    waktuSingkat,
} from '@/Components/booking/pembayaran';
import RekeningTransfer from '@/Components/booking/RekeningTransfer';
import UbahJadwal from '@/Components/booking/UbahJadwal';
import InputError from '@/Components/InputError';
import { Alert, AlertDescription, AlertTitle } from '@/Components/ui/alert';
import { Button, buttonVariants } from '@/Components/ui/button';
import { FileUpload } from '@/Components/ui/file-upload';
import { durationHours, formatRupiah, formatTanggal, rentangJam } from '@/Components/ui/format';
import { Link, useForm } from '@inertiajs/react';
import { cn } from 'cn';
import {
    CalendarX,
    Check,
    ChevronDown,
    ChevronLeft,
    CircleX,
    Clock3,
    ImageIcon,
    Info,
    TriangleAlert,
    X,
} from 'lucide-react';
import { ReactNode, useEffect, useRef, useState } from 'react';

type Props = {
    booking: BookingPenyewa;
    rekening: Rekening;
    /** `halaman` = /booking/{id}/bayar, `dialog` = pop-up di Booking saya (satu kolom, rincian dilipat). */
    tampilan: 'halaman' | 'dialog';
    /** Jam terisi untuk Ubah jadwal; undefined sampai dimuat dengan partial reload. */
    terisi?: Terisi[];
    onTutup?: () => void;
    /** Minta konfirmasi pembatalan; konfirmasinya dipegang halaman atau pop-up. */
    onMintaBatal: () => void;
    /** Dipanggil sekali saat batas bayar habis selagi panel terbuka. */
    onHabis?: () => void;
};

/** Panel Konfirmasi dan bayar untuk semua keadaan booking; dipakai halaman Bayar dan pop-up Booking saya. */
export default function PanelPembayaran({ booking, rekening, tampilan, terisi, onTutup, onMintaBatal, onHabis }: Props) {
    const dialog = tampilan === 'dialog';
    const k0 = keadaan(booking);
    const sisa = useSisaWaktu(k0 === 'belumBayar' ? booking.batasBayar : null);
    // batas bayar lewat selagi panel terbuka: tampil sebagai batal otomatis, server menyusul saat dimuat ulang
    const habis = k0 === 'belumBayar' && !!sisa?.habis;
    const k = habis ? 'dibatalkan' : k0;
    const sebab = habis ? 'otomatis' : sebabBatal(booking);
    const belum = k === 'belumBayar';
    const ditolak = k === 'ditolak';
    const jamBatas = booking.batasBayar ? formatTanggal(booking.batasBayar, 'HH.mm') : null;

    const [langkah, setLangkah] = useState<'transfer' | 'unggah'>(ditolak ? 'unggah' : 'transfer');
    const [bukaUbah, setBukaUbah] = useState(false);
    const [bukaBukti, setBukaBukti] = useState(false);
    const form = useForm<{ bukti: File | null }>({ bukti: null });

    const habisDilaporkan = useRef(false);
    useEffect(() => {
        if (!habis || habisDilaporkan.current) return;
        habisDilaporkan.current = true;
        setBukaUbah(false);
        setBukaBukti(false);
        onHabis?.();
    }, [habis, onHabis]);

    const kirim = () =>
        form.post(route('booking.bukti', booking.idBooking), {
            forceFormData: true,
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => form.reset(),
        });

    const judul = {
        belumBayar: 'Konfirmasi dan bayar',
        ditolak: 'Kirim ulang bukti transfer',
        menungguVerifikasi: 'Bukti transfer terkirim',
        dikonfirmasi: 'Booking dikonfirmasi',
        dibatalkan: 'Booking dibatalkan',
    }[k];
    const subjudul = {
        belumBayar: jamBatas ? `Bayar sebelum ${jamBatas} atau batal otomatis.` : 'Transfer, lalu kirim buktinya.',
        ditolak: 'Bukti ditolak. Kirim bukti yang benar.',
        menungguVerifikasi: 'Sedang diperiksa pengelola.',
        dikonfirmasi: 'Pembayaran sudah terverifikasi.',
        dibatalkan:
            sebab === 'penyewa'
                ? 'Anda membatalkan booking ini.'
                : sebab === 'otomatis'
                  ? `Bukti tidak terkirim sebelum ${jamBatas}.`
                  : 'Dibatalkan oleh pengelola.',
    }[k];

    const kartu = cn('flex flex-col rounded-2xl border bg-card p-6 max-sm:p-5', dialog && 'max-sm:p-4');
    const pesanLagi = (
        <Link href={route('dashboard')} className={cn(buttonVariants({ size: 'lg' }), 'max-sm:flex-1')}>
            Pesan lapangan lagi
        </Link>
    );

    const tombolSudah = (className?: string) => (
        <Button size="lg" className={className} onClick={() => setLangkah('unggah')}>
            Saya sudah transfer
        </Button>
    );
    const tombolKirim = (className?: string) => (
        <Button
            variant="elevated"
            size="lg"
            className={className}
            disabled={!form.data.bukti || form.processing}
            onClick={kirim}
        >
            {form.processing ? 'Mengirim…' : ditolak ? 'Kirim ulang bukti' : 'Kirim bukti'}
        </Button>
    );

    return (
        <>
            {dialog && (
                // tombol tutup menempel di pojok kanan atas, tidak ikut bergeser saat judul turun baris
                <div className="sticky top-0 z-[6] h-0">
                    <button
                        type="button"
                        aria-label="Tutup"
                        onClick={onTutup}
                        className="absolute top-4 right-4 flex size-9 cursor-pointer items-center justify-center rounded-full border bg-card shadow-xs hover:bg-muted"
                    >
                        <X className="size-[18px]" aria-hidden="true" />
                    </button>
                </div>
            )}

            <div className={cn('grid gap-7', dialog ? 'gap-4 px-6 pb-6 max-sm:px-4 max-sm:pb-4' : 'max-sm:pb-28')}>
                <div
                    className={cn(
                        'flex items-start gap-3',
                        dialog &&
                            'sticky top-0 z-[4] -mx-6 items-center bg-canvas px-6 pt-5 pb-4 pr-16 max-sm:-mx-4 max-sm:px-4 max-sm:pt-4 max-sm:pb-3 max-sm:pr-16',
                    )}
                >
                    {!dialog && (
                        <div className="size-11 shrink-0 min-[85rem]:absolute min-[85rem]:size-0">
                            <Link
                                href={route('dashboard')}
                                aria-label="Kembali ke pesan lapangan"
                                className="fixed top-[93px] left-4 z-[6] flex size-11 items-center justify-center rounded-full border bg-card text-foreground shadow-sm hover:bg-muted sm:left-6 lg:left-[calc(max(0px,(100vw-80rem)/2)+2rem)] min-[85rem]:top-[89px] min-[85rem]:left-[calc((100vw-80rem)/2-2rem)]"
                            >
                                <ChevronLeft className="size-5" aria-hidden="true" />
                            </Link>
                        </div>
                    )}
                    <div className="grid min-w-0 gap-1">
                        <h1
                            className={cn(
                                'font-semibold',
                                dialog ? 'text-body max-sm:text-callout' : 'text-title-3 max-sm:text-body',
                            )}
                        >
                            {judul}
                        </h1>
                        <p className={cn('text-subheadline text-muted-foreground', dialog && 'max-sm:text-footnote')}>
                            {subjudul}
                        </p>
                    </div>
                </div>

                <div
                    className={cn(
                        'grid grid-cols-[minmax(0,1fr)] gap-4',
                        !dialog && 'gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start lg:gap-16',
                    )}
                >
                    <section aria-label="Langkah pembayaran" className="flex min-w-0 flex-col gap-4">
                        {ditolak && (
                            <Alert variant="destructive">
                                <CircleX />
                                <AlertTitle>
                                    {booking.alasanTolak ? `Alasan: “${booking.alasanTolak}”` : 'Bukti transfer ditolak'}
                                </AlertTitle>
                                <AlertDescription>
                                    {booking.alasanTolak
                                        ? 'Perbaiki sesuai alasan ini, lalu kirim bukti yang baru.'
                                        : 'Kirim bukti yang baru.'}{' '}
                                    {booking.buktiUrl && (
                                        <button
                                            type="button"
                                            onClick={() => setBukaBukti(true)}
                                            className="cursor-pointer font-semibold underline underline-offset-3"
                                        >
                                            Lihat bukti sebelumnya
                                        </button>
                                    )}
                                </AlertDescription>
                            </Alert>
                        )}

                        {(belum || ditolak) && (
                            <>
                                <div className={cn(kartu, 'gap-5')}>
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h2 className="text-callout font-semibold">Cara bayar</h2>
                                        {belum && sisa && (
                                            <p
                                                className={cn(
                                                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-footnote font-semibold whitespace-nowrap',
                                                    sisa.genting
                                                        ? 'bg-destructive/12 text-destructive'
                                                        : 'bg-accessible-orange/12 text-accessible-orange',
                                                )}
                                            >
                                                <Clock3 className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
                                                <span>
                                                    Bayar sebelum {sisa.jamBatas} ·{' '}
                                                    <span className="tabular-nums">{sisa.sisa}</span>
                                                </span>
                                            </p>
                                        )}
                                    </div>

                                    <ol className="flex flex-col">
                                        <li className="flex gap-4 max-sm:gap-3">
                                            <div className="flex shrink-0 flex-col items-center">
                                                <Titik keadaan={langkah === 'transfer' ? 'aktif' : 'selesai'}>1</Titik>
                                                <span
                                                    className={cn(
                                                        'my-1.5 min-h-5 w-0.5 flex-1 rounded-full',
                                                        langkah === 'transfer' ? 'bg-border' : 'bg-success',
                                                    )}
                                                />
                                            </div>
                                            <div className="flex min-w-0 flex-1 flex-col pb-6">
                                                <div className="flex min-h-7 items-start justify-between gap-3">
                                                    <div className="min-w-0 pt-0.5">
                                                        <h3 className="text-subheadline font-semibold">Transfer ke rekening</h3>
                                                        <Lipat buka={langkah !== 'transfer'}>
                                                            <p className="mt-0.5 text-footnote text-muted-foreground tabular-nums">
                                                                {rekening.bank} {rekening.nomor} ·{' '}
                                                                {formatRupiah(booking.totalBayar)}
                                                            </p>
                                                        </Lipat>
                                                    </div>
                                                    {langkah !== 'transfer' && (
                                                        <Button variant="secondary" size="sm" onClick={() => setLangkah('transfer')}>
                                                            Lihat
                                                        </Button>
                                                    )}
                                                </div>
                                                <Lipat buka={langkah === 'transfer'}>
                                                    <div className="flex flex-col gap-3 pt-2">
                                                        <p className="text-footnote text-muted-foreground">
                                                            Transfer tepat sesuai jumlah di bawah, supaya pembayaran Anda mudah
                                                            dicocokkan.
                                                        </p>
                                                        <RekeningTransfer rekening={rekening} total={booking.totalBayar} />
                                                        <div className="flex justify-end pt-1 max-sm:hidden">{tombolSudah()}</div>
                                                    </div>
                                                </Lipat>
                                            </div>
                                        </li>

                                        <li className="flex gap-4 max-sm:gap-3">
                                            <div className="flex shrink-0 flex-col items-center">
                                                <Titik keadaan={langkah === 'unggah' ? 'aktif' : 'nanti'}>2</Titik>
                                            </div>
                                            <div className="flex min-w-0 flex-1 flex-col">
                                                <div className="min-h-7 pt-0.5">
                                                    <h3
                                                        className={cn(
                                                            'text-subheadline font-semibold',
                                                            langkah !== 'unggah' && 'text-muted-foreground',
                                                        )}
                                                    >
                                                        Kirim bukti transfer
                                                    </h3>
                                                    <Lipat buka={langkah !== 'unggah'}>
                                                        <p className="mt-0.5 text-footnote text-muted-foreground">
                                                            Setelah transfer, unggah foto atau tangkapan layar buktinya di sini.
                                                        </p>
                                                    </Lipat>
                                                </div>
                                                <Lipat buka={langkah === 'unggah'}>
                                                    <div className="flex flex-col gap-3 pt-2">
                                                        <p className="text-footnote text-muted-foreground">
                                                            Foto atau tangkapan layar yang memperlihatkan jumlah, tanggal, dan
                                                            rekening tujuan.
                                                        </p>
                                                        <div>
                                                            <FileUpload
                                                                value={form.data.bukti}
                                                                onChange={(f) => form.setData('bukti', f)}
                                                                accept="image/jpeg,image/png"
                                                                hideHint
                                                                label={
                                                                    <>
                                                                        <span className="underline underline-offset-4">
                                                                            Pilih atau seret file
                                                                        </span>{' '}
                                                                        ke sini
                                                                    </>
                                                                }
                                                                description="Gambar JPG atau PNG, maks. 2 MB"
                                                                aria-invalid={!!form.errors.bukti}
                                                            />
                                                            <InputError message={form.errors.bukti} className="mt-2" />
                                                        </div>
                                                        <p className="flex items-start gap-2 text-footnote text-accessible-orange">
                                                            <TriangleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
                                                            <span>
                                                                Bukti yang sudah terkirim tidak bisa ditarik. Untuk membatalkan
                                                                setelahnya, <HubungiPengelola />.
                                                            </span>
                                                        </p>
                                                        <div className="flex justify-end pt-1 max-sm:hidden">{tombolKirim()}</div>
                                                    </div>
                                                </Lipat>
                                            </div>
                                        </li>
                                    </ol>
                                </div>

                                <p className="mt-1 flex items-start gap-2 text-footnote text-muted-foreground">
                                    <Info className="mt-px size-4 shrink-0" aria-hidden="true" />
                                    <span>Jadwal baru terkunci setelah pengelola memeriksa dan mengonfirmasi bukti transfer.</span>
                                </p>
                            </>
                        )}

                        {(k === 'menungguVerifikasi' || k === 'dikonfirmasi') && (
                            <StatusPembayaran
                                booking={booking}
                                ok={k === 'dikonfirmasi'}
                                kartu={kartu}
                                onLihatBukti={() => setBukaBukti(true)}
                                aksi={
                                    dialog ? (
                                        pesanLagi
                                    ) : (
                                        <>
                                            <Link
                                                href={route('dashboard')}
                                                className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'max-sm:flex-1')}
                                            >
                                                Pesan lapangan lain
                                            </Link>
                                            <Link
                                                href={route('booking')}
                                                className={cn(buttonVariants({ size: 'lg' }), 'max-sm:flex-1')}
                                            >
                                                Lihat booking saya
                                            </Link>
                                        </>
                                    )
                                }
                            />
                        )}

                        {k === 'dibatalkan' && (
                            <div className={cn(kartu, 'gap-4')}>
                                <div className="flex items-start gap-3.5">
                                    <span
                                        className={cn(
                                            'flex size-10 shrink-0 items-center justify-center rounded-full',
                                            sebab === 'penyewa'
                                                ? 'bg-foreground/7 text-muted-foreground'
                                                : 'bg-destructive/12 text-destructive',
                                        )}
                                    >
                                        <CalendarX className="size-5" aria-hidden="true" />
                                    </span>
                                    <div className="grid min-w-0 gap-1">
                                        <h2 className="text-callout font-semibold">Booking ini dibatalkan</h2>
                                        {sebab !== 'pengelola' && (
                                            <p className="text-subheadline text-muted-foreground">
                                                {sebab === 'penyewa'
                                                    ? 'Anda membatalkan booking ini sebelum membayar, jadi tidak ada biaya yang ditagih.'
                                                    : `Bukti transfer tidak terkirim sebelum batas bayar pukul ${jamBatas}, jadi booking dibatalkan otomatis. Tidak ada biaya yang ditagih.`}
                                            </p>
                                        )}
                                        <p className="mt-1 text-subheadline text-muted-foreground">
                                            Ada pertanyaan? <HubungiPengelola awalBesar />.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex justify-end">{pesanLagi}</div>
                            </div>
                        )}
                    </section>

                    <aside
                        aria-label="Ringkasan booking"
                        className={cn('order-first', !dialog && 'lg:sticky lg:top-24 lg:order-none')}
                    >
                        <Ringkasan
                            booking={booking}
                            dialog={dialog}
                            k={k}
                            ditagih={!(k === 'dibatalkan' && sebab !== 'pengelola')}
                            onUbah={() => setBukaUbah(true)}
                        />
                    </aside>
                </div>

                {belum && (
                    <Button
                        variant="destructive"
                        onClick={onMintaBatal}
                        className={cn(
                            'h-11 w-full text-subheadline font-semibold',
                            !dialog && 'lg:w-auto lg:justify-self-start lg:px-6',
                        )}
                    >
                        Batalkan booking
                    </Button>
                )}
            </div>

            {(belum || ditolak) && (
                <div
                    className={cn(
                        'bottom-0 z-[7] flex items-center justify-between gap-3 border-t bg-background px-4 pt-3 pb-4 shadow-[0_-4px_16px_rgb(0_0_0/0.06)] sm:hidden',
                        dialog ? 'sticky' : 'fixed inset-x-0',
                    )}
                >
                    <div className="grid min-w-0 gap-0.5">
                        <p className="text-callout font-semibold tabular-nums">{formatRupiah(booking.totalBayar)}</p>
                        <p
                            className={cn(
                                'text-footnote text-muted-foreground tabular-nums',
                                belum && langkah === 'transfer' && sisa?.genting && 'text-destructive',
                            )}
                        >
                            {langkah === 'transfer'
                                ? belum && sisa
                                    ? `Bayar sebelum ${sisa.jamBatas} · ${sisa.sisa}`
                                    : `${rekening.bank} ${rekening.nomor}`
                                : form.data.bukti
                                  ? 'Bukti siap dikirim'
                                  : 'Unggah bukti transfer'}
                        </p>
                    </div>
                    {langkah === 'transfer' ? tombolSudah('shrink-0') : tombolKirim('shrink-0')}
                </div>
            )}

            {belum && (
                <UbahJadwal
                    booking={booking}
                    terisi={terisi}
                    jamBatas={jamBatas}
                    open={bukaUbah}
                    onOpenChange={setBukaUbah}
                />
            )}
            {booking.buktiUrl && <DialogBukti booking={booking} open={bukaBukti} onOpenChange={setBukaBukti} />}
        </>
    );
}

/** Lipatan dengan animasi tinggi (grid rows 0fr → 1fr). `selaluBukaLg` = selalu terbuka mulai lg. */
function Lipat({ buka, selaluBukaLg = false, children }: { buka: boolean; selaluBukaLg?: boolean; children: ReactNode }) {
    return (
        <div
            className={cn(
                'grid transition-[grid-template-rows] duration-[340ms] ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none',
                buka ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                selaluBukaLg && 'lg:grid-rows-[1fr]',
            )}
        >
            <div
                className={cn(
                    'min-h-0 overflow-hidden transition-[opacity,visibility] motion-reduce:transition-none',
                    buka ? 'visible opacity-100 delay-[60ms] duration-[280ms]' : 'invisible opacity-0 duration-200',
                    selaluBukaLg && 'lg:visible lg:opacity-100',
                )}
            >
                {children}
            </div>
        </div>
    );
}

function Titik({ keadaan, children }: { keadaan: 'aktif' | 'selesai' | 'nanti'; children: ReactNode }) {
    return (
        <span
            className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full text-footnote font-bold tabular-nums',
                keadaan === 'aktif' && 'bg-primary text-primary-foreground',
                keadaan === 'selesai' && 'bg-success text-primary-foreground',
                keadaan === 'nanti' && 'border-[1.5px] border-input bg-card text-muted-foreground',
            )}
        >
            {keadaan === 'selesai' ? <Check className="size-3.5" strokeWidth={3} aria-hidden="true" /> : children}
        </span>
    );
}

function StatusPembayaran({
    booking,
    ok,
    kartu,
    aksi,
    onLihatBukti,
}: {
    booking: BookingPenyewa;
    ok: boolean;
    kartu: string;
    aksi: ReactNode;
    onLihatBukti: () => void;
}) {
    const garis = [
        { judul: 'Booking dibuat', isi: booking.dibuatPada && waktuSingkat(booking.dibuatPada), selesai: true },
        {
            judul: 'Bukti transfer terkirim',
            isi: booking.dikirimPada && waktuSingkat(booking.dikirimPada),
            selesai: true,
            lihat: !!booking.buktiUrl,
        },
        {
            judul: ok ? 'Pembayaran terverifikasi' : 'Diperiksa pengelola',
            isi: ok
                ? `${booking.namaLapangan} sudah milik Anda untuk jadwal ini.`
                : 'Anda tidak perlu melakukan apa-apa sekarang.',
            selesai: ok,
        },
    ];

    return (
        <div className={cn(kartu, 'gap-5')}>
            <h2 className="text-callout font-semibold">Status pembayaran</h2>
            <ol className="flex flex-col">
                {garis.map((g, i) => {
                    const terakhir = i === garis.length - 1;
                    return (
                        <li key={g.judul} className="flex gap-3.5">
                            <span className="flex shrink-0 flex-col items-center">
                                <span
                                    className={cn(
                                        'flex size-6 items-center justify-center rounded-full',
                                        g.selesai
                                            ? 'bg-success text-primary-foreground'
                                            : 'border-2 border-primary bg-primary/15',
                                    )}
                                >
                                    {g.selesai && <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />}
                                </span>
                                {!terakhir && (
                                    <span
                                        className={cn(
                                            'my-1 min-h-4 w-0.5 flex-1',
                                            garis[i + 1].selesai ? 'bg-success' : 'bg-border',
                                        )}
                                    />
                                )}
                            </span>
                            <span className={cn('flex min-w-0 flex-col gap-0.5', !terakhir && 'pb-5')}>
                                <span className="text-subheadline font-semibold">{g.judul}</span>
                                {g.isi && <span className="text-footnote text-muted-foreground">{g.isi}</span>}
                                {g.lihat && (
                                    <button
                                        type="button"
                                        onClick={onLihatBukti}
                                        className="cursor-pointer self-start text-footnote font-semibold underline underline-offset-3"
                                    >
                                        Lihat bukti yang dikirim
                                    </button>
                                )}
                            </span>
                        </li>
                    );
                })}
            </ol>
            <div className="flex flex-wrap justify-end gap-2">{aksi}</div>
        </div>
    );
}

function Ringkasan({
    booking,
    dialog,
    k,
    ditagih,
    onUbah,
}: {
    booking: BookingPenyewa;
    dialog: boolean;
    k: ReturnType<typeof keadaan>;
    /** false untuk booking yang batal sebelum dibayar: total dicoret. */
    ditagih: boolean;
    onUbah: () => void;
}) {
    const [rinci, setRinci] = useState(false);
    const belum = k === 'belumBayar';
    const batal = k === 'dibatalkan';
    const durasi = durationHours(booking.jamMulai, booking.jamSelesai);
    const ikon = IKON_JENIS[booking.jenisLapangan];
    const baris = cn('flex items-start justify-between gap-4 border-t py-5', batal && 'opacity-50');

    return (
        <div
            className={cn(
                'flex flex-col rounded-[20px] border bg-card p-5',
                dialog ? 'max-sm:p-4' : 'sm:rounded-3xl sm:p-7',
            )}
        >
            <div className="flex items-center gap-4">
                <div
                    className={cn(
                        'flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[color-mix(in_oklab,var(--foreground)_8%,var(--canvas))] text-muted-foreground',
                        !dialog && 'lg:size-28',
                    )}
                >
                    {booking.foto ? (
                        <img src={booking.foto} alt="" className="size-full object-cover" />
                    ) : ikon ? (
                        <img src={ikon} alt="" className={cn('size-8 object-contain', !dialog && 'lg:size-12')} />
                    ) : (
                        <ImageIcon className="size-6" strokeWidth={1.6} aria-hidden="true" />
                    )}
                </div>
                <div className="grid min-w-0 flex-1 gap-1">
                    <p className="text-callout font-semibold">{booking.namaLapangan}</p>
                    <p className="text-footnote text-muted-foreground tabular-nums">Kode {booking.kode}</p>
                </div>
            </div>

            <button
                type="button"
                aria-expanded={rinci}
                onClick={() => setRinci((r) => !r)}
                className={cn(
                    'mt-4 flex w-full cursor-pointer items-center justify-between gap-2 border-t pt-2.5 text-subheadline font-semibold',
                    !dialog && 'lg:hidden',
                )}
            >
                <span>{rinci ? 'Sembunyikan rincian' : 'Lihat rincian'}</span>
                <ChevronDown
                    className={cn(
                        'size-4 transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)]',
                        rinci && 'rotate-180',
                    )}
                    aria-hidden="true"
                />
            </button>

            <Lipat buka={rinci} selaluBukaLg={!dialog}>
                <div className="pt-5">
                    {!batal && (
                        <div className="grid gap-0.5 border-t py-5">
                            <p className="text-subheadline font-semibold">{belum ? 'Pembatalan gratis' : 'Pembatalan'}</p>
                            <p className="text-subheadline">
                                {belum ? (
                                    'Bisa dibatalkan tanpa biaya selama bukti transfer belum dikirim.'
                                ) : (
                                    <>
                                        Bukti transfer sudah dikirim. Untuk membatalkan, <HubungiPengelola />.
                                    </>
                                )}
                            </p>
                        </div>
                    )}

                    <div className={baris}>
                        <div className="grid min-w-0 gap-0.5">
                            <p className="text-subheadline font-semibold">Jadwal</p>
                            <p className="text-subheadline">{formatTanggal(booking.tanggal)}</p>
                        </div>
                        {belum && (
                            <Button variant="secondary" onClick={onUbah}>
                                Ubah
                            </Button>
                        )}
                    </div>

                    <div className={baris}>
                        <div className="grid min-w-0 gap-0.5">
                            <p className="text-subheadline font-semibold">Durasi</p>
                            <p className="text-subheadline tabular-nums">
                                {rentangJam(booking.jamMulai, booking.jamSelesai)} ({durasi} jam)
                            </p>
                        </div>
                        {belum && (
                            <Button variant="secondary" onClick={onUbah}>
                                Ubah
                            </Button>
                        )}
                    </div>

                    <div className="flex items-start justify-between gap-3 border-t pt-5">
                        <div className="grid gap-0.5">
                            <p className="text-subheadline font-semibold">{ditagih ? 'Total' : 'Total (tidak ditagih)'}</p>
                            <p className="text-footnote text-muted-foreground tabular-nums">
                                {durasi} jam x {formatRupiah(booking.tarifPerJam)}
                            </p>
                        </div>
                        <p
                            className={cn(
                                'text-callout font-semibold tabular-nums',
                                !ditagih && 'text-muted-foreground line-through',
                            )}
                        >
                            {formatRupiah(booking.totalBayar)}
                        </p>
                    </div>
                </div>
            </Lipat>
        </div>
    );
}
