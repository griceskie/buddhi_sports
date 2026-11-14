import { Tooltip, TooltipContent, TooltipTrigger } from '@/Components/ui/tooltip';
import { cn } from 'cn';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { ReactNode } from 'react';

// Bentuk data dari App\Support\AnalitikBisnis. Semua angka dan kalimat sudah jadi di server.
export type Delta = { teks: string; naik: boolean; baik: boolean; banding: string } | null;
export type Metrik = { judul: string; nilai: string; ket: string; delta: Delta };
export type BarisBatang = { judul: string; warna: string; n: string; porsi: string; lebar: number; nilai?: string; wawasan?: string };
export type Tujuan = Record<string, string | number>;
export type Titik = {
    label: string;
    judul: string;
    nilai: string;
    ket: string;
    tinggi: number;
    segmen: { warna: string; porsi: number }[];
    rinci: { warna: string; nama: string; nilai: string }[];
    terpilih: boolean;
    mati: boolean;
    bergaris: boolean;
    kiri: boolean;
    tujuan: Tujuan;
};
export type Grafik = {
    judul: string;
    aria: string;
    lebarBatang: number;
    titik: Titik[];
    sumbu: { pos: number; label: string }[];
    legenda: { warna: string; nama: string }[];
    batas?: { pos: number; label: string };
    lebarSumbu?: number;
};

/** Kartu satu bagian analisis: judul 16px, keterangan abu, isi. */
export function Kartu({ judul, ket, children, className }: { judul: string; ket?: string; children: ReactNode; className?: string }) {
    return (
        <section className={cn('flex flex-col gap-6 rounded-xl border bg-card p-4 text-card-foreground shadow-sm sm:p-6', className)}>
            <div className="flex flex-col gap-0.5">
                <h3 className="text-base font-semibold">{judul}</h3>
                {ket && <p className="text-sm text-muted-foreground">{ket}</p>}
            </div>
            {children}
        </section>
    );
}

/** Garis pemisah antarbagian di dalam satu kartu. */
export function Sub({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn('flex flex-col gap-3 border-t pt-6', className)}>{children}</div>;
}

export function ChipDelta({ delta }: { delta: Delta }) {
    if (!delta) return null;
    const Ikon = delta.naik ? TrendingUp : TrendingDown;
    return (
        <Tooltip>
            <TooltipTrigger
                render={
                    <span
                        tabIndex={0}
                        className={cn(
                            'inline-flex items-center gap-1 rounded text-sm font-medium whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            delta.baik ? 'text-accessible-green' : 'text-accessible-red',
                        )}
                    />
                }
            >
                <Ikon className="size-3.5" aria-hidden />
                {delta.teks}
            </TooltipTrigger>
            <TooltipContent className="text-sm">{delta.banding}</TooltipContent>
        </Tooltip>
    );
}

/** Deretan angka utama dengan garis pemisah; keterangan diberi tinggi tetap supaya kartu tidak bergeser saat periode berganti. */
export function DeretMetrik({ metrik }: { metrik: Metrik[] }) {
    return (
        <div className={cn('grid grid-cols-[minmax(0,1fr)] gap-6 sm:grid-cols-2', metrik.length === 3 ? 'lg:grid-cols-3' : 'xl:grid-cols-4')}>
            {metrik.map((m, i) => (
                <div key={m.judul} className={cn('flex min-w-0 flex-col gap-1.5', i > 0 && 'sm:border-l sm:pl-6', i === 2 && metrik.length === 4 && 'sm:border-l-0 sm:pl-0 xl:border-l xl:pl-6')}>
                    <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-muted-foreground">{m.judul}</span>
                        <ChipDelta delta={m.delta} />
                    </div>
                    <span className="text-3xl font-semibold tracking-tight whitespace-nowrap tabular-nums">{m.nilai}</span>
                    <span className="min-h-10 text-sm text-muted-foreground">{m.ket}</span>
                </div>
            ))}
        </div>
    );
}

/** Daftar baris dengan batang tipis: judul, angka, batang, lalu wawasan bila ada. */
export function DaftarBatang({ baris }: { baris: BarisBatang[] }) {
    return (
        <ul className="flex flex-col gap-3.5">
            {baris.map((b) => (
                <li key={b.judul} className="flex flex-col gap-1.5">
                    <div className="flex justify-between gap-3">
                        <span className="flex items-center gap-2 font-medium">
                            <span aria-hidden className="size-2.5 shrink-0 rounded-[2px]" style={{ background: b.warna }} />
                            {b.judul}
                        </span>
                        <span className="whitespace-nowrap tabular-nums">
                            <span className="font-medium">{b.nilai ? b.n : b.porsi}</span>
                            <span className="text-muted-foreground"> · {b.nilai ? `${b.nilai} · ${b.porsi}` : b.n}</span>
                        </span>
                    </div>
                    <div aria-hidden className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full" style={{ width: `${b.lebar}%`, background: b.warna }} />
                    </div>
                    {b.wawasan && <span className="text-sm text-muted-foreground">{b.wawasan}</span>}
                </li>
            ))}
        </ul>
    );
}

const POLA_GARIS = 'repeating-linear-gradient(135deg, var(--muted-foreground) 0 2px, transparent 2px 4px)';

