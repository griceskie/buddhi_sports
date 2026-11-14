import DeleteButton from '@/Components/DeleteButton';
import FormSheet, { SheetForm, useFormSheet } from '@/Components/FormSheet';
import InputError from '@/Components/InputError';
import PasswordInput from '@/Components/PasswordInput';
import { Button } from '@/Components/ui/button';
import { formatJam, formatTanggal } from '@/Components/ui/format';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/Components/ui/tooltip';
import JudulHalaman from '@/Components/pengelola/JudulHalaman';
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
import { KeyRound, Plus, Trash2 } from 'lucide-react';
import { FormEventHandler } from 'react';

type Admin = { idAdmin: number; namaAdmin: string; username: string; aktivitasTerakhir: string | null; pembayaran: number; laporan: number; booking: number };

const tercatat = (a: Admin) =>
    [
        [a.pembayaran, 'pembayaran'],
        [a.laporan, 'laporan'],
        [a.booking, 'booking'],
    ]
        .filter(([n]) => Number(n) > 0)
        .map(([n, l]) => `${n} ${l}`)
        .join(' · ');

export default function Admin({ admin }: { admin: Admin[] }) {
    // row null = tambah Admin, row terisi = reset password Admin itu
    const sheet = useFormSheet<Admin>();

    return (
        <AdminSidebarLayout header={<JudulHalaman judul="Data admin" deskripsi="Admin mengelola booking, pembayaran, dan laporan. Admin yang masih tercatat di data tidak bisa dihapus." />}>
            <Head title="Data admin" />

            <section aria-label="Daftar admin" className="flex flex-col gap-4">
                <div className="flex justify-end">
                    <Button onClick={() => sheet.buka()}>
                        <Plus />
                        Tambah admin
                    </Button>
                </div>
                <div className="overflow-hidden rounded-[calc(var(--radius)+2px)] border bg-card shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama</TableHead>
                                <TableHead>Username</TableHead>
                                <TableHead>Aktivitas terakhir</TableHead>
                                <TableHead>Tercatat di</TableHead>
                                <TableHead className="w-24">
                                    <span className="sr-only">Aksi</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {admin.map((a) => {
                                const dipakai = tercatat(a);
                                return (
                                    <TableRow key={a.idAdmin}>
                                        <TableCell>
                                            <span className="flex items-center gap-2.5">
                                                <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                                                    {a.namaAdmin.slice(0, 2).toUpperCase()}
                                                </span>
                                                <span className="font-medium">{a.namaAdmin}</span>
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{a.username}</TableCell>
                                        <TableCell className="text-muted-foreground tabular-nums">
                                            {a.aktivitasTerakhir ? `${formatTanggal(a.aktivitasTerakhir.slice(0, 10), 'd MMM yyyy')}, ${formatJam(a.aktivitasTerakhir.slice(11, 16))}` : 'Belum ada'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground tabular-nums">{dipakai || '—'}</TableCell>
                                        <TableCell className="text-right">
                                            <span className="inline-flex items-center gap-0.5">
                                                <Button variant="ghost" size="icon-sm" className="size-8 text-muted-foreground" aria-label={`Reset password ${a.namaAdmin}`} title="Reset password" onClick={() => sheet.buka(a)}>
                                                    <KeyRound />
                                                </Button>
                                                {dipakai ? (
                                                    <Tooltip>
                                                        <TooltipTrigger render={<span tabIndex={0} className="inline-flex size-8 cursor-not-allowed items-center justify-center rounded-md text-muted-foreground/50 outline-none focus-visible:ring-2 focus-visible:ring-ring" />}>
                                                            <Trash2 className="size-4" aria-label={`${a.namaAdmin} tidak bisa dihapus`} />
                                                        </TooltipTrigger>
                                                        <TooltipContent className="text-sm">Tidak bisa dihapus: masih tercatat di {dipakai}.</TooltipContent>
                                                    </Tooltip>
                                                ) : (
                                                    <DeleteButton href={route('manager.admin.hapus', a.idAdmin)} method="delete" label={`Hapus ${a.namaAdmin}`} message={`Hapus akun ${a.namaAdmin}? Admin ini belum tercatat di data mana pun.`} />
                                                )}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {admin.length === 0 && <TableEmpty colSpan={5}>Belum ada akun Admin.</TableEmpty>}
                        </TableBody>
                    </Table>
                </div>
            </section>

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
        <SheetForm title="Tambah admin" onSubmit={submit} processing={processing}>
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
