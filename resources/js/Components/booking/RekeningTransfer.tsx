import { Button } from '@/Components/ui/button';
import { formatRupiah } from '@/Components/ui/format';
import { ReactNode, useState } from 'react';
import { Rekening } from './pembayaran';

/** Bank, nomor rekening, atas nama, jumlah; baris tidak pernah turun ke dua baris (di HP teks mengecil). */
export default function RekeningTransfer({ rekening, total }: { rekening: Rekening; total: number }) {
    const [tersalin, setTersalin] = useState<'rekening' | 'jumlah' | null>(null);

    const salin = (kunci: 'rekening' | 'jumlah', teks: string) => {
        navigator.clipboard?.writeText(teks).catch(() => {});
        setTersalin(kunci);
    };

    const baris = (label: ReactNode, isi: ReactNode) => (
        <div className="flex min-h-11 items-center justify-between gap-3 border-t py-1.5 first:border-t-0 sm:min-h-13">
            <dt className="text-footnote whitespace-nowrap text-muted-foreground sm:text-subheadline">{label}</dt>
            <dd className="flex items-center gap-2 text-right text-footnote font-semibold whitespace-nowrap tabular-nums sm:gap-3 sm:text-subheadline">
                {isi}
            </dd>
        </div>
    );

    return (
        <dl>
            {baris('Bank', rekening.bank)}
            {baris(
                <>
                    <span className="max-[379px]:hidden">No. rekening</span>
                    <span className="min-[380px]:hidden">No. rek</span>
                </>,
                <>
                    {rekening.nomor}
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => salin('rekening', rekening.nomor.replace(/\s/g, ''))}
                    >
                        {tersalin === 'rekening' ? 'Tersalin' : 'Salin'}
                    </Button>
                </>,
            )}
            {baris('Atas nama', rekening.atasNama)}
            {baris(
                'Jumlah transfer',
                <>
                    <span className="sm:text-callout sm:font-semibold">{formatRupiah(total)}</span>
                    <Button type="button" variant="secondary" size="sm" onClick={() => salin('jumlah', String(total))}>
                        {tersalin === 'jumlah' ? 'Tersalin' : 'Salin'}
                    </Button>
                </>,
            )}
        </dl>
    );
}
