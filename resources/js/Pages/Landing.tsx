import { buttonVariants } from '@/Components/ui/button';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link } from '@inertiajs/react';
import { cn } from 'cn';

/** Halaman depan sementara; landing page sungguhan menyusul. */
export default function Landing() {
    return (
        <GuestLayout
            title={
                <span className="block text-center text-balance">
                    Halaman depan ini ternyata lebih lama dirancang daripada seluruh aplikasinya.
                </span>
            }
            description={
                <span className="block text-center text-balance">
                    Jadi kamu bisa langsung masuk aja dengan tombol di bawah ini.
                </span>
            }
        >
            <Head title="Buddhi Sports" />

            <Link href={route('login')} className={cn(buttonVariants({ variant: 'elevated', size: 'lg' }), 'w-full')}>
                Login
            </Link>
        </GuestLayout>
    );
}
