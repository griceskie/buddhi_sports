import { Button, buttonVariants } from '@/Components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/Components/ui/popover';
import { NotifikasiPengelola } from '@/types';
import { Link, router } from '@inertiajs/react';
import { cn } from 'cn';
import { format, isToday, isYesterday } from 'date-fns';
import { id } from 'date-fns/locale';
import { Bell, CircleX, FileText, History, Wallet } from 'lucide-react';
import { useState } from 'react';

const IKON = { bayar: Wallet, laporan: FileText, batal: CircleX };
const WARNA = {
    bayar: 'bg-accessible-orange/15 text-accessible-orange',
    laporan: 'bg-accessible-green/15 text-accessible-green',
    batal: 'bg-muted text-muted-foreground',
};

function waktuSingkat(iso: string | null) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isToday(d)) return format(d, 'HH.mm');
    if (isYesterday(d)) return 'Kemarin';
    return format(d, 'd MMM', { locale: id });
}

/** Lonceng notifikasi di header Admin: titik merah selama ada bukti bayar baru yang belum ditandai dibaca. */
export default function NotifikasiHeader({ daftar, baru }: { daftar: NotifikasiPengelola[]; baru: number }) {
    const [buka, setBuka] = useState(false);

    const tandaiDibaca = () => router.post(route('notifikasi.dibaca'), {}, { preserveScroll: true, preserveState: true });

    return (
        <Popover open={buka} onOpenChange={setBuka}>
            {/* kelas tombol langsung di trigger: Button bukan forwardRef, jadi tidak bisa jadi `render` (popup tidak menempel) */}
            <PopoverTrigger
                className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'relative size-9 text-muted-foreground hover:text-foreground data-popup-open:bg-muted')}
                aria-label={baru ? `Notifikasi, ${baru} baru` : 'Notifikasi'}
            >
                <Bell className="size-[18px]" />
                {baru > 0 && <span aria-hidden className="absolute top-1.5 right-1.5 size-2 rounded-full bg-accessible-red ring-2 ring-background" />}
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={6} className="w-[340px] overflow-hidden p-0">
                <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
                    <span className="font-medium">Notifikasi</span>
                    <Button variant="ghost" size="xs" className="text-primary" disabled={!baru} onClick={tandaiDibaca}>
                        Tandai sudah dibaca
                    </Button>
                </div>
                {daftar.length === 0 ? (
                    <p className="px-3 py-8 text-center text-sm text-muted-foreground">Belum ada notifikasi.</p>
                ) : (
                    <ul className="max-h-[300px] overflow-y-auto">
                        {daftar.map((n) => {
                            const Ikon = IKON[n.jenis];
                            return (
                                <li key={n.id}>
                                    <Link
                                        href={n.href}
                                        onClick={() => setBuka(false)}
                                        className={`flex w-full items-start gap-2.5 border-b px-3 py-2.5 text-left transition-colors hover:bg-muted ${n.baru ? 'bg-primary/5' : ''}`}
                                    >
                                        <span aria-hidden className={`flex size-7 shrink-0 items-center justify-center rounded-full ${WARNA[n.jenis]}`}>
                                            <Ikon className="size-3.5" />
                                        </span>
                                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                            <span className="text-[13px] leading-[18px] font-medium">{n.judul}</span>
                                            <span className="text-sm text-muted-foreground">{n.ket}</span>
                                        </span>
                                        <span className="shrink-0 text-sm text-muted-foreground tabular-nums">{waktuSingkat(n.waktu)}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
                <Link
                    href={route('log.aktivitas')}
                    onClick={() => setBuka(false)}
                    className="flex h-9 items-center justify-center gap-1.5 text-[13px] font-medium text-primary hover:bg-muted"
                >
                    <History className="size-3.5" aria-hidden />
                    Lihat semua di Log aktivitas
                </Link>
            </PopoverContent>
        </Popover>
    );
}
