import { Button } from '@/Components/ui/button';
import { DatePicker } from '@/Components/ui/date-picker';
import { formatTanggal } from '@/Components/ui/format';
import { cn } from 'cn';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { isoTanggal } from './jadwal';

export type HariItem = { tanggal: Date; kosong: number };

const NAMA_HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const GAP = 6;

// Jumlah tanggal yang terlihat sekaligus: 5 di HP, 7 mulai sm, 10 mulai lg, 14 mulai xl.
const LEBAR: [string, number][] = [
    ['(min-width: 1280px)', 14],
    ['(min-width: 1024px)', 10],
    ['(min-width: 640px)', 7],
];
const jumlahTerlihat = () =>
    typeof window === 'undefined' ? 5 : (LEBAR.find(([q]) => window.matchMedia(q).matches)?.[1] ?? 5);

function useJumlahTerlihat() {
    const [n, setN] = useState(jumlahTerlihat);
    useEffect(() => {
        const ubah = () => setN(jumlahTerlihat());
        const mql = LEBAR.map(([q]) => window.matchMedia(q));
        mql.forEach((m) => m.addEventListener('change', ubah));
        return () => mql.forEach((m) => m.removeEventListener('change', ubah));
    }, []);
    return n;
}

/**
 * Island tanggal: tanggal terpilih sebagai judul, panah per halaman, kalender, lalu deretan tanggal.
 * Status (Terbatas, Penuh) dihitung untuk lapangan terpilih. Penanda terpilih = kotak abu-abu yang bergeser.
 */
export default function DateStrip({
    hari,
    terpilih,
    batasTerbatas,
    onSelect,
}: {
    /** Semua hari yang bisa dipesan (30), dengan jam kosong lapangan terpilih. */
    hari: HariItem[];
    terpilih: Date;
    /** Jam kosong sebanyak ini atau kurang (tapi lebih dari 0) ditandai "Terbatas". */
    batasTerbatas: number;
    onSelect: (d: Date) => void;
}) {
    const n = useJumlahTerlihat();
    const iTerpilih = Math.max(0, hari.findIndex((h) => isoTanggal(h.tanggal) === isoTanggal(terpilih)));
    const [awal, setAwal] = useState(0);
    const maksAwal = Math.max(0, hari.length - n);

    // Tanggal terpilih (mis. lewat kalender) atau jumlah terlihat berubah: pastikan terpilih ada di jendela.
    useEffect(() => {
        setAwal((a) => {
            const batas = Math.min(a, maksAwal);
            // lompat ke halaman (kelipatan n) yang memuat tanggal terpilih
            return iTerpilih < batas || iTerpilih >= batas + n ? Math.min(Math.floor(iTerpilih / n) * n, maksAwal) : batas;
        });
    }, [iTerpilih, n, maksAwal]);

    const terlihat = hari.slice(awal, awal + n);
    const k = iTerpilih - awal;
    const pertama = hari[0].tanggal;
    const terakhir = hari[hari.length - 1].tanggal;
    const penuh = hari.filter((h) => h.kosong === 0).map((h) => h.tanggal);

    return (
        <div className="grid gap-2.5 rounded-2xl border bg-card px-3 pt-3.5 pb-3 sm:px-5 sm:pt-4">
            <div className="flex items-center justify-between gap-3">
                <h2 className="min-w-0 text-subheadline font-semibold">
                    <span className="sm:hidden">{formatTanggal(terpilih, 'EEE, d MMM yyyy')}</span>
                    <span className="hidden sm:inline">{formatTanggal(terpilih)}</span>
                </h2>
                <div className="flex shrink-0 items-center gap-1.5">
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Tanggal sebelumnya"
                        disabled={awal === 0}
                        onClick={() => setAwal(Math.max(0, awal - n))}
                    >
                        <ChevronLeft />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Tanggal berikutnya"
                        disabled={awal >= maksAwal}
                        onClick={() => setAwal(Math.min(maksAwal, awal + n))}
                    >
                        <ChevronRight />
                    </Button>
                    <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
                    <DatePicker
                        value={terpilih}
                        onChange={(d) => d && onSelect(d)}
                        label={<span className="sr-only">Pilih tanggal dari kalender</span>}
                        align="end"
                        disabled={[{ before: pertama }, { after: terakhir }]}
                        calendarProps={{
                            numberOfMonths: 1,
                            startMonth: pertama,
                            endMonth: terakhir,
                            modifiers: { penuh },
                            modifiersClassNames: { penuh: 'line-through text-muted-foreground' },
                        }}
                        footer={(pick) => (
                            <div className="flex items-center justify-between gap-4 border-t px-4 py-3 text-caption-1 text-muted-foreground">
                                <span>Tanggal penuh dicoret</span>
                                <Button variant="link" size="sm" onClick={() => pick(pertama)}>
                                    Hari ini
                                </Button>
                            </div>
                        )}
                        className="size-7 w-7 justify-center px-0 [&>svg]:text-foreground"
                    />
                </div>
            </div>

            <div
                role="group"
                aria-label="Tanggal"
                className="relative grid"
                style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, gap: GAP }}
            >
                {k >= 0 && k < n && (
                    <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-0 left-0 rounded-xl bg-foreground/7 transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none"
                        style={{
                            width: `calc((100% - ${(n - 1) * GAP}px) / ${n})`,
                            transform: `translateX(calc(${k} * (100% + ${GAP}px)))`,
                        }}
                    />
                )}
                {terlihat.map((h) => {
                    const i = hari.indexOf(h);
                    const aktif = i === iTerpilih;
                    const status = h.kosong === 0 ? 'Penuh' : h.kosong <= batasTerbatas ? 'Terbatas' : '';
                    const nama = i === 0 ? 'Hari ini' : i === 1 ? 'Besok' : NAMA_HARI[h.tanggal.getDay()];
                    return (
                        <button
                            key={isoTanggal(h.tanggal)}
                            type="button"
                            aria-pressed={aktif}
                            aria-label={`${formatTanggal(h.tanggal)}${status ? `, ${status.toLowerCase()}` : ''}`}
                            onClick={() => onSelect(h.tanggal)}
                            className={cn(
                                'relative flex h-17 min-w-0 cursor-pointer flex-col items-center justify-center rounded-xl outline-none hover:bg-foreground/4 focus-visible:ring-3 focus-visible:ring-ring/50',
                                status === 'Penuh' && !aktif && 'text-muted-foreground',
                            )}
                        >
                            <span className="text-caption-1 whitespace-nowrap text-muted-foreground">{nama}</span>
                            <span className="text-callout font-semibold tabular-nums">{h.tanggal.getDate()}</span>
                            <span
                                className={cn(
                                    'min-h-4 text-caption-1 font-medium whitespace-nowrap',
                                    status === 'Terbatas' ? 'text-accessible-orange' : 'text-muted-foreground',
                                )}
                            >
                                {status}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
