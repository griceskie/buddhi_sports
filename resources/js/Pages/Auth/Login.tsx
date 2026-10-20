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
        <GuestLayout>
            <Head title="Log in" />

            {status && (
                <Alert variant="success" className="mb-4">
                    <AlertTitle>{status}</AlertTitle>
                </Alert>
            )}

            <form onSubmit={submit}>
                <div>
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
                        autoFocus
                        onChange={(e) => setData('email', e.target.value)}
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <Label htmlFor="password" className="text-muted-foreground">
                        Password
                    </Label>

                    <PasswordInput
                        id="password"
                        name="password"
                        value={data.password}
                        className="mt-2"
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                    <Label className="font-normal text-foreground">
                        <Checkbox
                            name="remember"
                            className="rounded-[4px]"
                            checked={data.remember}
                            onCheckedChange={(checked) =>
                                setData('remember', checked)
                            }
                        />
                        Remember me
                    </Label>

                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="text-sm text-primary hover:underline"
                        >
                            Forgot your password?
                        </Link>
                    )}
                </div>

                <Button
                    type="submit"
                    size="lg"
                    className="mt-6 w-full"
                    disabled={processing}
                >
                    Continue
                </Button>

                <p className="mt-4 text-center text-sm text-muted-foreground">
                    Don&apos;t have an account?{' '}
                    <Link
                        href={route('register')}
                        className="text-primary hover:underline"
                    >
                        Register
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}
