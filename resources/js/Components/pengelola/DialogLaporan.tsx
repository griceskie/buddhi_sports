import { isoTanggal } from '@/Components/booking/jadwal';
import FormSelect from '@/Components/FormSelect';
import InputError from '@/Components/InputError';
import { Ringkasan } from '@/Components/RingkasanPembayaran';
import { Button } from '@/Components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { formatRupiah, formatTanggal } from '@/Components/ui/format';
import { Label } from '@/Components/ui/label';
import { Period } from '@/Components/ui/period-picker';
import { SignaturePad } from '@/Components/ui/signature-pad';
import { useForm } from '@inertiajs/react';

type Manager = { idManager: number; namaManager: string };

/** Dialog "Buat laporan pembayaran": tanggal, Manager tujuan, tanda tangan; dipakai di halaman Pembayaran dan Laporan. */
export default function DialogLaporan({
    buka,
    onClose,
    periode,
    namaLaporan,
    ringkasan,
    datamanager,
    idManagerAwal,
}: {
    buka: boolean;
    onClose: () => void;
    periode: Period;
    namaLaporan: string;
    ringkasan: Ringkasan;
    datamanager: Manager[];
    /** Manager tujuan terpilih saat dialog dibuka (mis. saat membuat ulang laporan). */
    idManagerAwal?: number | null;
}) {
    const form = useForm({
        bulan: periode.bulan,
        tahun: periode.tahun,
        idManager: idManagerAwal ? String(idManagerAwal) : datamanager[0] ? String(datamanager[0].idManager) : '',
        tandaTangan: '',
    });

    const kirim = () =>
        form.post(route('laporan.buat'), {
            preserveScroll: true,
            onSuccess: () => {
                form.setData('tandaTangan', '');
                onClose();
            },
        });

    return (
        <Dialog open={buka} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Buat laporan pembayaran</DialogTitle>
                    <DialogDescription>
                        {ringkasan.terverifikasi.jumlah} pembayaran terverifikasi ·{' '}
                        {formatRupiah(ringkasan.terverifikasi.total)}. PDF tersimpan di Laporan Pembayaran.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                    <div>
                        <Label>Nama laporan</Label>
                        <p className="mt-1 font-medium">{namaLaporan}</p>
                    </div>

                    <div>
                        <Label>Tanggal laporan</Label>
                        <p className="mt-1 font-medium">{formatTanggal(isoTanggal(new Date()), 'd MMMM yyyy')}</p>
                        <p className="text-sm text-muted-foreground">Diisi otomatis dengan tanggal hari ini.</p>
                    </div>

                    <div>
                        <Label htmlFor="idManager">Ditujukan kepada (Manager)</Label>
                        <FormSelect
                            id="idManager"
                            className="mt-1 w-full"
                            value={form.data.idManager}
                            onChange={(v) => form.setData('idManager', v)}
                            placeholder="Pilih Manager"
                            options={datamanager.map((m) => ({ value: String(m.idManager), label: m.namaManager }))}
                        />
                        <InputError message={form.errors.idManager} className="mt-1" />
                    </div>

                    <div>
                        <Label>Tanda tangan digital</Label>
                        <SignaturePad
                            className="mt-1"
                            onChange={(v) => form.setData('tandaTangan', v)}
                            aria-invalid={!!form.errors.tandaTangan}
                        />
                        <InputError message={form.errors.tandaTangan} className="mt-1" />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Batal
                    </Button>
                    <Button disabled={!form.data.tandaTangan || !form.data.idManager || form.processing} onClick={kirim}>
                        {form.processing ? 'Membuat PDF…' : 'Buat PDF'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
