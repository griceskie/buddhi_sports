import { cn } from 'cn';
import { X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { jam, JAM_TUTUP } from './jadwal';

// island muncul saat pengguna menggulir, paling cepat sekali tiap JEDA sejak terakhir tampil, lalu hilang sendiri
const JEDA_MS = 120_000;
const TAMPIL_MS = 6_000;

/**
 * Island status buka/tutup di tengah bawah (pola pill Airbnb). Papan Open/Close di depan island, di kiri teks:
 * cincin dan kawatnya di dalam island, bawah platnya menjulur keluar dan berayun saat muncul.
 * Muncul saat digulir (tiap 2 menit), saat `minta` berubah (titik status di header diklik), hilang setelah
 * 6 detik atau lewat X. Di Home, di bawah lg posisinya di atas bar booking.
 */
export default function IslandStatus({
    buka,
    bukaLagi,
    minta,
    tanpaBarBawah = false,
}: {
    buka: boolean;
    bukaLagi: string;
    minta: number;
    /** Halaman tanpa bar booking di bawah (Booking saya, Profile): island cukup 48px dari bawah di semua lebar. */
    tanpaBarBawah?: boolean;
}) {
    const [fase, setFaseState] = useState<'tampil' | 'keluar' | null>(null);
    const faseRef = useRef(fase);
    const setFase = (f: typeof fase) => {
        faseRef.current = f;
        setFaseState(f);
    };
    const terakhir = useRef<number | null>(null);
    const tHilang = useRef<ReturnType<typeof setTimeout>>(undefined);
    const tKeluar = useRef<ReturnType<typeof setTimeout>>(undefined);

    const sembunyikan = useCallback(() => {
        clearTimeout(tHilang.current);
        if (faseRef.current !== 'tampil') return;
        setFase('keluar');
        clearTimeout(tKeluar.current);
        tKeluar.current = setTimeout(() => setFase(null), 200);
    }, []);

    const tampilkan = useCallback(() => {
        clearTimeout(tHilang.current);
        clearTimeout(tKeluar.current);
        terakhir.current = Date.now();
        setFase('tampil');
        tHilang.current = setTimeout(sembunyikan, TAMPIL_MS);
    }, [sembunyikan]);

    useEffect(() => {
        const gulir = () => {
            if (terakhir.current === null || Date.now() - terakhir.current >= JEDA_MS) tampilkan();
        };
        window.addEventListener('scroll', gulir, { passive: true });
        return () => {
            window.removeEventListener('scroll', gulir);
            clearTimeout(tHilang.current);
            clearTimeout(tKeluar.current);
        };
    }, [tampilkan]);

    useEffect(() => {
        if (minta > 0) tampilkan();
    }, [minta, tampilkan]);

    if (!fase) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            className={cn(
                'fixed left-1/2 z-30 max-w-[calc(100%-2rem)] -translate-x-1/2 motion-reduce:animate-none',
                tanpaBarBawah ? 'bottom-12' : 'bottom-44 sm:bottom-30 lg:bottom-12',
                fase === 'keluar'
                    ? 'animate-[island-keluar_.2s_cubic-bezier(.4,0,1,1)_both]'
                    : 'animate-[island-masuk_.34s_cubic-bezier(.2,.8,.2,1)_both]',
            )}
        >
            <img
                src={buka ? '/images/booking/papan-buka.webp' : '/images/booking/papan-tutup.webp'}
                alt=""
                width={80}
                height={74}
                className="pointer-events-none absolute top-0.5 left-3.5 z-2 w-20 origin-[53%_4%] animate-[ayun-papan_1.7s_cubic-bezier(.3,.6,.4,1)_.1s_both] motion-reduce:animate-none"
            />
            <div className="relative z-1 flex items-center gap-3 rounded-full bg-background py-1.5 pr-1.5 pl-26 shadow-[0_10px_30px_rgb(0_0_0/0.14),0_0_0_1px_color-mix(in_oklab,var(--foreground)_6%,transparent)]">
                <p className="min-w-0 truncate text-[15px] leading-5 tabular-nums">
                    <span className={cn('font-semibold', !buka && 'text-destructive')}>{buka ? 'Buka' : 'Tutup'}</span>{' '}
                    {buka ? `sampai ${jam(JAM_TUTUP)}` : `· ${bukaLagi}`}
                </p>
                <button
                    type="button"
                    aria-label="Tutup status jam buka"
                    onClick={sembunyikan}
                    className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                    <X className="size-4" strokeWidth={2.25} />
                </button>
            </div>
        </div>
    );
}
