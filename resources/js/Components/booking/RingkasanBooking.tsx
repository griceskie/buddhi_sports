import { Button } from '@/Components/ui/button';
import { bookingTotal, formatRupiah, formatTanggal } from '@/Components/ui/format';
import { Stepper } from '@/Components/ui/stepper';
import { cn } from 'cn';
import { Clock, Image } from 'lucide-react';
import { jam, Lapangan, Pilihan } from './jadwal';

const LANGKAH = ['Pilih jadwal', 'Transfer', 'Unggah bukti'];

type Props = {
    lapangan: Lapangan | null;
    pilihan: Pilihan | null;
    tanggal: Date;
    onBook: () => void;
    memproses?: boolean;
};

export default function RingkasanBooking({
    lapangan,
    pilihan,
    tanggal,
    onBook,
    memproses,
    batasBayarMenit,
}: Props & { batasBayarMenit: number }) {
    const ada = !!(lapangan && pilihan);
    const durasi = pilihan ? pilihan.end - pilihan.start : 0;
    const total =
        lapangan && pilihan ? bookingTotal(jam(pilihan.start), jam(pilihan.end), lapangan.tarifPerJam) : 0;

    return (
        <div className="grid gap-5 lg:sticky lg:top-6">
            <Stepper steps={LANGKAH} current={0} />

            <div className="grid gap-4 rounded-lg border bg-card p-5 text-card-foreground shadow-md">
                <div className="flex items-center gap-3.5">
                    {ada ? (
                        // belum ada foto lapangan di database
                        <div className="flex h-18 w-24 shrink-0 items-center justify-center rounded-[10px] border bg-grays-gray-6 text-muted-foreground">
                            <Image className="size-5" role="img" aria-label={`Foto ${lapangan!.namaLapangan} belum tersedia`} />
                        </div>
                    ) : (
                        <div className="flex h-18 w-24 shrink-0 items-center justify-center rounded-[10px] border border-dashed border-input text-muted-foreground">
                            <Clock className="size-5" aria-hidden="true" />
                        </div>
                    )}
                    <div className="grid min-w-0 gap-0.5">
                        <span className="text-xs text-muted-foreground">Ringkasan booking</span>
                        <span className="truncate text-base leading-[22px] font-semibold">
                            {ada ? lapangan!.namaLapangan : 'Belum ada jam dipilih'}
                        </span>
                        <span className="text-[13px] text-muted-foreground">
                            {ada ? lapangan!.jenisLapangan : 'Ketuk jam kosong di salah satu lapangan.'}
                        </span>
                    </div>
                </div>

                <dl className="grid grid-cols-2 overflow-hidden rounded-lg border border-input">
                    <div className="grid gap-0.5 border-r border-input px-3 py-2.5">
                        <dt className="text-[11px] leading-[14px] font-semibold tracking-wide uppercase">Tanggal</dt>
                        <dd className="text-sm">{formatTanggal(tanggal, 'EEE, d MMM yyyy')}</dd>
                    </div>
                    <div className="grid gap-0.5 px-3 py-2.5">
                        <dt className="text-[11px] leading-[14px] font-semibold tracking-wide uppercase">Jam</dt>
                        <dd className={cn('text-sm tabular-nums', !ada && 'text-muted-foreground')}>
                            {ada ? `${jam(pilihan!.start)}–${jam(pilihan!.end)}` : 'Belum dipilih'}
                        </dd>
                    </div>
                </dl>

                <Button className="h-11 w-full text-[15px]" disabled={!ada || memproses} onClick={onBook}>
                    {memproses ? 'Menyimpan…' : 'Booking sekarang'}
                </Button>

                {ada ? (
                    <>
                        <div className="grid gap-2.5 text-sm">
                            <div className="flex justify-between gap-3">
                                <span className="text-muted-foreground">
                                    {formatRupiah(lapangan!.tarifPerJam)} × {durasi} jam
                                </span>
                                <span className="tabular-nums">{formatRupiah(total)}</span>
                            </div>
                            <div className="flex items-baseline justify-between gap-3 border-t pt-3">
                                <span className="font-semibold">Total</span>
                                <span className="text-xl leading-[26px] font-semibold tabular-nums">
                                    {formatRupiah(total)}
                                </span>
                            </div>
                        </div>
                        <p className="flex items-start gap-2 rounded-md bg-canvas p-2.5 text-xs text-muted-foreground">
                            <Clock className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                            <span>
                                Setelah booking, transfer dan unggah bukti dalam {batasBayarMenit} menit. Lewat dari
                                itu, booking batal otomatis.
                            </span>
                        </p>
                    </>
                ) : (
                    <p className="text-center text-xs text-muted-foreground">Total biaya muncul setelah jam dipilih.</p>
                )}
            </div>
        </div>
    );
}

export function BarBookingMobile({ lapangan, pilihan, tanggal, onBook, memproses }: Props) {
    const total =
        lapangan && pilihan
            ? bookingTotal(jam(pilihan.start), jam(pilihan.end), lapangan.tarifPerJam)
            : 0;

    return (
        <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 border-t bg-background px-4 py-3 lg:hidden">
            <div className="min-w-0">
                <div className="font-semibold tabular-nums">
                    {lapangan && pilihan ? `Total ${formatRupiah(total)}` : 'Belum ada jam dipilih'}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                    {lapangan && pilihan
                        ? `${lapangan.namaLapangan} · ${formatTanggal(tanggal, 'EEE, d MMM')} · ${jam(pilihan.start)}–${jam(pilihan.end)} · ${pilihan.end - pilihan.start} jam`
                        : 'Ketuk jam kosong di salah satu lapangan.'}
                </div>
            </div>
            <Button className="h-11 text-[15px]" disabled={!pilihan || memproses} onClick={onBook}>
                {memproses ? 'Menyimpan…' : 'Booking sekarang'}
            </Button>
        </div>
    );
}
