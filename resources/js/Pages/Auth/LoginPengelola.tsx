import InputError from '@/Components/InputError';
import PanelPratinjauLogin from '@/Components/pengelola/PanelPratinjauLogin';
import PasswordInput from '@/Components/PasswordInput';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import PengelolaGuestLayout from '@/Layouts/PengelolaGuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

type Peran = 'admin' | 'manager';

export default function LoginPengelola() {
    const { data, setData, post, processing, errors, reset } = useForm<{ role: Peran; username: string; password: string }>({
        role: 'admin',
        username: '',
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login.pengelola'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <PengelolaGuestLayout panel={<PanelPratinjauLogin peran={data.role} />}>
            <Head title="Login Pengelola" />

            <div className="flex flex-col gap-7">
                <div className="flex flex-col gap-1.5">
                    <h1 className="text-[26px] leading-8 font-semibold tracking-[-0.01em] text-balance">Login ke panel pengelola</h1>
                    <p className="text-[15px] leading-[22px] text-muted-foreground">
                        Selamat datang kembali, semoga lancar bekerja hari ini.
                    </p>
                </div>

                <Tabs value={data.role} onValueChange={(v) => setData('role', v as Peran)}>
                    <TabsList className="h-9 w-full group-data-horizontal/tabs:h-9" aria-label="Peran">
                        <TabsTrigger value="admin">Admin</TabsTrigger>
                        <TabsTrigger value="manager">Manager</TabsTrigger>
                    </TabsList>
                </Tabs>

                <form onSubmit={submit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            name="username"
                            value={data.username}
                            autoComplete="username"
                            autoFocus
                            aria-invalid={!!errors.username}
                            onChange={(e) => setData('username', e.target.value)}
                            required
                        />
                        <InputError message={errors.username} className="mt-1" />
                    </div>

                    <div className="flex flex-col gap-1">
                        <Label htmlFor="password">Password</Label>
                        <PasswordInput
                            id="password"
                            name="password"
                            value={data.password}
                            autoComplete="current-password"
                            aria-invalid={!!errors.password}
                            onChange={(e) => setData('password', e.target.value)}
                            required
                        />
                        <InputError message={errors.password} className="mt-1" />
                    </div>

                    <Button type="submit" size="lg" className="h-10 w-full" disabled={processing}>
                        Login sebagai {data.role === 'admin' ? 'Admin' : 'Manager'}
                    </Button>
                </form>
            </div>
        </PengelolaGuestLayout>
    );
}
