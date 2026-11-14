import { formatTanggal } from '@/Components/ui/format';
import { useEffect, useState } from 'react';

export type Rekening = { bank: string; nomor: string; atasNama: string };

/** Satu booking milik penyewa, seperti dikirim BookingPenyewaController::detail(). */
export type BookingPenyewa = {
    idBooking: number;
    idLapangan: number;
    kode: string;
    namaLapangan: string;
    jenisLapangan: string;
    tarifPerJam: number;
    /** Foto utama lapangan, atau null. */
    foto: string | null;
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
    dibuatPada: string | null;
    /** Waktu bukti terakhir dikirim. */
    dikirimPada: string | null;
    /** Alamat bukti lewat route privat `pembayaran.bukti`, atau null. */
    buktiUrl: string | null;
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

/** Siapa yang membatalkan: penyewa sendiri, sistem (batas bayar lewat tanpa bukti), atau pengelola. */
export function sebabBatal(b: Pick<BookingPenyewa, 'dibatalkanPenyewa' | 'statusPembayaran' | 'batasBayar'>) {
    if (b.dibatalkanPenyewa) return 'penyewa' as const;
    if (!b.statusPembayaran && b.batasBayar) return 'otomatis' as const;
    return 'pengelola' as const;
}

/** Hari dan jam singkat untuk riwayat status, mis. "Kamis, 26 Nov pukul 16.12". */
export const waktuSingkat = (iso: string) => formatTanggal(iso, "EEEE, d MMM 'pukul' HH.mm");

const pad = (n: number) => String(n).padStart(2, '0');

/** Jam batas bayar dan sisa waktunya (mm:ss), diperbarui tiap detik. `genting` = kurang dari 10 menit. */
export function useSisaWaktu(batas: string | null) {
    const [sekarang, setSekarang] = useState(() => Date.now());

    useEffect(() => {
        if (!batas) return;
        const t = setInterval(() => setSekarang(Date.now()), 1000);
        return () => clearInterval(t);
    }, [batas]);

    if (!batas) return null;
    const d = new Date(batas);
    const detik = Math.max(0, Math.floor((d.getTime() - sekarang) / 1000));
    return {
        jamBatas: `${pad(d.getHours())}.${pad(d.getMinutes())}`,
        sisa: `${pad(Math.floor(detik / 60))}:${pad(detik % 60)}`,
        habis: detik === 0,
        genting: detik < 600,
    };
}

