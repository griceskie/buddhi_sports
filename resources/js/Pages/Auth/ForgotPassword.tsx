import InputError from '@/Components/InputError';
import { Alert, AlertTitle } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Lupa Password" />

            <div className="mb-4 text-sm text-muted-foreground">
                Lupa password? Tidak masalah. Masukkan email Anda, dan kami
                akan mengirimkan link untuk membuat password baru.
            </div>

            {status && (
                <Alert variant="success" className="mb-4">
                    <AlertTitle>{status}</AlertTitle>
                </Alert>
            )}

            <form onSubmit={submit}>
                <Input
                    id="email"
                    type="email"
                    name="email"
                    value={data.email}
                    className="mt-1"
                    autoFocus
                    onChange={(e) => setData('email', e.target.value)}
                />

                <InputError message={errors.email} className="mt-2" />

                <div className="mt-4 flex flex-col gap-3">
                    <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        disabled={processing}
                    >
                        Kirim Link Reset Password
                    </Button>
                </div>
            </form>
        </GuestLayout>
    );
}
