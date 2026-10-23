import { BookingStatusBadge, PaymentStatusBadge } from '@/Components/ui/badge';
import { BookingPenyewa, keadaan } from './pembayaran';

export default function StatusBooking({
    booking,
}: {
    booking: Pick<BookingPenyewa, 'status' | 'statusPembayaran'>;
}) {
    switch (keadaan(booking)) {
        case 'belumBayar':
            return <BookingStatusBadge status="dipesan" />;
        case 'menungguVerifikasi':
            return <PaymentStatusBadge status="menunggu verifikasi" />;
        case 'ditolak':
            return <PaymentStatusBadge status="ditolak" />;
        case 'dikonfirmasi':
            return <BookingStatusBadge status="dikonfirmasi" />;
        default:
            return <BookingStatusBadge status="dibatalkan" />;
    }
}
