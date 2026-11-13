import { useState } from 'react';

/**
 * Tema panel pengelola (Admin dan login pengelola). Pilihan per perangkat di cookie `tema_pengelola`
 * (`gelap` / `terang`); tanpa cookie mengikuti pengaturan sistem. Kelas dipasang di <html> supaya isi portal
 * (dropdown, dialog, sheet) ikut bertema. Pemasangan pertama sebelum React jalan ada di app.blade.php.
 */
const COOKIE = 'tema_pengelola';

export function temaGelapTersimpan(): boolean {
    const cocok = document.cookie.match(/(?:^|; )tema_pengelola=(gelap|terang)/);
    if (cocok) return cocok[1] === 'gelap';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

function terapkan(gelap: boolean) {
    document.documentElement.classList.toggle('dark', gelap);
}

/** Pasang atau lepas tema panel di <html> sesuai prop `temaPanel` halaman (dipanggil dari app.tsx setiap pindah halaman). */
export function sinkronTemaPanel(aktif: boolean) {
    const html = document.documentElement;
    html.classList.toggle('tema-pengelola', aktif);
    terapkan(aktif && temaGelapTersimpan());
}

/** Status mode gelap dan pengubahnya (untuk tombol di header dan halaman login). */
export function useModeGelap(): [boolean, (gelap: boolean) => void] {
    const [gelap, setGelap] = useState(() => (typeof document === 'undefined' ? false : temaGelapTersimpan()));

    const ubah = (baru: boolean) => {
        document.cookie = `${COOKIE}=${baru ? 'gelap' : 'terang'}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
        terapkan(baru);
        setGelap(baru);
    };

    return [gelap, ubah];
}
