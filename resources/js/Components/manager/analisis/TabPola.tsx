import { Tooltip, TooltipContent, TooltipTrigger } from '@/Components/ui/tooltip';
import { cn } from 'cn';
import { useState } from 'react';
import { BarisBatang, ChipDelta, DaftarBatang, Delta, Kartu } from './bagian';

type Blok = {
    no: number;
    judul: string;
    ket: string;
    persen: string;
    lebar: number;
    nilai: string;
    nilaiKet: string;
    rinci: { warna: string; nama: string; isi: string; rata: string; nilai: string }[];
};
export type DataPola = {
    terisi: { persen: string; ket: string; delta: Delta };
    perLapangan: { nama: string; warna: string; persen: string; jam: string; lebar: number }[];
    peta: {
        hari: string;
        panjang: string;
        total: string;
        rata: string;
        persen: string;
        jamRamai: string;
        sel: { tingkat: number; tip: string; blok: { kosong: number | null; ramai: number | null } }[];
    }[];
    jamLabel: string[];
    hariRamai: number | null;
    petaAria: string;
    blok: { kosong: Blok[]; ramai: Blok[] };
    lamaMain: BarisBatang[];
    jarak: BarisBatang[];
};

const TINGKAT = [
    'var(--muted)',
    'color-mix(in oklab, var(--primary) 22%, var(--card))',
    'color-mix(in oklab, var(--primary) 45%, var(--card))',
    'color-mix(in oklab, var(--primary) 70%, var(--card))',
    'var(--primary)',
];

