import { IKON_LAPANGAN, JAM_BUKA, JAM_TUTUP } from '@/Components/booking/jadwal';
import { Button } from '@/Components/ui/button';
import { rentangJam, toMinutes } from '@/Components/ui/format';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PointerEvent as ReactPointerEvent, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

export type JadwalLapangan = { idLapangan: number; namaLapangan: string; jenisLapangan: string };

export type JadwalBooking = {
    idBooking: number;
    idLapangan: number;
    tanggal: string;
    jamMulai: string;
    jamSelesai: string;
    namaPenyewa: string;
    status: string;
    statusPembayaran: string | null;
    idPembayaran: number | null;
};

const PX_JAM = 100;
const LEBAR = (JAM_TUTUP - JAM_BUKA) * PX_JAM; // 1.400px untuk 08:00-22:00
const KOLOM_NAMA = 200;
const JAM = Array.from({ length: JAM_TUTUP - JAM_BUKA }, (_, i) => JAM_BUKA + i);
const dua = (n: number) => String(n).padStart(2, '0');
const teksMenit = (m: number) => `${dua(Math.floor(m / 60))}.${dua(Math.round(m % 60))}`;
const posisi = (hhmm: string) => ((toMinutes(hhmm) - JAM_BUKA * 60) / 60) * PX_JAM;

type Blok = JadwalBooking & { menunggu: boolean; bentrok: boolean; lajur: number };

/** Booking yang bertumpuk di satu lapangan dipisah ke lajur; baris dengan dua lajur atau lebih jadi lebih tinggi. */
function susunLajur(daftar: JadwalBooking[]): { blok: Blok[]; lajur: number } {
    const urut = [...daftar].sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));
    const akhirLajur: string[] = [];
    const blok = urut.map((b) => {
        let l = akhirLajur.findIndex((akhir) => akhir <= b.jamMulai);
        if (l === -1) l = akhirLajur.push('') - 1;
        akhirLajur[l] = b.jamSelesai;
        const menunggu = b.status !== 'Dikonfirmasi';
        const bentrok =
            menunggu &&
            daftar.some((o) => o.status === 'Dikonfirmasi' && o.idBooking !== b.idBooking && o.jamMulai < b.jamSelesai && o.jamSelesai > b.jamMulai);
        return { ...b, menunggu, bentrok, lajur: l };
    });
    return { blok, lajur: Math.max(1, akhirLajur.length) };
}

/**
 * Jadwal satu tanggal untuk dashboard Admin: satu jam selebar 100px, isinya digeser. Cara geser: seret jalur, seret
 * thumb penggeser, klik trek, usap mendatar (trackpad), tombol satu jam, dan panah keyboard pada penggeser.
 * Hanya booking Dikonfirmasi dan yang menunggu verifikasi (blok bergaris, membuka drawer verifikasi).
 */
