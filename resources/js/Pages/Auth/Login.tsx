import InputError from '@/Components/InputError';
import { Alert, AlertTitle } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';
import PasswordInput from '@/Components/PasswordInput';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout
            title="Welcome back👋, mate!"
            description="Good to see you again. Log in and grab a court for your next game."
        >
            <Head title="Log in" />

            {status && (
                <Alert variant="success" className="mb-4">
                    <AlertTitle>{status}</AlertTitle>
                </Alert>
            )}

            <form onSubmit={submit} className="flex flex-col gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>

                    <Input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        autoComplete="username"
                        placeholder="you@email.com"
                        autoFocus
                        onChange={(e) => setData('email', e.target.value)}
                    />

                    <InputError message={errors.email} />
                </div>

                <div className="grid gap-2">
                    <div className="flex items-center justify-between gap-3">
                        <Label htmlFor="password">Password</Label>

                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="text-sm text-primary hover:underline"
                            >
                                Forgot your password?
                            </Link>
                        )}
                    </div>

                    <PasswordInput
                        id="password"
                        name="password"
                        value={data.password}
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />

                    <InputError message={errors.password} />
                </div>

                <Label className="font-normal text-foreground">
                    <Checkbox
                        name="remember"
                        className="rounded-[4px]"
                        checked={data.remember}
                        onCheckedChange={(checked) =>
                            setData('remember', checked)
                        }
                    />
                    Keep me logged in
                </Label>

                <Button
                    type="submit"
                    variant="elevated"
                    size="lg"
                    className="mt-2 w-full"
                    disabled={processing}
                >
                    Log in
                </Button>
            </form>

            <p className="mt-7 text-sm text-muted-foreground">
                New here?{' '}
                <Link
                    href={route('register')}
                    className="text-primary hover:underline"
                >
                    Create an account
                </Link>
            </p>
        </GuestLayout>
    );
}
