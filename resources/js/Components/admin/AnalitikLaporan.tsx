import { formatRupiah } from '@/Components/ui/format';
import { cn } from 'cn';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { ReactNode, useMemo, useState } from 'react';

type Peta = Record<string, number>;

/** Angka satu bulan dari AnalitikLaporan::untuk (server). Peta PHP bisa datang sebagai array atau objek. */
export type Analitik = {
    pemasukan: number;
    booking: number;
    jamTerisi: number;
    kapasitas: number;
    hariBulan: number;
    geser: number;
    lapangan: { id: number; nama: string }[];
    harian: Record<string, Record<string, [number, number]>> | [];
    peta: { isi: number[][]; tanggal: number[][]; jumlahLapangan: number };
    perLapangan: { nama: string; jam: number; kapasitas: number; booking: number }[];
    funnel: {
        masuk: number;
        terkonfirmasi: { n: number; rp: number };
        batal: Record<'otomatis' | 'penyewa' | 'pengelola', { n: number; rp: number }>;
        tolak: { n: number; rp: number };
    };
};

const WARNA_LAPANGAN = ['var(--primary)', '#0891b2', '#7c3aed', '#f59e0b', '#16a34a', '#e11d48'];
const warnaLapangan = (i: number) => WARNA_LAPANGAN[i % WARNA_LAPANGAN.length];
const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const persen = (x: number) => `${(Math.round(x * 1000) / 10).toLocaleString('id-ID')}%`;
const angka = (n: number) => n.toLocaleString('id-ID');

function Kartu({ judul, ket, aksi, children, className }: { judul: string; ket?: string; aksi?: ReactNode; children: ReactNode; className?: string }) {
    return (
        <section className={cn('flex flex-col gap-4 rounded-lg border bg-card p-5 shadow-xs', className)}>
            <header className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h3 className="font-medium">{judul}</h3>
                    {ket && <p className="text-sm text-muted-foreground">{ket}</p>}
                </div>
                {aksi}
            </header>
            {children}
        </section>
    );
}

// ---------------------------------------------------------------- tiga angka utama

function Selisih({ kini, lalu }: { kini: number; lalu: number }) {
    if (!lalu) return <span className="text-xs text-muted-foreground">Bulan lalu belum ada data</span>;
    const d = (kini - lalu) / lalu;
    const Ikon = d > 0.0005 ? ArrowUpRight : d < -0.0005 ? ArrowDownRight : Minus;
    return (
        <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium', d > 0.0005 ? 'text-accessible-green' : d < -0.0005 ? 'text-accessible-red' : 'text-muted-foreground')}>
            <Ikon className="size-3.5" />
            {persen(Math.abs(d))} dari bulan lalu
        </span>
    );
}

export function AngkaUtama({ kini, lalu }: { kini: Analitik; lalu: Analitik }) {
    const item = [
        { judul: 'Pemasukan', nilai: formatRupiah(kini.pemasukan), ket: `Dari ${kini.booking} pembayaran terverifikasi`, a: kini.pemasukan, b: lalu.pemasukan },
        {
            judul: 'Lapangan terisi',
            nilai: persen(kini.kapasitas ? kini.jamTerisi / kini.kapasitas : 0),
            ket: `${angka(kini.jamTerisi)} dari ${angka(kini.kapasitas)} jam terisi`,
            a: kini.kapasitas ? kini.jamTerisi / kini.kapasitas : 0,
            b: lalu.kapasitas ? lalu.jamTerisi / lalu.kapasitas : 0,
        },
        { judul: 'Total booking', nilai: `${kini.booking} booking`, ket: 'Sudah dibayar dan dikonfirmasi', a: kini.booking, b: lalu.booking },
    ];
    return (
        <div className="grid gap-4 md:grid-cols-3">
            {item.map((m) => (
                <div key={m.judul} className="flex flex-col gap-1 rounded-lg border bg-card p-5 shadow-xs">
                    <span className="text-sm text-muted-foreground">{m.judul}</span>
                    <span className="text-2xl leading-8 font-semibold tabular-nums">{m.nilai}</span>
                    <span className="text-xs text-muted-foreground">{m.ket}</span>
                    <Selisih kini={m.a} lalu={m.b} />
                </div>
            ))}
        </div>
    );
}

