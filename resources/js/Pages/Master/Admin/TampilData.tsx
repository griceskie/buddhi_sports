import DeleteButton from '@/Components/DeleteButton';
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

type Admin = {
    idAdmin: number;
    namaAdmin: string;
    username: string;
};

export default function TampilData({ dataadmin }: { dataadmin: Admin[] }) {
    return (
        <AdminLayout
            header={
                <h2 className="text-xl leading-tight font-semibold text-foreground">
                    Data Admin
                </h2>
            }
        >
            <Head title="Data Admin" />

            <div className="mb-4">
                <Link href="/formadmin" className={buttonVariants()}>
                    <Plus />
                    Tambah Admin
                </Link>
            </div>

            <Card className="gap-0 overflow-hidden py-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>Username</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {dataadmin.map((row) => (
                            <TableRow key={row.idAdmin}>
                                <TableCell>{row.namaAdmin}</TableCell>
                                <TableCell>{row.username}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Link
                                            href={`/editadmin/${row.idAdmin}`}
                                            className={buttonVariants({
                                                variant: 'outline',
                                                size: 'sm',
                                            })}
                                        >
                                            <Pencil />
                                            Edit
                                        </Link>
                                        <DeleteButton href={`/deleteadmin/${row.idAdmin}`} />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {dataadmin.length === 0 && <TableEmpty colSpan={3} />}
                    </TableBody>
                </Table>
            </Card>
        </AdminLayout>
    );
}
