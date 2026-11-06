import { BookingPenyewa } from '@/Components/booking/pembayaran';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/Components/ui/alert-dialog';
import { formatTanggal } from '@/Components/ui/format';
import { router } from '@inertiajs/react';

/** Konfirmasi "Batalkan booking ini?"; hanya untuk booking yang belum dibayar. */
export default function KonfirmasiBatal({
    booking,
    open,
    onOpenChange,
}: {
    booking: BookingPenyewa;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const batalkan = () =>
        router.post(route('booking.batal', booking.idBooking), {}, { preserveScroll: true, preserveState: true });

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Batalkan booking ini?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Booking {booking.kode} untuk {booking.namaLapangan},{' '}
                        {formatTanggal(booking.tanggal, 'EEE, d MMM yyyy')} pukul {booking.jamMulai}–{booking.jamSelesai}{' '}
                        dibatalkan. Anda belum membayar apa pun, jadi tidak ada biaya.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Kembali</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={batalkan}>
                        Ya, batalkan
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
