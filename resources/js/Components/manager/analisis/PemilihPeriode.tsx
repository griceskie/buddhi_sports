import FormSelect from '@/Components/FormSelect';
import { Button, buttonVariants } from '@/Components/ui/button';
import { Calendar } from '@/Components/ui/calendar';
import { BULAN } from '@/Components/ui/format';
import { Popover, PopoverContent, PopoverTrigger } from '@/Components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { cn } from 'cn';
import { format, parseISO } from 'date-fns';
import { CalendarDays, Check, ChevronDown, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { DateRange } from 'react-day-picker';

export type Periode = {
    jenis: 'bulan' | 'kuartal' | 'tahun' | 'rentang';
    th: number;
    bl: number;
    q: number;
    rentang: string;
    dari: string | null;
    sampai: string | null;
    tab: string;
};
export type Pilihan = {
    tahun: number[];
    bulan: Record<string, number[]>;
    kuartal: Record<string, number[]>;
    rentang: Record<string, string>;
    awalData: string;
    hariIni: string;
};

const JENIS = [
    ['bulan', 'Bulanan'],
    ['kuartal', 'Kuartal'],
    ['tahun', 'Tahunan'],
    ['rentang', 'Rentang'],
] as const;
const singkat = (m: number) => BULAN[m - 1].slice(0, 3);

/** Pemilih periode Analisis bisnis: jenis (segmented) lalu bulan/kuartal/tahun, atau rentang (pilihan cepat + kalender). */
export default function PemilihPeriode({
    periode,
    pilihan,
    rentangTeks,
    onUbah,
}: {
    periode: Periode;
    pilihan: Pilihan;
    rentangTeks: string;
    onUbah: (ubah: Partial<Periode>) => void;
}) {
    const tahun = (
        <FormSelect
            className="w-[104px]"
            value={String(periode.th)}
            onChange={(v) => onUbah({ th: Number(v) })}
            options={pilihan.tahun.map((y) => ({ value: String(y), label: String(y) }))}
        />
    );

    return (
        <div className="flex flex-wrap items-center gap-3">
            <span className="font-medium">Periode</span>
            <Tabs value={periode.jenis} onValueChange={(v) => onUbah({ jenis: v as Periode['jenis'] })}>
                <TabsList aria-label="Jenis periode" className="group-data-horizontal/tabs:h-10">
                    {JENIS.map(([k, l]) => (
                        <TabsTrigger key={k} value={k} className="px-3">
                            {l}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
            <div className="flex gap-2">
                {periode.jenis === 'bulan' && (
                    <>
                        <FormSelect
                            className="w-36"
                            value={String(periode.bl)}
                            onChange={(v) => onUbah({ bl: Number(v) })}
                            options={(pilihan.bulan[periode.th] ?? []).map((m) => ({ value: String(m), label: BULAN[m - 1] }))}
                        />
                        {tahun}
                    </>
                )}
                {periode.jenis === 'kuartal' && (
                    <>
                        <FormSelect
                            className="w-[200px]"
                            value={String(periode.q)}
                            onChange={(v) => onUbah({ q: Number(v) })}
                            options={(pilihan.kuartal[periode.th] ?? []).map((k) => ({
                                value: String(k),
                                label: `Kuartal ${k} (${singkat((k - 1) * 3 + 1)}–${singkat(k * 3)})`,
                            }))}
                        />
                        {tahun}
                    </>
                )}
                {periode.jenis === 'tahun' && tahun}
                {periode.jenis === 'rentang' && <PilihRentang periode={periode} pilihan={pilihan} teks={rentangTeks} onUbah={onUbah} />}
            </div>
        </div>
    );
}

function PilihRentang({ periode, pilihan, teks, onUbah }: { periode: Periode; pilihan: Pilihan; teks: string; onUbah: (u: Partial<Periode>) => void }) {
    const [buka, setBuka] = useState(false);
    const [kalender, setKalender] = useState(false);
    const [pilih, setPilih] = useState<DateRange | undefined>(
        periode.rentang === 'pilih' && periode.dari && periode.sampai ? { from: parseISO(periode.dari), to: parseISO(periode.sampai) } : undefined,
    );
    const awal = parseISO(pilihan.awalData);
    const akhir = parseISO(pilihan.hariIni);
    const pakai = (u: Partial<Periode>) => {
        setBuka(false);
        onUbah(u);
    };

    return (
        <Popover
            open={buka}
            onOpenChange={(o) => {
                setBuka(o);
                if (o) setKalender(false);
            }}
        >
            <PopoverTrigger
                aria-label="Rentang tanggal"
                className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'h-10 w-[300px] justify-between px-4 text-base font-normal data-popup-open:border-ring data-popup-open:ring-[3px] data-popup-open:ring-ring/50',
                )}
            >
                <span className="flex items-center gap-2 truncate">
                    <CalendarDays className="text-muted-foreground" />
                    <span className="truncate">{teks}</span>
                </span>
                <ChevronDown className="text-muted-foreground" />
            </PopoverTrigger>
            <PopoverContent align="end" className={cn('p-1', kalender ? 'w-auto' : 'w-[300px]')}>
                {kalender ? (
                    <div className="flex flex-col gap-2 p-1">
                        <button type="button" onClick={() => setKalender(false)} className="flex items-center gap-1 self-start rounded px-1 text-sm text-muted-foreground hover:text-foreground">
                            <ChevronLeft className="size-4" />
                            Pilihan cepat
                        </button>
                        <Calendar
                            mode="range"
                            numberOfMonths={2}
                            selected={pilih}
                            onSelect={setPilih}
                            defaultMonth={pilih?.from ?? akhir}
                            startMonth={awal}
                            endMonth={akhir}
                            disabled={{ before: awal, after: akhir }}
                        />
                        <div className="flex items-center justify-between gap-3 border-t px-1 pt-2">
                            <span className="text-sm text-muted-foreground">
                                {pilih?.from && pilih.to ? `${format(pilih.from, 'd/M/yyyy')} – ${format(pilih.to, 'd/M/yyyy')}` : 'Pilih tanggal awal dan tanggal akhir.'}
                            </span>
                            <Button
                                size="sm"
                                disabled={!pilih?.from || !pilih.to}
                                onClick={() => pilih?.from && pilih.to && pakai({ rentang: 'pilih', dari: format(pilih.from, 'yyyy-MM-dd'), sampai: format(pilih.to, 'yyyy-MM-dd') })}
                            >
                                Terapkan
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div role="listbox" aria-label="Rentang">
                        {Object.entries(pilihan.rentang).map(([k, l]) => (
                            <Opsi key={k} aktif={periode.rentang === k} onClick={() => pakai({ rentang: k, dari: null, sampai: null })}>
                                {l}
                            </Opsi>
                        ))}
                        <div className="-mx-1 my-1 h-px bg-border" />
                        <Opsi aktif={periode.rentang === 'pilih'} onClick={() => setKalender(true)}>
                            Pilih tanggal sendiri
                        </Opsi>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}

function Opsi({ aktif, onClick, children }: { aktif: boolean; onClick: () => void; children: string }) {
    return (
        <button
            type="button"
            role="option"
            aria-selected={aktif}
            onClick={onClick}
            className="relative flex w-full items-center rounded-md py-1.5 pr-2 pl-8 text-left text-sm hover:bg-accent hover:text-accent-foreground"
        >
            {aktif && <Check className="absolute left-2 size-4" />}
            {children}
        </button>
    );
}
