import { IKON_LAPANGAN } from '@/Components/booking/jadwal';
import BadgeTip, { tipLapangan } from '@/Components/pengelola/BadgeTip';
import JudulHalaman from '@/Components/pengelola/JudulHalaman';
import { CourtStatusBadge } from '@/Components/ui/badge';
import { buttonVariants } from '@/Components/ui/button';
import { formatRupiah } from '@/Components/ui/format';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/Components/ui/tooltip';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import { Head, Link } from '@inertiajs/react';
import { cn } from 'cn';
import { ChartColumn, LayoutGrid, List } from 'lucide-react';
import { CSSProperties, useState } from 'react';

type Lapangan = {
    idLapangan: number;
    namaLapangan: string;
    jenisLapangan: string;
    tarifPerJam: number;
    status: string;
    pemasukan: number;
    terisi: number;
    hariIni: { booking: number; jam: number };
    depan: number;
};

const persen = (x: number) => `${x.toLocaleString('id-ID')}%`;
const hariIni = (l: Lapangan) => (l.hariIni.booking ? `${l.hariIni.booking} booking · ${l.hariIni.jam} jam` : 'Kosong');
const depan = (l: Lapangan) => (l.depan ? `${l.depan} booking` : 'Belum ada');

// Kartu dan tabel bertumpuk; yang tidak aktif memudar dan bergeser turun sedikit, isinya masuk berurutan (lp-* di admin.css)
const lapis = (aktif: boolean) => cn('transition-[opacity,translate,scale] duration-300 ease-out motion-reduce:transition-none', !aktif && 'pointer-events-none invisible absolute inset-x-0 top-0 translate-y-2 scale-[.985] opacity-0');
const masuk = (aktif: boolean, i: number): { className?: string; style?: CSSProperties } =>
    aktif ? { className: 'motion-safe:animate-[lp-masuk_.38s_cubic-bezier(.2,.7,.2,1)_both]', style: { animationDelay: `${i * 50}ms` } } : {};

