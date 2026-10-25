import DeleteButton from '@/Components/DeleteButton';
import FormSelect from '@/Components/FormSelect';
import FormSheet, { SheetForm, useFormSheet } from '@/Components/FormSheet';
import InputError from '@/Components/InputError';
import { Badge } from '@/Components/ui/badge';
import { Button, buttonVariants } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import { CurrencyInput } from '@/Components/ui/currency-input';
import { DateInput } from '@/Components/ui/date-input';
import { BULAN, formatRupiah, formatTanggal } from '@/Components/ui/format';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableEmpty,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import { Head, useForm } from '@inertiajs/react';
import { CircleCheck, FileText, Pencil, Plus } from 'lucide-react';
import { FormEventHandler } from 'react';

type Laporan = {
    idLaporan: number;
    idAdmin: number;
    idManager: number;
    bulan: number;
    tahun: number;
    totalPemasukan: number;
    tglLaporan: string;
    idPembayaran: number | null;
    namaLaporan: string | null;
    filePdf: string | null;
    diperiksaPada: string | null;
};
type Admin = { idAdmin: number; namaAdmin: string };
type Manager = { idManager: number; namaManager: string };
type Pembayaran = { idPembayaran: number; kode: string; namaPenyewa: string; jumlahBayar: number };
type Pilihan = { dataadmin: Admin[]; datamanager: Manager[]; datapembayaran: Pembayaran[] };

