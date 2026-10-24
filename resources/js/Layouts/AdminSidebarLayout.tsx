import AdminSidebar from '@/Components/AdminSidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/Components/ui/sidebar';
import Wordmark from '@/Components/Wordmark';
import { PropsWithChildren } from 'react';

/** Panel Admin atau Manager (menu mengikuti peran) dengan sidebar yang bisa diciutkan. Di desktop tombol ciutkan ada di sidebar; di HP di header. */
export default function AdminSidebarLayout({ children }: PropsWithChildren) {
    return (
        <SidebarProvider>
            <AdminSidebar />
            <SidebarInset className="bg-canvas">
                <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 md:hidden">
                    <SidebarTrigger className="-ml-1" />
                    <Wordmark />
                </header>
                <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
            </SidebarInset>
        </SidebarProvider>
    );
}
