import { Badge } from '@/Components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { cn } from 'cn';
import { BarisBatang, DaftarBatang, DeretMetrik, Grafik, GrafikBatang, Kartu, Metrik, Sub, Tujuan } from './bagian';

export type DataAdmin = {
    metrik: Metrik[];
    grafik: Grafik;
    sebaran: BarisBatang[];
    perAdmin: { nama: string; inisial: string; ket: string; n: string; rata: string; cepat: string; cepatBaik: boolean; tolak: string }[];
    laporan: { bulan: string; dibuat: string; batas: string; tepat: string; nadaTepat: string; diperiksa: string; status: string; nadaStatus: string }[];
    laporanKosong: string;
};

const WARNA_NADA: Record<string, string> = {
    hijau: 'text-accessible-green',
    oranye: 'text-accessible-orange',
    merah: 'text-accessible-red',
    abu: 'text-muted-foreground',
};

export default function TabAdmin({ data, onPilih }: { data: DataAdmin; onPilih: (t: Tujuan) => void }) {
    return (
        <>
            <Kartu judul="Pemeriksaan bukti bayar" ket="Dihitung dari bukti yang diterima atau ditolak Admin di periode ini. Waktu malam tidak dihitung.">
                <DeretMetrik metrik={data.metrik} />
                <Sub>
                    <GrafikBatang grafik={data.grafik} onPilih={onPilih} tinggi={200} />
                </Sub>
            </Kartu>
            <div className="grid grid-cols-[minmax(0,1fr)] items-stretch gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
                <Kartu judul="Lama periksa" ket="Sebaran waktu dari bukti dikirim sampai diputuskan." className="gap-4">
                    <div className="flex flex-col gap-3.5">
                        <span className="font-medium">Bukti menurut lama periksa</span>
                        <DaftarBatang baris={data.sebaran} />
                    </div>
                </Kartu>
                <Kartu judul="Per admin" ket="Admin yang menerima atau menolak bukti di periode ini." className="gap-4">
                    {data.perAdmin.length ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Admin</TableHead>
                                    <TableHead className="text-right">Bukti</TableHead>
                                    <TableHead className="text-right">Rata-rata</TableHead>
                                    <TableHead className="text-right">Dalam 1 jam</TableHead>
                                    <TableHead className="text-right">Ditolak</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.perAdmin.map((a) => (
                                    <TableRow key={a.nama + a.ket}>
                                        <TableCell>
                                            <span className="flex items-center gap-2.5">
                                                <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                                                    {a.inisial}
                                                </span>
                                                <span className="flex flex-col">
                                                    <span className="font-medium">{a.nama}</span>
                                                    <span className="text-sm text-muted-foreground">{a.ket}</span>
                                                </span>
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">{a.n}</TableCell>
                                        <TableCell className="text-right whitespace-nowrap tabular-nums">{a.rata}</TableCell>
                                        <TableCell className={cn('text-right font-medium tabular-nums', a.cepatBaik ? 'text-accessible-green' : 'text-accessible-orange')}>{a.cepat}</TableCell>
                                        <TableCell className="text-right tabular-nums">{a.tolak}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">Belum ada bukti yang diperiksa di periode ini.</p>
                    )}
                </Kartu>
            </div>
            <Kartu judul="Laporan bulanan" ket="Admin membuat laporan paling lambat tanggal 5 bulan berikutnya." className="gap-4">
                {data.laporan.length ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Bulan</TableHead>
                                <TableHead>Dibuat</TableHead>
                                <TableHead>Batas</TableHead>
                                <TableHead>Ketepatan</TableHead>
                                <TableHead>Diperiksa Anda</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.laporan.map((l) => (
                                <TableRow key={l.bulan}>
                                    <TableCell className="font-medium">{l.bulan}</TableCell>
                                    <TableCell className="tabular-nums">{l.dibuat}</TableCell>
                                    <TableCell className="text-muted-foreground tabular-nums">{l.batas}</TableCell>
                                    <TableCell>
                                        <span className={cn('inline-flex items-center gap-1.5 font-medium', WARNA_NADA[l.nadaTepat])}>
                                            <span aria-hidden className="size-2 rounded-full bg-current" />
                                            {l.tepat}
                                        </span>
                                    </TableCell>
                                    <TableCell className="tabular-nums">{l.diperiksa}</TableCell>
                                    <TableCell>
                                        <Badge data-nada={l.nadaStatus}>{l.status}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">{data.laporanKosong}</p>
                )}
            </Kartu>
        </>
    );
}
