import { Button } from '@/Components/ui/button';
import { cn } from 'cn';
import { Image, LayoutGrid, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Lapangan } from './jadwal';

type Kotak = { l: number; t: number; w: number; h: number };
type Galeri = {
    fase: 'awal' | 'buka' | 'tutup';
    /** Kotak grid tempat foto terangkat (disembunyikan selama galeri terbuka). */
    sumber: number;
    asal: Kotak;
    akhir: Kotak;
    bawahTop: number;
    hp: boolean;
    hover: boolean;
};

const EASE = 'cubic-bezier(.2,.8,.2,1)';
const KOSONG = 'bg-[color-mix(in_oklab,var(--foreground)_8%,var(--canvas))]';
// efek dock: [lebar, tinggi, naik] untuk thumbnail yang di-hover (jarak 0) dan tetangganya (jarak 1, 2)
const DOCK: [number, number, number][] = [
    [96, 66, -8],
    [86, 59, -4],
    [80, 55, -1.5],
];

const kotakDari = (r: DOMRect): Kotak => ({ l: r.left, t: r.top, w: r.width, h: r.height });

/**
 * Foto lapangan: satu foto besar di kiri + empat kecil (dua mulai sm, empat mulai lg, satu foto di HP).
 * Kotak mana pun membuka galeri layar penuh di foto itu: foto terangkat dari kotaknya ke bingkai landscape
 * di tengah (4:3 di HP), latar di-blur. Pindah foto memakai transisi tumpukan (maju: foto depan jatuh dan
 * memudar, foto berikut membesar; mundur: kebalikannya). Thumbnail berefek dock saat di-hover (tidak di
 * layar sentuh), foto bisa digeser di HP, dan "Pesan sekarang" menutup galeri lalu memanggil `onPesan`.
 */
