import DeleteButton from '@/Components/DeleteButton';
import FlashMessage from '@/Components/FlashMessage';
import { BookingStatusBadge } from '@/Components/ui/badge';
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

type Booking = {
    idBooking: number;
    idPenyewa: number;
    idLapangan: number;
    idAdmin: number | null;
    tanggal: string;
    jamMulai: string;
    jamSelesai: string;
    totalBayar: number;
    status: string;
};

export default function TampilData({ databooking }: { databooking: Booking[] }) {
    return (
        <AdminLayout
            header={
                <h2 className="text-xl leading-tight font-semibold text-foreground">
                    Data Booking
                </h2>
            }
        >
            <Head title="Data Booking" />

            <FlashMessage />

            <div className="mb-4">
                <Link href="/formbooking" className={buttonVariants()}>
                    <Plus />
                    Tambah Booking
                </Link>
            </div>

            <Card className="gap-0 overflow-hidden py-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID Penyewa</TableHead>
                            <TableHead>ID Lapangan</TableHead>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Jam</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {databooking.map((row) => (
                            <TableRow key={row.idBooking}>
                                <TableCell>{row.idPenyewa}</TableCell>
                                <TableCell>{row.idLapangan}</TableCell>
                                <TableCell>{row.tanggal}</TableCell>
                                <TableCell>{row.jamMulai.slice(0, 5)}-{row.jamSelesai.slice(0, 5)}</TableCell>
                                <TableCell>{formatRupiah(row.totalBayar)}</TableCell>
                                <TableCell><BookingStatusBadge status={row.status} /></TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Link
                                            href={`/editbooking/${row.idBooking}`}
                                            className={buttonVariants({
                                                variant: 'outline',
                                                size: 'sm',
                                            })}
                                        >
                                            <Pencil />
                                            Edit
                                        </Link>
                                        <DeleteButton href={`/deletebooking/${row.idBooking}`} />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {databooking.length === 0 && <TableEmpty colSpan={7} />}
                    </TableBody>
                </Table>
            </Card>
        </AdminLayout>
    );
}
