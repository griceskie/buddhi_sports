export interface User {
    idPenyewa: number;
    namaPenyewa: string;
    noHp: string;
    email: string;
}

export interface Pengelola {
    role: 'admin' | 'manager';
    nama: string;
    username: string;
    /** Admin saja: jumlah pembayaran yang menunggu verifikasi (badge sidebar). */
    menungguVerifikasi?: number;
    /** Admin saja: notifikasi header (maksimal 5) dan jumlah bukti bayar yang belum dibaca. */
    notifikasi?: { daftar: NotifikasiPengelola[]; baru: number };
    /** Manager saja: jumlah laporan ber-PDF yang belum ditandai diperiksa (badge sidebar). */
    laporanBelumDiperiksa?: number;
}

export interface NotifikasiPengelola {
    id: string;
    jenis: 'bayar' | 'laporan' | 'batal';
    judul: string;
    ket: string;
    /** ISO 8601; null untuk booking yang dibatalkan penyewa (waktu batal tidak tercatat). */
    waktu: string | null;
    href: string;
    baru: boolean;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    pengelola: Pengelola | null;
    /** Penyewa: booking mendatang yang belum dibayar atau buktinya ditolak (0 untuk akun lain). */
    perluTindakan: number;
    /** Halaman memakai tema panel pengelola (Admin dan login pengelola). */
    temaPanel: boolean;
    flash: {
        error?: string;
        success?: string;
    };
};
