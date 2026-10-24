import { CourtStatusBadge } from '@/Components/ui/badge';
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
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import { Head } from '@inertiajs/react';

type Lapangan = {
    idLapangan: number;
    namaLapangan: string;
    jenisLapangan: string;
    tarifPerJam: number;
    status: string;
};

export default function Lapangan({ lapangan }: { lapangan: Lapangan[] }) {
    return (
        <AdminSidebarLayout>
            <Head title="Lapangan" />

            <div className="grid gap-6">
                <div>
                    <h1 className="text-xl leading-7 font-semibold tracking-tight">Lapangan</h1>
                    <p className="mt-0.5 text-muted-foreground">Data lapangan dikelola Admin.</p>
                </div>

                <Card className="min-w-0 gap-0 overflow-hidden py-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama</TableHead>
                                <TableHead>Jenis</TableHead>
                                <TableHead>Tarif/Jam</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {lapangan.map((l) => (
                                <TableRow key={l.idLapangan}>
                                    <TableCell className="font-medium">{l.namaLapangan}</TableCell>
                                    <TableCell>{l.jenisLapangan}</TableCell>
                                    <TableCell className="tabular-nums">{formatRupiah(l.tarifPerJam)}</TableCell>
                                    <TableCell>
                                        <CourtStatusBadge status={l.status} />
                                    </TableCell>
                                </TableRow>
                            ))}
                            {lapangan.length === 0 && <TableEmpty colSpan={4} />}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </AdminSidebarLayout>
    );
}
