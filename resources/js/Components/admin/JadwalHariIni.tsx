import { jam, JAM_BUKA, JAM_TUTUP } from '@/Components/booking/jadwal';
import { keadaan } from '@/Components/booking/pembayaran';
import { BookingTimeline } from '@/Components/ui/booking-timeline';

export type JadwalLapangan = { idLapangan: number; namaLapangan: string; jenisLapangan: string };

export type JadwalBooking = {
    idBooking: number;
    idLapangan: number;
    jamMulai: string;
    jamSelesai: string;
    namaPenyewa: string;
    status: string;
    statusPembayaran: string | null;
    idPembayaran: number | null;
};

/** Jadwal satu tanggal untuk dashboard Admin: hanya booking terkonfirmasi dan yang menunggu verifikasi. */
export default function JadwalHariIni({
    lapangan,
    booking,
    onTinjau,
}: {
    lapangan: JadwalLapangan[];
    booking: JadwalBooking[];
    onTinjau: (idPembayaran: number) => void;
}) {
    return (
        <BookingTimeline
            open={jam(JAM_BUKA)}
            close={jam(JAM_TUTUP)}
            rows={lapangan.map((l) => ({
                id: l.idLapangan,
                name: l.namaLapangan,
                description: l.jenisLapangan,
                blocks: booking
                    .filter((b) => b.idLapangan === l.idLapangan)
                    .map((b) => {
                        const menunggu = keadaan(b) === 'menungguVerifikasi';
                        const judul = `${b.namaPenyewa}, ${b.jamMulai}–${b.jamSelesai}`;
                        return {
                            id: b.idBooking,
                            start: b.jamMulai,
                            end: b.jamSelesai,
                            label: b.namaPenyewa,
                            detail: `${b.jamMulai}–${b.jamSelesai}`,
                            tone: menunggu ? ('pending' as const) : ('confirmed' as const),
                            title: menunggu ? `${judul}, menunggu verifikasi. Tinjau bukti` : judul,
                            onSelect: menunggu && b.idPembayaran ? () => onTinjau(b.idPembayaran!) : undefined,
                        };
                    }),
            }))}
            legend={[
                { tone: 'confirmed', label: 'Dikonfirmasi' },
                { tone: 'pending', label: 'Menunggu verifikasi' },
            ]}
        />
    );
}
