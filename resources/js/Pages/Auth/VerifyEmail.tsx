import { Alert, AlertTitle } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="Verifikasi Email" />

            <div className="mb-4 text-sm text-muted-foreground">
                Terima kasih sudah mendaftar! Sebelum mulai, verifikasi email
                Anda dengan mengklik link yang baru saja kami kirim. Jika email
                belum masuk, kami bisa mengirimkannya lagi.
            </div>

            {status === 'verification-link-sent' && (
                <Alert variant="success" className="mb-4">
                    <AlertTitle>
                        Link verifikasi baru sudah dikirim ke email yang Anda
                        daftarkan.
                    </AlertTitle>
                </Alert>
            )}

            <form onSubmit={submit}>
                <div className="mt-4 flex flex-col gap-3">
                    <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        disabled={processing}
                    >
                        Kirim Ulang Email Verifikasi
                    </Button>

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="text-center text-sm text-muted-foreground underline hover:text-foreground"
                    >
                        Log Out
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
