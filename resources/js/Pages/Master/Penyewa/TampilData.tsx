import DeleteButton from '@/Components/DeleteButton';
import FormSheet, { SheetForm, useFormSheet } from '@/Components/FormSheet';
import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
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
import { Head, useForm } from '@inertiajs/react';
import { Pencil, Plus } from 'lucide-react';
import { FormEventHandler } from 'react';

type Penyewa = {
    idPenyewa: number;
    namaPenyewa: string;
    noHp: string;
    email: string;
};

export default function TampilData({ datapenyewa }: { datapenyewa: Penyewa[] }) {
    const sheet = useFormSheet<Penyewa>();

    return (
        <AdminSidebarLayout
            header={
                <h2 className="text-xl leading-tight font-semibold text-foreground">
                    Data Penyewa
                </h2>
            }
        >
            <Head title="Data Penyewa" />

            <div className="mb-4">
                <Button onClick={() => sheet.buka()}>
                    <Plus />
                    Tambah Penyewa
                </Button>
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
                                        <Button variant="outline" size="sm" onClick={() => sheet.buka(row)}>
                                            <Pencil />
                                            Edit
                                        </Button>
                                        <DeleteButton href={`/deletepenyewa/${row.idPenyewa}`} />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {datapenyewa.length === 0 && <TableEmpty colSpan={4} />}
                    </TableBody>
                </Table>
            </Card>

            <FormSheet open={sheet.open} onClose={sheet.tutup}>
                <FormPenyewa key={sheet.versi} row={sheet.row} onDone={sheet.tutup} />
            </FormSheet>
        </AdminSidebarLayout>
    );
}

function FormPenyewa({ row, onDone }: { row: Penyewa | null; onDone: () => void }) {
    const { data, setData, post, processing, errors } = useForm({
        txtid: row?.idPenyewa ?? '',
        txtnama: row?.namaPenyewa ?? '',
        txtnohp: row?.noHp ?? '',
        txtemail: row?.email ?? '',
        txtpassword: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(row ? '/updatepenyewa' : '/insertpenyewa', {
            preserveState: true,
            preserveScroll: true,
            onSuccess: onDone,
        });
    };

    return (
        <SheetForm
            title={row ? 'Edit Penyewa' : 'Tambah Penyewa'}
            onSubmit={submit}
            processing={processing}
            submitLabel={row ? 'Simpan Perubahan' : 'Simpan'}
        >
            <div>
                <Label htmlFor="txtnama">Nama</Label>
                <Input
                    id="txtnama"
                    className="mt-1"
                    value={data.txtnama}
                    onChange={(e) => setData('txtnama', e.target.value)}
                />
                <InputError message={errors.txtnama} className="mt-1" />
            </div>

            <div>
                <Label htmlFor="txtnohp">No HP</Label>
                <Input
                    id="txtnohp"
                    className="mt-1"
                    value={data.txtnohp}
                    onChange={(e) => setData('txtnohp', e.target.value)}
                />
                <InputError message={errors.txtnohp} className="mt-1" />
            </div>

            <div>
                <Label htmlFor="txtemail">Email</Label>
                <Input
                    id="txtemail"
                    type="email"
                    className="mt-1"
                    value={data.txtemail}
                    onChange={(e) => setData('txtemail', e.target.value)}
                />
                <InputError message={errors.txtemail} className="mt-1" />
            </div>

            <div>
                <Label htmlFor="txtpassword">{row ? 'Password Baru (opsional)' : 'Password'}</Label>
                <Input
                    id="txtpassword"
                    type="password"
                    className="mt-1"
                    placeholder={row ? 'Biarkan kosong jika tidak diubah' : undefined}
                    value={data.txtpassword}
                    onChange={(e) => setData('txtpassword', e.target.value)}
                />
                <InputError message={errors.txtpassword} className="mt-1" />
            </div>
        </SheetForm>
    );
}
