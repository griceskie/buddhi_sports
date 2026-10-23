import { BookingSummary } from '@/Components/ui/booking-summary';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { bookingTotal, formatRupiah, formatTanggal } from '@/Components/ui/format';
import { Stepper } from '@/Components/ui/stepper';
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
}: Props) {
    return (
        <div className="grid gap-3 lg:sticky lg:top-4">
            <Stepper steps={LANGKAH} current={0} />

            {lapangan && pilihan ? (
                <BookingSummary
                    court={lapangan.namaLapangan}
                    type={lapangan.jenisLapangan}
                    date={tanggal}
                    start={jam(pilihan.start)}
                    end={jam(pilihan.end)}
                    rate={lapangan.tarifPerJam}
                >
                    <Button size="lg" className="w-full" disabled={memproses} onClick={onBook}>
                        {memproses ? 'Menyimpan…' : 'Booking sekarang'}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                        Ketuk jam lain di lapangan yang sama untuk menambah durasi.
                    </p>
                </BookingSummary>
            ) : (
                <Card>
                    <CardContent className="grid gap-3">
                        <p className="font-semibold">Ringkasan booking</p>
                        <p className="text-muted-foreground">
                            Belum ada jam dipilih. Ketuk jam yang kosong di salah satu lapangan.
                        </p>
                        <Button size="lg" className="w-full" disabled>
                            Booking sekarang
                        </Button>
                    </CardContent>
                </Card>
            )}
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
                    {lapangan && pilihan ? formatRupiah(total) : 'Belum ada jam dipilih'}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                    {lapangan && pilihan
                        ? `${lapangan.namaLapangan} · ${formatTanggal(tanggal, 'EEE, d MMM')} · ${jam(pilihan.start)}–${jam(pilihan.end)}`
                        : 'Ketuk jam yang kosong'}
                </div>
            </div>
            <Button size="lg" disabled={!pilihan || memproses} onClick={onBook}>
                {memproses ? 'Menyimpan…' : 'Booking sekarang'}
            </Button>
        </div>
    );
}
