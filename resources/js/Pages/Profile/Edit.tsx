import NavPenyewa from '@/Components/booking/NavPenyewa';
import InputError from '@/Components/InputError';
import PasswordInput from '@/Components/PasswordInput';
import PhoneInput from '@/Components/PhoneInput';
import BarisProfil from '@/Components/profile/BarisProfil';
import { sensorEmail, sensorHp } from '@/Components/profile/sensor';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import PenyewaLayout from '@/Layouts/PenyewaLayout';
import { PageProps } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { cn } from 'cn';
import { CircleCheck, LogOut } from 'lucide-react';
import { FormEventHandler, ReactNode, useState } from 'react';

type Bagian = 'nama' | 'hp' | 'email' | 'password';

const PANJANG_MIN_PASSWORD = 8; // Password::defaults()

export default function Edit() {
    const user = usePage<PageProps>().props.auth.user;
    const [edit, setEdit] = useState<Bagian | null>(null);

    const profil = useForm({ namaPenyewa: user.namaPenyewa, noHp: user.noHp, email: user.email });
    const password = useForm({ current_password: '', password: '', password_confirmation: '' });

    const tutup = () => {
        profil.reset();
        profil.clearErrors();
        password.reset();
        password.clearErrors();
        setEdit(null);
    };

    const simpanProfil: FormEventHandler = (e) => {
        e.preventDefault();
        profil.patch(route('profile.update'), {
            preserveScroll: true,
            onSuccess: () => {
                profil.setDefaults();
                setEdit(null);
            },
        });
    };

    const simpanPassword: FormEventHandler = (e) => {
        e.preventDefault();
        password.put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => {
                password.reset();
                setEdit(null);
            },
            onError: (errors) => {
                if (errors.password) password.reset('password', 'password_confirmation');
                if (errors.current_password) password.reset('current_password');
            },
        });
    };

    const baris = (bagian: Bagian) => ({
        id: bagian,
        terbuka: edit === bagian,
        redup: edit !== null && edit !== bagian,
        onBuka: () => setEdit(bagian),
        onTutup: tutup,
    });
    const syaratTerpenuhi = password.data.password.length >= PANJANG_MIN_PASSWORD;

    return (
        <PenyewaLayout nav={<NavPenyewa />}>
            <Head title="Profile" />

            <div className="mx-auto flex max-w-[40rem] flex-col gap-8">
                <div>
                    <h1 className="text-title-3 font-semibold">Profile</h1>
                    <p className="mt-0.5 text-subheadline text-muted-foreground">Data akun dan keamanan Anda.</p>
                </div>

                <div className="flex items-center gap-4 rounded-2xl border-[0.5px] bg-card p-5">
                    <span
                        aria-hidden
                        className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-subheadline font-semibold text-primary-foreground"
                    >
                        {inisial(user.namaPenyewa)}
                    </span>
                    <div className="min-w-0">
                        <p className="truncate text-subheadline font-semibold">{user.namaPenyewa}</p>
                        <p className="truncate text-footnote text-muted-foreground">{sensorEmail(user.email)}</p>
                    </div>
                </div>

                <section className="flex flex-col gap-4">
                    <div>
                        <h2 className="text-callout font-semibold">Informasi pribadi</h2>
                        <p className="mt-1 text-footnote text-muted-foreground">Hanya Anda dan pengelola yang melihat data ini.</p>
                    </div>

                    <Island>
                        <BarisProfil label="Nama" nilai={user.namaPenyewa} {...baris('nama')}>
                            <FormBaris
                                bantuan="Nama ini tampil di booking Anda dan dilihat pengelola."
                                processing={profil.processing}
                                onSubmit={simpanProfil}
                                error={profil.errors.namaPenyewa}
                                idBantuan="bantuan-nama"
                            >
                                <Input
                                    id="namaPenyewa"
                                    aria-label="Nama"
                                    aria-describedby="bantuan-nama"
                                    value={profil.data.namaPenyewa}
                                    onChange={(e) => profil.setData('namaPenyewa', e.target.value)}
                                    autoComplete="name"
                                />
                            </FormBaris>
                        </BarisProfil>

                        <BarisProfil label="No HP" nilai={sensorHp(user.noHp)} nilaiClassName="tabular-nums" {...baris('hp')}>
                            <FormBaris
                                bantuan="Dipakai pengelola untuk menghubungi Anda soal booking."
                                processing={profil.processing}
                                onSubmit={simpanProfil}
                                error={profil.errors.noHp}
                                idBantuan="bantuan-hp"
                            >
                                <PhoneInput
                                    id="noHp"
                                    aria-label="No HP"
                                    aria-describedby="bantuan-hp"
                                    value={profil.data.noHp}
                                    onValueChange={(v) => profil.setData('noHp', v)}
                                    autoComplete="tel"
                                />
                            </FormBaris>
                        </BarisProfil>

                        <BarisProfil label="Email" nilai={sensorEmail(user.email)} {...baris('email')}>
                            <FormBaris
                                bantuan="Email baru dipakai untuk login berikutnya."
                                processing={profil.processing}
                                onSubmit={simpanProfil}
                                error={profil.errors.email}
                                idBantuan="bantuan-email"
                            >
                                <Input
                                    id="email"
                                    type="email"
                                    aria-label="Email"
                                    aria-describedby="bantuan-email"
                                    value={profil.data.email}
                                    onChange={(e) => profil.setData('email', e.target.value)}
                                    autoComplete="email"
                                />
                            </FormBaris>
                        </BarisProfil>
                    </Island>

                    <div className="flex flex-col gap-4 rounded-2xl border-[0.5px] bg-background p-5">
                        <Faq
                            gambar="/images/profil/faq-kunci.webp"
                            judul="Untuk apa email saya?"
                            jawaban="Untuk masuk dan mengatur ulang password."
                        />
                        <Faq
                            gambar="/images/profil/faq-orang.webp"
                            judul="Siapa yang melihat No HP?"
                            jawaban="Hanya pengelola, untuk urusan booking Anda."
                            className="border-t pt-4"
                        />
                    </div>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="text-callout font-semibold">Login dan keamanan</h2>

                    <Island>
                        <BarisProfil label="Password" nilai="********" nilaiClassName="tracking-[2px]" {...baris('password')}>
                            <form onSubmit={simpanPassword} className="flex flex-col gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="current_password">Password sekarang</Label>
                                    <PasswordInput
                                        id="current_password"
                                        value={password.data.current_password}
                                        onChange={(e) => password.setData('current_password', e.target.value)}
                                        autoComplete="current-password"
                                    />
                                    <InputError message={password.errors.current_password} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="password">Password baru</Label>
                                    <PasswordInput
                                        id="password"
                                        aria-describedby="syarat-password"
                                        value={password.data.password}
                                        onChange={(e) => password.setData('password', e.target.value)}
                                        autoComplete="new-password"
                                    />
                                    <p
                                        id="syarat-password"
                                        className={cn(
                                            'flex items-center gap-1.5 text-footnote',
                                            syaratTerpenuhi ? 'text-success' : 'text-muted-foreground',
                                        )}
                                    >
                                        <CircleCheck className="size-4" aria-hidden />
                                        Minimal 8 karakter
                                    </p>
                                    <InputError message={password.errors.password} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="password_confirmation">Ulangi password baru</Label>
                                    <PasswordInput
                                        id="password_confirmation"
                                        value={password.data.password_confirmation}
                                        onChange={(e) => password.setData('password_confirmation', e.target.value)}
                                        autoComplete="new-password"
                                    />
                                    <InputError message={password.errors.password_confirmation} />
                                </div>
                                <div>
                                    <Button type="submit" disabled={password.processing}>
                                        Simpan password
                                    </Button>
                                </div>
                            </form>
                        </BarisProfil>

                        {/* hapus akun dinonaktifkan dulu (keputusan user 2026-11-07) */}
                        <BarisProfil
                            id="hapus"
                            label="Hapus akun"
                            nilai="Akun tidak bisa dipulihkan setelah dihapus."
                            aksi="Hapus"
                            aksiClassName="text-destructive"
                            redup
                            nonaktif
                        />
                    </Island>

                    <Island className={cn('transition-opacity duration-200', edit !== null && 'opacity-40')}>
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            disabled={edit !== null}
                            className="flex min-h-19 w-full items-center justify-between gap-4 px-5 py-4 text-left text-footnote font-semibold hover:bg-muted disabled:pointer-events-none"
                        >
                            Log Out
                            <LogOut className="size-[18px] text-muted-foreground" aria-hidden />
                        </Link>
                    </Island>
                </section>
            </div>
        </PenyewaLayout>
    );
}