/** Lapangan untuk Manager: hanya dilihat. Pemakaian dan pemasukan tiap lapangan; Admin yang mengubah tarif, status, dan foto. */
export default function Lapangan({ lapangan, bulan }: { lapangan: Lapangan[]; bulan: string }) {
    const [tampilan, setTampilan] = useState<'kartu' | 'tabel'>('kartu');
    const kartu = tampilan === 'kartu';

    return (
        <AdminSidebarLayout
            header={
                <JudulHalaman judul="Data lapangan" deskripsi="Pemakaian dan pemasukan tiap lapangan. Admin yang mengubah tarif, status, dan foto.">
                    <div role="group" aria-label="Tampilan lapangan" className="inline-flex h-8 items-center rounded-lg border bg-background p-0.5 shadow-xs">
                        {(
                            [
                                ['kartu', 'Kartu', LayoutGrid],
                                ['tabel', 'Tabel', List],
                            ] as const
                        ).map(([k, l, Ikon]) => (
                            <button
                                key={k}
                                type="button"
                                aria-pressed={tampilan === k}
                                onClick={() => setTampilan(k)}
                                className={cn(
                                    'inline-flex h-[26px] cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-colors',
                                    tampilan === k ? 'bg-accent text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                <Ikon className="size-4" aria-hidden />
                                {l}
                            </button>
                        ))}
                    </div>
                </JudulHalaman>
            }
        >
            <Head title="Lapangan" />

            <div className="relative">
                <div aria-hidden={!kartu} className={cn('grid gap-6 md:grid-cols-2', lapis(kartu))}>
                    {lapangan.map((l, i) => (
                        <article key={l.idLapangan} {...masuk(kartu, i)} className={cn('flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm', masuk(kartu, i).className)}>
                            <div className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-x-4 px-6 py-5">
                                <div aria-hidden className="flex size-14 items-center justify-center rounded-xl bg-muted">
                                    <img src={IKON_LAPANGAN[l.jenisLapangan]} alt="" className="size-9 object-contain" />
                                </div>
                                <div className="flex min-w-0 flex-col gap-0.5">
                                    <h3 className="text-base font-semibold">{l.namaLapangan}</h3>
                                    <span className="text-muted-foreground">
                                        {l.jenisLapangan} · {formatRupiah(l.tarifPerJam)}/jam
                                    </span>
                                </div>
                                <BadgeTip tip={tipLapangan(l.status)}>
                                    <CourtStatusBadge status={l.status} />
                                </BadgeTip>
                            </div>
                            <div className="flex flex-col gap-1 border-t px-6 py-4">
                                <span className="text-muted-foreground">Pemasukan {bulan}</span>
                                <span className="text-2xl font-semibold tabular-nums">{formatRupiah(l.pemasukan)}</span>
                            </div>
                            <dl className="grid grid-cols-3 gap-x-4 border-t px-6 py-4">
                                {[
                                    ['Hari ini', hariIni(l)],
                                    [`Keterisian ${bulan}`, persen(l.terisi)],
                                    ['30 hari ke depan', depan(l)],
                                ].map(([dt, dd]) => (
                                    <div key={dt} className="flex flex-col gap-0.5">
                                        <dt className="text-muted-foreground">{dt}</dt>
                                        <dd className="font-medium tabular-nums">{dd}</dd>
                                    </div>
                                ))}
                            </dl>
                            <div className="border-t px-6 py-3">
                                <Link href={route('manager.analisis')} tabIndex={kartu ? 0 : -1} className="text-sm font-medium text-primary hover:underline">
                                    Lihat di Analisis bisnis
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>

                <div aria-hidden={kartu} className={cn('overflow-hidden rounded-[calc(var(--radius)+2px)] border bg-card shadow-sm', lapis(!kartu))}>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Lapangan</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Pemasukan {bulan}</TableHead>
                                <TableHead className="text-right">Keterisian {bulan}</TableHead>
                                <TableHead className="text-right">Hari ini</TableHead>
                                <TableHead className="text-right">30 hari ke depan</TableHead>
                                <TableHead className="w-14">
                                    <span className="sr-only">Aksi</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {lapangan.map((l, i) => (
                                <TableRow key={l.idLapangan} {...masuk(!kartu, i)}>
                                    <TableCell>
                                        <span className="flex min-w-0 items-center gap-3">
                                            <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                                                <img src={IKON_LAPANGAN[l.jenisLapangan]} alt="" className="size-5 object-contain" />
                                            </span>
                                            <span className="flex min-w-0 flex-col">
                                                <span className="truncate font-medium">{l.namaLapangan}</span>
                                                <span className="truncate text-muted-foreground">
                                                    {l.jenisLapangan} · {formatRupiah(l.tarifPerJam)}/jam
                                                </span>
                                            </span>
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <BadgeTip tip={tipLapangan(l.status)}>
                                            <CourtStatusBadge status={l.status} />
                                        </BadgeTip>
                                    </TableCell>
                                    <TableCell className="text-right font-medium tabular-nums">{formatRupiah(l.pemasukan)}</TableCell>
                                    <TableCell className="text-right tabular-nums">{persen(l.terisi)}</TableCell>
                                    <TableCell className="text-right tabular-nums">{hariIni(l)}</TableCell>
                                    <TableCell className="text-right tabular-nums">{depan(l)}</TableCell>
                                    <TableCell className="text-right">
                                        <Tooltip>
                                            <TooltipTrigger
                                                render={
                                                    <Link
                                                        href={route('manager.analisis')}
                                                        tabIndex={kartu ? -1 : 0}
                                                        aria-label={`Lihat ${l.namaLapangan} di Analisis bisnis`}
                                                        className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'text-muted-foreground')}
                                                    />
                                                }
                                            >
                                                <ChartColumn />
                                            </TooltipTrigger>
                                            <TooltipContent className="text-sm">Lihat di Analisis bisnis</TooltipContent>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AdminSidebarLayout>
    );
}
