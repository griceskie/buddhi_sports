import { Button } from '@/Components/ui/button';
import { DatePicker } from '@/Components/ui/date-picker';
import { formatTanggal } from '@/Components/ui/format';
import { cn } from 'cn';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { isoTanggal } from './jadwal';

export type HariItem = { tanggal: Date; kosong: number };

// Aktif: putih berbingkai. Nonaktif: abu-abu pucat tanpa bingkai.
const PANAH =
    'hidden self-center rounded-full border-border bg-grays-white text-foreground hover:bg-muted disabled:border-transparent disabled:bg-fills-tertiary disabled:text-labels-tertiary disabled:opacity-100 sm:inline-flex';

// Kotak 84x84; ikon bawaan DatePicker disembunyikan, ikon dan teks datang lewat `label`.
const TOMBOL_KALENDER =
    'h-21 w-21 shrink-0 flex-col justify-center gap-1.5 rounded-lg bg-grays-white px-1 text-center text-xs font-medium text-foreground hover:bg-muted aria-expanded:bg-grays-white [&>svg:first-child]:hidden';

// Status satu tanggal untuk jenis lapangan yang sedang dilihat.
const STATUS = {
    tersedia: { teks: 'Tersedia', titik: 'bg-success' },
    terbatas: { teks: 'Terbatas', titik: 'bg-accents-orange' },
    penuh: { teks: 'Penuh', titik: 'bg-grays-gray-2' },
};

const NAMA_HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const NAMA_BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export default function DateStrip({
    hari,
    terpilih,
    penuh,
    hampirPenuh,
    batasTerbatas,
    onSelect,
}: {
    hari: HariItem[];
    terpilih: Date;
    /** Untuk penanda di kalender (semua lapangan). */
    penuh: Date[];
    hampirPenuh: Date[];
    /** Jam kosong sebanyak ini atau kurang (tapi lebih dari 0) ditandai "Terbatas". */
    batasTerbatas: number;
    onSelect: (d: Date) => void;
}) {
    const stripRef = useRef<HTMLDivElement>(null);
    const [tepi, setTepi] = useState<'awal' | 'tengah' | 'akhir'>('awal');
    const pertama = hari[0].tanggal;
    const terakhir = hari[hari.length - 1].tanggal;

    const hitungTepi = () => {
        const el = stripRef.current;
        if (!el) return;
        setTepi(
            el.scrollLeft <= 1
                ? 'awal'
                : el.scrollLeft + el.clientWidth >= el.scrollWidth - 1
                  ? 'akhir'
                  : 'tengah',
        );
    };

    useEffect(hitungTepi, []);

    // Geser pita hanya bila hari terpilih tidak terlihat penuh (mis. dipilih lewat kalender).
    useEffect(() => {
        const el = stripRef.current;
        const aktif = el?.querySelector<HTMLElement>('[aria-pressed="true"]');
        if (!el || !aktif) return;
        const s = el.getBoundingClientRect();
        const a = aktif.getBoundingClientRect();
        if (a.left < s.left || a.right > s.right) {
            el.scrollTo({ left: el.scrollLeft + (a.left - s.left), behavior: 'smooth' });
        }
    }, [terpilih]);

    const geser = (arah: number) =>
        stripRef.current?.scrollBy({ left: arah * stripRef.current.clientWidth, behavior: 'smooth' });

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="icon-lg"
                className={PANAH}
                aria-label="Geser ke tanggal sebelumnya"
                disabled={tepi === 'awal'}
                onClick={() => geser(-1)}
            >
                <ChevronLeft />
            </Button>

            <div
                ref={stripRef}
                role="group"
                aria-label="Tanggal"
                onScroll={hitungTepi}
                className="flex min-w-0 flex-1 snap-x snap-mandatory gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {hari.map((h, i) => {
                    const aktif = isoTanggal(h.tanggal) === isoTanggal(terpilih);
                    const nama = i === 0 ? 'Hari ini' : i === 1 ? 'Besok' : NAMA_HARI[h.tanggal.getDay()];
                    const status =
                        h.kosong === 0 ? STATUS.penuh : h.kosong <= batasTerbatas ? STATUS.terbatas : STATUS.tersedia;
                    const penuhHari = h.kosong === 0;
                    return (
                        <button
                            key={isoTanggal(h.tanggal)}
                            type="button"
                            aria-pressed={aktif}
                            aria-label={`${formatTanggal(h.tanggal)}, ${status.teks}, ${h.kosong} jam kosong`}
                            onClick={() => onSelect(h.tanggal)}
                            className={cn(
                                // 4 kotak per layar di ponsel, 7 di tablet, 10 di desktop (gap-2 = 0.5rem)
                                'flex h-21 shrink-0 basis-[calc((100%-1.5rem)/4)] cursor-pointer snap-start flex-col items-start justify-between rounded-lg border bg-background px-3 py-2.5 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 sm:basis-[calc((100%-3rem)/7)] lg:basis-[calc((100%-4.5rem)/10)]',
                                penuhHari && !aktif && 'border-transparent bg-canvas text-muted-foreground',
                                aktif && 'border-primary/45 bg-primary/9 hover:bg-primary/9',
                            )}
                        >
                            <span className="text-xs text-muted-foreground">{nama}</span>
                            <span
                                className={cn(
                                    'text-xl leading-6 font-semibold tabular-nums',
                                    aktif && 'text-primary',
                                )}
                            >
                                {h.tanggal.getDate()}
                                <span className="ml-0.75 text-[13px] font-medium text-muted-foreground">
                                    {NAMA_BULAN[h.tanggal.getMonth()]}
                                </span>
                            </span>
                            <span className="flex items-center gap-1.25 text-xs whitespace-nowrap text-muted-foreground">
                                <span className={cn('size-1.5 shrink-0 rounded-full', status.titik)} />
                                {status.teks}
                            </span>
                        </button>
                    );
                })}
            </div>

            <Button
                variant="outline"
                size="icon-lg"
                className={PANAH}
                aria-label="Geser ke tanggal berikutnya"
                disabled={tepi === 'akhir'}
                onClick={() => geser(1)}
            >
                <ChevronRight />
            </Button>

            <DatePicker
                value={terpilih}
                onChange={(d) => d && onSelect(d)}
                label={
                    <>
                        <CalendarDays className="size-5.5 text-primary" aria-hidden="true" />
                        Pilih tanggal
                    </>
                }
                align="end"
                disabled={[{ before: pertama }, { after: terakhir }, penuh]}
                calendarProps={{
                    numberOfMonths: 2,
                    startMonth: pertama,
                    endMonth: terakhir,
                    modifiers: { hampirPenuh, penuh },
                    modifiersClassNames: {
                        hampirPenuh:
                            'relative after:absolute after:bottom-1 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-accents-orange',
                        penuh: 'line-through',
                    },
                }}
                footer={(pick) => (
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t px-4 py-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <i className="size-1.5 rounded-full bg-accents-orange" />
                            Hampir penuh · Penuh dicoret
                        </span>
                        <Button variant="link" size="sm" onClick={() => pick(pertama)}>
                            Hari ini
                        </Button>
                    </div>
                )}
                className={TOMBOL_KALENDER}
            />
        </div>
    );
}
