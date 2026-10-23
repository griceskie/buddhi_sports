import JadwalHariIni, { JadwalBooking, JadwalLapangan } from '@/Components/admin/JadwalHariIni';
import { awalHari, isoTanggal, tambahHari } from '@/Components/booking/jadwal';
import StatusBooking from '@/Components/booking/StatusBooking';
import FlashMessage from '@/Components/FlashMessage';
import { Button, buttonVariants } from '@/Components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { DatePicker } from '@/Components/ui/date-picker';
import { formatRupiah, formatTanggal } from '@/Components/ui/format';
import { ProofReview } from '@/Components/ui/proof-review';
import { StatCard } from '@/Components/ui/stat-card';
import {
    Table,
    TableBody,
    TableCell,
    TableEmpty,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import { PageProps } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Plus, Trophy, Wallet } from 'lucide-react';
import { useState } from 'react';

type Stat = {
    bookingHariIni: number;
    menungguVerifikasi: number;
    pendapatanBulanIni: number;
    pendapatanBulanLalu: number;
    jamTerisi: number;
    jamTotal: number;
};

type Antrean = {
    idPembayaran: number;
    idBooking: number;
    kode: string;
    namaPenyewa: string;
    namaLapangan: string;
    tanggal: string;
    jamMulai: string;
    jamSelesai: string;
    tglBayar: string;
    jumlahBayar: number;
    totalBayar: number;
    buktiBayar: string | null;
    status: string;
};

type Terbaru = {
    idBooking: number;
    kode: string;
    namaPenyewa: string;
    namaLapangan: string;
    tanggal: string;
    jamMulai: string;
    jamSelesai: string;
    totalBayar: number;
    status: string;
    statusPembayaran: string | null;
};

const jadwal = (tanggal: string, mulai: string, selesai: string) =>
    `${formatTanggal(tanggal, 'EEE, d MMM')} · ${mulai}–${selesai}`;

const keTanggal = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
};

function judulTanggal(tanggal: Date) {
    const selisih = Math.round((tanggal.getTime() - awalHari(new Date()).getTime()) / 86_400_000);
    const sebutan = { [-1]: 'Kemarin', 0: 'Hari ini', 1: 'Besok' }[selisih];
    const lengkap = formatTanggal(tanggal);
    return sebutan ? `${sebutan} (${lengkap})` : lengkap;
}

function trenPendapatan(ini: number, lalu: number) {
    if (lalu === 0) return 'Hanya pembayaran terverifikasi';
    const persen = Math.round(((ini - lalu) / lalu) * 100);
    return `${persen >= 0 ? '▲' : '▼'} ${Math.abs(persen)}% dari bulan lalu`;
}

