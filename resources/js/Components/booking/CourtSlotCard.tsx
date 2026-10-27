import { CourtCard } from '@/Components/ui/court-card';
import { SlotPicker, TimeRange } from '@/Components/ui/slot-picker';
import { cn } from 'cn';
import { Clock, Image, Images, Wrench } from 'lucide-react';
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
    return (
        <CourtCard
            headerLayout="inline"
            asideFlush
            name={lapangan.namaLapangan}
            type={lapangan.jenisLapangan}
            rate={lapangan.tarifPerJam}
            status={perbaikan ? 'perbaikan' : jamKosong === 0 ? 'dipesan' : 'tersedia'}
            aside={<FotoLapangan nama={lapangan.namaLapangan} abuAbu={perbaikan} />}
            action={
                perbaikan ? (
                    <div className="flex min-h-24 flex-1 items-center gap-3 rounded-lg bg-canvas p-4">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-background text-accessible-orange">
                            <Wrench className="size-4.5" aria-hidden="true" />
                        </span>
                        <div className="grid gap-0.5">
                            <p className="font-semibold">Belum bisa dipesan</p>
                            <p className="text-muted-foreground">
                                Lapangan sedang diperbaiki. Pilih lapangan lain atau tanggal lain.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid min-w-0 flex-1 gap-3.5">
                        <SlotPicker
                            key={resetKey}
                            variant="compact"
                            open={jam(JAM_BUKA)}
                            close={jam(JAM_TUTUP)}
                            booked={booked}
                            isPast={isPast}
                            value={value}
                            onValueChange={onValueChange}
                        />
                        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                            <div className="flex flex-wrap items-center gap-3.5">
                                <span className="flex items-center gap-1.5">
                                    <span className="size-3 rounded-sm bg-primary/12" />
                                    Kosong
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="size-3 rounded-sm bg-primary" />
                                    Dipilih
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="size-3 rounded-sm border border-dashed border-input" />
                                    Terbooking
                                </span>
                            </div>
                            <span className="flex items-center gap-1.5 text-[13px] text-foreground tabular-nums">
                                {jamKosong === 0 ? (
                                    'Penuh di tanggal ini'
                                ) : (
                                    <>
                                        <Clock className="size-3.5 text-muted-foreground" aria-hidden="true" />
                                        {jamKosong} jam kosong
                                    </>
                                )}
                            </span>
                        </div>
                    </div>
                )
            }
        />
    );
}

// Belum ada foto lapangan di database: tampilkan tempatnya dulu, tombol "Lihat foto" belum aktif.
function FotoLapangan({ nama, abuAbu }: { nama: string; abuAbu: boolean }) {
    return (
        <div className={cn('absolute inset-0 bg-grays-gray-6', abuAbu && 'grayscale')}>
            <div className="flex h-full items-center justify-center text-muted-foreground">
                <Image className="size-5.5" role="img" aria-label={`Foto ${nama} belum tersedia`} />
            </div>
            <button
                type="button"
                disabled
                className="absolute right-3 bottom-3 flex h-7.5 items-center gap-1.5 rounded-full bg-background px-3 text-xs font-medium text-foreground shadow-md disabled:cursor-not-allowed"
            >
                <Images className="size-3.5" aria-hidden="true" />
                Lihat foto
            </button>
        </div>
    );
}
