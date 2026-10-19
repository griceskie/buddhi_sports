import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

export default function LoginPengelola() {
    const [role, setRole] = useState<'admin' | 'manager'>('admin');
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        role: 'admin',
        username: '',
        password: '',
    });

    const switchRole = (next: 'admin' | 'manager') => {
        setRole(next);
        setData('role', next);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login.pengelola'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Login Pengelola" />

            <Tabs
                value={role}
                onValueChange={(v) => switchRole(v as 'admin' | 'manager')}
                className="mb-6"
            >
                <TabsList className="w-full">
                    <TabsTrigger value="admin" className="flex-1">
                        Login sebagai Admin
                    </TabsTrigger>
                    <TabsTrigger value="manager" className="flex-1">
                        Login sebagai Manager
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            <form onSubmit={submit}>
                <div>
                    <Label htmlFor="username">Username</Label>

                    <Input
                        id="username"
                        name="username"
                        value={data.username}
                        className="mt-1"
                        autoComplete="username"
                        autoFocus
                        onChange={(e) => setData('username', e.target.value)}
                        required
                    />

                    <InputError message={errors.username} className="mt-2" />
                </div>

                <div className="mt-4">
                    <Label htmlFor="password">Password</Label>

                    <div className="relative mt-1">
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={data.password}
                            className="pr-10"
                            autoComplete="current-password"
                            onChange={(e) => setData('password', e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                        >
                            {showPassword ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                        </button>
                    </div>

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4 flex flex-col gap-3">
                    <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        disabled={processing}
                    >
                        Login sebagai {role === 'admin' ? 'Admin' : 'Manager'}
                    </Button>
                </div>
            </form>
        </GuestLayout>
    );
}
