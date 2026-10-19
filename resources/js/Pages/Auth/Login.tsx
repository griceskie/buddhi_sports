import InputError from '@/Components/InputError';
import { Alert, AlertTitle } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';
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
                    <Label htmlFor="email">Email</Label>

                    <Input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1"
                        autoComplete="username"
                        autoFocus
                        onChange={(e) => setData('email', e.target.value)}
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <Label htmlFor="password">Password</Label>

                    <Input
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1"
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4">
                    <Label className="font-normal text-muted-foreground">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onCheckedChange={(checked) =>
                                setData('remember', checked)
                            }
                        />
                        Remember me
                    </Label>
                </div>

                <div className="mt-4 flex flex-col gap-3">
                    <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        disabled={processing}
                    >
                        Log in
                    </Button>

                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="text-center text-sm text-muted-foreground underline hover:text-foreground"
                        >
                            Forgot your password?
                        </Link>
                    )}
                </div>
            </form>
        </GuestLayout>
    );
}
