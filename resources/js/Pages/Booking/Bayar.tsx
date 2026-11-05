import { Terisi } from '@/Components/booking/jadwal';
import KonfirmasiBatal from '@/Components/booking/KonfirmasiBatal';
import PanelPembayaran from '@/Components/booking/PanelPembayaran';
import { BookingPenyewa, Rekening } from '@/Components/booking/pembayaran';
import StatusBuka from '@/Components/booking/StatusBuka';
import PenyewaLayout from '@/Layouts/PenyewaLayout';
import { Head, router } from '@inertiajs/react';
import { useCallback, useState } from 'react';

export default function Bayar({
    booking,
    rekening,
    terisi,
}: {
    booking: BookingPenyewa;
    rekening: Rekening;
    terisi?: Terisi[];
}) {
    const [konfirmasi, setKonfirmasi] = useState(false);
    // batas bayar lewat: server membatalkan booking saat halaman dimuat ulang
    const habis = useCallback(() => {
        setKonfirmasi(false);
        router.reload({ only: ['booking'] });
    }, []);

    return (
        <PenyewaLayout navTengah={<StatusBuka />}>
            <Head title="Konfirmasi dan bayar" />
            <PanelPembayaran
                booking={booking}
                rekening={rekening}
                terisi={terisi}
                tampilan="halaman"
                onMintaBatal={() => setKonfirmasi(true)}
                onHabis={habis}
            />
            <KonfirmasiBatal booking={booking} open={konfirmasi} onOpenChange={setKonfirmasi} />
        </PenyewaLayout>
    );
}
