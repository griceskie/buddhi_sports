import { cn } from 'cn';
import { useEffect, useState } from 'react';
import { jamTeks, JAM_BUKA, JAM_TUTUP, statusGor } from './jadwal';

/** Waktu sekarang yang diperbarui tiap menit (untuk status buka/tutup). */
export function useSekarangPerMenit() {
    const [sekarang, setSekarang] = useState(() => new Date());
    useEffect(() => {
        const id = setInterval(() => setSekarang(new Date()), 60_000);
        return () => clearInterval(id);
    }, []);
    return sekarang;
}

/** Titik berdenyut: hijau saat buka, merah saat tutup. */
export function TitikStatus({ buka, className }: { buka: boolean; className?: string }) {
    return (
        <span className={cn('relative flex size-2', buka ? 'text-success' : 'text-destructive', className)} aria-hidden="true">
            <span className="absolute inset-0 rounded-full bg-current opacity-75 motion-safe:animate-ping" />
            <span className="relative size-2 rounded-full bg-current" />
        </span>
    );
}

/** Status GOR di nav: titik berdenyut hijau saat buka, merah saat tutup. Diperbarui tiap menit. */
export default function StatusBuka() {
    const { buka, bukaLagi } = statusGor(useSekarangPerMenit());

    return (
        <p className="flex items-center gap-2 text-footnote whitespace-nowrap">
            <TitikStatus buka={buka} />
            <span>
                <span className={cn('font-semibold', !buka && 'text-destructive')}>{buka ? 'Buka' : 'Tutup'}</span>{' '}
                <span className="text-muted-foreground tabular-nums">
                    {buka ? `${jamTeks(JAM_BUKA)}–${jamTeks(JAM_TUTUP)}` : `· ${bukaLagi}`}
                </span>
            </span>
        </p>
    );
}
