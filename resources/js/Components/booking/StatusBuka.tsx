import { cn } from 'cn';
import { useEffect, useState } from 'react';
import { jam, JAM_BUKA, JAM_TUTUP } from './jadwal';

/** Status GOR di nav: titik berdenyut hijau saat buka, merah saat tutup. Diperbarui tiap menit. */
export default function StatusBuka() {
    const [sekarang, setSekarang] = useState(() => new Date());
    useEffect(() => {
        const id = setInterval(() => setSekarang(new Date()), 60_000);
        return () => clearInterval(id);
    }, []);

    const h = sekarang.getHours();
    const buka = h >= JAM_BUKA && h < JAM_TUTUP;

    return (
        <p className="flex items-center gap-2 text-footnote whitespace-nowrap">
            <span className={cn('relative flex size-2', buka ? 'text-success' : 'text-destructive')} aria-hidden="true">
                <span className="absolute inset-0 rounded-full bg-current opacity-75 motion-safe:animate-ping" />
                <span className="relative size-2 rounded-full bg-current" />
            </span>
            <span>
                <span className={cn('font-semibold', !buka && 'text-destructive')}>{buka ? 'Buka' : 'Tutup'}</span>{' '}
                <span className="text-muted-foreground tabular-nums">
                    {buka
                        ? `${jam(JAM_BUKA)}–${jam(JAM_TUTUP)}`
                        : `· buka ${h >= JAM_TUTUP ? 'besok' : 'pukul'} ${jam(JAM_BUKA)}`}
                </span>
            </span>
        </p>
    );
}
