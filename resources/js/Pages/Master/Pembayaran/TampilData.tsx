import { isoTanggal } from '@/Components/booking/jadwal';
import DeleteButton from '@/Components/DeleteButton';
import FlashMessage from '@/Components/FlashMessage';
import FormSelect from '@/Components/FormSelect';
import FormSheet, { SheetForm, useFormSheet } from '@/Components/FormSheet';
import InputError from '@/Components/InputError';
import { PaymentStatusBadge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { CurrencyInput } from '@/Components/ui/currency-input';
import { DatePicker } from '@/Components/ui/date-picker';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { formatRupiah, formatTanggal } from '@/Components/ui/format';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Period, PeriodPicker } from '@/Components/ui/period-picker';
import { ProofPreview } from '@/Components/ui/proof-review';
import { SignaturePad } from '@/Components/ui/signature-pad';
import { StatCard } from '@/Components/ui/stat-card';
import {
    Table,
    TableBody,
    TableCell,
    TableEmpty,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { FileText, Pencil, Plus, Wallet } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

type Pembayaran = {
    idPembayaran: number;
    idAdmin: number | null;
    idBooking: number;
    tglBayar: string;
    jumlahBayar: number;
    buktiBayar: string | null;
    status: string;
};

type PerStatus = { jumlah: number; total: number };
type Ringkasan = { terverifikasi: PerStatus; menunggu: PerStatus; ditolak: PerStatus };
type Laporan = { idLaporan: number; namaLaporan: string | null; tglLaporan: string; filePdf: string | null };
type Manager = { idManager: number; namaManager: string };
type Booking = { idBooking: number; tanggal: string };
type Admin = { idAdmin: number; namaAdmin: string };

type Props = {
    datapembayaran: Pembayaran[];
    periode: Period;
    namaLaporan: string;
    ringkasan: Ringkasan;
    laporan: Laporan | null;
    datamanager: Manager[];
    databooking: Booking[];
    dataadmin: Admin[];
};

const keTanggal = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
};

