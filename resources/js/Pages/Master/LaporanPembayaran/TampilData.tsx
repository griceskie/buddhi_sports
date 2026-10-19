import DeleteButton from '@/Components/DeleteButton';
import FlashMessage from '@/Components/FlashMessage';
import { buttonVariants } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import { BULAN, formatRupiah } from '@/Components/ui/format';
import {
    Table,
    TableBody,
    TableCell,
    TableEmpty,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { Pencil, Plus } from 'lucide-react';

type Laporan = {
    idLaporan: number;
    idAdmin: number;
    idManager: number;
    bulan: number;
    tahun: number;
    totalPemasukan: number;
    tglLaporan: string;
    idPembayaran: number | null;
};

export default function TampilData({ datalaporan }: { datalaporan: Laporan[] }) {
    return (
        <AdminLayout
            header={
                <h2 className="text-xl leading-tight font-semibold text-foreground">
                    Data Laporan Pembayaran
                </h2>
            }
        >
            <Head title="Data Laporan Pembayaran" />

            <FlashMessage />

            <div className="mb-4">
                <Link href="/formlaporanpembayaran" className={buttonVariants()}>
                    <Plus />
                    Tambah Laporan
                </Link>
            </div>

            <Card className="gap-0 overflow-hidden py-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Bulan</TableHead>
                            <TableHead>Tahun</TableHead>
                            <TableHead>Total Pemasukan</TableHead>
                            <TableHead>Tgl Laporan</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {datalaporan.map((row) => (
                            <TableRow key={row.idLaporan}>
                                <TableCell>{BULAN[row.bulan - 1] ?? row.bulan}</TableCell>
                                <TableCell>{row.tahun}</TableCell>
                                <TableCell>{formatRupiah(row.totalPemasukan)}</TableCell>
                                <TableCell>{row.tglLaporan}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Link
                                            href={`/editlaporanpembayaran/${row.idLaporan}`}
                                            className={buttonVariants({
                                                variant: 'outline',
                                                size: 'sm',
                                            })}
                                        >
                                            <Pencil />
                                            Edit
                                        </Link>
                                        <DeleteButton href={`/deletelaporanpembayaran/${row.idLaporan}`} />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {datalaporan.length === 0 && <TableEmpty colSpan={5} />}
                    </TableBody>
                </Table>
            </Card>
        </AdminLayout>
    );
}
