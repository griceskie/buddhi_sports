import { toMinutes } from '@/Components/ui/format';

export const JAM_BUKA = 8;
export const JAM_TUTUP = 22;
export const HARI_KE_DEPAN = 30;
export const HAMPIR_PENUH = 12;
// true: jam hari ini yang sudah mulai tidak bisa dipilih. Ubah ke false bila perlu semua jam terbuka untuk mengisi data uji.
export const BLOKIR_JAM_LEWAT = true;

export type Lapangan = {
    idLapangan: number;
    namaLapangan: string;
    jenisLapangan: string;
    tarifPerJam: number;
    status: string;
};

export type Terisi = {
    idLapangan: number;
    tanggal: string;
    jamMulai: string;
    jamSelesai: string;
    milikSaya?: boolean;
};

export type Pilihan = { court: number; start: number; end: number };
export type StatusJam = 'free' | 'taken' | 'past';

const pad = (n: number) => String(n).padStart(2, '0');

export const jam = (h: number) => `${pad(h)}:00`;

export const isoTanggal = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const tambahHari = (d: Date, n: number) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export const awalHari = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const sedangPerbaikan = (l: Lapangan) =>
    l.status.toLowerCase() === 'perbaikan';

export const jamSudahLewat = (h: number, tanggal: Date, sekarang: Date) =>
    BLOKIR_JAM_LEWAT && isoTanggal(tanggal) === isoTanggal(sekarang) && h <= sekarang.getHours();

export function statusJam(
    terisi: Terisi[],
    idLapangan: number,
    h: number,
    tanggal: Date,
    sekarang: Date,
): StatusJam {
    const ds = isoTanggal(tanggal);
    const dipakai = terisi.some(
        (t) =>
            t.idLapangan === idLapangan &&
            t.tanggal === ds &&
            h * 60 < toMinutes(t.jamSelesai) &&
            (h + 1) * 60 > toMinutes(t.jamMulai),
    );
    if (dipakai) return 'taken';
    if (jamSudahLewat(h, tanggal, sekarang)) return 'past';
    return 'free';
}

export function jamKosong(
    terisi: Terisi[],
    l: Lapangan,
    tanggal: Date,
    sekarang: Date,
): number {
    if (sedangPerbaikan(l)) return 0;
    let n = 0;
    for (let h = JAM_BUKA; h < JAM_TUTUP; h++) {
        if (statusJam(terisi, l.idLapangan, h, tanggal, sekarang) === 'free') n++;
    }
    return n;
}
