import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        namaPenyewa: '',
        noHp: '',
        email: '',
        password: '',
        password_confirmation: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Daftar" />

            <form onSubmit={submit}>
                <div>
                    <Label htmlFor="namaPenyewa" className="text-muted-foreground">
                        Nama
                    </Label>

                    <Input
                        id="namaPenyewa"
                        name="namaPenyewa"
                        value={data.namaPenyewa}
                        className="mt-2"
                        autoComplete="name"
                        autoFocus
                        onChange={(e) => setData('namaPenyewa', e.target.value)}
                        required
                    />

                    <InputError message={errors.namaPenyewa} className="mt-2" />
                </div>

                <div className="mt-4">
                    <Label htmlFor="noHp" className="text-muted-foreground">
                        No HP
                    </Label>

                    <Input
                        id="noHp"
                        name="noHp"
                        value={data.noHp}
                        className="mt-2"
                        autoComplete="tel"
                        onChange={(e) => setData('noHp', e.target.value)}
                        required
                    />

                    <InputError message={errors.noHp} className="mt-2" />
                </div>

                <div className="mt-4">
                    <Label htmlFor="email" className="text-muted-foreground">
                        Email
                    </Label>

                    <Input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-2"
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <Label htmlFor="password" className="text-muted-foreground">
                        Password
                    </Label>

                    <Input
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-2"
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4">
                    <Label
                        htmlFor="password_confirmation"
                        className="text-muted-foreground"
                    >
                        Konfirmasi Password
                    </Label>

                    <Input
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="mt-2"
                        autoComplete="new-password"
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                        required
                    />

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

                <div className="mt-4">
                    <Label className="font-normal text-foreground">
                        <Checkbox
                            name="remember"
                            className="rounded-[4px]"
                            checked={data.remember}
                            onCheckedChange={(checked) =>
                                setData('remember', checked)
                            }
                        />
                        Ingat saya
                    </Label>
                </div>

                <Button
                    type="submit"
                    size="lg"
                    className="mt-6 w-full"
                    disabled={processing}
                >
                    Daftar
                </Button>

                <p className="mt-4 text-center text-sm text-muted-foreground">
                    Sudah punya akun?{' '}
                    <Link
                        href={route('login')}
                        className="text-primary hover:underline"
                    >
                        Login
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}
