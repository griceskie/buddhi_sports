import { formatRupiah } from '@/Components/ui/format';
import { SlotPicker, TimeRange } from '@/Components/ui/slot-picker';
import { Wrench } from 'lucide-react';
import { jam, JAM_BUKA, JAM_TUTUP, Lapangan } from './jadwal';

/**
 * Jam di lapangan terpilih: judul "N Jam di {lapangan}" + rentang terpilih, grid jam (label rentang),
 * dibungkus kontainer abu-abu dengan strip bawah "N jam kosong" dan legend.
 */
export default function KartuJam({
    lapangan,
    perbaikan,
    jamKosong,
    booked,
    isPast,
    value,
    onValueChange,
}: {
    lapangan: Lapangan;
    perbaikan: boolean;
    jamKosong: number;
    booked: TimeRange[];
    isPast: (start: string) => boolean;
    value: TimeRange | null;
    onValueChange: (r: TimeRange | null) => void;
}) {
    const durasi = value ? (Number(value.end.slice(0, 2)) - Number(value.start.slice(0, 2))) : 0;
    const judul = perbaikan
        ? lapangan.namaLapangan
        : value
          ? `${durasi} Jam di ${lapangan.namaLapangan}`
          : jamKosong > 0
            ? `Pilih jam di ${lapangan.namaLapangan}`
            : `${lapangan.namaLapangan} penuh`;
    const sub = perbaikan
        ? 'Sedang diperbaiki, belum bisa dipesan.'
        : value
          ? `${value.start}–${value.end}`
          : jamKosong > 0
            ? 'Belum ada jam dipilih'
            : 'Pilih tanggal lain';

    return (
        <div className="rounded-[17px] border bg-[color-mix(in_oklab,var(--foreground)_6%,var(--canvas))]">
            <article className="grid gap-4 rounded-2xl bg-card px-4 pt-4 pb-4 shadow-[0_1px_0_var(--border)] sm:px-5 sm:pb-5">
                <div className="flex items-center gap-4">
                    <div className="min-w-0 flex-1">
                        <h3 className="text-subheadline font-semibold">{judul}</h3>
                        <p className="text-footnote text-muted-foreground tabular-nums">{sub}</p>
                    </div>
                    <p className="shrink-0 text-footnote text-muted-foreground">
                        <span className="text-subheadline font-semibold text-foreground">
                            {formatRupiah(lapangan.tarifPerJam)}
                        </span>{' '}
                        / jam
                    </p>
                </div>

                {perbaikan ? (
                    <div className="flex items-center gap-2 rounded-lg bg-accessible-orange/10 px-3 py-2.5 text-footnote text-accessible-orange">
                        <Wrench className="size-4 shrink-0" aria-hidden="true" />
                        Lapangan ini sedang dalam perbaikan. Pilih lapangan lain.
                    </div>
                ) : (
                    <>
                        <SlotPicker
                            variant="compact"
                            open={jam(JAM_BUKA)}
                            close={jam(JAM_TUTUP)}
                            booked={booked}
                            isPast={isPast}
                            value={value}
                            onValueChange={onValueChange}
                            gridClassName="grid-cols-3 sm:grid-cols-5 xl:grid-cols-7"
                        />
                        <p className="text-footnote text-muted-foreground">
                            {value
                                ? 'Klik kotak sesudahnya untuk menambah jam, atau langsung booking.'
                                : jamKosong > 0
                                  ? 'Klik jam yang ingin dipesan.'
                                  : 'Semua jam di tanggal ini sudah terisi.'}
                        </p>
                    </>
                )}
            </article>

            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 px-4 pt-3 pb-3.5 sm:px-5">
                <p className="text-footnote font-semibold">
                    {perbaikan ? 'Dalam perbaikan' : jamKosong > 0 ? `${jamKosong} jam kosong` : 'Penuh di tanggal ini'}
                </p>
                <div className="flex items-center gap-3 text-caption-1 text-muted-foreground sm:gap-4">
                    <span className="flex items-center gap-1.5">
                        <span className="size-3 rounded-[3px] bg-canvas ring-1 ring-border/60" />
                        Kosong
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="size-3 rounded-[3px] bg-primary" />
                        Dipilih
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="size-3 rounded-[3px] border-[1.5px] border-dashed border-foreground/32" />
                        Terbooking
                    </span>
                </div>
            </div>
        </div>
    );
}
