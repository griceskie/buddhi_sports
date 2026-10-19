import DeleteButton from '@/Components/DeleteButton';
import FlashMessage from '@/Components/FlashMessage';
import { buttonVariants } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
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

type Penyewa = {
    idPenyewa: number;
    namaPenyewa: string;
    noHp: string;
    email: string;
};

export default function TampilData({ datapenyewa }: { datapenyewa: Penyewa[] }) {
    return (
        <AdminLayout
            header={
                <h2 className="text-xl leading-tight font-semibold text-foreground">
                    Data Penyewa
                </h2>
            }
        >
            <Head title="Data Penyewa" />

            <FlashMessage />

            <div className="mb-4">
                <Link href="/formpenyewa" className={buttonVariants()}>
                    <Plus />
                    Tambah Penyewa
                </Link>
            </div>

            <Card className="gap-0 overflow-hidden py-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>No HP</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {datapenyewa.map((row) => (
                            <TableRow key={row.idPenyewa}>
                                <TableCell>{row.namaPenyewa}</TableCell>
                                <TableCell>{row.noHp}</TableCell>
                                <TableCell>{row.email}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Link
                                            href={`/editpenyewa/${row.idPenyewa}`}
                                            className={buttonVariants({
                                                variant: 'outline',
                                                size: 'sm',
                                            })}
                                        >
                                            <Pencil />
                                            Edit
                                        </Link>
                                        <DeleteButton href={`/deletepenyewa/${row.idPenyewa}`} />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {datapenyewa.length === 0 && <TableEmpty colSpan={4} />}
                    </TableBody>
                </Table>
            </Card>
        </AdminLayout>
    );
}
