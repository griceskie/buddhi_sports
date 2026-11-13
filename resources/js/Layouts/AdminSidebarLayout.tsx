import AdminSidebar, { judulHalamanAdmin } from '@/Components/AdminSidebar';
import HeaderPengelola from '@/Components/pengelola/HeaderPengelola';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/Components/ui/sidebar';
import Wordmark from '@/Components/Wordmark';
import { PageProps } from '@/types';
import { usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode } from 'react';

/** Panel Admin atau Manager (menu mengikuti peran) dengan sidebar yang bisa diciutkan. `header` adalah judul halaman (opsional). Di desktop tombol ciutkan ada di sidebar; di HP di header. */
export default function AdminSidebarLayout({ header, children }: PropsWithChildren<{ header?: ReactNode }>) {
    const { url, props } = usePage<PageProps>();
    const pengelola = props.pengelola;
    // Admin memakai header baru (notifikasi, mode gelap, menu akun); Manager tetap header lama
    const admin = pengelola?.role === 'admin';

    return (
        <SidebarProvider>
            <AdminSidebar />
            <SidebarInset className="bg-canvas">
                {admin ? (
                    <HeaderPengelola judul={judulHalamanAdmin(url)} pengelola={pengelola} />
                ) : (
                    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 md:hidden">
                        <SidebarTrigger className="-ml-1" />
                        <Wordmark />
                    </header>
                )}
                {/* Admin mengikuti kanvas: padding 24px dan jarak 24px antar-bagian; Manager tetap seperti sebelumnya */}
                <main className={admin ? 'flex w-full flex-col gap-6 p-4 text-sm sm:p-6' : 'mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8'}>
                    {header && <div className={admin ? undefined : 'mb-6'}>{header}</div>}
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
