import { Button } from '@/Components/ui/button';
import { formatRupiah } from '@/Components/ui/format';
import { ReactNode, useState } from 'react';
import { Rekening } from './pembayaran';

export default function RekeningTransfer({ rekening, total }: { rekening: Rekening; total: number }) {
    const [tersalin, setTersalin] = useState<'rekening' | 'jumlah' | null>(null);

    const salin = (kunci: 'rekening' | 'jumlah', teks: string) => {
        navigator.clipboard?.writeText(teks).catch(() => {});
        setTersalin(kunci);
    };

    const baris = (label: string, isi: ReactNode) => (
        <div className="flex min-h-11 items-center justify-between gap-3 border-t py-1.5 first:border-t-0">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="flex items-center gap-2 text-right font-medium tabular-nums">{isi}</dd>
        </div>
    );

    return (
        <dl className="text-sm">
            {baris('Bank', rekening.bank)}
            {baris(
                'No. rekening',
                <>
                    {rekening.nomor}
                    <Button
                        type="button"
                        variant="outline"
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
                    <span className="text-base font-semibold">{formatRupiah(total)}</span>
                    <Button type="button" variant="outline" size="sm" onClick={() => salin('jumlah', String(total))}>
                        {tersalin === 'jumlah' ? 'Tersalin' : 'Salin'}
                    </Button>
                </>,
            )}
        </dl>
    );
}
