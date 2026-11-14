import AdminSidebar, { judulHalamanPengelola } from '@/Components/AdminSidebar';
import HeaderPengelola from '@/Components/pengelola/HeaderPengelola';
import { SidebarInset, SidebarProvider } from '@/Components/ui/sidebar';
import { PageProps } from '@/types';
import { usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode } from 'react';

/** Panel Admin atau Manager (menu mengikuti peran) dengan sidebar yang bisa diciutkan. `header` adalah judul halaman (opsional). */
export default function AdminSidebarLayout({ header, children }: PropsWithChildren<{ header?: ReactNode }>) {
    const { url, props } = usePage<PageProps>();
    const pengelola = props.pengelola;

    return (
        <SidebarProvider>
            <AdminSidebar />
            <SidebarInset className="bg-canvas">
                {pengelola && <HeaderPengelola judul={judulHalamanPengelola(url, pengelola.role)} pengelola={pengelola} />}
                {/* mengikuti kanvas: padding 24px dan jarak 24px antar-bagian */}
                <main className="flex w-full flex-col gap-6 p-4 text-sm sm:p-6">
                    {header && <div>{header}</div>}
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