export default function TampilData({ datalaporan, ...pilihan }: { datalaporan: Laporan[] } & Pilihan) {
    const sheet = useFormSheet<Laporan>();

    return (
        <AdminSidebarLayout
            header={
                <h2 className="text-xl leading-tight font-semibold text-foreground">
                    Data Laporan Pembayaran
                </h2>
            }
        >
            <Head title="Data Laporan Pembayaran" />

            <div className="mb-4">
                <Button onClick={() => sheet.buka()}>
                    <Plus />
                    Tambah Laporan
                </Button>
            </div>

            <Card className="gap-0 overflow-hidden py-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama Laporan</TableHead>
                            <TableHead>Bulan</TableHead>
                            <TableHead>Tahun</TableHead>
                            <TableHead>Total Pemasukan</TableHead>
                            <TableHead>Tgl Laporan</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {datalaporan.map((row) => (
                            <TableRow key={row.idLaporan}>
                                <TableCell className="font-medium">{row.namaLaporan ?? '-'}</TableCell>
                                <TableCell>{BULAN[row.bulan - 1] ?? row.bulan}</TableCell>
                                <TableCell>{row.tahun}</TableCell>
                                <TableCell>{formatRupiah(row.totalPemasukan)}</TableCell>
                                <TableCell>{formatTanggal(row.tglLaporan, 'EEE, d MMM yyyy')}</TableCell>
                                <TableCell>
                                    {row.diperiksaPada ? (
                                        <Badge variant="success">
                                            <CircleCheck aria-hidden="true" />
                                            Sudah diperiksa
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline">Belum diperiksa</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        {row.filePdf && (
                                            <a
                                                href={route('laporan.pdf', row.idLaporan)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className={buttonVariants({ variant: 'outline', size: 'sm' })}
                                            >
                                                <FileText />
                                                PDF
                                            </a>
                                        )}
                                        {/* sudah diperiksa Manager: terkunci */}
                                        {!row.diperiksaPada && (
                                            <>
                                                <Button variant="outline" size="sm" onClick={() => sheet.buka(row)}>
                                                    <Pencil />
                                                    Edit
                                                </Button>
                                                <DeleteButton href={`/deletelaporanpembayaran/${row.idLaporan}`} />
                                            </>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {datalaporan.length === 0 && <TableEmpty colSpan={7} />}
                    </TableBody>
                </Table>
            </Card>

            <FormSheet open={sheet.open} onClose={sheet.tutup}>
                <FormLaporan key={sheet.versi} row={sheet.row} onDone={sheet.tutup} {...pilihan} />
            </FormSheet>
        </AdminSidebarLayout>
    );
}

function FormLaporan({
    row,
    onDone,
    dataadmin,
    datamanager,
    datapembayaran,
}: { row: Laporan | null; onDone: () => void } & Pilihan) {
    const { data, setData, post, processing, errors } = useForm({
        txtid: row?.idLaporan ?? '',
        txtadmin: row ? String(row.idAdmin) : '',
        txtmanager: row ? String(row.idManager) : '',
        txtbulan: row ? String(row.bulan) : '',
        txttahun: row ? String(row.tahun) : '',
        txttotal: row ? String(row.totalPemasukan) : '',
        txttgllaporan: row?.tglLaporan ?? '',
        txtpembayaran: row?.idPembayaran ? String(row.idPembayaran) : '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(row ? '/updatelaporanpembayaran' : '/insertlaporanpembayaran', {
            preserveState: true,
            preserveScroll: true,
            onSuccess: onDone,
        });
    };

    return (
        <SheetForm
            title={row ? 'Edit Laporan Pembayaran' : 'Tambah Laporan Pembayaran'}
            description={row?.namaLaporan}
            onSubmit={submit}
            processing={processing}
            submitLabel={row ? 'Simpan Perubahan' : 'Simpan'}
        >
            <div>
                <Label htmlFor="txtadmin">Admin</Label>
                <FormSelect
                    id="txtadmin"
                    className="mt-1"
                    value={data.txtadmin}
                    onChange={(v) => setData('txtadmin', v)}
                    placeholder="Pilih Admin"
                    options={dataadmin.map((a) => ({
                        value: String(a.idAdmin),
                        label: a.namaAdmin,
                    }))}
                />
                <InputError message={errors.txtadmin} className="mt-1" />
            </div>

            <div>
                <Label htmlFor="txtmanager">Manager</Label>
                <FormSelect
                    id="txtmanager"
                    className="mt-1"
                    value={data.txtmanager}
                    onChange={(v) => setData('txtmanager', v)}
                    placeholder="Pilih Manager"
                    options={datamanager.map((m) => ({
                        value: String(m.idManager),
                        label: m.namaManager,
                    }))}
                />
                <InputError message={errors.txtmanager} className="mt-1" />
            </div>

            <div className="flex gap-4">
                <div className="flex-1">
                    <Label htmlFor="txtbulan">Bulan</Label>
                    <FormSelect
                        id="txtbulan"
                        className="mt-1"
                        value={String(data.txtbulan)}
                        onChange={(v) => setData('txtbulan', v)}
                        placeholder="Pilih Bulan"
                        options={BULAN.map((b, i) => ({ value: String(i + 1), label: b }))}
                    />
                    <InputError message={errors.txtbulan} className="mt-1" />
                </div>

                <div className="flex-1">
                    <Label htmlFor="txttahun">Tahun</Label>
                    <Input
                        id="txttahun"
                        type="number"
                        min={2000}
                        className="mt-1"
                        value={data.txttahun}
                        onChange={(e) => setData('txttahun', e.target.value)}
                    />
                    <InputError message={errors.txttahun} className="mt-1" />
                </div>
            </div>

            <div>
                <Label htmlFor="txttotal">Total Pemasukan (Rp)</Label>
                <CurrencyInput
                    id="txttotal"
                    className="mt-1"
                    value={data.txttotal === '' ? null : Number(data.txttotal)}
                    onValueChange={(v) => setData('txttotal', v == null ? '' : String(v))}
                />
                <InputError message={errors.txttotal} className="mt-1" />
            </div>

            <div>
                <Label htmlFor="txttgllaporan">Tanggal Laporan</Label>
                <DateInput
                    id="txttgllaporan"
                    className="mt-1"
                    value={data.txttgllaporan}
                    onValueChange={(v) => setData('txttgllaporan', v)}
                    aria-invalid={!!errors.txttgllaporan}
                />
                <InputError message={errors.txttgllaporan} className="mt-1" />
            </div>

            <div>
                <Label htmlFor="txtpembayaran">Pembayaran (opsional)</Label>
                <FormSelect
                    id="txtpembayaran"
                    className="mt-1"
                    value={data.txtpembayaran}
                    onChange={(v) => setData('txtpembayaran', v)}
                    options={[
                        { value: '', label: '-' },
                        ...datapembayaran.map((p) => ({
                            value: String(p.idPembayaran),
                            label: `${p.kode} · ${p.namaPenyewa} · ${formatRupiah(p.jumlahBayar)}`,
                        })),
                    ]}
                />
                <InputError message={errors.txtpembayaran} className="mt-1" />
            </div>
        </SheetForm>
    );
}
