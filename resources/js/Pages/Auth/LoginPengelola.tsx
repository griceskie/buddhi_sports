import InputError from '@/Components/InputError';
import PasswordInput from '@/Components/PasswordInput';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

export default function LoginPengelola() {
    const [role, setRole] = useState<'admin' | 'manager'>('admin');

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

                    <PasswordInput
                        id="password"
                        name="password"
                        value={data.password}
                        className="mt-1"
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4 flex flex-col gap-3">
                    <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        disabled={processing}
                    >
                        Log in sebagai {role === 'admin' ? 'Admin' : 'Manager'}
                    </Button>
                </div>
            </form>
        </GuestLayout>
    );
}
