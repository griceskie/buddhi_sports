import MenuAkun from '@/Components/MenuAkun';
import Wordmark from '@/Components/Wordmark';
import { Link } from '@inertiajs/react';
import { PropsWithChildren, ReactNode } from 'react';

export default function PenyewaLayout({
    header,
    nav,
    navTengah,
    children,
}: PropsWithChildren<{
    header?: ReactNode;
    /** Pengganti seluruh navigasi (header Home dengan kategori dan pilihan lapangan). */
    nav?: ReactNode;
    /** Isi di tengah nav, mis. status buka GOR di halaman Bayar. */
    navTengah?: ReactNode;
}>) {
    return (
        <div className="min-h-screen bg-canvas">
            {nav ?? (
                <nav className="sticky top-0 z-30 border-b bg-background">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="relative flex h-16 items-center justify-between gap-3">
                            <div className="flex items-center gap-6">
                                <Link href={route('dashboard')} className="shrink-0">
                                    <Wordmark className="whitespace-nowrap" />
                                </Link>
                            </div>

                            {navTengah && (
                                <div className="sm:absolute sm:left-1/2 sm:-translate-x-1/2">{navTengah}</div>
                            )}

                            <MenuAkun />
                        </div>
                    </div>
                </nav>
            )}

            {header && (
                <header className="border-b bg-background">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    );
}
