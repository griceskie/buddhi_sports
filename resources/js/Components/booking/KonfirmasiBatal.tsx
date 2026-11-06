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
                    <img
                        src="/images/booking/tempat-sampah.webp"
                        alt=""
                        width={72}
                        height={72}
                        className="mx-auto mb-1 size-18 sm:mx-0"
                    />
                    <AlertDialogTitle>Batalkan booking ini?</AlertDialogTitle>
                    {/* pendek: 1 baris di desktop, maks. 2 baris di HP; detail booking sudah terlihat di belakang */}
                    <AlertDialogDescription className="text-balance">Jadwalnya dilepas untuk orang lain. Tidak ada biaya.</AlertDialogDescription>
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
