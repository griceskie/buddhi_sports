import DeleteButton from '@/Components/DeleteButton';
import FlashMessage from '@/Components/FlashMessage';
import { CourtStatusBadge } from '@/Components/ui/badge';
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

type Lapangan = {
    idLapangan: number;
    namaLapangan: string;
    jenisLapangan: string;
    tarifPerJam: number;
    status: string;
};

export default function TampilData({ datalapangan }: { datalapangan: Lapangan[] }) {
    return (
        <AdminLayout
            header={
                <h2 className="text-xl leading-tight font-semibold text-foreground">
                    Data Lapangan
                </h2>
            }
        >
            <Head title="Data Lapangan" />

            <FlashMessage />

            <div className="mb-4">
                <Link href="/formlapangan" className={buttonVariants()}>
                    <Plus />
                    Tambah Lapangan
                </Link>
            </div>

            <Card className="gap-0 overflow-hidden py-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>Jenis</TableHead>
                            <TableHead>Tarif/Jam</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {datalapangan.map((row) => (
                            <TableRow key={row.idLapangan}>
                                <TableCell>{row.namaLapangan}</TableCell>
                                <TableCell>{row.jenisLapangan}</TableCell>
                                <TableCell>{formatRupiah(row.tarifPerJam)}</TableCell>
                                <TableCell><CourtStatusBadge status={row.status} /></TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Link
                                            href={`/editlapangan/${row.idLapangan}`}
                                            className={buttonVariants({
                                                variant: 'outline',
                                                size: 'sm',
                                            })}
                                        >
                                            <Pencil />
                                            Edit
                                        </Link>
                                        <DeleteButton href={`/deletelapangan/${row.idLapangan}`} />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {datalapangan.length === 0 && <TableEmpty colSpan={5} />}
                    </TableBody>
                </Table>
            </Card>
        </AdminLayout>
    );
}
