import DrawerVerifikasi, { BuktiAntrean } from '@/Components/admin/DrawerVerifikasi';
import JadwalGeser, { JadwalBooking, JadwalLapangan } from '@/Components/admin/JadwalGeser';
import { awalHari, isoTanggal, JAM_TUTUP, tambahHari } from '@/Components/booking/jadwal';
import BadgeTip, { tipBooking, tipPembayaran } from '@/Components/pengelola/BadgeTip';
import { BookingStatusBadge, PaymentStatusBadge } from '@/Components/ui/badge';
import { Button, buttonVariants } from '@/Components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { DatePicker } from '@/Components/ui/date-picker';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/Components/ui/dropdown-menu';
import { formatJam, formatRupiah, formatTanggal, rentangJam, toMinutes } from '@/Components/ui/format';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { toast } from '@/Components/ui/toast';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import { PageProps } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { cn } from 'cn';
import {
    ArrowRight,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    CircleCheck,
    CirclePlus,
    CircleX,
    Copy,
    FileCheck,
    FileLock,
    FileText,
    MessageCircle,
    MoreHorizontal,
    Plus,
    SquareArrowOutUpRight,
    Trophy,
    Wallet,
} from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';

type Stat = {
    jamTerisi: number;
    jamTotal: number;
    bookingMasuk: number;
    bookingMasukBatal: number;
    bookingMasukBelumBayar: number;
    terverifikasiJumlah: number;
    terverifikasiN: number;
};

type Tugas = { jenis: 'revisi' | 'tertahan' | 'siap' | 'ditolak'; judul: string; ket: string; aksi: string; idPembayaran: number | null; href: string | null };

type Terbaru = {
    idBooking: number;
    kode: string;
    namaPenyewa: string;
    noHp: string;
    namaLapangan: string;
    tanggal: string;
    jamMulai: string;
    jamSelesai: string;
    totalBayar: number;
    status: string;
    idPembayaran: number | null;
    statusPembayaran: string | null;
};

const keTanggal = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
};
const jam = (hhmm: string) => formatJam(hhmm);
const selisihHari = (a: Date, b: Date) => Math.round((awalHari(a).getTime() - awalHari(b).getTime()) / 86_400_000);

function judulTanggal(tanggal: Date) {
    const sebutan = { [-1]: 'Kemarin', 0: 'Hari ini', 1: 'Besok' }[selisihHari(tanggal, new Date())];
    return sebutan ? `${sebutan} · ${formatTanggal(tanggal)}` : formatTanggal(tanggal);
}

/** "081234…" -> "6281234…" untuk tautan wa.me */
const nomorWa = (hp: string) => {
    const d = hp.replace(/\D/g, '');
    return d.startsWith('0') ? `62${d.slice(1)}` : d;
};

function Angka({ ikon, label, nilai, ket, className }: { ikon: ReactNode; label: string; nilai: ReactNode; ket: string; className?: string }) {
    return (
        <div className={cn('flex min-w-0 flex-col gap-1.5 px-6 py-5 [&_svg]:size-4', className)}>
            <span className="flex items-center gap-1.5 font-medium">
                <span className="text-muted-foreground">{ikon}</span>
                {label}
            </span>
            <span className="text-2xl leading-8 font-semibold tracking-tight tabular-nums">{nilai}</span>
            <span className="text-sm text-muted-foreground">{ket}</span>
        </div>
    );
}

function Chip({ children, warna }: { children: ReactNode; warna: string }) {
    return <span className={cn('inline-flex h-[22px] items-center rounded-md px-2 text-xs font-medium whitespace-nowrap', warna)}>{children}</span>;
}

