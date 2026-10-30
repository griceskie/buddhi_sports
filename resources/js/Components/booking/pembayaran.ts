import { useEffect, useState } from 'react';

export type Rekening = { bank: string; nomor: string; atasNama: string };

/** Satu booking milik penyewa, seperti dikirim BookingPenyewaController::detail(). */
export type BookingPenyewa = {
    idBooking: number;
    kode: string;
    namaLapangan: string;
    jenisLapangan: string;
    tarifPerJam: number;
    tanggal: string;
    jamMulai: string;
    jamSelesai: string;
    totalBayar: number;
    status: string;
    /** true bila penyewa sendiri yang membatalkan (bukan batal otomatis). */
    dibatalkanPenyewa: boolean;
    statusPembayaran: string | null;
    /** Diisi Admin saat menolak bukti; null lagi setelah bukti diunggah ulang. */
    alasanTolak: string | null;
    batasBayar: string | null;
};

export type Keadaan = 'belumBayar' | 'menungguVerifikasi' | 'ditolak' | 'dikonfirmasi' | 'dibatalkan';

// Gabungan status booking dan status pembayaran, karena "Menunggu verifikasi" hanya ada di pembayarans.
export function keadaan(b: Pick<BookingPenyewa, 'status' | 'statusPembayaran'>): Keadaan {
    if (b.status === 'Dibatalkan') return 'dibatalkan';
    if (b.status === 'Dikonfirmasi' || b.statusPembayaran === 'Terverifikasi') {
        return 'dikonfirmasi';
    }
    if (b.statusPembayaran === 'Ditolak') return 'ditolak';
    if (b.statusPembayaran) return 'menungguVerifikasi';
    return 'belumBayar';
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Jam batas bayar dan sisa waktunya; diperbarui tiap 30 detik. */
export function useSisaWaktu(batas: string | null) {
    const [sekarang, setSekarang] = useState(() => Date.now());

    useEffect(() => {
        if (!batas) return;
        const t = setInterval(() => setSekarang(Date.now()), 30_000);
        return () => clearInterval(t);
    }, [batas]);

    if (!batas) return null;
    const d = new Date(batas);
    const menit = Math.max(0, Math.ceil((d.getTime() - sekarang) / 60_000));
    return {
        jamBatas: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
        sisa: menit >= 60 ? `${Math.floor(menit / 60)} jam ${menit % 60} menit` : `${menit} menit`,
        habis: menit === 0,
    };
}
