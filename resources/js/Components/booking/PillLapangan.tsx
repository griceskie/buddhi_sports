import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { cn } from 'cn';
import { Lapangan, sedangPerbaikan } from './jadwal';

/**
 * Pilihan lapangan satu jenis sebagai pill bersegmen (pola kolom pencarian Airbnb), dipakai mulai `sm`.
 * Ruas terpilih putih dan terangkat; garis pemisah hilang di sebelah ruas terpilih.
 */
export default function PillLapangan({
    lapangan,
    value,
    onChange,
    jamKosong,
    ikon,
}: {
    lapangan: Lapangan[];
    value: number | null;
    onChange: (idLapangan: number) => void;
    /** Jam kosong per lapangan di tanggal terpilih. */
    jamKosong: (l: Lapangan) => number;
    ikon?: string;
}) {
    const iTerpilih = lapangan.findIndex((l) => l.idLapangan === value);

    return (
        <RadioGroup
            aria-label="Lapangan"
            value={value}
            onValueChange={(v) => onChange(v as number)}
            className="pill-lapangan mx-auto inline-flex rounded-full border bg-[color-mix(in_oklab,var(--foreground)_5%,var(--background))] shadow-[0_3px_12px_rgb(0_0_0/0.08),0_1px_2px_rgb(0_0_0/0.04)]"
        >
            {lapangan.map((l, i) => {
                const perbaikan = sedangPerbaikan(l);
                const n = perbaikan ? 0 : jamKosong(l);
                const tanpaGaris = i === 0 || i === iTerpilih || i - 1 === iTerpilih;
                return (
                    <Radio.Root
                        key={l.idLapangan}
                        value={l.idLapangan}
                        disabled={perbaikan}
                        className={cn(
                            'relative flex h-16 w-59 shrink-0 cursor-pointer items-center gap-2.5 rounded-full py-0 pr-4 pl-2.5 text-left outline-none transition-[background-color,box-shadow] duration-200 focus-visible:ring-3 focus-visible:ring-ring/50 lg:w-70 lg:gap-3 lg:pr-6',
                            'before:absolute before:inset-y-[18px] before:left-0 before:w-px before:bg-border',
                            'data-[checked]:bg-background data-[checked]:shadow-[0_6px_18px_rgb(0_0_0/0.10),0_1px_3px_rgb(0_0_0/0.08)]',
                            'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-55',
                            tanpaGaris && 'before:hidden',
                        )}
                    >
                        {ikon && <img src={ikon} alt="" className="h-9 w-11 shrink-0 object-contain lg:h-11 lg:w-14" />}
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
