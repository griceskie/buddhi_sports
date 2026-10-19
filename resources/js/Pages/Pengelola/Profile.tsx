import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import AdminLayout from '@/Layouts/AdminLayout';
import { PageProps } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

function UpdateInfoForm() {
    const pengelola = usePage<PageProps>().props.pengelola!;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        nama: pengelola.nama,
        username: pengelola.username,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('profile.pengelola.update'), { preserveScroll: true });
    };

    return (
        <section className="max-w-xl">
            <header>
                <h2 className="text-lg font-medium text-foreground">Informasi Akun</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Ubah nama dan username yang dipakai untuk login.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-4">
                <div>
                    <Label htmlFor="nama">Nama</Label>
                    <Input
                        id="nama"
                        className="mt-1"
                        value={data.nama}
                        onChange={(e) => setData('nama', e.target.value)}
                        required
                    />
                    <InputError message={errors.nama} className="mt-2" />
                </div>

                <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                        id="username"
                        className="mt-1"
                        autoComplete="username"
                        value={data.username}
                        onChange={(e) => setData('username', e.target.value)}
                        required
                    />
                    <InputError message={errors.username} className="mt-2" />
                </div>

                <div className="flex items-center gap-4">
                    <Button type="submit" disabled={processing}>
                        Simpan
                    </Button>
                    {recentlySuccessful && (
                        <p className="text-sm text-muted-foreground">Tersimpan.</p>
                    )}
                </div>
            </form>
        </section>
    );
}

function UpdatePasswordForm() {
    const { data, setData, put, errors, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('profile.pengelola.password'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: () => reset('current_password', 'password', 'password_confirmation'),
        });
    };

    return (
        <section className="max-w-xl">
            <header>
                <h2 className="text-lg font-medium text-foreground">Ganti Password</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Gunakan password yang panjang dan sulit ditebak.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-4">
                <div>
                    <Label htmlFor="current_password">Password Saat Ini</Label>
                    <Input
                        id="current_password"
                        type="password"
                        className="mt-1"
                        autoComplete="current-password"
                        value={data.current_password}
                        onChange={(e) => setData('current_password', e.target.value)}
                    />
                    <InputError message={errors.current_password} className="mt-2" />
                </div>

                <div>
                    <Label htmlFor="password">Password Baru</Label>
                    <Input
                        id="password"
                        type="password"
                        className="mt-1"
                        autoComplete="new-password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div>
                    <Label htmlFor="password_confirmation">Konfirmasi Password Baru</Label>
                    <Input
                        id="password_confirmation"
                        type="password"
                        className="mt-1"
                        autoComplete="new-password"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                    />
                    <InputError message={errors.password_confirmation} className="mt-2" />
                </div>

                <div className="flex items-center gap-4">
                    <Button type="submit" disabled={processing}>
                        Simpan
                    </Button>
                    {recentlySuccessful && (
                        <p className="text-sm text-muted-foreground">Tersimpan.</p>
                    )}
                </div>
            </form>
        </section>
    );
}

export default function Profile() {
    return (
        <AdminLayout
            header={
                <h2 className="text-xl leading-tight font-semibold text-foreground">
                    Profile
                </h2>
            }
        >
            <Head title="Profile" />

            <div className="space-y-6">
                <Card>
                    <CardContent className="sm:px-8">
                        <UpdateInfoForm />
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="sm:px-8">
                        <UpdatePasswordForm />
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
