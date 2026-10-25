import TabelLaporan, { Laporan } from '@/Components/manager/TabelLaporan';
import { Card } from '@/Components/ui/card';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import { Head } from '@inertiajs/react';

export default function LaporanPembayaran({ laporan }: { laporan: Laporan[] }) {
    return (
        <AdminSidebarLayout>
            <Head title="Laporan Pembayaran" />

            <div className="grid gap-6">
                <div>
                    <h1 className="text-xl leading-7 font-semibold tracking-tight">Laporan Pembayaran</h1>
                    <p className="mt-0.5 text-muted-foreground">Dibuat Admin sebulan sekali. Buka atau unduh PDF-nya, lalu tandai sudah diperiksa.</p>
                </div>

                <Card className="min-w-0 gap-0 overflow-hidden py-0">
                    <TabelLaporan laporan={laporan} />
                </Card>
            </div>
        </AdminSidebarLayout>
    );
}
