import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/Components/ui/alert-dialog';
import InputError from '@/Components/InputError';
import { Badge } from '@/Components/ui/badge';
import { Button, buttonVariants } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { formatRupiah, formatTanggal } from '@/Components/ui/format';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableEmpty,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { router, useForm } from '@inertiajs/react';
import { CircleCheck, Download, ExternalLink } from 'lucide-react';
import { useState } from 'react';

export type Laporan = {
    idLaporan: number;
    namaLaporan: string | null;
    bulan: number;
    tahun: number;
    totalPemasukan: number;
    tglLaporan: string;
    filePdf: string | null;
    diperiksaPada: string | null;
    catatanRevisi: string | null;
    revisiPada: string | null;
    namaAdmin: string | null;
};

/** Laporan pembayaran untuk Manager: PDF bisa dibuka atau diunduh, dan laporan bisa ditandai sudah diperiksa. */
export default function TabelLaporan({ laporan }: { laporan: Laporan[] }) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Nama laporan</TableHead>
                    <TableHead>Total pemasukan</TableHead>
                    <TableHead>Tanggal laporan</TableHead>
                    <TableHead>Dibuat oleh</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {laporan.map((l) => (
                    <TableRow key={l.idLaporan}>
                        <TableCell className="max-w-56 whitespace-normal font-medium">{l.namaLaporan ?? `Laporan ${l.bulan}/${l.tahun}`}</TableCell>
                        <TableCell className="tabular-nums">{formatRupiah(l.totalPemasukan)}</TableCell>
                        <TableCell>{formatTanggal(l.tglLaporan, 'd MMM yyyy')}</TableCell>
                        <TableCell>{l.namaAdmin ?? '-'}</TableCell>
                        <TableCell>
                            {l.diperiksaPada ? (
                                <Badge variant="success">
                                    <CircleCheck aria-hidden="true" />
                                    Sudah diperiksa
                                </Badge>
                            ) : l.filePdf ? (
                                l.revisiPada ? (
                                    <Badge variant="outline" className="border-accessible-orange/40 text-accessible-orange">
                                        Menunggu revisi Admin
                                    </Badge>
                                ) : (
                                    <Badge variant="outline">Menunggu diperiksa</Badge>
                                )
                            ) : (
                                '-'
                            )}
                        </TableCell>
                        <TableCell className="text-right">
                            {l.filePdf ? (
                                <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                                    {!l.diperiksaPada && (
                                        <div className="flex flex-col items-stretch gap-1.5">
                                            <TandaiDiperiksa laporan={l} />
                                            <MintaRevisi laporan={l} />
                                        </div>
                                    )}
                                    <a
                                        href={route('laporan.pdf', l.idLaporan)}
                                        target="_blank"
                                        rel="noreferrer"
                                        aria-label="Buka PDF"
                                        title="Buka PDF"
                                        className={buttonVariants({ variant: 'outline', size: 'icon-sm' })}
                                    >
                                        <ExternalLink />
                                    </a>
                                    <a
                                        href={route('laporan.pdf', { idLaporan: l.idLaporan, unduh: 1 })}
                                        aria-label="Unduh PDF"
                                        title="Unduh PDF"
                                        className={buttonVariants({ variant: 'outline', size: 'icon-sm' })}
                                    >
                                        <Download />
                                    </a>
                                </div>
                            ) : (
                                <span className="text-sm text-muted-foreground">Belum ada PDF</span>
                            )}
                        </TableCell>
                    </TableRow>
                ))}
                {laporan.length === 0 && <TableEmpty colSpan={6}>Belum ada laporan pembayaran.</TableEmpty>}
            </TableBody>
        </Table>
    );
}

/** Menandai laporan sudah diperiksa; minta konfirmasi karena Admin tidak bisa lagi mengubah laporan itu. */
function TandaiDiperiksa({ laporan }: { laporan: Laporan }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                Tandai diperiksa
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Tandai sudah diperiksa?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Setelah ditandai, Admin tidak bisa lagi membuat ulang, mengubah, atau menghapus{' '}
                        {laporan.namaLaporan ?? 'laporan ini'}. Tanda ini tidak bisa dibatalkan.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() =>
                            router.post(route('manager.laporan.diperiksa', laporan.idLaporan), {}, { preserveScroll: true })
                        }
                    >
                        Tandai diperiksa
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

/** Meminta Admin memperbaiki laporan: catatan wajib, ditampilkan ke Admin di halaman Laporan dan notifikasi. */
function MintaRevisi({ laporan }: { laporan: Laporan }) {
    const [buka, setBuka] = useState(false);
    const form = useForm({ catatan: laporan.catatanRevisi ?? '' });

    return (
        <>
            <Button variant="outline" size="sm" onClick={() => setBuka(true)}>
                {laporan.revisiPada ? 'Ubah revisi' : 'Minta revisi'}
            </Button>
            <Dialog open={buka} onOpenChange={setBuka}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Minta revisi laporan</DialogTitle>
                        <DialogDescription>
                            Admin melihat catatan ini, memperbaiki datanya, lalu membuat ulang {laporan.namaLaporan ?? 'laporan ini'}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-1.5">
                        <Label htmlFor={`catatan-${laporan.idLaporan}`}>Catatan revisi</Label>
                        <Textarea
                            id={`catatan-${laporan.idLaporan}`}
                            rows={4}
                            maxLength={500}
                            placeholder="Contoh: total minggu ketiga tidak cocok dengan rekap kas."
                            value={form.data.catatan}
                            onChange={(e) => form.setData('catatan', e.target.value)}
                            aria-invalid={!!form.errors.catatan}
                        />
                        <InputError message={form.errors.catatan} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBuka(false)}>
                            Batal
                        </Button>
                        <Button
                            disabled={!form.data.catatan.trim() || form.processing}
                            onClick={() => form.post(route('manager.laporan.revisi', laporan.idLaporan), { preserveScroll: true, onSuccess: () => setBuka(false) })}
                        >
                            Kirim ke Admin
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