export function Legenda({ isi }: { isi: Grafik['legenda'] }) {
    return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
            {isi.map((l) => (
                <span key={l.nama} className="inline-flex items-center gap-1.5">
                    {l.warna === 'batas' ? (
                        <span aria-hidden className="w-3.5 border-t-2 border-dashed border-accessible-red" />
                    ) : (
                        <span aria-hidden className="size-2.5 rounded-[2px]" style={{ background: l.warna === 'garis' ? POLA_GARIS : l.warna }} />
                    )}
                    {l.nama}
                </span>
            ))}
        </div>
    );
}

/**
 * Grafik batang yang bisa diklik: klik memilih periode batang itu (tujuan dari server). Batang tanpa data mati.
 * Batang terpilih penuh, yang lain pudar; batang yang laporannya belum diperiksa bergaris miring.
 */
export function GrafikBatang({ grafik, onPilih, tinggi = 220 }: { grafik: Grafik; onPilih: (t: Tujuan) => void; tinggi?: number }) {
    const sumbu = grafik.lebarSumbu ?? 88;
    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
                <span className="font-medium">{grafik.judul}</span>
                <Legenda isi={grafik.legenda} />
            </div>
            <div className="overflow-x-auto pt-2.5">
                <div role="group" aria-label={grafik.aria} className="grid min-w-[560px]" style={{ gridTemplateRows: `${tinggi}px 28px`, gridTemplateColumns: `${sumbu}px minmax(0, 1fr)` }}>
                    <div className="relative">
                        {grafik.sumbu.map((y) => (
                            <span key={y.pos} className="absolute right-2.5 translate-y-1/2 whitespace-nowrap text-muted-foreground tabular-nums" style={{ bottom: `${y.pos}%` }}>
                                {y.label}
                            </span>
                        ))}
                    </div>
                    <div className="relative">
                        {grafik.sumbu.map((y) => (
                            <span key={y.pos} aria-hidden className="absolute inset-x-0 border-t border-border/60" style={{ bottom: `${y.pos}%` }} />
                        ))}
                        {grafik.batas && (
                            <>
                                <span aria-hidden className="pointer-events-none absolute inset-x-0 z-[2] border-t-2 border-dashed border-accessible-red" style={{ bottom: `${grafik.batas.pos}%` }} />
                                <span className="pointer-events-none absolute right-0 z-[2] -translate-y-1 rounded bg-card px-1.5 font-medium text-accessible-red" style={{ bottom: `${grafik.batas.pos}%` }}>
                                    {grafik.batas.label}
                                </span>
                            </>
                        )}
                        <div className="absolute inset-0 flex items-stretch gap-1">
                            {grafik.titik.map((t, i) => (
                                <button
                                    key={t.label}
                                    type="button"
                                    aria-pressed={t.terpilih}
                                    aria-disabled={t.mati}
                                    aria-label={`${t.judul}: ${t.nilai}`}
                                    onClick={() => !t.mati && onPilih(t.tujuan)}
                                    className={cn(
                                        'group relative flex min-w-0 flex-1 items-end justify-center rounded-md px-2.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                                        t.mati ? 'cursor-default' : 'cursor-pointer hover:bg-muted',
                                    )}
                                >
                                    <div
                                        className="relative flex flex-[1_1_0] origin-bottom flex-col-reverse overflow-hidden rounded-t transition-opacity motion-safe:animate-[naik-grafik_0.5s_cubic-bezier(0.2,0.8,0.2,1)_both]"
                                        style={{ height: `${t.tinggi}%`, maxWidth: grafik.lebarBatang, opacity: t.terpilih ? 1 : 0.35, animationDelay: `${i * 30}ms` }}
                                    >
                                        {t.segmen.map((s, k) => (
                                            <div key={k} className="flex-none" style={{ height: `${s.porsi}%`, background: s.warna }} />
                                        ))}
                                        {t.bergaris && (
                                            <div
                                                aria-hidden
                                                className="absolute inset-0"
                                                style={{ background: 'repeating-linear-gradient(135deg, transparent 0 5px, color-mix(in oklab, var(--card) 70%, transparent) 5px 8px)' }}
                                            />
                                        )}
                                    </div>
                                    <div
                                        role="tooltip"
                                        className={cn(
                                            'pointer-events-none absolute top-2 z-10 hidden gap-1 rounded-lg border bg-popover px-2.5 py-2 text-left whitespace-nowrap text-popover-foreground shadow-lg group-hover:grid group-focus-visible:grid',
                                            t.kiri ? 'left-1' : 'right-1',
                                        )}
                                    >
                                        <span className="font-medium">{t.judul}</span>
                                        <span className="font-semibold tabular-nums">{t.nilai}</span>
                                        <span className="text-muted-foreground">{t.ket}</span>
                                        {t.rinci.length > 0 && (
                                            <div className="grid grid-cols-[10px_auto_auto] items-center gap-x-2 gap-y-1 border-t pt-1">
                                                {t.rinci.map((r) => (
                                                    <span key={r.nama} className="contents">
                                                        <span className="size-2.5 rounded-[2px]" style={{ background: r.warna }} />
                                                        <span>{r.nama}</span>
                                                        <span className="text-right tabular-nums">{r.nilai}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div />
                    <div className="flex gap-1 pt-2">
                        {grafik.titik.map((t) => (
                            <span key={t.label} className={cn('min-w-0 flex-1 text-center whitespace-nowrap', t.terpilih ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                                {t.label}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
