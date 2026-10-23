import { Button } from '@/Components/ui/button';
import { DatePicker } from '@/Components/ui/date-picker';
import { formatTanggal } from '@/Components/ui/format';
import { cn } from 'cn';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { isoTanggal } from './jadwal';

export type HariItem = { tanggal: Date; kosong: number };

// Aktif: putih berbingkai. Nonaktif: abu-abu pucat tanpa bingkai.
const PANAH =
    'hidden self-center rounded-full border-border bg-grays-white text-foreground hover:bg-muted disabled:border-transparent disabled:bg-fills-tertiary disabled:text-labels-tertiary disabled:opacity-100 sm:inline-flex';

const TOMBOL_KALENDER =
    'h-auto w-[84px] shrink-0 flex-col justify-center gap-1 rounded-lg bg-grays-white px-0 text-center text-xs text-muted-foreground hover:bg-grays-white aria-expanded:bg-grays-white [&>svg]:size-5! [&>svg]:text-foreground';

const NAMA_HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const NAMA_BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export default function DateStrip({
    hari,
    terpilih,
    penuh,
    hampirPenuh,
    onSelect,
}: {
    hari: HariItem[];
    terpilih: Date;
    penuh: Date[];
    hampirPenuh: Date[];
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
        <div className="flex items-stretch gap-2">
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
                className="flex min-w-0 flex-1 snap-x snap-mandatory overflow-x-auto rounded-lg border bg-background [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {hari.map((h, i) => {
                    const aktif = isoTanggal(h.tanggal) === isoTanggal(terpilih);
                    const nama = i === 0 ? 'Hari ini' : i === 1 ? 'Besok' : NAMA_HARI[h.tanggal.getDay()];
                    return (
                        <button
                            key={isoTanggal(h.tanggal)}
                            type="button"
                            aria-pressed={aktif}
                            aria-label={`${formatTanggal(h.tanggal)}, ${h.kosong} jam kosong`}
                            onClick={() => onSelect(h.tanggal)}
                            className={cn(
                                'grid shrink-0 basis-1/4 cursor-pointer snap-start content-center gap-0.5 px-1 py-2 text-center outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 sm:basis-[calc(100%/7)]',
                                i > 0 && 'border-l',
                                aktif &&
                                    'bg-primary/10 shadow-[inset_0_-3px_0_var(--primary)] hover:bg-primary/10',
                            )}
                        >
                            <span className="text-xs text-muted-foreground">{nama}</span>
                            <span className={cn('font-semibold', aktif && 'text-primary')}>
                                {h.tanggal.getDate()} {NAMA_BULAN[h.tanggal.getMonth()]}
                            </span>
                            <span
                                className={cn(
                                    'text-xs font-medium',
                                    h.kosong ? 'text-success' : 'text-muted-foreground',
                                )}
                            >
                                {h.kosong ? `${h.kosong} kosong` : 'Penuh'}
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
                label="Pilih tanggal"
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
