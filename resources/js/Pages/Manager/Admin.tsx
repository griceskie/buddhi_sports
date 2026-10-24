import DeleteButton from '@/Components/DeleteButton';
import FormSheet, { SheetForm, useFormSheet } from '@/Components/FormSheet';
import InputError from '@/Components/InputError';
import PasswordInput from '@/Components/PasswordInput';
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
import { KeyRound, Plus } from 'lucide-react';
import { FormEventHandler } from 'react';

type Admin = { idAdmin: number; namaAdmin: string; username: string };

export default function Admin({ admin }: { admin: Admin[] }) {
    // row null = tambah Admin, row terisi = reset password Admin itu
    const sheet = useFormSheet<Admin>();

    return (
        <AdminSidebarLayout>
            <Head title="Akun Admin" />

            <div className="grid gap-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-xl leading-7 font-semibold tracking-tight">Akun Admin</h1>
                        <p className="mt-0.5 text-muted-foreground">Admin mengelola booking, pembayaran, dan laporan.</p>
                    </div>
                    <Button onClick={() => sheet.buka()}>
                        <Plus />
                        Tambah Admin
                    </Button>
                </div>

                <Card className="min-w-0 gap-0 overflow-hidden py-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama</TableHead>
                                <TableHead>Username</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {admin.map((a) => (
                                <TableRow key={a.idAdmin}>
                                    <TableCell className="font-medium">{a.namaAdmin}</TableCell>
                                    <TableCell>{a.username}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="sm" onClick={() => sheet.buka(a)}>
                                                <KeyRound />
                                                Reset password
                                            </Button>
                                            <DeleteButton
                                                href={route('manager.admin.hapus', a.idAdmin)}
                                                method="delete"
                                                message={`Hapus akun ${a.namaAdmin}? Admin yang sudah tercatat di booking, pembayaran, atau laporan tidak bisa dihapus.`}
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {admin.length === 0 && <TableEmpty colSpan={3}>Belum ada akun Admin.</TableEmpty>}
                        </TableBody>
                    </Table>
                </Card>
            </div>

            <FormSheet open={sheet.open} onClose={sheet.tutup}>
                {sheet.row ? (
                    <FormResetPassword key={sheet.versi} admin={sheet.row} onDone={sheet.tutup} />
                ) : (
                    <FormTambahAdmin key={sheet.versi} onDone={sheet.tutup} />
                )}
            </FormSheet>
        </AdminSidebarLayout>
    );
}

function FormTambahAdmin({ onDone }: { onDone: () => void }) {
    const { data, setData, post, processing, errors } = useForm({ nama: '', username: '', password: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('manager.admin.tambah'), { preserveState: true, preserveScroll: true, onSuccess: onDone });
    };

    return (
        <SheetForm title="Tambah Admin" onSubmit={submit} processing={processing}>
            <div>
                <Label htmlFor="nama">Nama</Label>
                <Input id="nama" className="mt-1" value={data.nama} onChange={(e) => setData('nama', e.target.value)} />
                <InputError message={errors.nama} className="mt-1" />
            </div>

            <div>
                <Label htmlFor="username">Username</Label>
                <Input
                    id="username"
                    className="mt-1"
                    autoComplete="off"
                    value={data.username}
                    onChange={(e) => setData('username', e.target.value)}
                />
                <InputError message={errors.username} className="mt-1" />
            </div>

            <div>
                <Label htmlFor="password">Password</Label>
                <div className="mt-1">
                    <PasswordInput
                        id="password"
                        autoComplete="new-password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                    />
                </div>
                <InputError message={errors.password} className="mt-1" />
            </div>
        </SheetForm>
    );
}

function FormResetPassword({ admin, onDone }: { admin: Admin; onDone: () => void }) {
    const { data, setData, put, processing, errors } = useForm({ password: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('manager.admin.password', admin.idAdmin), { preserveState: true, preserveScroll: true, onSuccess: onDone });
    };

    return (
        <SheetForm
            title="Reset password"
            description={`${admin.namaAdmin} (${admin.username}). Beri tahu password baru ini ke Admin yang bersangkutan.`}
            onSubmit={submit}
            processing={processing}
            submitLabel="Simpan password"
        >
            <div>
                <Label htmlFor="password">Password baru</Label>
                <div className="mt-1">
                    <PasswordInput
                        id="password"
                        autoComplete="new-password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                    />
                </div>
                <InputError message={errors.password} className="mt-1" />
            </div>
        </SheetForm>
    );
}
