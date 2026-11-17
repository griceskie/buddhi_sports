import { buttonVariants } from '@/Components/ui/button';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link } from '@inertiajs/react';
import { cn } from 'cn';

/** Halaman depan sementara; landing page sungguhan menyusul. */
export default function Landing() {
    return (
        <GuestLayout kolomClassName="max-w-[520px] text-center">
            <Head title="Buddhi Sports" />

            <h1 className="text-[28px] leading-[34px] font-semibold tracking-[-0.02em] text-balance sm:text-[36px] sm:leading-[42px]">
                Halaman depan ini ternyata lebih lama dirancang daripada seluruh aplikasinya.
            </h1>
            <p className="mx-auto mt-4 max-w-[380px] text-[17px] leading-[26px] text-balance text-muted-foreground">
                Jadi kamu bisa langsung masuk aja dengan tombol di bawah ini.
            </p>

            <Link href={route('login')} className={cn(buttonVariants({ variant: 'elevated', size: 'lg' }), 'mt-10 min-w-40 px-8')}>
                Login
            </Link>
        </GuestLayout>
    );
}