export default function TabPola({ data }: { data: DataPola }) {
    const [hari, setHari] = useState<number | null>(null);
    const [mode, setMode] = useState<'kosong' | 'ramai'>('kosong');
    const [sorotBlok, setSorotBlok] = useState<number | null>(null);
    const ramai = mode === 'ramai';
    const fokus = hari ?? data.hariRamai;
    const ketHari =
        data.hariRamai === null
            ? 'Belum ada booking.'
            : hari === null
              ? `${data.peta[data.hariRamai].panjang} paling ramai, rata-rata ${data.peta[data.hariRamai].rata} jam lapangan terisi. Pilih baris untuk melihat jam paling ramai di hari itu.`
              : `${data.peta[hari].panjang}: rata-rata ${data.peta[hari].rata} jam terisi (${data.peta[hari].persen}). Paling ramai ${data.peta[hari].jamRamai}. Pilih lagi untuk membatalkan.`;
    const kolom = `36px repeat(${data.jamLabel.length}, minmax(0, 1fr)) 72px`;

    return (
        <>
            <Kartu judul="Pemakaian dan kapasitas" ket="Jam yang terisi booking terkonfirmasi, dari seluruh jam buka 08.00–22.00">
                <div className="grid grid-cols-[minmax(0,1fr)] gap-8 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
                    <div className="flex min-w-0 flex-col gap-5">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-baseline gap-2.5">
                                <span className="text-3xl font-semibold tracking-tight tabular-nums">{data.terisi.persen}</span>
                                <ChipDelta delta={data.terisi.delta} />
                            </div>
                            <span className="min-h-10 text-sm text-muted-foreground">{data.terisi.ket}</span>
                        </div>
                        <ul className="flex flex-col gap-3.5">
                            {data.perLapangan.map((l) => (
                                <li key={l.nama} className="flex flex-col gap-1.5">
                                    <div className="flex justify-between gap-2">
                                        <span className="flex items-center gap-2 font-medium">
                                            <span aria-hidden className="size-2.5 rounded-[2px]" style={{ background: l.warna }} />
                                            {l.nama}
                                        </span>
                                        <span className="tabular-nums">
                                            <span className="font-medium">{l.persen}</span>
                                            <span className="text-muted-foreground"> · {l.jam}</span>
                                        </span>
                                    </div>
                                    <div aria-hidden className="h-2 overflow-hidden rounded-full bg-muted">
                                        <div className="h-full rounded-full" style={{ width: `${l.lebar}%`, background: l.warna }} />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="flex min-w-0 flex-col gap-3">
                        <div className="flex flex-wrap items-baseline justify-between gap-3">
                            <span className="font-medium">Jam tersibuk</span>
                            <span className="min-h-10 text-sm text-muted-foreground sm:max-w-[70%] sm:text-right">{ketHari}</span>
                        </div>
                        <div className="overflow-x-auto">
                            <div aria-label={data.petaAria} className="flex min-w-[560px] flex-col gap-[3px]">
                                <div className="grid gap-[3px] text-muted-foreground" style={{ gridTemplateColumns: kolom }}>
                                    <span />
                                    {data.jamLabel.map((j) => (
                                        <span key={j} className="text-center tabular-nums">
                                            {j}
                                        </span>
                                    ))}
                                    <span className="text-right">Total</span>
                                </div>
                                {data.peta.map((r, d) => (
                                    <button
                                        key={r.hari}
                                        type="button"
                                        aria-pressed={hari === d}
                                        aria-label={`${r.panjang}, rata-rata ${r.rata} jam terisi`}
                                        onClick={() => setHari(hari === d ? null : d)}
                                        className={cn(
                                            'grid cursor-pointer gap-[3px] rounded-md text-left outline-offset-2 hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring',
                                            hari === d && 'outline-2 outline-foreground',
                                        )}
                                        style={{ gridTemplateColumns: kolom }}
                                    >
                                        <span className="flex items-center text-muted-foreground">{r.hari}</span>
                                        {r.sel.map((s, h) => (
                                            <span
                                                key={h}
                                                title={s.tip}
                                                className={cn(
                                                    'relative h-[26px] rounded hover:shadow-[inset_0_0_0_1.5px_var(--foreground)]',
                                                    sorotBlok !== null && s.blok[mode] === sorotBlok && 'z-[1] outline-2 outline-offset-1 outline-foreground',
                                                )}
                                                style={{ background: TINGKAT[s.tingkat] }}
                                            />
                                        ))}
                                        <span className={cn('flex items-center justify-end whitespace-nowrap tabular-nums', d === fokus ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                                            {r.total}
                                        </span>
                                    </button>
                                ))}
                                <div className="mt-2 flex items-center justify-end gap-1.5 text-muted-foreground">
                                    <span>Sepi</span>
                                    {TINGKAT.map((t) => (
                                        <span key={t} aria-hidden className="size-3.5 rounded-[3px]" style={{ background: t }} />
                                    ))}
                                    <span>Ramai</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 border-t pt-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                        <span className="flex flex-col gap-0.5">
                            <span className="font-medium">{ramai ? 'Jam yang paling ramai' : 'Jam yang paling sering kosong'}</span>
                            <span className="text-sm text-muted-foreground">Arahkan kursor ke baris untuk melihatnya di peta.</span>
                        </span>
                        <div role="tablist" aria-label="Urutan jam" className="inline-flex h-9 items-center rounded-lg bg-muted p-[3px] text-muted-foreground">
                            {(
                                [
                                    ['kosong', 'Paling kosong'],
                                    ['ramai', 'Paling ramai'],
                                ] as const
                            ).map(([k, l]) => (
                                <button
                                    key={k}
                                    type="button"
                                    role="tab"
                                    aria-selected={mode === k}
                                    onClick={() => setMode(k)}
                                    className={cn(
                                        'h-full cursor-pointer rounded-md px-3 text-sm font-medium transition-colors',
                                        mode === k ? 'bg-background text-foreground shadow-sm' : 'hover:text-foreground',
                                    )}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                    </div>
                    <ul className="overflow-hidden rounded-lg border">
                        {data.blok[mode].map((s, n) => (
                            <li
                                key={s.judul}
                                tabIndex={0}
                                onMouseEnter={() => setSorotBlok(n)}
                                onMouseLeave={() => setSorotBlok(null)}
                                onFocus={() => setSorotBlok(n)}
                                onBlur={() => setSorotBlok(null)}
                                className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-x-4 border-t px-4 py-3 outline-none transition-colors first:border-t-0 hover:bg-muted focus-visible:bg-muted sm:h-16 sm:grid-cols-[28px_minmax(0,1fr)_200px_160px] sm:py-0"
                            >
                                <span aria-hidden className="flex size-6 items-center justify-center rounded-full bg-muted text-sm font-medium tabular-nums">
                                    {s.no}
                                </span>
                                <span className="flex min-w-0 flex-col">
                                    <span className="truncate font-medium">{s.judul}</span>
                                    <span className="truncate text-sm text-muted-foreground">{s.ket}</span>
                                </span>
                                <span className="hidden grid-cols-[minmax(0,1fr)_44px] items-center gap-x-3 sm:grid">
                                    <span aria-hidden className="h-2 overflow-hidden rounded-full bg-muted">
                                        <span className="block h-full rounded-full bg-primary" style={{ width: `${s.lebar}%` }} />
                                    </span>
                                    <span className="text-right font-medium tabular-nums">{s.persen}</span>
                                </span>
                                <Tooltip>
                                    <TooltipTrigger
                                        render={<span tabIndex={0} className="flex flex-col items-end rounded outline-none focus-visible:ring-2 focus-visible:ring-ring" />}
                                    >
                                        <span className="font-medium whitespace-nowrap tabular-nums underline decoration-dotted underline-offset-[3px]">{s.nilai}</span>
                                        <span className="text-sm text-muted-foreground">{s.nilaiKet}</span>
                                    </TooltipTrigger>
                                    <TooltipContent className="grid grid-cols-[10px_auto_auto_auto] items-center gap-x-2.5 gap-y-1.5 px-3 py-2.5 text-sm">
                                        <span className="col-span-full font-medium">{ramai ? 'Pemasukan per lapangan' : 'Potensi per lapangan'}</span>
                                        <span />
                                        <span className="opacity-70">Lapangan</span>
                                        <span className="text-right opacity-70">Terisi</span>
                                        <span className="text-right opacity-70">{ramai ? 'Pemasukan' : 'Tambahan'}</span>
                                        {s.rinci.map((r) => (
                                            <span key={r.nama} className="contents">
                                                <span className="size-2.5 rounded-[2px]" style={{ background: r.warna }} />
                                                <span>{r.nama}</span>
                                                <span className="text-right tabular-nums">
                                                    {r.isi} <span className="opacity-70">/ {r.rata}</span>
                                                </span>
                                                <span className="text-right tabular-nums">{r.nilai}</span>
                                            </span>
                                        ))}
                                    </TooltipContent>
                                </Tooltip>
                            </li>
                        ))}
                    </ul>
                    <span className="min-h-10 text-sm text-muted-foreground">
                        {ramai
                            ? 'Angka di kanan adalah pemasukan rata-rata per bulan dari jam itu, dengan tarif tiap lapangan. Hindari jadwal perawatan di jam ini.'
                            : 'Angka di kanan adalah tambahan pemasukan bila tiap lapangan di jam itu seramai rata-rata lapangan itu sendiri, dengan tarifnya masing-masing. Arahkan kursor ke angka untuk melihat rinciannya. Cocok untuk promo atau jadwal perawatan.'}
                    </span>
                </div>
            </Kartu>

            <Kartu judul="Kebiasaan penyewa" ket="Lama main dan seberapa jauh hari penyewa memesan.">
                <div className="flex flex-col gap-3.5">
                    <span className="font-medium">Lama main per booking</span>
                    <DaftarBatang baris={data.lamaMain} />
                </div>
                <div className="flex flex-col gap-3.5 border-t pt-6">
                    <div className="flex flex-col gap-0.5">
                        <span className="font-medium">Jarak booking ke hari main</span>
                        <span className="text-sm text-muted-foreground">Dihitung dari tanggal booking dibuat.</span>
                    </div>
                    <DaftarBatang baris={data.jarak} />
                </div>
            </Kartu>
        </>
    );
}
