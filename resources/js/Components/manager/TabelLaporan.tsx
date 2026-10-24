import { buttonVariants } from '@/Components/ui/button';
import { formatRupiah, formatTanggal } from '@/Components/ui/format';
import {
    Table,
    TableBody,
    TableCell,
    TableEmpty,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { Download, ExternalLink } from 'lucide-react';

export type Laporan = {
    idLaporan: number;
    namaLaporan: string | null;
    bulan: number;
    tahun: number;
    totalPemasukan: number;
    tglLaporan: string;
    filePdf: string | null;
    namaAdmin: string | null;
};

/** Laporan pembayaran untuk Manager: hanya dibaca, PDF bisa dibuka atau diunduh. */
export default function TabelLaporan({ laporan }: { laporan: Laporan[] }) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Nama laporan</TableHead>
                    <TableHead>Total pemasukan</TableHead>
                    <TableHead>Tanggal laporan</TableHead>
                    <TableHead>Dibuat oleh</TableHead>
                    <TableHead className="text-right">PDF</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {laporan.map((l) => (
                    <TableRow key={l.idLaporan}>
                        <TableCell className="font-medium">{l.namaLaporan ?? `Laporan ${l.bulan}/${l.tahun}`}</TableCell>
                        <TableCell className="tabular-nums">{formatRupiah(l.totalPemasukan)}</TableCell>
                        <TableCell>{formatTanggal(l.tglLaporan, 'd MMM yyyy')}</TableCell>
                        <TableCell>{l.namaAdmin ?? '-'}</TableCell>
                        <TableCell className="text-right">
                            {l.filePdf ? (
                                <div className="flex justify-end gap-2">
                                    <a
                                        href={route('laporan.pdf', l.idLaporan)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={buttonVariants({ variant: 'outline', size: 'sm' })}
                                    >
                                        <ExternalLink />
                                        Buka
                                    </a>
                                    <a
                                        href={route('laporan.pdf', { idLaporan: l.idLaporan, unduh: 1 })}
                                        className={buttonVariants({ variant: 'outline', size: 'sm' })}
                                    >
                                        <Download />
                                        Unduh
                                    </a>
                                </div>
                            ) : (
                                <span className="text-sm text-muted-foreground">Belum ada PDF</span>
                            )}
                        </TableCell>
                    </TableRow>
                ))}
                {laporan.length === 0 && <TableEmpty colSpan={5}>Belum ada laporan pembayaran.</TableEmpty>}
            </TableBody>
        </Table>
    );
}
