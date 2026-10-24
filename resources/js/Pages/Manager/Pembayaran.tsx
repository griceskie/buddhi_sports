import { useFormSheet } from '@/Components/FormSheet';
import RingkasanPembayaran, { Ringkasan } from '@/Components/RingkasanPembayaran';
import { PaymentStatusBadge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { formatRupiah, formatTanggal } from '@/Components/ui/format';
import { Label } from '@/Components/ui/label';
import { Period, PeriodPicker } from '@/Components/ui/period-picker';
import { ProofPreview } from '@/Components/ui/proof-review';
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/Components/ui/sheet';
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
import { Head, router } from '@inertiajs/react';
import { Eye } from 'lucide-react';

type Pembayaran = {
    idPembayaran: number;
    idBooking: number;
    kode: string;
    namaPenyewa: string;
    namaLapangan: string;
    tglBayar: string;
    jumlahBayar: number;
    totalBayar: number;
    status: string;
    alasanTolak: string | null;
    buktiBayar: string | null;
    buktiPdf: boolean;
};

export default function Pembayaran({
    periode,
    ringkasan,
    pembayaran,
}: {
    periode: Period;
    ringkasan: Ringkasan;
    pembayaran: Pembayaran[];
}) {
    const sheet = useFormSheet<Pembayaran>();
    const dilihat = sheet.row;

    const ubahPeriode = (p: Period) =>
        router.get(
            route('manager.pembayaran'),
            { periode: `${p.tahun}-${String(p.bulan).padStart(2, '0')}` },
            { preserveScroll: true, preserveState: true, replace: true },
        );

    return (
        <AdminSidebarLayout>
            <Head title="Pembayaran" />

            <div className="grid gap-6">
                <div>
                    <h1 className="text-xl leading-7 font-semibold tracking-tight">Pembayaran</h1>
                    <p className="mt-0.5 text-muted-foreground">Verifikasi pembayaran dilakukan Admin.</p>
                </div>

                <Card>
                    <CardContent className="grid gap-4">
                        <div className="grid w-fit gap-1.5">
                            <Label>Periode</Label>
                            <PeriodPicker value={periode} onValueChange={ubahPeriode} />
                        </div>
                        <RingkasanPembayaran ringkasan={ringkasan} />
                    </CardContent>
                </Card>

                <Card className="min-w-0 gap-0 overflow-hidden py-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Kode</TableHead>
                                <TableHead>Penyewa</TableHead>
                                <TableHead>Lapangan</TableHead>
                                <TableHead>Tgl Bayar</TableHead>
                                <TableHead>Jumlah</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Bukti</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pembayaran.map((p) => (
                                <TableRow key={p.idPembayaran}>
                                    <TableCell className="text-muted-foreground">{p.kode}</TableCell>
                                    <TableCell className="font-medium">{p.namaPenyewa}</TableCell>
                                    <TableCell>{p.namaLapangan}</TableCell>
                                    <TableCell>{formatTanggal(p.tglBayar, 'd MMM yyyy')}</TableCell>
                                    <TableCell className="tabular-nums">{formatRupiah(p.jumlahBayar)}</TableCell>
                                    <TableCell>
                                        <PaymentStatusBadge status={p.status} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => sheet.buka(p)}>
                                            <Eye />
                                            Lihat
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {pembayaran.length === 0 && <TableEmpty colSpan={7}>Belum ada pembayaran di periode ini.</TableEmpty>}
                        </TableBody>
                    </Table>
                </Card>
            </div>

            <Sheet open={sheet.open} onOpenChange={(buka) => !buka && sheet.tutup()}>
                <SheetContent className="sm:max-w-lg">
                    {dilihat && (
                        <>
                            <SheetHeader>
                                <SheetTitle>Bukti pembayaran</SheetTitle>
                                <SheetDescription>
                                    {dilihat.kode} · {dilihat.namaPenyewa} · {dilihat.namaLapangan}
                                </SheetDescription>
                            </SheetHeader>
                            <SheetBody className="grid content-start gap-5 pb-4">
                                <ProofPreview src={dilihat.buktiBayar} pdf={dilihat.buktiPdf} />
                                <dl className="grid gap-2 text-sm">
                                    {[
                                        ['Status', <PaymentStatusBadge key="s" status={dilihat.status} />],
                                        ['Tanggal bayar', formatTanggal(dilihat.tglBayar, 'd MMMM yyyy')],
                                        ['Total booking', formatRupiah(dilihat.totalBayar)],
                                        ['Jumlah dibayar', formatRupiah(dilihat.jumlahBayar)],
                                    ].map(([label, nilai]) => (
                                        <div key={String(label)} className="flex items-baseline justify-between gap-4">
                                            <dt className="text-muted-foreground">{label}</dt>
                                            <dd className="text-right font-medium tabular-nums">{nilai}</dd>
                                        </div>
                                    ))}
                                </dl>
                                {dilihat.alasanTolak && (
                                    <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                                        Alasan ditolak: {dilihat.alasanTolak}
                                    </p>
                                )}
                            </SheetBody>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </AdminSidebarLayout>
    );
}
