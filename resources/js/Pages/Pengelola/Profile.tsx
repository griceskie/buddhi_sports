import FormSheet, { SheetForm, useFormSheet } from '@/Components/FormSheet';
import InputError from '@/Components/InputError';
import PasswordInput from '@/Components/PasswordInput';
import JudulHalaman from '@/Components/pengelola/JudulHalaman';
import { buttonVariants } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/Components/ui/tooltip';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import { PageProps } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { cn } from 'cn';
import { KeyRound, Pencil, ShieldCheck } from 'lucide-react';
import { FormEventHandler, ReactNode } from 'react';

const PERAN = {
    admin: {
        label: 'Admin',
        tugas: 'Mengelola booking, memverifikasi bukti bayar, dan membuat laporan bulanan.',
        lupa: 'Lupa password? Minta Manager mereset password Anda dari halaman Data admin.',
    },
    manager: {
        label: 'Manager',
        tugas: 'Memeriksa laporan bulanan, memantau pemasukan, dan mengelola akun Admin.',
        lupa: 'Password Manager tidak bisa direset dari aplikasi. Simpan password Anda di tempat yang aman.',
    },
};

/** Profile Admin dan Manager (artboard Admin-Profil / Manager-Profil): kartu akun, kartu keamanan, ubah lewat sheet. */
export default function Profile() {
    const pengelola = usePage<PageProps>().props.pengelola!;
    const peran = PERAN[pengelola.role === 'manager' ? 'manager' : 'admin'];
    const sheet = useFormSheet<'profil' | 'password'>();
    const inisial = pengelola.nama
        .split(/\s+/)
        .slice(0, 2)
        .map((k) => k[0])
        .join('')
        .toUpperCase();

    return (
        <AdminSidebarLayout header={<JudulHalaman judul="Profile" />}>
            <Head title="Profile" />

            <section aria-labelledby="judul-akun" className="flex flex-col rounded-xl border bg-card shadow-sm">
                <div className="flex flex-wrap items-center gap-4 p-6">
                    <span aria-hidden className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
                        {inisial}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <h2 id="judul-akun" className="truncate text-xl font-semibold">
                            {pengelola.nama}
                        </h2>
                        <Tooltip>
                            <TooltipTrigger
                                render={
                                    <span
                                        tabIndex={0}
                                        className="inline-flex h-[22px] items-center gap-1 self-start rounded-full bg-muted px-2 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    />
                                }
                            >
                                <ShieldCheck className="size-3 text-muted-foreground" aria-hidden />
                                {peran.label}
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[300px] text-sm">{peran.tugas}</TooltipContent>
                        </Tooltip>
                    </div>
                    <button type="button" className={buttonVariants({ variant: 'outline', size: 'sm' })} onClick={() => sheet.buka('profil')}>
                        <Pencil />
                        Ubah profile
                    </button>
                </div>
                <Baris judul="Username" ket="Dipakai untuk masuk di halaman login pengelola.">
                    <span className="font-medium whitespace-nowrap">{pengelola.username}</span>
                </Baris>
            </section>

            <section aria-labelledby="judul-aman" className="flex flex-col rounded-xl border bg-card shadow-sm">
                <h2 id="judul-aman" className="px-6 py-5 text-base font-semibold">
                    Keamanan
                </h2>
                <Baris judul="Password" ket="Ganti bila ada orang lain yang mungkin tahu password Anda.">
                    <button type="button" className={buttonVariants({ variant: 'outline', size: 'sm' })} onClick={() => sheet.buka('password')}>
                        <KeyRound />
                        Ganti password
                    </button>
                </Baris>
                <p className="border-t px-6 py-3.5 text-muted-foreground">{peran.lupa}</p>
            </section>

            <FormSheet open={sheet.open} onClose={sheet.tutup}>
                {sheet.row === 'password' ? <FormPassword key={sheet.versi} onDone={sheet.tutup} /> : <FormProfil key={sheet.versi} onDone={sheet.tutup} />}
            </FormSheet>
        </AdminSidebarLayout>
    );
}

function Baris({ judul, ket, children, className }: { judul: string; ket: string; children: ReactNode; className?: string }) {
    return (
        <div className={cn('flex min-h-[76px] flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t px-6 py-4', className)}>
            <span className="flex min-w-0 flex-col gap-0.5">
                <span className="font-medium">{judul}</span>
                <span className="text-muted-foreground">{ket}</span>
            </span>
            {children}
        </div>
    );
}

function FormProfil({ onDone }: { onDone: () => void }) {
    const pengelola = usePage<PageProps>().props.pengelola!;
    const { data, setData, patch, errors, processing } = useForm({ nama: pengelola.nama, username: pengelola.username });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('profile.pengelola.update'), { preserveScroll: true, onSuccess: onDone });
    };

    return (
        <SheetForm title="Ubah profile" description="Nama tampil di panel dan Log aktivitas. Username dipakai untuk masuk." onSubmit={submit} processing={processing}>
            <div className="grid gap-2">
                <Label htmlFor="nama">Nama</Label>
                <Input id="nama" value={data.nama} onChange={(e) => setData('nama', e.target.value)} aria-invalid={!!errors.nama} required />
                <InputError message={errors.nama} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" autoComplete="username" value={data.username} onChange={(e) => setData('username', e.target.value)} aria-invalid={!!errors.username} required />
                <InputError message={errors.username} />
            </div>
        </SheetForm>
    );
}

function FormPassword({ onDone }: { onDone: () => void }) {
    const { data, setData, put, errors, processing, reset } = useForm({ current_password: '', password: '', password_confirmation: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('profile.pengelola.password'), { preserveScroll: true, onSuccess: onDone, onError: () => reset('password', 'password_confirmation') });
    };

    return (
        <SheetForm title="Ganti password" description="Masukkan password saat ini, lalu password baru dua kali." onSubmit={submit} processing={processing} submitLabel="Ganti password">
            <div className="grid gap-2">
                <Label htmlFor="current_password">Password saat ini</Label>
                <PasswordInput id="current_password" autoComplete="current-password" value={data.current_password} onChange={(e) => setData('current_password', e.target.value)} />
                <InputError message={errors.current_password} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="password">Password baru</Label>
                <PasswordInput id="password" autoComplete="new-password" value={data.password} onChange={(e) => setData('password', e.target.value)} />
                {errors.password ? <InputError message={errors.password} /> : <span className="text-sm text-muted-foreground">Minimal 8 karakter.</span>}
            </div>
            <div className="grid gap-2">
                <Label htmlFor="password_confirmation">Ulangi password baru</Label>
                <PasswordInput id="password_confirmation" autoComplete="new-password" value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} />
                <InputError message={errors.password_confirmation} />
            </div>
        </SheetForm>
    );
}
