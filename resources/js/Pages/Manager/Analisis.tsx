import { Tujuan } from '@/Components/manager/analisis/bagian';
import PemilihPeriode, { Periode, Pilihan } from '@/Components/manager/analisis/PemilihPeriode';
import TabAdmin, { DataAdmin } from '@/Components/manager/analisis/TabAdmin';
import TabPendapatan, { DataPendapatan } from '@/Components/manager/analisis/TabPendapatan';
import TabPenyewa, { DataPenyewa } from '@/Components/manager/analisis/TabPenyewa';
import TabPola, { DataPola } from '@/Components/manager/analisis/TabPola';
import { Badge } from '@/Components/ui/badge';
import { Tabs, TabsIndicator, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/Components/ui/tooltip';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import { Head, router } from '@inertiajs/react';
import { cn } from 'cn';
import { Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

const TAB = [
    ['pendapatan', 'Pendapatan'],
    ['penyewa', 'Penyewa'],
    ['pola', 'Pola booking'],
    ['admin', 'Kinerja Admin'],
] as const;

type Props = {
    periode: Periode;
    pilihan: Pilihan;
    judul: string;
    deskripsi: string;
    belumFinal: string | null;
    rentangTeks: string;
    data: DataPendapatan | DataPenyewa | DataPola | DataAdmin;
};

/** Analisis bisnis Manager: satu periode untuk empat tab. Periode dan tab disimpan di URL; angka dihitung server (AnalitikBisnis). */
export default function Analisis({ periode, pilihan, judul, deskripsi, belumFinal, rentangTeks, data }: Props) {
    const [memuat, setMemuat] = useState(false);
    useEffect(() => router.on('finish', () => setMemuat(false)), []);

    const kunjungi = (ubah: Partial<Periode> | Tujuan) => {
        const p = { ...periode, ...ubah } as Periode;
        const query: Record<string, string | number> = { jenis: p.jenis, tab: p.tab };
        if (p.jenis === 'bulan') Object.assign(query, { th: p.th, bl: p.bl });
        if (p.jenis === 'kuartal') Object.assign(query, { th: p.th, q: p.q });
        if (p.jenis === 'tahun') query.th = p.th;
        if (p.jenis === 'rentang') {
            query.rentang = p.rentang;
            if (p.rentang === 'pilih' && p.dari && p.sampai) Object.assign(query, { dari: p.dari, sampai: p.sampai });
        }
        setMemuat(true);
        router.get(route('manager.analisis'), query, { preserveScroll: true, preserveState: true });
    };
    const kunciPeriode = `${periode.jenis}-${periode.th}-${periode.bl}-${periode.q}-${periode.rentang}-${periode.dari}-${periode.sampai}`;

    return (
        <AdminSidebarLayout>
            <Head title="Analisis bisnis" />

            {/* contain: grafik dan peta yang lebar tidak boleh melebarkan layout (lebarnya diatur scroll di masing-masing) */}
            <div className="flex flex-col gap-6 [contain:inline-size]">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                    <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-0.5">
                        <h2 className="text-xl font-medium">
                            {judul}
                            {belumFinal && (
                                <Tooltip>
                                    <TooltipTrigger render={<span tabIndex={0} className="ml-2.5 inline-flex rounded-full align-[3px] outline-none focus-visible:ring-2 focus-visible:ring-ring" />}>
                                        <Badge data-nada="oranye" className="gap-1">
                                            <Clock className="size-3" aria-hidden />
                                            Belum final
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-[300px] text-sm">{belumFinal}</TooltipContent>
                                </Tooltip>
                            )}
                        </h2>
                        <span title={deskripsi} className="truncate text-muted-foreground">
                            {deskripsi}
                        </span>
                    </div>
                    <PemilihPeriode periode={periode} pilihan={pilihan} rentangTeks={rentangTeks} onUbah={kunjungi} />
                </div>

                <Tabs value={periode.tab} onValueChange={(v) => kunjungi({ tab: String(v) })} className="-mt-2">
                    <TabsList variant="line" aria-label="Bagian analisis" className="relative w-full justify-start gap-6 overflow-x-auto border-b group-data-horizontal/tabs:h-11">
                        {TAB.map(([k, l]) => (
                            <TabsTrigger key={k} value={k} className="flex-none px-0 text-base after:hidden">
                                {l}
                            </TabsTrigger>
                        ))}
                        <TabsIndicator className="-bottom-px" />
                    </TabsList>
                </Tabs>

                <div aria-busy={memuat} className={cn('flex flex-col gap-6 transition-opacity', memuat && 'opacity-60')}>
                    {periode.tab === 'penyewa' ? (
                        <TabPenyewa data={data as DataPenyewa} onPilih={kunjungi} />
                    ) : periode.tab === 'pola' ? (
                        <TabPola key={kunciPeriode} data={data as DataPola} />
                    ) : periode.tab === 'admin' ? (
                        <TabAdmin data={data as DataAdmin} onPilih={kunjungi} />
                    ) : (
                        <TabPendapatan data={data as DataPendapatan} onPilih={kunjungi} />
                    )}
                </div>
            </div>
        </AdminSidebarLayout>
    );
}
