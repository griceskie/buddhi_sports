import { CourtCard } from '@/Components/ui/court-card';
import { durationHours, formatRupiah } from '@/Components/ui/format';
import { SlotPicker, TimeRange } from '@/Components/ui/slot-picker';
import { cn } from 'cn';
import { JAM_BUKA, JAM_TUTUP, jam, Lapangan } from './jadwal';

export default function CourtSlotCard({
    lapangan,
    perbaikan,
    jamKosong,
    booked,
    isPast,
    value,
    onValueChange,
    resetKey,
}: {
    lapangan: Lapangan;
    perbaikan: boolean;
    jamKosong: number;
    booked: TimeRange[];
    isPast: (start: string) => boolean;
    value: TimeRange | null;
    onValueChange: (value: TimeRange | null) => void;
    // SlotPicker menyimpan jam awal di dalam dirinya; ganti key supaya ia mulai bersih saat pilihan pindah lapangan atau tanggal.
    resetKey: string;
}) {
    const durasi = value ? durationHours(value.start, value.end) : 0;
    const status = perbaikan ? 'perbaikan' : jamKosong === 0 ? 'dipesan' : 'tersedia';

    return (
        <CourtCard
            name={lapangan.namaLapangan}
            type={lapangan.jenisLapangan}
            rate={lapangan.tarifPerJam}
            status={status}
            statusLabel={
                perbaikan ? undefined : jamKosong === 0 ? 'Penuh' : `${jamKosong} jam kosong`
            }
            description={perbaikan ? 'Lapangan sedang diperbaiki dan belum bisa dipesan.' : undefined}
            aside={
                <>
                    <span className="text-xs text-muted-foreground">{value ? `${durasi} jam dipilih` : ''}</span>
                    <span className={cn('text-[22px] leading-[30px] font-semibold tabular-nums', value && 'text-primary')}>
                        {formatRupiah(lapangan.tarifPerJam * (value ? durasi : 1))}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {value ? `${value.start}–${value.end}` : 'per jam'}
                    </span>
                </>
            }
            className={perbaikan ? 'opacity-75' : undefined}
            action={
                perbaikan ? undefined : (
                    <SlotPicker
                        key={resetKey}
                        className="min-w-0 flex-1"
                        open={jam(JAM_BUKA)}
                        close={jam(JAM_TUTUP)}
                        booked={booked}
                        isPast={isPast}
                        value={value}
                        onValueChange={onValueChange}
                    />
                )
            }
        />
    );
}
