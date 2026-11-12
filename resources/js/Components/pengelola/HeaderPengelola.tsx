import MenuAkunPengelola from '@/Components/pengelola/MenuAkunPengelola';
import NotifikasiHeader from '@/Components/pengelola/NotifikasiHeader';
import TombolTema from '@/Components/pengelola/TombolTema';
import { SidebarTrigger } from '@/Components/ui/sidebar';
import { Pengelola } from '@/types';

/** Header panel Admin: tombol sidebar, judul halaman, lalu notifikasi, mode gelap, menu akun (urutan tetap). */
export default function HeaderPengelola({ judul, pengelola }: { judul: string; pengelola: Pengelola }) {
    return (
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background pr-4 pl-3 sm:pr-6">
            <SidebarTrigger className="text-foreground" />
            <span aria-hidden className="mx-1 h-4 w-px bg-border" />
            <h1 className="min-w-0 flex-1 truncate text-base font-medium">{judul}</h1>
            <div className="flex shrink-0 items-center gap-0.5">
                <NotifikasiHeader daftar={pengelola.notifikasi?.daftar ?? []} baru={pengelola.notifikasi?.baru ?? 0} />
                <TombolTema className="size-9 text-muted-foreground hover:text-foreground" />
                <span aria-hidden className="mx-1.5 h-5 w-px bg-border" />
                <MenuAkunPengelola pengelola={pengelola} />
            </div>
        </header>
    );
}
