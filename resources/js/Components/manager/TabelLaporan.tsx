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
import { Check, FileText } from 'lucide-react';
import BadgeTip from '@/Components/pengelola/BadgeTip';
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

const tgl = (iso: string) => formatTanggal(iso.slice(0, 10), 'd MMM yyyy');

function statusLaporan(l: Laporan): { teks: string; nada: string; tip: string } {
    if (l.diperiksaPada) return { teks: 'Sudah diperiksa', nada: 'hijau', tip: `Anda periksa ${tgl(l.diperiksaPada)}. Admin tidak bisa lagi mengubahnya.` };
    if (!l.filePdf) return { teks: 'Belum ada PDF', nada: 'abu', tip: 'Admin belum membuat PDF laporan ini.' };
    if (l.revisiPada) return { teks: 'Menunggu revisi Admin', nada: 'oranye', tip: `Catatan Anda: ${l.catatanRevisi ?? '-'}` };
    return { teks: 'Menunggu diperiksa', nada: 'biru', tip: 'Buka PDF-nya, lalu tandai diperiksa atau minta revisi.' };
}

/** Daftar laporan pembayaran untuk Manager. Tindakan ada di peringatan atas halaman (laporan terlama yang menunggu). */
export default function TabelLaporan({ laporan }: { laporan: Laporan[] }) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Periode</TableHead>
                    <TableHead className="text-right">Total pemasukan</TableHead>
                    <TableHead>Dibuat</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Diperiksa</TableHead>
                    <TableHead>
                        <span className="sr-only">Aksi</span>
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {laporan.map((l) => {
                    const st = statusLaporan(l);
                    return (
                        <TableRow key={l.idLaporan}>
                            <TableCell>
                                <span className="font-medium">{l.namaLaporan ?? `Laporan ${l.bulan}/${l.tahun}`}</span>
                                {l.revisiPada && !l.diperiksaPada && <span className="block max-w-80 truncate text-muted-foreground">Revisi: {l.catatanRevisi}</span>}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{formatRupiah(l.totalPemasukan)}</TableCell>
                            <TableCell className="whitespace-nowrap text-muted-foreground tabular-nums">
                                {tgl(l.tglLaporan)}
                                {l.namaAdmin && ` · ${l.namaAdmin}`}
                            </TableCell>
                            <TableCell>
                                <BadgeTip tip={st.tip}>
                                    <Badge data-nada={st.nada}>{st.teks}</Badge>
                                </BadgeTip>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-muted-foreground tabular-nums">{l.diperiksaPada ? tgl(l.diperiksaPada) : '—'}</TableCell>
                            <TableCell className="text-right">
                                {l.filePdf && (
                                    <a href={route('laporan.pdf', l.idLaporan)} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                                        <FileText />
                                        PDF
                                    </a>
                                )}
                            </TableCell>
                        </TableRow>
                    );
                })}
                {laporan.length === 0 && <TableEmpty colSpan={6}>Belum ada laporan pembayaran.</TableEmpty>}
            </TableBody>
        </Table>
    );
}

/** Menandai laporan sudah diperiksa; minta konfirmasi karena Admin tidak bisa lagi mengubah laporan itu. */
export function TandaiDiperiksa({ laporan }: { laporan: Laporan }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger className={buttonVariants({ size: 'sm' })}>
                <Check />
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
export function MintaRevisi({ laporan }: { laporan: Laporan }) {
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
