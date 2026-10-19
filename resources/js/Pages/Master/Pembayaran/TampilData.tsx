import DeleteButton from '@/Components/DeleteButton';
import FlashMessage from '@/Components/FlashMessage';
import { PaymentStatusBadge } from '@/Components/ui/badge';
import { buttonVariants } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import { formatRupiah } from '@/Components/ui/format';
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

type Pembayaran = {
    idPembayaran: number;
    idAdmin: number | null;
    idBooking: number;
    tglBayar: string;
    jumlahBayar: number;
    buktiBayar: string | null;
    status: string;
};

export default function TampilData({ datapembayaran }: { datapembayaran: Pembayaran[] }) {
    return (
        <AdminLayout
            header={
                <h2 className="text-xl leading-tight font-semibold text-foreground">
                    Data Pembayaran
                </h2>
            }
        >
            <Head title="Data Pembayaran" />

            <FlashMessage />

            <div className="mb-4">
                <Link href="/formpembayaran" className={buttonVariants()}>
                    <Plus />
                    Tambah Pembayaran
                </Link>
            </div>

            <Card className="gap-0 overflow-hidden py-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID Booking</TableHead>
                            <TableHead>Tgl Bayar</TableHead>
                            <TableHead>Jumlah</TableHead>
                            <TableHead>Bukti</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {datapembayaran.map((row) => (
                            <TableRow key={row.idPembayaran}>
                                <TableCell>{row.idBooking}</TableCell>
                                <TableCell>{row.tglBayar}</TableCell>
                                <TableCell>{formatRupiah(row.jumlahBayar)}</TableCell>
                                <TableCell>{row.buktiBayar ?? '-'}</TableCell>
                                <TableCell><PaymentStatusBadge status={row.status} /></TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Link
                                            href={`/editpembayaran/${row.idPembayaran}`}
                                            className={buttonVariants({
                                                variant: 'outline',
                                                size: 'sm',
                                            })}
                                        >
                                            <Pencil />
                                            Edit
                                        </Link>
                                        <DeleteButton href={`/deletepembayaran/${row.idPembayaran}`} />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {datapembayaran.length === 0 && <TableEmpty colSpan={6} />}
                    </TableBody>
                </Table>
            </Card>
        </AdminLayout>
    );
}
