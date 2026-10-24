import TabelLaporan, { Laporan } from '@/Components/manager/TabelLaporan';
import { Badge } from '@/Components/ui/badge';
import { buttonVariants } from '@/Components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { IncomeChart, IncomeRow } from '@/Components/ui/chart';
import { formatRupiah, formatTanggal } from '@/Components/ui/format';
import { StatCard } from '@/Components/ui/stat-card';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import { PageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { CalendarCheck, CircleCheck, Clock, Download, ExternalLink, TrendingUp, Wallet } from 'lucide-react';

type Stat = {
    pemasukanBulanIni: number;
    pemasukanBulanLalu: number;
    pemasukanTahunIni: number;
    bookingBulanIni: number;
};

type BulanIni = { bulan: number; tahun: number; namaLaporan: string; sudahDibuat: boolean };

function tren(ini: number, lalu: number) {
    if (lalu === 0) return 'Hanya pembayaran terverifikasi';
    const persen = Math.round(((ini - lalu) / lalu) * 100);
    return `${persen >= 0 ? '▲' : '▼'} ${Math.abs(persen)}% dari bulan lalu`;
}

export default function ManagerDashboard({
    stat,
    grafik,
    bulanIni,
    laporan,
}: {
    stat: Stat;
    grafik: IncomeRow[];
    bulanIni: BulanIni;
    laporan: Laporan[];
}) {
    const nama = usePage<PageProps>().props.pengelola?.nama;
    const terbaru = laporan[0];

    return (
        <AdminSidebarLayout>
            <Head title="Dashboard Manager" />

            <div className="grid gap-6">
                <div>
                    <h1 className="text-xl leading-7 font-semibold tracking-tight">Halo, {nama}</h1>
                    <p className="mt-0.5 text-muted-foreground">{formatTanggal(new Date())}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard
                        label="Pemasukan bulan ini"
                        value={formatRupiah(stat.pemasukanBulanIni)}
                        description={tren(stat.pemasukanBulanIni, stat.pemasukanBulanLalu)}
                        icon={<Wallet />}
                    />
                    <StatCard
                        label={`Pemasukan ${bulanIni.tahun}`}
                        value={formatRupiah(stat.pemasukanTahunIni)}
                        description="Hanya pembayaran terverifikasi"
                        icon={<TrendingUp />}
                    />
                    <StatCard
                        label="Booking bulan ini"
                        value={stat.bookingBulanIni}
                        description="Booking terkonfirmasi"
                        icon={<CalendarCheck />}
                    />
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
                    <Card className="min-w-0">
                        <CardHeader>
                            <CardTitle>Pemasukan 12 bulan terakhir</CardTitle>
                            <CardDescription>Pembayaran terverifikasi per bulan</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <IncomeChart data={grafik} />
                        </CardContent>
                    </Card>

                    <Card className="min-w-0">
                        <CardHeader>
                            <CardTitle>Laporan bulan ini</CardTitle>
                            <CardDescription>{bulanIni.namaLaporan}</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            {bulanIni.sudahDibuat ? (
                                <Badge variant="success">
                                    <CircleCheck />
                                    Sudah dibuat Admin
                                </Badge>
                            ) : (
                                <div className="grid gap-1.5">
                                    <Badge variant="outline">
                                        <Clock />
                                        Belum dibuat
                                    </Badge>
                                    <p className="text-sm text-muted-foreground">
                                        Admin membuat laporan sebulan sekali, biasanya setelah bulan berakhir.
                                    </p>
                                </div>
                            )}

                            {terbaru?.filePdf && (
                                <div className="grid gap-2 border-t pt-4">
                                    <p className="text-sm text-muted-foreground">Laporan terbaru</p>
                                    <div>
                                        <p className="font-medium">{terbaru.namaLaporan}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {formatRupiah(terbaru.totalPemasukan)} · dibuat{' '}
                                            {formatTanggal(terbaru.tglLaporan, 'd MMM yyyy')}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <a
                                            href={route('laporan.pdf', terbaru.idLaporan)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className={buttonVariants({ variant: 'outline', size: 'sm' })}
                                        >
                                            <ExternalLink />
                                            Buka
                                        </a>
                                        <a
                                            href={route('laporan.pdf', { idLaporan: terbaru.idLaporan, unduh: 1 })}
                                            className={buttonVariants({ variant: 'outline', size: 'sm' })}
                                        >
                                            <Download />
                                            Unduh
                                        </a>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card className="min-w-0 gap-0 py-0">
                    <CardHeader className="border-b py-4">
                        <CardTitle>Laporan pembayaran</CardTitle>
                        <CardAction>
                            <Link href={route('manager.laporan')} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                                Lihat semua
                            </Link>
                        </CardAction>
                    </CardHeader>
                    <TabelLaporan laporan={laporan} />
                </Card>
            </div>
        </AdminSidebarLayout>
    );
}