export default function JadwalGeser({
    lapangan,
    booking,
    sekarang,
    onTinjau,
}: {
    lapangan: JadwalLapangan[];
    booking: JadwalBooking[];
    /** Diisi kalau tanggal yang tampil adalah hari ini: garis "Sekarang". */
    sekarang?: Date;
    onTinjau: (idPembayaran: number) => void;
}) {
    const area = useRef<HTMLDivElement>(null);
    const trek = useRef<HTMLDivElement>(null);
    const [geser, setGeser] = useState(0);
    const [lebarTampil, setLebarTampil] = useState(LEBAR);
    const [lebarTrek, setLebarTrek] = useState(0);

    const menitSekarang = sekarang ? sekarang.getHours() * 60 + sekarang.getMinutes() : null;
    const adaSekarang = menitSekarang !== null && menitSekarang >= JAM_BUKA * 60 && menitSekarang <= JAM_TUTUP * 60;
    const xSekarang = adaSekarang ? ((menitSekarang! - JAM_BUKA * 60) / 60) * PX_JAM : 0;

    const maks = Math.max(0, LEBAR - lebarTampil);
    const ukur = useCallback(() => {
        const el = area.current;
        if (!el) return;
        setLebarTampil(Math.max(0, el.clientWidth - KOLOM_NAMA));
        setLebarTrek(trek.current?.clientWidth ?? 0);
        setGeser(el.scrollLeft);
    }, []);

    useLayoutEffect(() => {
        ukur();
        const ro = new ResizeObserver(ukur);
        if (area.current) ro.observe(area.current);
        return () => ro.disconnect();
    }, [ukur]);

    // Posisi awal: dua jam sebelum sekarang, atau satu jam sebelum booking pertama
    const kunciAwal = `${booking[0]?.tanggal ?? ''}|${adaSekarang}`;
    useEffect(() => {
        const el = area.current;
        if (!el) return;
        const pertama = booking.length ? Math.min(...booking.map((b) => posisi(b.jamMulai))) : 0;
        el.scrollLeft = adaSekarang ? xSekarang - 2 * PX_JAM : pertama - PX_JAM;
        setGeser(el.scrollLeft);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [kunciAwal]);

    const geserKe = (x: number, halus = false) => area.current?.scrollTo({ left: Math.max(0, Math.min(maks, x)), behavior: halus ? 'smooth' : 'auto' });

    // Seret jalur jadwal (bukan tombol blok)
    const seret = useRef<{ x: number; awal: number } | null>(null);
    const seretMulai = (e: ReactPointerEvent<HTMLDivElement>) => {
        if (e.pointerType !== 'mouse' || e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
        seret.current = { x: e.clientX, awal: area.current!.scrollLeft };
        e.currentTarget.setPointerCapture(e.pointerId);
    };
    const seretGerak = (e: ReactPointerEvent<HTMLDivElement>) => {
        if (seret.current) geserKe(seret.current.awal - (e.clientX - seret.current.x));
    };
    const seretSelesai = () => (seret.current = null);

    // Penggeser di bawah jadwal
    const fraksi = Math.min(1, lebarTampil / LEBAR);
    const lebarThumb = Math.max(32, lebarTrek * fraksi);
    const kiriThumb = maks ? (geser / maks) * (lebarTrek - lebarThumb) : 0;
    const dariTrek = (clientX: number, offset: number) => {
        const r = trek.current!.getBoundingClientRect();
        const ruang = Math.max(1, r.width - lebarThumb);
        return ((clientX - r.left - offset) / ruang) * maks;
    };
    const thumbSeret = useRef<number | null>(null);
    const trekTekan = (e: ReactPointerEvent<HTMLDivElement>) => {
        const r = trek.current!.getBoundingClientRect();
        const diThumb = e.clientX >= r.left + kiriThumb && e.clientX <= r.left + kiriThumb + lebarThumb;
        // klik di trek: thumb melompat ke titik itu (tengahnya), lalu bisa langsung diseret
        thumbSeret.current = diThumb ? e.clientX - r.left - kiriThumb : lebarThumb / 2;
        if (!diThumb) geserKe(dariTrek(e.clientX, thumbSeret.current));
        e.currentTarget.setPointerCapture(e.pointerId);
    };
    const trekGerak = (e: ReactPointerEvent<HTMLDivElement>) => {
        if (thumbSeret.current !== null) geserKe(dariTrek(e.clientX, thumbSeret.current));
    };
    const tombolKunci = (e: React.KeyboardEvent) => {
        const langkah = { ArrowLeft: -PX_JAM, ArrowRight: PX_JAM, PageUp: -4 * PX_JAM, PageDown: 4 * PX_JAM }[e.key];
        if (langkah) geserKe(geser + langkah, true);
        else if (e.key === 'Home') geserKe(0, true);
        else if (e.key === 'End') geserKe(maks, true);
        else return;
        e.preventDefault();
    };

    const mulaiTampil = JAM_BUKA * 60 + (geser / PX_JAM) * 60;
    const rentang = `${teksMenit(mulaiTampil)}–${teksMenit(Math.min(JAM_TUTUP * 60, mulaiTampil + (lebarTampil / PX_JAM) * 60))}`;
    const persen = maks ? Math.round((geser / maks) * 100) : 0;

    return (
        <div className="flex flex-col gap-3">
            <div
                ref={area}
                onScroll={(e) => setGeser(e.currentTarget.scrollLeft)}
                onPointerDown={seretMulai}
                onPointerMove={seretGerak}
                onPointerUp={seretSelesai}
                onPointerCancel={seretSelesai}
                className="overflow-x-auto overscroll-x-contain [scrollbar-width:none] select-none [&::-webkit-scrollbar]:hidden"
            >
                <div className="relative" style={{ width: KOLOM_NAMA + LEBAR }}>
                    {/* kepala jam */}
                    <div className="flex h-6 items-end">
                        <div className="sticky left-0 z-20 h-full shrink-0 bg-card" style={{ width: KOLOM_NAMA }} />
                        <div className="relative h-full" style={{ width: LEBAR }}>
                            {JAM.map((h) => (
                                <span key={h} className="absolute bottom-1 text-sm text-muted-foreground tabular-nums" style={{ left: (h - JAM_BUKA) * PX_JAM }}>
                                    {dua(h)}
                                </span>
                            ))}
                            {adaSekarang && (
                                <span
                                    className="absolute bottom-0.5 z-10 -translate-x-1/2 rounded-full bg-foreground px-1.5 text-[11px] leading-4 font-semibold text-background tabular-nums"
                                    style={{ left: xSekarang }}
                                >
                                    {teksMenit(menitSekarang!)}
                                </span>
                            )}
                        </div>
                    </div>

                    {lapangan.map((l) => {
                        const { blok, lajur } = susunLajur(booking.filter((b) => b.idLapangan === l.idLapangan));
                        const tinggi = lajur === 1 ? 84 : 84 + (lajur - 1) * 28;
                        const tinggiBlok = (tinggi - 12 - (lajur - 1) * 4) / lajur;
                        return (
                            <div key={l.idLapangan} className="flex" style={{ height: tinggi + 8 }}>
                                <div className="sticky left-0 z-20 flex shrink-0 items-center gap-3 bg-card pr-3" style={{ width: KOLOM_NAMA }}>
                                    <img src={IKON_LAPANGAN[l.jenisLapangan]} alt="" width={28} height={28} className="size-7 shrink-0 object-contain" />
                                    <div className="min-w-0">
                                        <p className="truncate font-medium">{l.namaLapangan}</p>
                                        <p className="truncate text-sm text-muted-foreground">
                                            {l.jenisLapangan} · {blok.length} booking
                                        </p>
                                    </div>
                                </div>
                                <div className="relative my-1 overflow-hidden rounded-lg bg-canvas" style={{ width: LEBAR, height: tinggi }}>
                                    {JAM.slice(1).map((h) => (
                                        <span key={h} aria-hidden className="absolute inset-y-0 w-px bg-border" style={{ left: (h - JAM_BUKA) * PX_JAM }} />
                                    ))}
                                    {blok.map((b) => {
                                        const gaya = {
                                            left: posisi(b.jamMulai) + 2,
                                            width: posisi(b.jamSelesai) - posisi(b.jamMulai) - 4,
                                            top: 6 + b.lajur * (tinggiBlok + 4),
                                            height: tinggiBlok,
                                        };
                                        const jam = rentangJam(b.jamMulai, b.jamSelesai);
                                        if (!b.menunggu)
                                            return (
                                                <div
                                                    key={b.idBooking}
                                                    title={`${b.namaPenyewa}, ${jam}`}
                                                    className="absolute overflow-hidden rounded-md border border-accessible-green/30 bg-accessible-green/10 px-2 py-1"
                                                    style={gaya}
                                                >
                                                    <p className="truncate text-xs font-semibold">{b.namaPenyewa}</p>
                                                    <p className="truncate text-sm text-muted-foreground tabular-nums">{jam}</p>
                                                </div>
                                            );
                                        const warna = b.bentrok
                                            ? 'border-accessible-red bg-accessible-red/10 text-accessible-red'
                                            : 'border-accessible-orange bg-accessible-orange/10 text-accessible-orange';
                                        return (
                                            <button
                                                key={b.idBooking}
                                                type="button"
                                                aria-label={`${b.namaPenyewa}, ${jam}, ${b.bentrok ? 'jam bentrok' : 'menunggu verifikasi'}. Tinjau bukti`}
                                                onClick={() => b.idPembayaran && onTinjau(b.idPembayaran)}
                                                className={`absolute overflow-hidden rounded-md border border-dashed px-2 py-1 text-left transition-[filter] hover:brightness-95 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none ${warna}`}
                                                style={gaya}
                                            >
                                                <p className="truncate text-xs font-semibold text-foreground">{b.namaPenyewa}</p>
                                                <p className="truncate text-xs font-medium">{b.bentrok ? 'Bentrok · tinjau' : 'Tinjau bukti'}</p>
                                            </button>
                                        );
                                    })}
                                    {adaSekarang && <span aria-hidden className="absolute inset-y-0 z-10 w-0.5 -translate-x-1/2 bg-foreground" style={{ left: xSekarang }} />}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex shrink-0 items-center gap-1.5">
                    <Button variant="outline" size="icon" aria-label="Mundur 1 jam" disabled={geser <= 0} onClick={() => geserKe(geser - PX_JAM, true)}>
                        <ChevronLeft />
                    </Button>
                    <Button variant="outline" size="icon" aria-label="Maju 1 jam" disabled={geser >= maks} onClick={() => geserKe(geser + PX_JAM, true)}>
                        <ChevronRight />
                    </Button>
                    <span className="w-[84px] text-sm text-muted-foreground tabular-nums">{rentang}</span>
                </div>
                <div
                    ref={trek}
                    onPointerDown={trekTekan}
                    onPointerMove={trekGerak}
                    onPointerUp={() => (thumbSeret.current = null)}
                    onPointerCancel={() => (thumbSeret.current = null)}
                    className="relative h-6 flex-1 cursor-pointer touch-none"
                >
                    <div aria-hidden className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-muted" />
                    <div
                        role="slider"
                        tabIndex={0}
                        aria-label="Geser timeline jadwal"
                        aria-orientation="horizontal"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={persen}
                        aria-valuetext={rentang}
                        onKeyDown={tombolKunci}
                        className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-muted-foreground/60 outline-none hover:bg-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        style={{ left: kiriThumb, width: lebarThumb }}
                    />
                </div>
            </div>
        </div>
    );
}
