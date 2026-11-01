import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { cn } from 'cn';
import { Image } from 'lucide-react';
import { useState } from 'react';
import { Lapangan } from './jadwal';

const KOSONG = 'bg-[color-mix(in_oklab,var(--foreground)_8%,var(--canvas))]';

/**
 * Foto lapangan terpilih: satu foto besar + dua kecil mulai `lg`, satu foto di bawahnya.
 * Chip nama lapangan di kiri bawah supaya jelas foto ini lapangan yang mana; "Lihat N foto" membuka semua foto.
 */
export default function GaleriLapangan({ lapangan, ikon }: { lapangan: Lapangan | null; ikon?: string }) {
    const [buka, setBuka] = useState(false);
    const foto = lapangan?.foto ?? [];
    const kotak = (src: string | undefined, kelas: string, utama = false) =>
        src ? (
            <img src={src} alt={utama ? `Foto ${lapangan?.namaLapangan}` : ''} className={cn('size-full object-cover', kelas)} />
        ) : (
            <div className={cn('flex size-full flex-col items-center justify-center gap-1.5 text-muted-foreground', KOSONG, kelas)}>
                {utama && (
                    <>
                        <Image className="size-6" aria-hidden="true" />
                        <span className="text-caption-1">Foto belum tersedia</span>
                    </>
                )}
            </div>
        );

    return (
        <div className="relative grid h-50 min-w-0 grid-cols-1 grid-rows-[minmax(0,1fr)] gap-2 sm:h-full lg:grid-cols-[2fr_1fr] lg:grid-rows-[repeat(2,minmax(0,1fr))]">
            <div className="overflow-hidden rounded-2xl lg:row-span-2 lg:rounded-r-md">{kotak(foto[0], '', true)}</div>
            <div className="hidden overflow-hidden rounded-md rounded-tr-2xl lg:block">{kotak(foto[1], '')}</div>
            <div className="hidden overflow-hidden rounded-md rounded-br-2xl lg:block">{kotak(foto[2], '')}</div>

            {lapangan && (
                <span className="absolute bottom-3 left-3 flex max-w-[calc(100%-9.5rem)] items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-caption-1 font-semibold">
                    {ikon && <img src={ikon} alt="" className="size-4 shrink-0 object-contain" />}
                    <span className="truncate">{lapangan.namaLapangan}</span>
                </span>
            )}
            {foto.length > 0 && (
                <Button variant="outline" size="sm" className="absolute right-3 bottom-3" onClick={() => setBuka(true)}>
                    Lihat {foto.length} foto
                </Button>
            )}

            <Dialog open={buka} onOpenChange={setBuka}>
                <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{lapangan?.namaLapangan}</DialogTitle>
                        <DialogDescription>{foto.length} foto</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {foto.map((src, i) => (
                            <img key={src} src={src} alt={`Foto ${i + 1}`} className="aspect-4/3 w-full rounded-lg object-cover" />
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
