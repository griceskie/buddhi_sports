import TombolTema from '@/Components/pengelola/TombolTema';
import { Trophy } from 'lucide-react';
import { PropsWithChildren, ReactNode } from 'react';

/**
 * Halaman tamu panel pengelola (login Admin dan Manager), gaya Design System Administrator.
 * Form di kiri, `panel` pratinjau di kanan (disembunyikan di bawah 900px). Login penyewa tetap memakai GuestLayout.
 */
export default function PengelolaGuestLayout({ panel, children }: PropsWithChildren<{ panel?: ReactNode }>) {
    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <section className="flex min-w-0 flex-1 basis-[380px] flex-col gap-8 px-5 py-6 min-[900px]:px-[clamp(24px,4vw,56px)] min-[900px]:py-8">
                <header className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5 text-sm whitespace-nowrap">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <Trophy className="size-4" aria-hidden />
                        </span>
                        <span className="font-semibold">Buddhi Sports</span>
                        <span aria-hidden className="h-4 w-px bg-border" />
                        <span className="truncate text-muted-foreground">Panel pengelola</span>
                    </div>
                    <TombolTema className="size-9" />
                </header>

                <main className="flex flex-1 flex-col justify-center pb-12">
                    <div className="w-full max-w-[360px]">{children}</div>
                </main>
            </section>

            {panel && (
                <aside
                    aria-label="Ringkasan panel"
                    className="hidden min-w-0 flex-[1.15_1_400px] flex-col justify-center border-l bg-muted px-[clamp(24px,4.5vw,64px)] py-18 min-[900px]:flex"
                >
                    <div className="w-full max-w-[520px]">{panel}</div>
                </aside>
            )}
        </div>
    );
}
