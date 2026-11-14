import { Badge } from '@/Components/ui/badge';
import { formatRupiah } from '@/Components/ui/format';
import { cn } from 'cn';
import { CalendarCheck, Gauge, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { ReactNode, useMemo, useState } from 'react';

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

/**
 * Isi kartu analitik halaman Laporan pembayaran (kanvas "Redesign Dashboard Admin", artboard Admin-Laporan):
 * tiga angka utama dibanding bulan lalu, lalu empat grafik 2 x 2 dalam satu kartu.
 */
export default function AnalitikLaporan({ kini, lalu, bulan, tahun, sementara = false }: { kini: Analitik; lalu: Analitik; bulan: number; tahun: number; sementara?: boolean }) {
    return (
        <div className="flex flex-col gap-6 rounded-xl border bg-card px-4 py-6 text-card-foreground shadow-sm sm:px-6">
            {sementara && (
                <p className="-mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge data-nada="oranye">Sementara</Badge>
                    Bulan ini masih berjalan, jadi angkanya terus bertambah dan belum dibandingkan dengan bulan lalu.
                </p>
            )}
            <AngkaUtama kini={kini} lalu={lalu} bulan={bulan} tahun={tahun} sementara={sementara} />
            <div className="grid gap-4 lg:grid-cols-2">
                <GrafikPemasukan key={`${tahun}-${bulan}`} data={kini} bulan={bulan} tahun={tahun} />
                <PetaJam data={kini} bulan={bulan} />
                <KeterisianLapangan data={kini} />
                <BookingDanBatal data={kini} bulan={bulan} />
            </div>
        </div>
    );
}

function Bagian({ judul, ket, aksi, children }: { judul: string; ket: string; aksi?: ReactNode; children: ReactNode }) {
    return (
        <section className="flex min-w-0 flex-col gap-4 rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                    <h3 className="font-medium">{judul}</h3>
                    <p className="text-sm text-muted-foreground">{ket}</p>
                </div>
                {aksi}
            </div>
            {children}
        </section>
    );
}

/** Tooltip gelap tiga baris (peta jam dan funnel), muncul saat elemen induk `group` disorot. */
function TipGelap({ t1, t2, t3, className }: { t1: string; t2: string; t3?: string; className?: string }) {
    return (
        <span
            role="tooltip"
            className={cn(
                'pointer-events-none absolute bottom-[calc(100%+6px)] z-20 hidden flex-col gap-0.5 rounded-md bg-foreground px-3 py-1.5 text-left text-xs whitespace-nowrap text-background group-hover:flex',
                className,
            )}
        >
            <span className="font-semibold">{t1}</span>
            <span>{t2}</span>
            {t3 && <span className="text-background/70">{t3}</span>}
        </span>
    );
}

// ---------------------------------------------------------------- tiga angka utama

function AngkaUtama({ kini, lalu, bulan, tahun, sementara }: { kini: Analitik; lalu: Analitik; bulan: number; tahun: number; sementara: boolean }) {
    const terisi = (a: Analitik) => (a.kapasitas ? a.jamTerisi / a.kapasitas : 0);
    const banding = `Dibanding ${bulan === 1 ? `Desember ${tahun - 1}` : `${NAMA_BULAN[bulan - 2]} ${tahun}`}`;
    const item = [
        { judul: 'Pemasukan', Ikon: Wallet, nilai: formatRupiah(kini.pemasukan), ket: `Dari ${kini.booking} pembayaran terverifikasi`, a: kini.pemasukan, b: lalu.pemasukan },
        {
            judul: 'Lapangan terisi',
            Ikon: Gauge,
            nilai: persen(terisi(kini)),
            ket: `${angka(kini.jamTerisi)} dari ${angka(kini.kapasitas)} jam terisi`,
            a: terisi(kini),
            b: terisi(lalu),
        },
        { judul: 'Total booking', Ikon: CalendarCheck, nilai: `${kini.booking} booking`, ket: 'Sudah dibayar dan dikonfirmasi', a: kini.booking, b: lalu.booking },
    ];
    return (
        <div className="grid gap-6 md:grid-cols-3">
            {item.map((m, i) => {
                // bulan lalu tanpa data, atau bulan ini belum selesai: tidak ada pembanding
                const pct = m.b && !sementara ? Math.round(((m.a - m.b) / m.b) * 100) : null;
                return (
                    <div key={m.judul} className={cn('flex min-w-0 flex-col gap-1.5', i > 0 && 'md:border-l md:pl-6')}>
                        <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5 font-medium">
                                <m.Ikon className="size-4 text-muted-foreground" aria-hidden />
                                {m.judul}
                            </span>
                            {pct !== null && (
                                <span
                                    title={banding}
                                    className={cn(
                                        'flex items-center gap-1 text-sm font-medium whitespace-nowrap',
                                        pct > 0 ? 'text-accessible-green' : pct < 0 ? 'text-accessible-red' : 'text-muted-foreground',
                                    )}
                                >
                                    {pct > 0 && <TrendingUp className="size-3.5" aria-hidden />}
                                    {pct < 0 && <TrendingDown className="size-3.5" aria-hidden />}
                                    {pct === 0 ? 'Tetap' : `${pct > 0 ? 'Naik' : 'Turun'} ${Math.abs(pct)}%`}
                                </span>
                            )}
                        </div>
                        <span className="text-2xl leading-8 font-semibold tracking-tight tabular-nums">{m.nilai}</span>
                        <span className="text-sm text-muted-foreground">{m.ket}</span>
                    </div>
                );
            })}
        </div>
    );
}

// ---------------------------------------------------------------- pemasukan per lapangan

type Kelompok = { dari: number; sampai: number; per: number[]; kali: number[] };

function GrafikPemasukan({ data, bulan, tahun }: { data: Analitik; bulan: number; tahun: number }) {
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
    const hari = skala === 'hari';

    const ganti = (k: 'minggu' | 'hari') => {
        if (k === skala) return;
        setSkala(k);
        setAnimKe((n) => n + 1);
    };

    return (
        <Bagian
            judul="Pemasukan per lapangan"
            ket={`Per ${skala}, hanya pembayaran terverifikasi`}
            aksi={
                // segmented control = Tabs default di ui/tabs.tsx
                <div role="tablist" aria-label="Skala grafik pemasukan" className="inline-flex h-8 shrink-0 items-center rounded-lg bg-muted p-[3px] text-muted-foreground">
                    {(['minggu', 'hari'] as const).map((k) => (
                        <button
                            key={k}
                            type="button"
                            role="tab"
                            aria-selected={skala === k}
                            onClick={() => ganti(k)}
                            className={cn(
                                'h-[calc(100%-1px)] cursor-pointer rounded-md border border-transparent px-3 text-sm font-medium capitalize transition-colors',
                                skala === k ? 'bg-background text-foreground shadow-sm' : 'hover:text-foreground',
                            )}
                        >
                            {k}
                        </button>
                    ))}
                </div>
            }
        >
            <div
                role="img"
                aria-label={`Grafik pemasukan per ${skala} ${NAMA_BULAN[bulan - 1]} ${tahun}, bertumpuk per lapangan`}
                className="grid grid-cols-[48px_minmax(0,1fr)] grid-rows-[228px_auto] text-xs"
            >
                <div className="relative">
                    {sumbu.map((v) => (
                        <span key={v} className="absolute right-2 translate-y-1/2 whitespace-nowrap text-muted-foreground tabular-nums" style={{ bottom: `${(v / puncak) * 100}%` }}>
                            {singkat(v)}
                        </span>
                    ))}
                </div>
                <div className="relative">
                    {/* garis grid: tipis dan utuh, warna border 50% */}
                    {sumbu.map((v) => (
                        <span key={v} aria-hidden className="absolute inset-x-0 border-t border-border/50" style={{ bottom: `${(v / puncak) * 100}%` }} />
                    ))}
                    <div className="absolute inset-0 flex items-stretch">
                        {kelompok.map((g, i) => {
                            const total = jumlah(g);
                            const judul = hari
                                ? `${HARI[new Date(tahun, bulan - 1, g.dari).getDay()]}, ${g.dari} ${NAMA_BULAN[bulan - 1]} ${tahun}`
                                : `${g.dari}–${g.sampai} ${NAMA_BULAN[bulan - 1]} ${tahun}`;
                            // kolom paling kanan membuka tooltip ke kiri supaya tidak keluar kartu
                            const kanan = i >= kelompok.length - (hari ? 8 : 2);
                            return (
                                <div
                                    key={`${animKe}-${i}`}
                                    className="group relative flex min-w-0 flex-1 items-end justify-center hover:bg-muted"
                                    style={{ paddingInline: hari ? 1.5 : 12 }}
                                >
                                    <div
                                        className="batang-grafik flex flex-[1_1_0] origin-bottom flex-col-reverse overflow-hidden rounded-t"
                                        style={{
                                            height: `${(total / puncak) * 100}%`,
                                            maxWidth: hari ? 16 : 48,
                                            animation: `naik-grafik 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) ${i * (hari ? 12 : 50)}ms both`,
                                        }}
                                    >
                                        {data.lapangan.map((l, c) => (
                                            <div key={l.id} className="flex-none" style={{ height: `${total ? (g.per[c] / total) * 100 : 0}%`, background: warnaLapangan(c) }} />
                                        ))}
                                    </div>
                                    <div
                                        role="tooltip"
                                        className={cn(
                                            'pointer-events-none absolute top-0 z-10 hidden gap-2 rounded-lg border bg-popover px-2.5 py-2 whitespace-nowrap text-popover-foreground shadow-lg group-hover:grid',
                                            kanan ? (hari ? 'right-[calc(100%+4px)]' : 'right-[calc(50%+32px)]') : hari ? 'left-[calc(100%+4px)]' : 'left-[calc(50%+32px)]',
                                        )}
                                    >
                                        <span className="font-medium">{judul}</span>
                                        <div className="grid grid-cols-[10px_auto_auto_auto_auto] items-center gap-x-2 gap-y-1.5 tabular-nums">
                                            <span />
                                            <span className="text-muted-foreground">Lapangan</span>
                                            <span className="pl-2 text-right text-muted-foreground">Booking</span>
                                            <span className="pl-2 text-right text-muted-foreground">Pemasukan</span>
                                            <span className="pl-1 text-right text-muted-foreground">Porsi</span>
                                            {data.lapangan.map((l, c) => (
                                                <TipBaris key={l.id} warna={warnaLapangan(c)} nama={l.nama} n={g.kali[c]} rp={g.per[c]} pct={total ? Math.round((g.per[c] / total) * 100) : 0} />
                                            ))}
                                            <span className="col-span-full h-px bg-border" />
                                            <span />
                                            <span className="font-medium">Total</span>
                                            <span className="text-right font-medium">{g.kali.reduce((a, v) => a + v, 0)}</span>
                                            <span className="text-right font-semibold">{formatRupiah(total)}</span>
                                            <span className="text-right text-muted-foreground">100%</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div />
                <div className="flex items-start pt-2">
                    {kelompok.map((g, i) => (
                        // di HP label minggu turun ke dua baris supaya tidak saling menimpa
                        <span key={i} className="min-w-0 flex-1 text-center leading-tight text-muted-foreground sm:whitespace-nowrap">
                            {hari ? (g.dari === 1 || g.dari % 5 === 0 ? g.dari : '') : `${g.dari}–${g.sampai} ${bln3}`}
                        </span>
                    ))}
                </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {data.lapangan.map((l, c) => (
                    <span key={l.id} className="inline-flex items-center gap-1.5">
                        <span className="size-2.5 rounded-xs" style={{ background: warnaLapangan(c) }} />
                        {l.nama}
                    </span>
                ))}
            </div>
        </Bagian>
    );
}

function TipBaris({ warna, nama, n, rp, pct }: { warna: string; nama: string; n: number; rp: number; pct: number }) {
    return (
        <>
            <span className="size-2.5 rounded-xs" style={{ background: warna }} />
            <span>{nama}</span>
            <span className="text-right">{n}</span>
            <span className="text-right font-medium">{formatRupiah(rp)}</span>
            <span className="text-right text-muted-foreground">{pct}%</span>
        </>
    );
}

// ---------------------------------------------------------------- jam tersibuk

function PetaJam({ data, bulan }: { data: Analitik; bulan: number }) {
    const HARI = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    const HARI_PANJANG = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const { isi, tanggal, jumlahLapangan } = data.peta;
    const jamBuka = isi[0]?.length ?? 14;
    const sedia = (h: number) => tanggal[h].length * jumlahLapangan;
    const pct = (h: number, j: number) => (sedia(h) ? isi[h][j] / sedia(h) : 0);
    let puncak = { h: 0, j: 0, v: -1 };
    HARI.forEach((_, h) => isi[h].forEach((_, j) => pct(h, j) > puncak.v && (puncak = { h, j, v: pct(h, j) })));
    const dua = (n: number) => String(n).padStart(2, '0');
    const bln3 = NAMA_BULAN[bulan - 1].slice(0, 3);

    return (
        <Bagian judul="Jam tersibuk" ket="Rata-rata lapangan terisi per hari dan jam. Arahkan kursor ke kotak untuk rinciannya.">
            <div role="img" aria-label="Peta keterisian per hari dan jam" className="grid items-center gap-[3px] text-xs" style={{ gridTemplateColumns: `32px repeat(${jamBuka}, minmax(0, 1fr))` }}>
                {HARI.map((nm, h) => (
                    <div key={nm} className="contents">
                        <span className="text-muted-foreground">{nm}</span>
                        {isi[h].map((_, j) => {
                            const v = pct(h, j);
                            // warna penuh pada 80% terisi, supaya jam ramai terlihat jelas
                            return (
                                <span
                                    key={j}
                                    className="group relative block h-[26px] cursor-default rounded hover:shadow-[inset_0_0_0_1.5px_var(--foreground)]"
                                    style={{ background: `color-mix(in oklab, var(--primary) ${Math.round(Math.min(1, v / 0.8) * 100)}%, var(--muted))` }}
                                >
                                    <TipGelap
                                        t1={`${HARI_PANJANG[h]}, ${dua(8 + j)}.00–${dua(9 + j)}.00`}
                                        t2={`${Math.round(v * 100)}% terisi · ${isi[h][j]} dari ${sedia(h)} jam sewa`}
                                        t3={`${tanggal[h].length} hari ${HARI_PANJANG[h]}: ${tanggal[h].join(', ')} ${bln3}`}
                                        className={j < 4 ? 'left-0' : j > jamBuka - 5 ? 'right-0' : 'left-1/2 -translate-x-1/2'}
                                    />
                                </span>
                            );
                        })}
                    </div>
                ))}
                <span />
                {Array.from({ length: jamBuka }, (_, j) => (
                    <span key={j} className="text-center text-muted-foreground tabular-nums">
                        {j % 2 === 0 ? dua(8 + j) : ''}
                    </span>
                ))}
            </div>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                <span className="text-foreground">
                    {puncak.v > 0
                        ? `Paling ramai: ${HARI_PANJANG[puncak.h]} ${dua(8 + puncak.j)}.00 (${Math.round(puncak.v * 100)}% terisi)`
                        : 'Belum ada jam terisi di periode ini.'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                    Sepi
                    <span className="inline-flex gap-0.5">
                        {[0, 25, 50, 75, 100].map((p) => (
                            <span key={p} className="h-2.5 w-3.5 rounded-xs" style={{ background: `color-mix(in oklab, var(--primary) ${p}%, var(--muted))` }} />
                        ))}
                    </span>
                    Ramai
                </span>
            </div>
        </Bagian>
    );
}

// ---------------------------------------------------------------- keterisian per lapangan

function KeterisianLapangan({ data }: { data: Analitik }) {
    const baris = data.perLapangan
        .map((l, i) => ({ ...l, warna: warnaLapangan(i), p: l.kapasitas ? l.jam / l.kapasitas : 0 }))
        .sort((a, b) => b.p - a.p);
    return (
        <Bagian judul="Keterisian per lapangan" ket="Jam terisi dibanding jam buka (08.00–22.00)">
            <ul className="my-auto flex flex-col gap-3.5">
                {baris.map((l) => (
                    <li key={l.nama} className="flex flex-col gap-1.5">
                        <div className="flex items-baseline gap-2">
                            <span className="truncate font-medium">{l.nama}</span>
                            <span className="ml-auto text-sm whitespace-nowrap text-muted-foreground tabular-nums">
                                {l.jam} dari {l.kapasitas} jam · {l.booking} booking
                            </span>
                            <span className="w-11 text-right font-semibold tabular-nums">{Math.round(l.p * 100)}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, l.p * 100)}%`, background: l.warna }} />
                        </div>
                    </li>
                ))}
            </ul>
        </Bagian>
    );
}

// ---------------------------------------------------------------- booking dan pembatalan

const SEBAB = [
    { k: 'otomatis', nama: 'Tidak dibayar dalam 60 menit', warna: '#f59e0b', kalimat: 'karena tidak dibayar dalam 60 menit' },
    { k: 'penyewa', nama: 'Dibatalkan penyewa', warna: '#0ea5e9', kalimat: 'dibatalkan sendiri oleh penyewa' },
    { k: 'pengelola', nama: 'Dibatalkan pengelola', warna: '#7c3aed', kalimat: 'dibatalkan pengelola' },
] as const;

function BookingDanBatal({ data, bulan }: { data: Analitik; bulan: number }) {
    const f = data.funnel;
    const batalN = SEBAB.reduce((a, s) => a + f.batal[s.k].n, 0);
    const batalRp = SEBAB.reduce((a, s) => a + f.batal[s.k].rp, 0);
    const pct = (n: number) => `${f.masuk ? Math.round((n / f.masuk) * 100) : 0}%`;
    const lebar = (n: number) => `${f.masuk ? (n / f.masuk) * 100 : 0}%`;
    const terbesar = SEBAB.slice().sort((a, b) => f.batal[b.k].n - f.batal[a.k].n)[0];
    const jt = (v: number) => (v >= 1e6 ? `Rp${(v / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt` : formatRupiah(v));

    type Seg = { lebar: string; warna: string; t1: string; t2: string; t3: string };
    const baris: { label: string; n: number; seg: Seg[] }[] = [
        {
            label: 'Booking masuk',
            n: f.masuk,
            seg: f.masuk
                ? [{ lebar: '100%', warna: 'color-mix(in oklab, var(--foreground) 22%, var(--muted))', t1: 'Booking masuk', t2: `${f.masuk} booking dengan jadwal main di ${NAMA_BULAN[bulan - 1]}`, t3: 'Tanpa yang masih menunggu verifikasi' }]
                : [],
        },
        {
            label: 'Terkonfirmasi',
            n: f.terkonfirmasi.n,
            seg: f.terkonfirmasi.n
                ? [{ lebar: lebar(f.terkonfirmasi.n), warna: 'var(--primary)', t1: 'Terkonfirmasi', t2: `${f.terkonfirmasi.n} booking · ${pct(f.terkonfirmasi.n)} dari booking masuk`, t3: `${formatRupiah(f.terkonfirmasi.rp)} masuk` }]
                : [],
        },
        {
            label: 'Dibatalkan',
            n: batalN,
            seg: SEBAB.filter((s) => f.batal[s.k].n).map((s) => ({
                lebar: lebar(f.batal[s.k].n),
                warna: s.warna,
                t1: s.nama,
                t2: `${f.batal[s.k].n} booking · ${pct(f.batal[s.k].n)} dari booking masuk`,
                t3: `${formatRupiah(f.batal[s.k].rp)} batal`,
            })),
        },
    ];
    if (f.tolak.n)
        baris.push({
            label: 'Bukti ditolak',
            n: f.tolak.n,
            seg: [{ lebar: lebar(f.tolak.n), warna: 'var(--muted-foreground)', t1: 'Bukti ditolak', t2: `${f.tolak.n} booking · penyewa belum mengirim ulang bukti`, t3: `${formatRupiah(f.tolak.rp)} belum dibayar` }],
        });

    return (
        <Bagian judul="Booking dan pembatalan" ket="Booking dengan jadwal main di periode ini">
            <div className="my-auto flex flex-col gap-3">
                {baris.map((b) => (
                    <div key={b.label} className="grid grid-cols-[104px_minmax(0,1fr)_96px] items-center gap-3">
                        <span className="font-medium whitespace-nowrap">{b.label}</span>
                        <div className="flex h-5 gap-0.5 rounded bg-muted">
                            {b.seg.map((s) => (
                                <span key={s.t1} className="group relative h-full flex-none cursor-default rounded hover:brightness-90" style={{ width: s.lebar, background: s.warna }}>
                                    <TipGelap t1={s.t1} t2={s.t2} t3={s.t3} className="left-0" />
                                </span>
                            ))}
                        </div>
                        <span className="text-right whitespace-nowrap tabular-nums">
                            <span className="font-semibold">{b.n}</span> <span className="inline-block w-12 text-sm text-muted-foreground">{pct(b.n)}</span>
                        </span>
                    </div>
                ))}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {SEBAB.map((s) => (
                    <span key={s.k} className="inline-flex items-center gap-1.5">
                        <span className="size-2.5 rounded-xs" style={{ background: s.warna }} />
                        {s.nama}
                    </span>
                ))}
            </div>
            <div className="flex flex-col gap-0.5 border-t pt-3">
                <span className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Pemasukan yang batal</span>
                    <span className="font-semibold tabular-nums">{jt(batalRp)}</span>
                </span>
                <span className="text-sm text-muted-foreground">
                    {batalN ? `${f.batal[terbesar.k].n} dari ${batalN} pembatalan ${terbesar.kalimat}.` : 'Tidak ada booking yang dibatalkan di periode ini.'}
                </span>
            </div>
        </Bagian>
    );
}
