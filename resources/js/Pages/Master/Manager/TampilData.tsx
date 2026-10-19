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

type Manager = {
    idManager: number;
    namaManager: string;
    username: string;
};

export default function TampilData({ datamanager }: { datamanager: Manager[] }) {
    return (
        <AdminLayout
            header={
                <h2 className="text-xl leading-tight font-semibold text-foreground">
                    Data Manager
                </h2>
            }
        >
            <Head title="Data Manager" />

            <FlashMessage />

            <div className="mb-4">
                <Link href="/formmanager" className={buttonVariants()}>
                    <Plus />
                    Tambah Manager
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
                        {datamanager.map((row) => (
                            <TableRow key={row.idManager}>
                                <TableCell>{row.namaManager}</TableCell>
                                <TableCell>{row.username}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Link
                                            href={`/editmanager/${row.idManager}`}
                                            className={buttonVariants({
                                                variant: 'outline',
                                                size: 'sm',
                                            })}
                                        >
                                            <Pencil />
                                            Edit
                                        </Link>
                                        <DeleteButton href={`/deletemanager/${row.idManager}`} />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {datamanager.length === 0 && <TableEmpty colSpan={3} />}
                    </TableBody>
                </Table>
            </Card>
        </AdminLayout>
    );
}
