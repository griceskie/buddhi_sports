import { Badge } from '@/Components/ui/badge';
import { Card } from '@/Components/ui/card';
import { formatRupiah } from '@/Components/ui/format';
import { cn } from 'cn';
import { CalendarX, CircleAlert, CircleCheck, Wrench } from 'lucide-react';
import { jam, JAM_BUKA, JAM_TUTUP, Lapangan, StatusJam } from './jadwal';

const LABEL: Record<StatusJam, string> = {
    free: 'kosong',
    taken: 'sudah dipesan',
    past: 'sudah lewat',
};

const JAM_LIST = Array.from({ length: JAM_TUTUP - JAM_BUKA }, (_, i) => JAM_BUKA + i);

export default function CourtSlotCard({
    lapangan,
    perbaikan,
    jamKosong,
    statusJam,
    pilihan,
    bentrok,
    onPick,
}: {
    lapangan: Lapangan;
    perbaikan: boolean;
    jamKosong: number;
    statusJam: (h: number) => StatusJam;
    pilihan: { start: number; end: number } | null;
    bentrok: boolean;
    onPick: (h: number) => void;
}) {
    const durasi = pilihan ? pilihan.end - pilihan.start : 0;

    return (
        <Card
            className={cn(
                'grid gap-0 overflow-hidden py-0 sm:grid-cols-[minmax(0,1fr)_150px]',
                perbaikan && 'opacity-75',
            )}
        >
            <div className="min-w-0 p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                    <h3 className="text-[15px] font-semibold">{lapangan.namaLapangan}</h3>
                    {perbaikan ? (
                        <Badge variant="secondary">
                            <Wrench aria-hidden="true" />
                            Perbaikan
                        </Badge>
                    ) : jamKosong === 0 ? (
                        <Badge variant="secondary">
                            <CalendarX aria-hidden="true" />
                            Penuh
                        </Badge>
                    ) : (
                        <Badge variant="success">
                            <CircleCheck aria-hidden="true" />
                            {jamKosong} jam kosong
                        </Badge>
                    )}
                </div>

                {perbaikan ? (
                    <p className="rounded-md bg-muted p-3 text-muted-foreground">
                        Lapangan sedang diperbaiki dan belum bisa dipesan.
                    </p>
                ) : (
                    <div className="grid grid-cols-4 gap-1.5 min-[480px]:grid-cols-7">
                        {JAM_LIST.map((h) => {
                            const status = statusJam(h);
                            const dipilih = !!pilihan && h >= pilihan.start && h < pilihan.end;
                            const label = dipilih ? 'dipilih' : LABEL[status];
                            return (
                                <button
                                    key={h}
                                    type="button"
                                    disabled={status !== 'free'}
                                    aria-pressed={dipilih}
                                    aria-label={`${jam(h)}–${jam(h + 1)}, ${label}`}
                                    title={label}
                                    onClick={() => onPick(h)}
                                    className={cn(
                                        'h-9 cursor-pointer rounded-md border border-border bg-background text-sm font-medium tabular-nums transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50',
                                        dipilih &&
                                            'border-primary bg-primary text-primary-foreground hover:bg-primary',
                                        status === 'taken' &&
                                            'cursor-not-allowed border-transparent bg-fills-tertiary text-labels-tertiary line-through hover:bg-fills-tertiary',
                                        status === 'past' &&
                                            'cursor-not-allowed opacity-45 hover:bg-background',
                                    )}
                                >
                                    {jam(h)}
                                </button>
                            );
                        })}
                    </div>
                )}

                {bentrok && (
                    <p className="mt-2.5 flex items-center gap-1.5 text-xs text-destructive">
                        <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
                        Ada jam terisi di antaranya, jadi pilihan dimulai ulang.
                    </p>
                )}
            </div>

            <div
                className={cn(
                    'flex items-baseline justify-between gap-2 border-t px-4 py-3 sm:flex-col sm:items-center sm:justify-center sm:border-t-0 sm:border-l sm:p-4 sm:text-center',
                    pilihan && 'text-primary',
                )}
            >
                <span className="text-xs text-muted-foreground">
                    {pilihan ? `${durasi} jam dipilih` : ''}
                </span>
                <span className="text-[22px] leading-[30px] font-semibold tabular-nums">
                    {formatRupiah(lapangan.tarifPerJam * (pilihan ? durasi : 1))}
                </span>
                <span className="text-xs text-muted-foreground">
                    {pilihan ? `${jam(pilihan.start)}–${jam(pilihan.end)}` : 'per jam'}
                </span>
            </div>
        </Card>
    );
}