// ---------------------------------------------------------------- pemasukan per lapangan

type Kelompok = { dari: number; sampai: number; per: number[]; kali: number[] };

export function GrafikPemasukan({ data, bulan, tahun }: { data: Analitik; bulan: number; tahun: number }) {
    const [skala, setSkala] = useState<'minggu' | 'hari'>('minggu');
    const [animKe, setAnimKe] = useState(0);
    const harian = data.harian as Record<string, Record<string, [number, number]>>;

    const kelompok = useMemo(() => {
        const out: Kelompok[] = [];
        const indeks = (d: number) => (skala === 'hari' ? d - 1 : Math.floor((d - 1 + data.geser) / 7));
        for (let d = 1; d <= data.hariBulan; d++) {
            const k = indeks(d);
            out[k] ??= { dari: d, sampai: d, per: data.lapangan.map(() => 0), kali: data.lapangan.map(() => 0) };
            out[k].sampai = d;
            data.lapangan.forEach((l, c) => {
                const v = harian[d]?.[l.id];
                if (v) {
                    out[k].per[c] += v[0];
                    out[k].kali[c] += v[1];
                }
            });
        }
        return out;
    }, [data, skala, harian]);

    const jumlah = (g: Kelompok) => g.per.reduce((a, v) => a + v, 0);
    const maks = Math.max(1, ...kelompok.map(jumlah));
    const kasar = maks / 4;
    const p10 = Math.pow(10, Math.floor(Math.log10(kasar)));
    const langkah = ([1, 2, 2.5, 5, 10].find((x) => x * p10 >= kasar) ?? 10) * p10;
    const puncak = Math.ceil(maks / langkah) * langkah;
    const singkat = (v: number) => (v >= 1e6 ? `${(v / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 2 })} jt` : v >= 1000 ? `${v / 1000} rb` : String(v));
    const sumbu = Array.from({ length: Math.round(puncak / langkah) + 1 }, (_, j) => j * langkah);
    const bln3 = NAMA_BULAN[bulan - 1].slice(0, 3);
    const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    const ganti = (k: 'minggu' | 'hari') => {
        if (k === skala) return;
        setSkala(k);
        setAnimKe((n) => n + 1);
    };

    return (
        <Kartu
            judul="Pemasukan per lapangan"
            ket={`Per ${skala}, hanya pembayaran terverifikasi`}
            aksi={
                <div role="group" aria-label="Skala grafik" className="inline-flex rounded-lg bg-muted p-0.5 text-sm">
                    {(['minggu', 'hari'] as const).map((k) => (
                        <button
                            key={k}
                            type="button"
                            aria-pressed={skala === k}
                            onClick={() => ganti(k)}
                            className={cn('cursor-pointer rounded-md px-3 py-1 capitalize transition-colors', skala === k ? 'bg-background font-medium shadow-sm' : 'text-foreground/60 hover:text-foreground')}
                        >
                            {k}
                        </button>
                    ))}
                </div>
            }
        >
            <div role="img" aria-label={`Grafik pemasukan per ${skala} ${NAMA_BULAN[bulan - 1]} ${tahun}, bertumpuk per lapangan`} className="flex gap-3">
                <div className="relative h-56 w-12 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                    {sumbu.map((v) => (
                        <span key={v} className="absolute right-0 translate-y-1/2" style={{ bottom: `${(v / puncak) * 100}%` }}>
                            {singkat(v)}
                        </span>
                    ))}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="relative h-56">
                        {sumbu.map((v) => (
                            <div key={v} className="absolute inset-x-0 border-t border-dashed border-border" style={{ bottom: `${(v / puncak) * 100}%` }} />
                        ))}
                        <div className="relative flex h-full items-end justify-around gap-1">
                            {kelompok.map((g, i) => {
                                const total = jumlah(g);
                                const judul =
                                    skala === 'hari'
                                        ? `${HARI[new Date(tahun, bulan - 1, g.dari).getDay()]}, ${g.dari} ${NAMA_BULAN[bulan - 1]} ${tahun}`
                                        : `${g.dari}–${g.sampai} ${NAMA_BULAN[bulan - 1]} ${tahun}`;
                                return (
                                    <div key={`${animKe}-${i}`} className="group relative flex h-full min-w-0 flex-1 items-end justify-center rounded-sm hover:bg-muted" style={{ paddingInline: skala === 'hari' ? 1.5 : 12 }}>
                                        <div
                                            className="batang-grafik flex w-full origin-bottom flex-col-reverse overflow-hidden rounded-t-sm"
                                            style={{ height: `${(total / puncak) * 100}%`, maxWidth: skala === 'hari' ? 16 : 48, animation: `naik-grafik ${animKe ? '.5s' : '.7s'} ${i * (skala === 'hari' ? 12 : 50)}ms cubic-bezier(.2,.7,.2,1) backwards` }}
                                        >
                                            {data.lapangan.map((l, c) => (
                                                <div key={l.id} style={{ height: `${total ? (g.per[c] / total) * 100 : 0}%`, background: warnaLapangan(c) }} />
                                            ))}
                                        </div>
                                        <div role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 hidden w-60 -translate-x-1/2 rounded-lg border bg-popover p-3 text-xs shadow-lg group-hover:block">
                                            <p className="mb-2 font-medium">{judul}</p>
                                            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 gap-y-1 tabular-nums">
                                                <span className="text-muted-foreground">Lapangan</span>
                                                <span className="text-right text-muted-foreground">Booking</span>
                                                <span className="text-right text-muted-foreground">Pemasukan</span>
                                                <span className="text-right text-muted-foreground">Porsi</span>
                                                {data.lapangan.map((l, c) => (
                                                    <TipBaris key={l.id} warna={warnaLapangan(c)} nama={l.nama} n={g.kali[c]} rp={g.per[c]} pct={total ? Math.round((g.per[c] / total) * 100) : 0} />
                                                ))}
                                                <span className="border-t pt-1 font-medium">Total</span>
                                                <span className="border-t pt-1 text-right">{g.kali.reduce((a, v) => a + v, 0)}×</span>
                                                <span className="border-t pt-1 text-right font-medium">{formatRupiah(total)}</span>
                                                <span className="border-t pt-1 text-right">100%</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="mt-2 flex justify-around gap-1 text-xs text-muted-foreground">
                        {kelompok.map((g, i) => (
                            <span key={i} className="min-w-0 flex-1 text-center">
                                {skala === 'hari' ? (g.dari === 1 || g.dari % 5 === 0 ? g.dari : '') : `${g.dari}–${g.sampai} ${bln3}`}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {data.lapangan.map((l, c) => (
                    <span key={l.id} className="inline-flex items-center gap-1.5">
                        <span className="size-2.5 rounded-sm" style={{ background: warnaLapangan(c) }} />
                        {l.nama}
                    </span>
                ))}
            </div>
        </Kartu>
    );
}

function TipBaris({ warna, nama, n, rp, pct }: { warna: string; nama: string; n: number; rp: number; pct: number }) {
    return (
        <>
            <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-sm" style={{ background: warna }} />
                {nama}
            </span>
            <span className="text-right">{n}×</span>
            <span className="text-right">{formatRupiah(rp)}</span>
            <span className="text-right">{pct}%</span>
        </>
    );
}

// ---------------------------------------------------------------- jam tersibuk

export function PetaJam({ data }: { data: Analitik }) {
    const HARI = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    const HARI_PANJANG = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const { isi, tanggal, jumlahLapangan } = data.peta;
    const jamBuka = isi[0]?.length ?? 14;
    const sedia = (h: number) => tanggal[h].length * jumlahLapangan;
    const pct = (h: number, j: number) => (sedia(h) ? isi[h][j] / sedia(h) : 0);
    let puncak = { h: 0, j: 0, v: -1 };
    HARI.forEach((_, h) => isi[h].forEach((_, j) => pct(h, j) > puncak.v && (puncak = { h, j, v: pct(h, j) })));
    const jam = (j: number) => `${String(8 + j).padStart(2, '0')}:00`;

    return (
        <Kartu judul="Jam tersibuk" ket="Rata-rata lapangan terisi per hari dan jam. Arahkan kursor ke kotak untuk rinciannya.">
            <div className="overflow-x-auto">
                <div className="grid min-w-[420px] gap-1" style={{ gridTemplateColumns: `40px repeat(${jamBuka}, minmax(0, 1fr))` }}>
                    <span />
                    {Array.from({ length: jamBuka }, (_, j) => (
                        <span key={j} className="text-center text-[10px] text-muted-foreground tabular-nums">
                            {j % 2 === 0 ? String(8 + j).padStart(2, '0') : ''}
                        </span>
                    ))}
                    {HARI.map((nm, h) => (
                        <div key={nm} className="contents">
                            <span className="flex h-6 items-center text-xs text-muted-foreground">{nm}</span>
                            {isi[h].map((_, j) => {
                                const p = pct(h, j);
                                return (
                                    <span
                                        key={j}
                                        title={`${HARI_PANJANG[h]}, ${jam(j)}: ${persen(p)} terisi (${isi[h][j]} dari ${sedia(h)} jam sewa) · tanggal ${tanggal[h].join(', ') || '-'}`}
                                        className="block h-6 cursor-default rounded-[4px] hover:ring-2 hover:ring-foreground"
                                        style={{ background: `color-mix(in oklab, var(--primary) ${Math.round(p * 100)}%, var(--muted))` }}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                    {puncak.v > 0 ? `Paling ramai: ${HARI_PANJANG[puncak.h]} pukul ${jam(puncak.j)} (${persen(puncak.v)})` : 'Belum ada booking terkonfirmasi'}
                </span>
                <span className="inline-flex items-center gap-2">
                    Sepi
                    <span className="h-2 w-24 rounded-full" style={{ background: 'linear-gradient(to right, var(--muted), var(--primary))' }} />
                    Ramai
                </span>
            </div>
        </Kartu>
    );
}

// ---------------------------------------------------------------- keterisian per lapangan

export function KeterisianLapangan({ data }: { data: Analitik }) {
    const baris = data.perLapangan
        .map((l, i) => ({ ...l, warna: warnaLapangan(i), p: l.kapasitas ? l.jam / l.kapasitas : 0 }))
        .sort((a, b) => b.p - a.p);
    return (
        <Kartu judul="Keterisian per lapangan" ket="Jam terisi dibanding jam buka (08:00–22:00)">
            <ul className="flex flex-col gap-4">
                {baris.map((l) => (
                    <li key={l.nama} className="flex flex-col gap-1.5">
                        <div className="flex items-baseline justify-between gap-2">
                            <span className="inline-flex items-center gap-2 font-medium">
                                <span className="size-2.5 rounded-sm" style={{ background: l.warna }} />
                                {l.nama}
                            </span>
                            <span className="tabular-nums">{persen(l.p)}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, l.p * 100)}%`, background: l.warna }} />
                        </div>
                        <span className="text-xs text-muted-foreground">
                            {l.jam} dari {l.kapasitas} jam · {l.booking} booking
                        </span>
                    </li>
                ))}
            </ul>
        </Kartu>
    );
}

// ---------------------------------------------------------------- booking dan pembatalan

const SEBAB = [
    { k: 'otomatis', nama: 'Tidak dibayar dalam 60 menit', warna: '#f59e0b', kalimat: 'karena tidak dibayar dalam batas waktu' },
    { k: 'penyewa', nama: 'Dibatalkan penyewa', warna: '#0ea5e9', kalimat: 'dibatalkan sendiri oleh penyewa' },
    { k: 'pengelola', nama: 'Dibatalkan pengelola', warna: '#7c3aed', kalimat: 'dibatalkan pengelola' },
] as const;

export function BookingDanBatal({ data, bulan }: { data: Analitik; bulan: number }) {
    const f = data.funnel;
    const batalN = SEBAB.reduce((a, s) => a + f.batal[s.k].n, 0);
    const batalRp = SEBAB.reduce((a, s) => a + f.batal[s.k].rp, 0);
    const pct = (n: number) => `${f.masuk ? Math.round((n / f.masuk) * 100) : 0}%`;
    const lebar = (n: number) => `${f.masuk ? (n / f.masuk) * 100 : 0}%`;
    const terbesar = SEBAB.slice().sort((a, b) => f.batal[b.k].n - f.batal[a.k].n)[0];
    const jt = (v: number) => (v >= 1e6 ? `Rp${(v / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt` : formatRupiah(v));

    const baris: { label: string; n: number; seg: { lebar: string; warna: string; judul: string }[] }[] = [
        { label: 'Booking masuk', n: f.masuk, seg: f.masuk ? [{ lebar: '100%', warna: 'color-mix(in oklab, var(--foreground) 22%, var(--muted))', judul: `${f.masuk} booking dengan jadwal main di ${NAMA_BULAN[bulan - 1]}` }] : [] },
        { label: 'Terkonfirmasi', n: f.terkonfirmasi.n, seg: f.terkonfirmasi.n ? [{ lebar: lebar(f.terkonfirmasi.n), warna: 'var(--primary)', judul: `${f.terkonfirmasi.n} booking · ${formatRupiah(f.terkonfirmasi.rp)}` }] : [] },
        { label: 'Dibatalkan', n: batalN, seg: SEBAB.filter((s) => f.batal[s.k].n).map((s) => ({ lebar: lebar(f.batal[s.k].n), warna: s.warna, judul: `${s.nama}: ${f.batal[s.k].n} booking · ${formatRupiah(f.batal[s.k].rp)}` })) },
    ];
    if (f.tolak.n) baris.push({ label: 'Bukti ditolak', n: f.tolak.n, seg: [{ lebar: lebar(f.tolak.n), warna: 'var(--muted-foreground)', judul: `${f.tolak.n} booking · penyewa belum mengirim ulang bukti` }] });

    return (
        <Kartu judul="Booking dan pembatalan" ket="Booking dengan jadwal main di periode ini. Bukti yang masih menunggu verifikasi tidak dihitung.">
            <ul className="flex flex-col gap-3">
                {baris.map((b) => (
                    <li key={b.label} className="grid grid-cols-[110px_minmax(0,1fr)_auto] items-center gap-3 text-sm sm:grid-cols-[130px_minmax(0,1fr)_90px]">
                        <span>{b.label}</span>
                        <div className="flex h-6 overflow-hidden rounded-md bg-muted">
                            {b.seg.map((s, i) => (
                                <div key={i} title={s.judul} style={{ width: s.lebar, background: s.warna }} />
                            ))}
                        </div>
                        <span className="text-right tabular-nums">
                            {b.n} <span className="text-muted-foreground">· {pct(b.n)}</span>
                        </span>
                    </li>
                ))}
            </ul>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {SEBAB.map((s) => (
                    <span key={s.k} className="inline-flex items-center gap-1.5">
                        <span className="size-2 rounded-sm" style={{ background: s.warna }} />
                        {s.nama}
                    </span>
                ))}
            </div>
            <div className="rounded-lg bg-muted/60 p-4">
                <p className="text-sm text-muted-foreground">Pemasukan yang batal</p>
                <p className="text-xl font-semibold tabular-nums">{jt(batalRp)}</p>
                <p className="text-sm text-muted-foreground">
                    {batalN
                        ? `${f.batal[terbesar.k].n} dari ${batalN} pembatalan ${terbesar.kalimat}.`
                        : 'Tidak ada booking yang dibatalkan di periode ini.'}
                </p>
            </div>
        </Kartu>
    );
}
