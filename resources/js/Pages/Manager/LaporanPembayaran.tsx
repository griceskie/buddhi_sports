import TabelLaporan, { Laporan, MintaRevisi, TandaiDiperiksa } from '@/Components/manager/TabelLaporan';
import JudulHalaman from '@/Components/pengelola/JudulHalaman';
import { buttonVariants } from '@/Components/ui/button';
import { formatRupiah, formatTanggal } from '@/Components/ui/format';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import { Head } from '@inertiajs/react';
import { CircleAlert, FileText } from 'lucide-react';

export default function LaporanPembayaran({ laporan, menunggu }: { laporan: Laporan[]; menunggu: number | null }) {
    const tunggu = laporan.find((l) => l.idLaporan === menunggu);

    return (
        <AdminSidebarLayout
            header={<JudulHalaman judul="Laporan pembayaran" deskripsi="Periksa laporan bulanan dari Admin. Tandai diperiksa untuk menguncinya, atau minta revisi dengan catatan." />}
        >
            <Head title="Laporan Pembayaran" />

            {tunggu && (
                <div role="alert" className="grid grid-cols-[16px_minmax(0,1fr)] items-start gap-x-3 gap-y-3 rounded-lg border bg-card px-4 py-3 md:grid-cols-[16px_minmax(0,1fr)_auto]">
                    <CircleAlert className="mt-0.5 size-4 text-accessible-orange" aria-hidden />
                    <div className="flex min-w-0 flex-col gap-1">
                        <span className="font-medium">{tunggu.namaLaporan ?? 'Laporan'} menunggu Anda periksa</span>
                        <span className="text-muted-foreground">
                            Dibuat {tunggu.namaAdmin ?? 'Admin'} pada {formatTanggal(tunggu.tglLaporan, 'd MMM yyyy')}. Total pemasukan {formatRupiah(tunggu.totalPemasukan)}.
                        </span>
                    </div>
                    <div className="col-start-2 flex flex-wrap gap-2 self-center md:col-start-3">
                        <a href={route('laporan.pdf', tunggu.idLaporan)} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                            <FileText />
                            Buka PDF
                        </a>
                        <MintaRevisi laporan={tunggu} />
                        <TandaiDiperiksa laporan={tunggu} />
                    </div>
                </div>
            )}

            <section aria-label="Daftar laporan" className="overflow-hidden rounded-[calc(var(--radius)+2px)] border bg-card shadow-sm">
                <TabelLaporan laporan={laporan} />
            </section>
        </AdminSidebarLayout>
    );
}