function Island({ className, children }: { className?: string; children: ReactNode }) {
    return (
        <div className={cn('overflow-hidden rounded-2xl border-[0.5px] bg-card [&>*+*]:border-t', className)}>
            {children}
        </div>
    );
}

function FormBaris({
    bantuan,
    idBantuan,
    error,
    processing,
    onSubmit,
    children,
}: {
    bantuan: string;
    idBantuan: string;
    error?: string;
    processing: boolean;
    onSubmit: FormEventHandler;
    children: ReactNode;
}) {
    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <p id={idBantuan} className="text-footnote text-muted-foreground">
                {bantuan}
            </p>
            {children}
            <InputError message={error} />
            <div>
                <Button type="submit" disabled={processing}>
                    Simpan
                </Button>
            </div>
        </form>
    );
}

function Faq({ gambar, judul, jawaban, className }: { gambar: string; judul: string; jawaban: string; className?: string }) {
    return (
        <div className={cn('flex items-center gap-3.5', className)}>
            <img src={gambar} alt="" width={44} height={44} className="size-11 shrink-0" />
            <div className="min-w-0">
                <p className="text-footnote font-semibold">{judul}</p>
                {/* maks. 2 baris di HP, 1 baris di desktop (user) */}
                <p className="line-clamp-2 text-footnote text-muted-foreground sm:line-clamp-1">{jawaban}</p>
            </div>
        </div>
    );
}

function inisial(nama: string) {
    return nama
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((k) => k[0].toUpperCase())
        .join('');
}
