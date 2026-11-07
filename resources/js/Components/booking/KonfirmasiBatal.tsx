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
            {/* rata tengah ala Airbnb: ikon besar, judul besar, dua tombol penuh bertumpuk */}
            <AlertDialogContent className="gap-6">
                <AlertDialogHeader className="items-center text-center sm:text-center">
                    <img
                        src="/images/booking/tempat-sampah.webp"
                        alt=""
                        width={112}
                        height={112}
                        className="mb-1 size-28"
                    />
                    <AlertDialogTitle className="text-body font-semibold text-balance">Batalkan booking ini?</AlertDialogTitle>
                    {/* pendek: 1 baris di desktop, maks. 2 baris di HP; detail booking sudah terlihat di belakang */}
                    <AlertDialogDescription className="text-balance">Jadwalnya dilepas untuk orang lain. Tidak ada biaya.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="sm:flex-col-reverse">
                    <AlertDialogCancel className="h-10 w-full">Kembali</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" className="h-10 w-full" onClick={batalkan}>
                        Ya, batalkan
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
