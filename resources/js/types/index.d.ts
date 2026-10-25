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
    /** Manager saja: jumlah laporan ber-PDF yang belum ditandai diperiksa (badge sidebar). */
    laporanBelumDiperiksa?: number;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    pengelola: Pengelola | null;
    flash: {
        error?: string;
        success?: string;
    };
};
