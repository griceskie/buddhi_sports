import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { cn } from 'cn';
import { Image } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import { Lapangan, sedangPerbaikan } from './jadwal';

type Posisi = { top: number; left: number; width: number; height: number };

/**
 * Daftar lapangan satu jenis sebagai radio. Item tanpa bingkai; satu kotak putih (border abu + bayangan)
 * bergeser ke lapangan terpilih. Vertikal mulai `sm`, di HP deretan yang bisa digeser ke samping.
 */
export default function PilihLapangan({
    lapangan,
    value,
    onChange,
    jamKosong,
}: {
    lapangan: Lapangan[];
    value: number | null;
    onChange: (idLapangan: number) => void;
    /** Jam kosong per lapangan di tanggal terpilih. */
    jamKosong: (l: Lapangan) => number;
}) {
    const listRef = useRef<HTMLDivElement>(null);
    const [posisi, setPosisi] = useState<Posisi | null>(null);

    // Ukur item terpilih relatif ke daftar; ulangi saat ukuran daftar berubah (pindah breakpoint, font dimuat).
    useLayoutEffect(() => {
        const list = listRef.current;
        if (!list) return;
        const ukur = () => {
            const el = list.querySelector<HTMLElement>('[data-checked]');
            setPosisi(
                el ? { top: el.offsetTop, left: el.offsetLeft, width: el.offsetWidth, height: el.offsetHeight } : null,
            );
        };
        ukur();
        const ro = new ResizeObserver(ukur);
        ro.observe(list);
        return () => ro.disconnect();
    }, [value, lapangan]);

    return (
        <RadioGroup
            ref={listRef}
            aria-label="Lapangan"
            value={value}
            onValueChange={(v) => onChange(v as number)}
            className="relative -mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] sm:mx-0 sm:flex-col sm:gap-1.5 sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden"
        >
            {posisi && (
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute top-0 left-0 rounded-2xl border bg-background shadow-[0_4px_14px_rgb(0_0_0/0.08),0_1px_3px_rgb(0_0_0/0.06)] transition-[translate,width,height] duration-300 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none"
                    style={{
                        width: posisi.width,
                        height: posisi.height,
                        translate: `${posisi.left}px ${posisi.top}px`,
                    }}
                />
            )}
            {lapangan.map((l) => {
                const perbaikan = sedangPerbaikan(l);
                const n = perbaikan ? 0 : jamKosong(l);
                return (
                    <Radio.Root
                        key={l.idLapangan}
                        value={l.idLapangan}
                        disabled={perbaikan}
                        className="relative flex h-14.5 w-56 shrink-0 cursor-pointer items-center gap-3 rounded-2xl border border-transparent py-2 pr-3 pl-2 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60 sm:w-full"
                    >
                        {l.foto[0] ? (
                            <img src={l.foto[0]} alt="" className="size-10 shrink-0 rounded-[10px] object-cover" />
                        ) : (
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[color-mix(in_oklab,var(--foreground)_7%,var(--canvas))] text-muted-foreground">
                                <Image className="size-4" aria-hidden="true" />
                            </span>
                        )}
                        <span className="grid min-w-0">
                            <span className="truncate text-footnote font-semibold">{l.namaLapangan}</span>
                            <span
                                className={cn(
                                    'text-caption-1 whitespace-nowrap',
                                    perbaikan || (n > 0 && n <= 3)
                                        ? 'font-medium text-accessible-orange'
                                        : 'text-muted-foreground',
                                )}
                            >
                                {perbaikan ? 'Dalam perbaikan' : n > 0 ? `${n} jam kosong` : 'Penuh'}
                            </span>
                        </span>
                    </Radio.Root>
                );
            })}
        </RadioGroup>
    );
}