export default function GaleriLapangan({ lapangan, onPesan }: { lapangan: Lapangan; onPesan: () => void }) {
    const foto = lapangan.foto;
    const kotakRef = useRef<(HTMLButtonElement | null)[]>([]);
    const thumbRef = useRef<(HTMLButtonElement | null)[]>([]);
    const tutupRef = useRef<HTMLButtonElement>(null);
    const sentuhX = useRef<number | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
    const [galeri, setGaleri] = useState<Galeri | null>(null);
    const [idx, setIdx] = useState(0);
    const [hov, setHov] = useState<number | null>(null);

    // kotak grid yang terlihat untuk foto ke-i; bila tersembunyi di lebar ini, pakai foto besar
    const kotakFoto = useCallback((i: number) => {
        const el = kotakRef.current[i];
        const r = el?.getBoundingClientRect();
        if (r && r.width > 0 && r.height > 0) return { i, r };
        return { i: 0, r: kotakRef.current[0]!.getBoundingClientRect() };
    }, []);

    const buka = (i: number) => {
        if (galeri || !foto[i]) return;
        const k = kotakFoto(i);
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const hp = vw < 640;
        const bawah = 24 + (hp ? 76 : 92) + 20 + 44;
        const rasio = hp ? 3 / 4 : 9 / 16;
        const W = hp ? vw - 32 : Math.max(240, Math.min(1040, vw - 32, (vh - 48 - bawah) / rasio));
        const H = W * rasio;
        const top = Math.max(hp ? 64 : 16, (vh - (H + bawah)) / 2);
        document.documentElement.style.overflow = 'hidden';
        setIdx(i);
        setHov(null);
        setGaleri({
            fase: 'awal',
            sumber: k.i,
            asal: kotakDari(k.r),
            akhir: { l: (vw - W) / 2, t: top, w: W, h: H },
            bawahTop: top + H + 24,
            hp,
            hover: window.matchMedia('(hover: hover)').matches,
        });
        requestAnimationFrame(() =>
            requestAnimationFrame(() => setGaleri((g) => (g && g.fase === 'awal' ? { ...g, fase: 'buka' } : g))),
        );
    };

    const tutup = useCallback(
        (lalu?: () => void) => {
            if (!galeri || galeri.fase === 'tutup') return;
            // kembali ke kotak foto yang sedang dilihat (atau foto besar bila kotaknya tidak tampil)
            const k = kotakFoto(idx);
            setGaleri({ ...galeri, fase: 'tutup', sumber: k.i, asal: kotakDari(k.r) });
            clearTimeout(timer.current);
            timer.current = setTimeout(() => {
                setGaleri(null);
                setHov(null);
                document.documentElement.style.overflow = '';
                kotakRef.current[k.i]?.focus({ preventScroll: true });
                lalu?.();
            }, 500);
        },
        [galeri, idx, kotakFoto],
    );

    const pilih = useCallback(
        (j: number) => {
            const n = Math.max(0, Math.min(foto.length - 1, j));
            setIdx(n);
            thumbRef.current[n]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        },
        [foto.length],
    );

    const terbuka = galeri?.fase === 'buka';

    // keyboard: Esc menutup, panah kiri/kanan pindah foto; fokus ke tombol tutup setelah galeri terbuka
    useEffect(() => {
        if (!galeri) return;
        const tombol = (e: KeyboardEvent) => {
            if (e.key === 'Escape') tutup();
            else if (e.key === 'ArrowRight') pilih(idx + 1);
            else if (e.key === 'ArrowLeft') pilih(idx - 1);
        };
        window.addEventListener('keydown', tombol);
        return () => window.removeEventListener('keydown', tombol);
    }, [galeri, idx, pilih, tutup]);

    useEffect(() => {
        if (terbuka) tutupRef.current?.focus({ preventScroll: true });
    }, [terbuka]);

    // pindah lapangan atau halaman ditinggal: lepas kunci gulir
    useEffect(
        () => () => {
            clearTimeout(timer.current);
            document.documentElement.style.overflow = '';
        },
        [],
    );

    const kotak = (i: number, kelas: string) =>
        foto[i] ? (
            <button
                key={i}
                ref={(el) => {
                    kotakRef.current[i] = el;
                }}
                type="button"
                aria-label={`Lihat foto ${i + 1}`}
                onClick={() => buka(i)}
                className={cn(
                    'group relative min-h-0 min-w-0 cursor-zoom-in overflow-hidden outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-inset',
                    KOSONG,
                    galeri?.sumber === i && 'invisible',
                    kelas,
                )}
            >
                <img
                    src={foto[i]}
                    alt={i === 0 ? `Foto ${lapangan.namaLapangan}` : ''}
                    className="absolute inset-0 size-full object-cover transition-[filter] duration-200 group-hover:brightness-90"
                />
            </button>
        ) : (
            <div key={i} className={cn('flex min-h-0 min-w-0 flex-col items-center justify-center gap-1.5 text-muted-foreground', KOSONG, kelas)}>
                {i === 0 && (
                    <>
                        <Image className="size-6" aria-hidden="true" />
                        <span className="text-caption-1">Foto belum tersedia</span>
                    </>
                )}
            </div>
        );

    const r = galeri ? (terbuka ? galeri.akhir : galeri.asal) : null;

    return (
        <>
            <div className="relative grid h-60 min-w-0 gap-2 overflow-hidden rounded-2xl sm:h-90 sm:grid-cols-[2fr_1fr] lg:h-110 lg:grid-cols-2">
                {kotak(0, '')}
                <div className="hidden min-h-0 gap-2 sm:grid sm:grid-rows-2 lg:grid-cols-2">
                    {kotak(1, '')}
                    {kotak(2, '')}
                    {kotak(3, 'max-lg:hidden')}
                    {kotak(4, 'max-lg:hidden')}
                </div>
                {foto.length > 0 && (
                    <Button variant="outline" size="sm" className="absolute right-4 bottom-4" onClick={() => buka(0)}>
                        <LayoutGrid aria-hidden="true" />
                        Lihat {foto.length} foto
                    </Button>
                )}
            </div>

            {galeri &&
                r &&
                createPortal(
                    <div role="dialog" aria-modal="true" aria-label={`Foto ${lapangan.namaLapangan}`} className="fixed inset-0 z-50">
                        <div
                            className="absolute inset-0 bg-black/42 transition-opacity duration-400 supports-[backdrop-filter]:backdrop-blur-[18px] motion-reduce:transition-none"
                            style={{ opacity: terbuka ? 1 : 0 }}
                            onClick={() => tutup()}
                        />
                        <button
                            ref={tutupRef}
                            type="button"
                            aria-label="Tutup foto"
                            onClick={() => tutup()}
                            className="fixed top-3 right-3 z-1 flex size-11 cursor-pointer items-center justify-center rounded-full bg-white/92 text-foreground outline-none transition-opacity duration-300 focus-visible:ring-3 focus-visible:ring-ring/50 sm:top-4 sm:right-4"
                            style={{ opacity: terbuka ? 1 : 0 }}
                        >
                            <X className="size-[18px]" strokeWidth={2.25} />
                        </button>

                        <div
                            className={cn('fixed overflow-hidden shadow-[0_30px_80px_rgb(0_0_0/0.35)] motion-reduce:transition-none', KOSONG)}
                            style={{
                                left: r.l,
                                top: r.t,
                                width: r.w,
                                height: r.h,
                                borderRadius: terbuka || galeri.hp ? 16 : galeri.sumber === 0 ? '16px 0 0 16px' : 0,
                                transition: ['left', 'top', 'width', 'height', 'border-radius'].map((p) => `${p} .5s ${EASE}`).join(','),
                            }}
                            onTouchStart={(e) => (sentuhX.current = e.touches[0]?.clientX ?? null)}
                            onTouchEnd={(e) => {
                                const x = e.changedTouches[0]?.clientX;
                                if (sentuhX.current === null || x === undefined) return;
                                const dx = x - sentuhX.current;
                                sentuhX.current = null;
                                if (Math.abs(dx) > 40) pilih(idx + (dx < 0 ? 1 : -1));
                            }}
                        >
                            {foto.map((src, i) => (
                                <img
                                    key={src}
                                    src={src}
                                    alt={i === idx ? `Foto ${i + 1} ${lapangan.namaLapangan}` : ''}
                                    className="absolute inset-0 size-full object-cover motion-reduce:transition-none"
                                    style={{
                                        // tumpukan: foto 1 paling depan; foto sebelum yang dilihat sudah "jatuh", sesudahnya menunggu di belakang
                                        zIndex: 100 - i,
                                        opacity: i === idx ? 1 : 0,
                                        transform: i === idx ? 'none' : i < idx ? 'translateY(48px)' : 'scale(0.92)',
                                        transition: `opacity .42s ease, transform .5s ${EASE}`,
                                    }}
                                />
                            ))}
                        </div>

                        <div
                            className="fixed inset-x-0 flex flex-col items-center gap-5 motion-reduce:transition-none"
                            style={{
                                top: galeri.bawahTop,
                                opacity: terbuka ? 1 : 0,
                                transform: `translateY(${terbuka ? 0 : 16}px)`,
                                pointerEvents: terbuka ? 'auto' : 'none',
                                transition: `opacity .3s ease .12s, transform .45s ${EASE} .12s`,
                            }}
                        >
                            <div
                                role="group"
                                aria-label="Daftar foto"
                                onMouseLeave={() => setHov(null)}
                                className="flex h-19 max-w-full items-end gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:h-23 [&::-webkit-scrollbar]:hidden"
                            >
                                {foto.map((src, i) => {
                                    const d = hov === null || !galeri.hover ? 9 : Math.abs(i - hov);
                                    const [w, h, y] = DOCK[d] ?? (galeri.hp ? [64, 44, 0] : [76, 52, 0]);
                                    const aktif = i === idx;
                                    return (
                                        <button
                                            key={src}
                                            ref={(el) => {
                                                thumbRef.current[i] = el;
                                            }}
                                            type="button"
                                            aria-label={`Foto ${i + 1}`}
                                            aria-pressed={aktif}
                                            onClick={() => pilih(i)}
                                            onMouseEnter={() => galeri.hover && setHov(i)}
                                            className={cn(
                                                'shrink-0 cursor-pointer overflow-hidden rounded-[10px] outline-none focus-visible:ring-3 focus-visible:ring-white motion-reduce:transition-none',
                                                KOSONG,
                                            )}
                                            style={{
                                                width: w,
                                                height: h,
                                                transform: `translateY(${y}px)`,
                                                opacity: aktif || d <= 1 ? 1 : 0.62,
                                                boxShadow: aktif ? '0 0 0 2px #fff, 0 6px 16px rgb(0 0 0 / 0.3)' : '0 4px 12px rgb(0 0 0 / 0.2)',
                                                transition: `width .22s ${EASE}, height .22s ${EASE}, transform .22s ${EASE}, opacity .2s ease, box-shadow .2s ease`,
                                            }}
                                        >
                                            <img src={src} alt="" className="size-full object-cover" />
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="flex w-full justify-center px-4">
                                <Button variant="elevated" size="lg" className="max-sm:w-full" onClick={() => tutup(onPesan)}>
                                    Pesan sekarang
                                </Button>
                            </div>
                        </div>
                    </div>,
                    document.body,
                )}
        </>
    );
}