export default function AdminDashboard({
    stat,
    lapangan,
    tanggalJadwal,
    jadwal: jadwalHariIni,
    antrean,
    terbaru,
}: {
    stat: Stat;
    lapangan: JadwalLapangan[];
    tanggalJadwal: string;
    jadwal: JadwalBooking[];
    antrean: Antrean[];
    terbaru: Terbaru[];
}) {
    const nama = usePage<PageProps>().props.pengelola?.nama;
    const [ditinjau, setDitinjau] = useState<Antrean | null>(null);
    const [memproses, setMemproses] = useState(false);
    const persenTerisi = stat.jamTotal ? Math.round((stat.jamTerisi / stat.jamTotal) * 100) : 0;

    const tanggal = keTanggal(tanggalJadwal);
    const hariIni = awalHari(new Date());
    const lihatTanggal = (d: Date) =>
        router.get(
            route('dashboard.admin'),
            d.getTime() === hariIni.getTime() ? {} : { tanggal: isoTanggal(d) },
            { only: ['jadwal', 'tanggalJadwal'], preserveState: true, preserveScroll: true, replace: true },
        );

    const tinjau = (idPembayaran: number) => setDitinjau(antrean.find((a) => a.idPembayaran === idPembayaran) ?? null);

    const putuskan = (aksi: 'terima' | 'tolak') => {
        if (!ditinjau) return;
        router.post(
            route(`verifikasi.${aksi}`, ditinjau.idPembayaran),
            {},
            {
                preserveScroll: true,
                onStart: () => setMemproses(true),
                onFinish: () => setMemproses(false),
                onSuccess: () => setDitinjau(null),
            },
        );
    };

    return (
        <AdminSidebarLayout>
            <Head title="Dashboard Admin" />

            <div className="grid gap-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-xl leading-7 font-semibold tracking-tight">Halo, {nama}</h1>
                        <p className="mt-0.5 text-muted-foreground">{formatTanggal(new Date())}</p>
                    </div>
                    <Link href="/tampilbooking?tambah" className={buttonVariants()}>
                        <Plus />
                        Tambah booking
                    </Link>
                </div>

                <FlashMessage />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Booking hari ini"
                        value={stat.bookingHariIni}
                        description={`di ${lapangan.length} lapangan`}
                        icon={<CalendarDays />}
                    />
                    <StatCard
                        label="Menunggu verifikasi"
                        value={stat.menungguVerifikasi}
                        icon={<Clock />}
                        action={
                            <Link href="/tampilpembayaran" className="text-xs font-medium text-primary hover:underline">
                                Buka daftar pembayaran
                            </Link>
                        }
                    />
                    <StatCard
                        label="Pendapatan bulan ini"
                        value={formatRupiah(stat.pendapatanBulanIni)}
                        description={trenPendapatan(stat.pendapatanBulanIni, stat.pendapatanBulanLalu)}
                        icon={<Wallet />}
                    />
                    <StatCard
                        label="Terisi hari ini"
                        value={`${persenTerisi}%`}
                        description={`${stat.jamTerisi} dari ${stat.jamTotal} jam sewa terkonfirmasi`}
                        icon={<Trophy />}
                    />
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
                    <Card className="min-w-0">
                        <CardHeader>
                            <CardTitle>Jadwal</CardTitle>
                            <CardDescription>{judulTanggal(tanggal)}</CardDescription>
                            <CardAction className="flex items-center gap-1.5">
                                {tanggal.getTime() !== hariIni.getTime() && (
                                    <Button variant="ghost" size="sm" onClick={() => lihatTanggal(hariIni)}>
                                        Hari ini
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    size="icon"
                                    aria-label="Hari sebelumnya"
                                    onClick={() => lihatTanggal(tambahHari(tanggal, -1))}
                                >
                                    <ChevronLeft />
                                </Button>
                                <DatePicker
                                    value={tanggal}
                                    onChange={(d) => d && lihatTanggal(d)}
                                    label={formatTanggal(tanggal, 'd MMM')}
                                    align="end"
                                    className="w-auto"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    aria-label="Hari berikutnya"
                                    onClick={() => lihatTanggal(tambahHari(tanggal, 1))}
                                >
                                    <ChevronRight />
                                </Button>
                            </CardAction>
                        </CardHeader>
                        <CardContent>
                            <JadwalHariIni lapangan={lapangan} booking={jadwalHariIni} onTinjau={tinjau} />
                        </CardContent>
                    </Card>

                    <Card className="min-w-0 gap-0 py-0">
                        <div className="border-b px-4 py-3">
                            <CardTitle>Perlu diverifikasi</CardTitle>
                        </div>
                        {antrean.length === 0 ? (
                            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                                Semua pembayaran sudah diproses.
                            </p>
                        ) : (
                            <ul className="divide-y">
                                {antrean.map((a) => (
                                    <li key={a.idPembayaran} className="flex items-center gap-3 px-4 py-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium">{a.namaPenyewa}</p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {a.namaLapangan} · {jadwal(a.tanggal, a.jamMulai, a.jamSelesai)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Dikirim {formatTanggal(a.tglBayar, 'd MMM')}
                                            </p>
                                        </div>
                                        <div className="grid justify-items-end gap-1.5">
                                            <span className="text-sm font-semibold tabular-nums">
                                                {formatRupiah(a.jumlahBayar)}
                                            </span>
                                            <Button size="sm" variant="outline" onClick={() => setDitinjau(a)}>
                                                Tinjau bukti
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                </div>

                <Card className="gap-0 overflow-hidden py-0">
                    <div className="flex items-center justify-between border-b px-4 py-2">
                        <CardTitle>Booking terbaru</CardTitle>
                        <Link href="/tampilbooking" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                            Lihat semua
                        </Link>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Kode</TableHead>
                                <TableHead>Penyewa</TableHead>
                                <TableHead>Lapangan</TableHead>
                                <TableHead>Jadwal</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {terbaru.length === 0 && <TableEmpty colSpan={6} />}
                            {terbaru.map((b) => (
                                <TableRow key={b.idBooking}>
                                    <TableCell className="text-muted-foreground tabular-nums">{b.kode}</TableCell>
                                    <TableCell className="font-medium">{b.namaPenyewa}</TableCell>
                                    <TableCell>{b.namaLapangan}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {jadwal(b.tanggal, b.jamMulai, b.jamSelesai)}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">{formatRupiah(b.totalBayar)}</TableCell>
                                    <TableCell>
                                        <StatusBooking booking={b} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            </div>

            {ditinjau && (
                <ProofReview
                    open
                    onOpenChange={(buka) => !buka && setDitinjau(null)}
                    payment={ditinjau}
                    onApprove={() => putuskan('terima')}
                    onReject={() => putuskan('tolak')}
                    processing={memproses}
                />
            )}
        </AdminSidebarLayout>
    );
}