export default function TampilData({
    datapembayaran,
    periode,
    namaLaporan,
    ringkasan,
    laporan,
    datamanager,
    databooking,
    dataadmin,
}: Props) {
    const [buatLaporan, setBuatLaporan] = useState(false);
    const sheet = useFormSheet<Pembayaran>();

    const ubahPeriode = (p: Period) =>
        router.get(
            '/tampilpembayaran',
            { periode: `${p.tahun}-${String(p.bulan).padStart(2, '0')}` },
            { preserveScroll: true, preserveState: true, replace: true },
        );

    return (
        <AdminLayout
            header={
                <h2 className="text-xl leading-tight font-semibold text-foreground">
                    Data Pembayaran
                </h2>
            }
        >
            <Head title="Data Pembayaran" />

            <FlashMessage />

            <Card className="mb-4">
                <CardContent className="grid gap-4">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div className="grid gap-1.5">
                            <Label>Periode</Label>
                            <PeriodPicker value={periode} onValueChange={ubahPeriode} />
                        </div>
                        <Button onClick={() => setBuatLaporan(true)}>
                            <FileText />
                            {laporan ? 'Buat ulang laporan' : 'Buat laporan'}
                        </Button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <StatCard
                            label="Total pemasukan"
                            value={formatRupiah(ringkasan.terverifikasi.total)}
                            description={`dari ${ringkasan.terverifikasi.jumlah} pembayaran terverifikasi, masuk laporan`}
                            icon={<Wallet className="text-success" />}
                        />
                        <StatusPembayaran ringkasan={ringkasan} />
                    </div>

                    {laporan?.filePdf && (
                        <p className="text-sm text-muted-foreground">
                            {laporan.namaLaporan} dibuat {formatTanggal(laporan.tglLaporan, 'd MMMM yyyy')} ·{' '}
                            <a
                                href={route('laporan.pdf', laporan.idLaporan)}
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-primary hover:underline"
                            >
                                Buka PDF
                            </a>
                        </p>
                    )}
                </CardContent>
            </Card>

            <div className="mb-4">
                <Button onClick={() => sheet.buka()}>
                    <Plus />
                    Tambah Pembayaran
                </Button>
            </div>

            <Card className="gap-0 overflow-hidden py-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID Booking</TableHead>
                            <TableHead>Tgl Bayar</TableHead>
                            <TableHead>Jumlah</TableHead>
                            <TableHead>Bukti</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {datapembayaran.map((row) => (
                            <TableRow key={row.idPembayaran}>
                                <TableCell>{row.idBooking}</TableCell>
                                <TableCell>{row.tglBayar}</TableCell>
                                <TableCell>{formatRupiah(row.jumlahBayar)}</TableCell>
                                <TableCell>{row.buktiBayar ?? '-'}</TableCell>
                                <TableCell><PaymentStatusBadge status={row.status} /></TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" size="sm" onClick={() => sheet.buka(row)}>
                                            <Pencil />
                                            Edit
                                        </Button>
                                        <DeleteButton href={`/deletepembayaran/${row.idPembayaran}`} />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {datapembayaran.length === 0 && <TableEmpty colSpan={6} />}
                    </TableBody>
                </Table>
            </Card>

            <FormSheet open={sheet.open} onClose={sheet.tutup} className="sm:max-w-lg">
                <FormPembayaran
                    key={sheet.versi}
                    row={sheet.row}
                    onDone={sheet.tutup}
                    databooking={databooking}
                    dataadmin={dataadmin}
                />
            </FormSheet>

            <DialogLaporan
                key={`${periode.tahun}-${periode.bulan}`}
                buka={buatLaporan}
                onClose={() => setBuatLaporan(false)}
                periode={periode}
                namaLaporan={namaLaporan}
                ringkasan={ringkasan}
                datamanager={datamanager}
            />
        </AdminLayout>
    );
}

const STATUS_PEMBAYARAN = [
    { key: 'terverifikasi', label: 'Terverifikasi', warna: 'bg-success' },
    { key: 'menunggu', label: 'Menunggu verifikasi', warna: 'bg-accessible-orange' },
    { key: 'ditolak', label: 'Ditolak', warna: 'bg-destructive' },
] as const;

function StatusPembayaran({ ringkasan }: { ringkasan: Ringkasan }) {
    const semua = STATUS_PEMBAYARAN.reduce((n, s) => n + ringkasan[s.key].jumlah, 0);

    return (
        <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
            <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-muted-foreground">Status pembayaran</p>
                <p className="text-sm text-muted-foreground tabular-nums">{semua} pembayaran</p>
            </div>

            <div className="flex h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                {semua > 0 &&
                    STATUS_PEMBAYARAN.map((s) => (
                        <div
                            key={s.key}
                            className={s.warna}
                            style={{ width: `${(ringkasan[s.key].jumlah / semua) * 100}%` }}
                        />
                    ))}
            </div>

            <ul className="grid gap-1.5 text-sm">
                {STATUS_PEMBAYARAN.map((s) => (
                    <li key={s.key} className="flex items-center gap-2">
                        <span className={`size-2 shrink-0 rounded-full ${s.warna}`} aria-hidden="true" />
                        <span className="flex-1">{s.label}</span>
                        <span className="font-medium tabular-nums">{ringkasan[s.key].jumlah}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

// buktiBayar tersimpan sebagai path di disk public ("bukti/x.jpg")
const urlBukti = (path: string | null) => (!path ? null : /^https?:\/\//.test(path) ? path : `/storage/${path}`);

function FormPembayaran({
    row,
    onDone,
    databooking,
    dataadmin,
}: {
    row: Pembayaran | null;
    onDone: () => void;
    databooking: Booking[];
    dataadmin: Admin[];
}) {
    const { data, setData, post, processing, errors } = useForm({
        txtid: row?.idPembayaran ?? '',
        txtadmin: row?.idAdmin ? String(row.idAdmin) : '',
        txtbooking: row ? String(row.idBooking) : '',
        txttglbayar: row?.tglBayar ?? '',
        txtjumlah: row ? String(row.jumlahBayar) : '',
        txtbukti: row?.buktiBayar ?? '',
        txtstatus: row?.status ?? 'Menunggu Verifikasi',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(row ? '/updatepembayaran' : '/insertpembayaran', {
            preserveState: true,
            preserveScroll: true,
            onSuccess: onDone,
        });
    };

    return (
        <SheetForm
            title={row ? 'Edit Pembayaran' : 'Tambah Pembayaran'}
            description={row && `Booking #${row.idBooking}`}
            onSubmit={submit}
            processing={processing}
            submitLabel={row ? 'Simpan Perubahan' : 'Simpan'}
        >
            {row && <ProofPreview src={urlBukti(row.buktiBayar)} />}

            <div>
                <Label htmlFor="txtbooking">Booking</Label>
                <FormSelect
                    id="txtbooking"
                    className="mt-1"
                    value={data.txtbooking}
                    onChange={(v) => setData('txtbooking', v)}
                    placeholder="Pilih Booking"
                    options={databooking.map((b) => ({
                        value: String(b.idBooking),
                        label: `#${b.idBooking} - ${b.tanggal}`,
                    }))}
                />
                <InputError message={errors.txtbooking} className="mt-1" />
            </div>

            <div>
                <Label htmlFor="txtadmin">Admin (opsional)</Label>
                <FormSelect
                    id="txtadmin"
                    className="mt-1"
                    value={data.txtadmin}
                    onChange={(v) => setData('txtadmin', v)}
                    options={[
                        { value: '', label: '-' },
                        ...dataadmin.map((a) => ({
                            value: String(a.idAdmin),
                            label: a.namaAdmin,
                        })),
                    ]}
                />
                <InputError message={errors.txtadmin} className="mt-1" />
            </div>

            <div>
                <Label htmlFor="txttglbayar">Tanggal Bayar</Label>
                <Input
                    id="txttglbayar"
                    type="date"
                    className="mt-1"
                    value={data.txttglbayar}
                    onChange={(e) => setData('txttglbayar', e.target.value)}
                />
                <InputError message={errors.txttglbayar} className="mt-1" />
            </div>

            <div>
                <Label htmlFor="txtjumlah">Jumlah Bayar (Rp)</Label>
                <CurrencyInput
                    id="txtjumlah"
                    className="mt-1"
                    value={data.txtjumlah === '' ? null : Number(data.txtjumlah)}
                    onValueChange={(v) => setData('txtjumlah', v == null ? '' : String(v))}
                />
                <InputError message={errors.txtjumlah} className="mt-1" />
            </div>

            <div>
                <Label htmlFor="txtbukti">Bukti Bayar (nama file/path)</Label>
                <Input
                    id="txtbukti"
                    className="mt-1"
                    value={data.txtbukti}
                    onChange={(e) => setData('txtbukti', e.target.value)}
                />
                <InputError message={errors.txtbukti} className="mt-1" />
            </div>

            <div>
                <Label htmlFor="txtstatus">Status</Label>
                <FormSelect
                    id="txtstatus"
                    className="mt-1"
                    value={data.txtstatus}
                    onChange={(v) => setData('txtstatus', v)}
                    options={[
                        { value: 'Menunggu Verifikasi', label: 'Menunggu Verifikasi' },
                        { value: 'Terverifikasi', label: 'Terverifikasi' },
                        { value: 'Ditolak', label: 'Ditolak' },
                    ]}
                />
                <InputError message={errors.txtstatus} className="mt-1" />
            </div>
        </SheetForm>
    );
}

function DialogLaporan({
    buka,
    onClose,
    periode,
    namaLaporan,
    ringkasan,
    datamanager,
}: {
    buka: boolean;
    onClose: () => void;
    periode: Period;
    namaLaporan: string;
    ringkasan: Ringkasan;
    datamanager: Manager[];
}) {
    const form = useForm({
        bulan: periode.bulan,
        tahun: periode.tahun,
        tglLaporan: isoTanggal(new Date()),
        idManager: datamanager[0] ? String(datamanager[0].idManager) : '',
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
                        <Label htmlFor="tglLaporan">Tanggal laporan</Label>
                        <DatePicker
                            id="tglLaporan"
                            className="mt-1"
                            value={keTanggal(form.data.tglLaporan)}
                            onChange={(d) => d && form.setData('tglLaporan', isoTanggal(d))}
                        />
                        <InputError message={form.errors.tglLaporan} className="mt-1" />
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