export default function AdminDashboard({
    stat,
    lapangan,
    tanggalJadwal,
    jadwalDari,
    jadwalSampai,
    jadwal: daftarJadwal,
    jadwalHariIni,
    antrean,
    tugas,
    terbaru,
}: {
    stat: Stat;
    lapangan: JadwalLapangan[];
    tanggalJadwal: string;
    jadwalDari: string;
    jadwalSampai: string;
    jadwal: JadwalBooking[];
    jadwalHariIni: JadwalBooking[];
    antrean: BuktiAntrean[];
    tugas: Tugas[];
    terbaru: Terbaru[];
}) {
    const nama = usePage<PageProps>().props.pengelola?.nama;
    const [sekarang, setSekarang] = useState(() => new Date());
    useEffect(() => {
        const t = setInterval(() => setSekarang(new Date()), 60_000);
        return () => clearInterval(t);
    }, []);
    const menitKini = sekarang.getHours() * 60 + sekarang.getMinutes();
    const hariIni = awalHari(sekarang);

    // ---------- drawer verifikasi (juga dibuka dari notifikasi header: ?bukti=id)
    const [ditinjau, setDitinjau] = useState<number | null>(() => {
        const id = Number(new URLSearchParams(window.location.search).get('bukti'));
        return id || null;
    });
    const [memproses, setMemproses] = useState(false);
    const [galatAlasan, setGalatAlasan] = useState<string>();
    const pos = antrean.findIndex((a) => a.idPembayaran === ditinjau);
    const bukti = pos >= 0 ? antrean[pos] : null;
    const berikutnya = pos >= 0 ? (antrean[pos + 1] ?? (pos > 0 ? antrean[0] : null)) : null;
    const tinjau = (id: number) => {
        setGalatAlasan(undefined);
        setDitinjau(id);
    };
    const putuskan = (aksi: 'terima' | 'tolak', alasan?: string) => {
        if (!bukti) return;
        const lanjut = berikutnya?.idPembayaran ?? null;
        router.post(route(`verifikasi.${aksi}`, bukti.idPembayaran), aksi === 'tolak' ? { alasan } : {}, {
            preserveScroll: true,
            onStart: () => setMemproses(true),
            onFinish: () => setMemproses(false),
            onError: (e) => setGalatAlasan(e.alasan),
            onSuccess: () => {
                setGalatAlasan(undefined);
                // FIFO: langsung ke bukti berikutnya di antrean
                setDitinjau(lanjut);
            },
        });
    };

    // ---------- Jadwal: server mengirim jadwalDari..jadwalSampai; pindah hari di rentang itu tanpa request
    const [tampil, setTampil] = useState(tanggalJadwal);
    useEffect(() => setTampil(tanggalJadwal), [tanggalJadwal]);
    const tanggal = keTanggal(tampil);
    const jadwalTanggal = daftarJadwal.filter((b) => b.tanggal === tampil);
    const tampilHariIni = tanggal.getTime() === hariIni.getTime();
    const lihatTanggal = (d: Date) => {
        const iso = isoTanggal(d);
        if (iso >= jadwalDari && iso <= jadwalSampai) return setTampil(iso);
        router.get(route('dashboard.admin'), d.getTime() === hariIni.getTime() ? {} : { tanggal: iso }, {
            only: ['jadwal', 'tanggalJadwal', 'jadwalDari', 'jadwalSampai'],
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };
    const adaBentrok = jadwalTanggal.some(
        (b) =>
            b.status !== 'Dikonfirmasi' &&
            jadwalTanggal.some((o) => o.status === 'Dikonfirmasi' && o.idLapangan === b.idLapangan && o.jamMulai < b.jamSelesai && o.jamSelesai > b.jamMulai),
    );

    // ---------- KPI hari ini (setiap angka punya keterangan asalnya)
    const sesi = jadwalHariIni;
    const berjalan = sesi.filter((b) => toMinutes(b.jamMulai) <= menitKini && menitKini < toMinutes(b.jamSelesai)).length;
    const nanti = [...sesi].filter((b) => toMinutes(b.jamMulai) > menitKini).sort((a, b) => a.jamMulai.localeCompare(b.jamMulai))[0];
    const namaLap = (id: number) => lapangan.find((l) => l.idLapangan === id)?.namaLapangan ?? '';
    let sisaKosong = 0;
    for (const l of lapangan)
        for (let h = Math.ceil(menitKini / 60); h < JAM_TUTUP; h++)
            if (!sesi.some((b) => b.idLapangan === l.idLapangan && toMinutes(b.jamMulai) <= h * 60 && h * 60 < toMinutes(b.jamSelesai))) sisaKosong++;
    const persenIsi = stat.jamTotal ? Math.round((stat.jamTerisi / stat.jamTotal) * 100) : 0;

    // ---------- ringkasan satu kalimat di bawah sapaan
    const isoHariIni = isoTanggal(hariIni);
    const buktiHariIni = antrean.filter((a) => a.tanggal === isoHariIni && toMinutes(a.jamMulai) >= menitKini);
    const ringkasan = sesi.length
        ? `${sesi.length} sesi hari ini · ${
              buktiHariIni.length
                  ? `${buktiHariIni.length} bukti harus dicek sebelum ${jam([...buktiHariIni].sort((a, b) => a.jamMulai.localeCompare(b.jamMulai))[0].jamMulai)}`
                  : 'semua bukti untuk sesi hari ini sudah dicek'
          }`
        : 'Belum ada sesi hari ini';

    // ---------- antrean: chip jadwal main dan lama menunggu
    const chipMain = (a: BuktiAntrean) => {
        const d = keTanggal(a.tanggal);
        const dd = selisihHari(d, sekarang);
        if (dd < 0 || (dd === 0 && toMinutes(a.jamMulai) < menitKini)) return <Chip warna="bg-muted text-muted-foreground">Main {formatTanggal(a.tanggal, 'd MMM')} · sudah lewat</Chip>;
        if (dd === 0) return <Chip warna="bg-accessible-orange/12 text-accessible-orange">Main hari ini {jam(a.jamMulai)}</Chip>;
        if (dd === 1) return <Chip warna="bg-primary/10 text-primary">Main besok {jam(a.jamMulai)}</Chip>;
        return <Chip warna="bg-muted text-muted-foreground">Main {formatTanggal(a.tanggal, 'EEE, d MMM')} {jam(a.jamMulai)}</Chip>;
    };
    const chipTunggu = (a: BuktiAntrean) => {
        if (a.bentrokDengan) return <Chip warna="bg-accessible-red/12 text-accessible-red">Jam bentrok</Chip>;
        if (!a.dikirimPada) return null;
        const kirim = new Date(a.dikirimPada);
        // lama menunggu dihitung dari jam kirim, bukan pergantian tanggal
        const hari = Math.floor((sekarang.getTime() - kirim.getTime()) / 86_400_000);
        return hari < 1 ? (
            <Chip warna="bg-muted text-muted-foreground">
                Dikirim {selisihHari(sekarang, kirim) === 1 ? 'kemarin ' : ''}
                {formatTanggal(kirim, 'HH.mm')}
            </Chip>
        ) : (
            <Chip warna="bg-accessible-red/12 text-accessible-red">Menunggu {hari} hari</Chip>
        );
    };
    const nTindakan = antrean.length + tugas.length;
    const IKON_TUGAS = { revisi: FileText, tertahan: FileLock, siap: FileCheck, ditolak: CircleX };
    const WARNA_TUGAS = { revisi: 'text-accessible-red', tertahan: 'text-accessible-orange', siap: 'text-accessible-green', ditolak: 'text-muted-foreground' };

    // ---------- booking terbaru: tab status
    const [tab, setTab] = useState<'semua' | 'Dipesan' | 'Dikonfirmasi' | 'Dibatalkan'>('semua');
    const tersaring = terbaru.filter((b) => tab === 'semua' || b.status === tab).slice(0, 6);
    const TAB = [
        ['semua', 'Semua'],
        ['Dipesan', 'Dipesan'],
        ['Dikonfirmasi', 'Dikonfirmasi'],
        ['Dibatalkan', 'Dibatalkan'],
    ] as const;
    const salin = (kode: string) =>
        navigator.clipboard?.writeText(kode).then(
            () => toast.success(`${kode} disalin.`),
            () => toast.error('Kode tidak bisa disalin.'),
        );

    return (
        <AdminSidebarLayout>
            <Head title="Dashboard Admin" />

            <div className="grid gap-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div className="min-w-0">
                        <h2 className="text-xl leading-7 font-medium">Halo, {nama}</h2>
                        <p className="mt-0.5 text-muted-foreground">
                            {formatTanggal(sekarang)} · <span className="font-medium text-foreground">{ringkasan}</span>
                        </p>
                    </div>
                    <Link href="/tampilbooking?tambah" className={buttonVariants({ variant: 'elevated' })}>
                        <Plus />
                        Tambah booking
                    </Link>
                </div>

                <Card className="gap-0 py-0" aria-label="Ringkasan hari ini">
                    {/* garis pemisah: 1 kolom (HP) di atas, 2 kolom (sm) kiri/atas, 4 kolom (xl) hanya kiri */}
                    <div className="grid sm:grid-cols-2 xl:grid-cols-4 [&>*+*]:border-t sm:[&>*:nth-child(2)]:border-t-0 sm:[&>*:nth-child(even)]:border-l xl:[&>*]:border-t-0 xl:[&>*+*]:border-l">
                        <Angka
                            ikon={<CalendarDays />}
                            label="Sesi hari ini"
                            nilai={sesi.length}
                            ket={
                                sesi.length
                                    ? `${berjalan ? `${berjalan} berjalan · ` : ''}${nanti ? `berikutnya ${jam(nanti.jamMulai)} di ${namaLap(nanti.idLapangan)}` : 'tidak ada sesi lagi'}`
                                    : 'Belum ada sesi'
                            }
                        />
                        <Angka
                            ikon={<Trophy />}
                            label="Keterisian hari ini"
                            nilai={`${persenIsi}%`}
                            ket={`${stat.jamTerisi} dari ${stat.jamTotal} jam terkonfirmasi · ${sisaKosong} jam kosong sampai tutup`}
                        />
                        <Angka
                            ikon={<CirclePlus />}
                            label="Booking masuk hari ini"
                            nilai={stat.bookingMasuk}
                            ket={`${stat.bookingMasukBatal} dibatalkan · ${stat.bookingMasukBelumBayar} belum dibayar`}
                        />
                        <Angka
                            ikon={<Wallet />}
                            label="Terverifikasi hari ini"
                            nilai={formatRupiah(stat.terverifikasiJumlah)}
                            ket={`${stat.terverifikasiN} pembayaran diterima hari ini`}
                        />
                    </div>
                </Card>

                <Card className="min-w-0" aria-label="Jadwal">
                    <CardHeader>
                        <CardTitle>Jadwal</CardTitle>
                        <CardDescription>{judulTanggal(tanggal)}</CardDescription>
                        <CardAction className="flex items-center gap-1.5">
                            {!tampilHariIni && (
                                <Button variant="ghost" size="sm" onClick={() => lihatTanggal(hariIni)}>
                                    Hari ini
                                </Button>
                            )}
                            <Button variant="outline" size="icon" aria-label="Hari sebelumnya" onClick={() => lihatTanggal(tambahHari(tanggal, -1))}>
                                <ChevronLeft />
                            </Button>
                            <DatePicker value={tanggal} onChange={(d) => d && lihatTanggal(d)} label={formatTanggal(tanggal, 'd MMM')} align="end" className="w-auto" />
                            <Button variant="outline" size="icon" aria-label="Hari berikutnya" onClick={() => lihatTanggal(tambahHari(tanggal, 1))}>
                                <ChevronRight />
                            </Button>
                        </CardAction>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <JadwalGeser lapangan={lapangan} booking={jadwalTanggal} sekarang={tampilHariIni ? sekarang : undefined} onTinjau={tinjau} />
                        {jadwalTanggal.length === 0 && <p className="text-center text-sm text-muted-foreground">Belum ada booking terkonfirmasi di tanggal ini.</p>}
                        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <span className="size-3 rounded-sm border border-accessible-green/30 bg-accessible-green/10" />
                                Dikonfirmasi
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="size-3 rounded-sm border border-dashed border-accessible-orange bg-accessible-orange/10" />
                                Menunggu verifikasi
                            </span>
                            {adaBentrok && (
                                <span className="flex items-center gap-1.5">
                                    <span className="size-3 rounded-sm border border-dashed border-accessible-red bg-accessible-red/10" />
                                    Bentrok
                                </span>
                            )}
                            {tampilHariIni && (
                                <span className="flex items-center gap-1.5">
                                    <span className="h-3 w-0.5 bg-foreground" />
                                    Sekarang
                                </span>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="gap-0 overflow-hidden py-0" aria-label="Perlu tindakan">
                    <div className="flex items-center gap-2 px-4 py-4">
                        <CardTitle>Perlu tindakan</CardTitle>
                        <span
                            className={cn(
                                'inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums',
                                antrean.length ? 'bg-accessible-orange/14 text-accessible-orange' : 'bg-muted',
                            )}
                        >
                            {nTindakan}
                        </span>
                    </div>
                    {nTindakan === 0 && (
                        <div className="flex flex-col items-center gap-1 border-t px-4 py-10 text-center">
                            <CircleCheck className="size-6 text-accessible-green" />
                            <span className="font-medium">Semua beres</span>
                            <span className="text-sm text-muted-foreground">Tidak ada bukti yang menunggu dan tidak ada tugas lain.</span>
                        </div>
                    )}
                    {antrean.length > 0 && (
                        <>
                            <div className="flex items-center justify-between border-y bg-tabel-header px-4 py-2 text-sm text-muted-foreground">
                                <span>Verifikasi bukti bayar · {antrean.length}</span>
                                <Link href="/tampilpembayaran" className="font-medium text-primary hover:underline">
                                    Buka Pembayaran
                                </Link>
                            </div>
                            <ul aria-label="Antrean verifikasi" className="max-h-[420px] divide-y overflow-y-auto">
                                {antrean.map((a) => (
                                    <li key={a.idPembayaran} className="flex items-center gap-3 px-4 py-3">
                                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                                            <span className="truncate">
                                                <span className="font-medium">{a.namaPenyewa}</span>
                                                <span className="text-muted-foreground"> · {a.namaLapangan}</span>
                                            </span>
                                            <span className="flex flex-wrap gap-1">
                                                {chipMain(a)}
                                                {chipTunggu(a)}
                                            </span>
                                        </div>
                                        <Button size="sm" variant="outline" onClick={() => tinjau(a.idPembayaran)}>
                                            Tinjau
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                    {tugas.length > 0 && (
                        <>
                            <div className="border-y bg-tabel-header px-4 py-2 text-sm text-muted-foreground">Tugas lain · {tugas.length}</div>
                            <ul aria-label="Tugas lain" className="divide-y">
                                {tugas.map((g) => {
                                    const Ikon = IKON_TUGAS[g.jenis];
                                    return (
                                        <li key={`${g.jenis}-${g.href}`} className="flex items-center gap-3 px-4 py-2.5">
                                            {/* kotak ikon berwarna 12% seperti kanvas */}
                                            <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg bg-current/12', WARNA_TUGAS[g.jenis])}>
                                                <Ikon className="size-4" aria-hidden />
                                            </span>
                                            <div className="flex min-w-0 flex-1 flex-col">
                                                <span className="truncate font-medium">{g.judul}</span>
                                                <span className="truncate text-sm text-muted-foreground" title={g.ket}>
                                                    {g.ket}
                                                </span>
                                            </div>
                                            {g.href ? (
                                                <Link href={g.href} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-7 shrink-0 px-2.5 text-[13px]')}>
                                                    {g.aksi}
                                                </Link>
                                            ) : (
                                                <Button size="sm" variant="outline" className="h-7 shrink-0 px-2.5 text-[13px]" onClick={() => g.idPembayaran && tinjau(g.idPembayaran)}>
                                                    {g.aksi}
                                                </Button>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </>
                    )}
                </Card>

                <Card className="gap-0 overflow-hidden py-0" aria-label="Booking terbaru">
                    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                        <div className="flex flex-wrap items-center gap-4">
                            <CardTitle>Booking terbaru</CardTitle>
                            <div role="tablist" aria-label="Saring status booking" className="flex h-8 items-center gap-0.5 rounded-lg bg-muted p-[3px]">
                                {TAB.map(([k, label]) => (
                                    <button
                                        key={k}
                                        type="button"
                                        role="tab"
                                        aria-selected={tab === k}
                                        onClick={() => setTab(k)}
                                        className={cn(
                                            'flex h-full items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                                            tab === k && 'bg-background text-foreground shadow-sm dark:bg-input/30',
                                        )}
                                    >
                                        {label}
                                        <span className="rounded-full bg-background/60 px-1.5 text-xs tabular-nums dark:bg-muted">
                                            {terbaru.filter((b) => k === 'semua' || b.status === k).length}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <Link href="/tampilbooking" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                            Lihat semua
                            <ArrowRight />
                        </Link>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Kode</TableHead>
                                <TableHead>Penyewa</TableHead>
                                <TableHead>Lapangan</TableHead>
                                <TableHead>Jadwal main</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Pembayaran</TableHead>
                                <TableHead className="text-right">
                                    <span className="sr-only">Aksi</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tersaring.length === 0 && <TableEmpty colSpan={8}>Tidak ada booking dengan status ini di antara booking terbaru.</TableEmpty>}
                            {tersaring.map((b) => {
                                const menunggu = b.statusPembayaran === 'Menunggu Verifikasi' && antrean.some((a) => a.idPembayaran === b.idPembayaran);
                                const perluChat = b.status === 'Dipesan' && (!b.statusPembayaran || b.statusPembayaran === 'Ditolak');
                                return (
                                    <TableRow key={b.idBooking}>
                                        <TableCell className="text-muted-foreground tabular-nums">{b.kode}</TableCell>
                                        <TableCell className="font-medium">{b.namaPenyewa}</TableCell>
                                        <TableCell>{b.namaLapangan}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatTanggal(b.tanggal, 'EEE, d MMM')} · {rentangJam(b.jamMulai, b.jamSelesai)}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">{formatRupiah(b.totalBayar)}</TableCell>
                                        <TableCell>
                                            <BadgeTip tip={tipBooking(b.status)}>
                                                <BookingStatusBadge status={b.status} />
                                            </BadgeTip>
                                        </TableCell>
                                        <TableCell>
                                            {b.statusPembayaran ? (
                                                <BadgeTip tip={tipPembayaran({ status: b.statusPembayaran })}>
                                                    <PaymentStatusBadge status={b.statusPembayaran} />
                                                </BadgeTip>
                                            ) : b.status === 'Dipesan' ? (
                                                <span className="text-sm text-muted-foreground">Belum bayar</span>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-1">
                                                {menunggu && (
                                                    <Button size="sm" variant="outline" onClick={() => b.idPembayaran && tinjau(b.idPembayaran)}>
                                                        Tinjau
                                                    </Button>
                                                )}
                                                {perluChat && b.noHp && (
                                                    <a
                                                        href={`https://wa.me/${nomorWa(b.noHp)}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        title="Buka WhatsApp ke nomor penyewa"
                                                        className={buttonVariants({ variant: 'outline', size: 'sm' })}
                                                    >
                                                        <MessageCircle />
                                                        Chat WA
                                                    </a>
                                                )}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        aria-label={`Aksi lain untuk ${b.kode}`}
                                                        className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
                                                    >
                                                        <MoreHorizontal />
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="min-w-44">
                                                        <DropdownMenuItem render={<Link href="/tampilbooking" />}>
                                                            <SquareArrowOutUpRight />
                                                            Buka di Booking
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => salin(b.kode)}>
                                                            <Copy />
                                                            Salin kode
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </Card>
            </div>

            <DrawerVerifikasi
                bukti={bukti}
                posisi={pos}
                jumlah={antrean.length}
                adaBerikutnya={!!bukti && !!berikutnya && berikutnya.idPembayaran !== bukti.idPembayaran}
                onSebelum={() => pos > 0 && tinjau(antrean[pos - 1].idPembayaran)}
                onBerikut={() => pos < antrean.length - 1 && tinjau(antrean[pos + 1].idPembayaran)}
                onTutup={() => setDitinjau(null)}
                onTerima={() => putuskan('terima')}
                onTolak={(alasan) => putuskan('tolak', alasan)}
                galatAlasan={galatAlasan}
                memproses={memproses}
            />
        </AdminSidebarLayout>
    );
}
