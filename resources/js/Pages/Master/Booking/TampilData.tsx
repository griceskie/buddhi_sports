import DeleteButton from '@/Components/DeleteButton';
import FormSelect from '@/Components/FormSelect';
import FormSheet, { SheetForm, useFormSheet } from '@/Components/FormSheet';
import InputError from '@/Components/InputError';
import { BookingStatusBadge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import { CurrencyInput } from '@/Components/ui/currency-input';
import { formatRupiah } from '@/Components/ui/format';
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
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Pencil, Plus } from 'lucide-react';
import { FormEventHandler, useEffect } from 'react';

type Booking = {
    idBooking: number;
    idPenyewa: number;
    idLapangan: number;
    idAdmin: number | null;
    tanggal: string;
    jamMulai: string;
    jamSelesai: string;
    totalBayar: number;
    status: string;
};
type Penyewa = { idPenyewa: number; namaPenyewa: string };
type Lapangan = { idLapangan: number; namaLapangan: string };
type Admin = { idAdmin: number; namaAdmin: string };
type Pilihan = { datapenyewa: Penyewa[]; datalapangan: Lapangan[]; dataadmin: Admin[] };

export default function TampilData({ databooking, ...pilihan }: { databooking: Booking[] } & Pilihan) {
    const sheet = useFormSheet<Booking>();
    const { url } = usePage();

    // "Tambah booking" di dashboard Admin membuka halaman ini dengan ?tambah
    useEffect(() => {
        if (new URLSearchParams(url.split('?')[1]).has('tambah')) sheet.buka();
    }, []);

    return (
        <AdminLayout
            header={
                <h2 className="text-xl leading-tight font-semibold text-foreground">
                    Data Booking
                </h2>
            }
        >
            <Head title="Data Booking" />

            <div className="mb-4">
                <Button onClick={() => sheet.buka()}>
                    <Plus />
                    Tambah Booking
                </Button>
            </div>

            <Card className="gap-0 overflow-hidden py-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID Penyewa</TableHead>
                            <TableHead>ID Lapangan</TableHead>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Jam</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {databooking.map((row) => (
                            <TableRow key={row.idBooking}>
                                <TableCell>{row.idPenyewa}</TableCell>
                                <TableCell>{row.idLapangan}</TableCell>
                                <TableCell>{row.tanggal}</TableCell>
                                <TableCell>{row.jamMulai.slice(0, 5)}-{row.jamSelesai.slice(0, 5)}</TableCell>
                                <TableCell>{formatRupiah(row.totalBayar)}</TableCell>
                                <TableCell><BookingStatusBadge status={row.status} /></TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" size="sm" onClick={() => sheet.buka(row)}>
                                            <Pencil />
                                            Edit
                                        </Button>
                                        <DeleteButton href={`/deletebooking/${row.idBooking}`} />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {databooking.length === 0 && <TableEmpty colSpan={7} />}
                    </TableBody>
                </Table>
            </Card>

            <FormSheet open={sheet.open} onClose={sheet.tutup}>
                <FormBooking key={sheet.versi} row={sheet.row} onDone={sheet.tutup} {...pilihan} />
            </FormSheet>
        </AdminLayout>
    );
}

function FormBooking({
    row,
    onDone,
    datapenyewa,
    datalapangan,
    dataadmin,
}: { row: Booking | null; onDone: () => void } & Pilihan) {
    const { data, setData, post, processing, errors } = useForm({
        txtid: row?.idBooking ?? '',
        txtpenyewa: row ? String(row.idPenyewa) : '',
        txtlapangan: row ? String(row.idLapangan) : '',
        txtadmin: row?.idAdmin ? String(row.idAdmin) : '',
        txttanggal: row?.tanggal ?? '',
        txtjammulai: row ? row.jamMulai.slice(0, 5) : '',
        txtjamselesai: row ? row.jamSelesai.slice(0, 5) : '',
        txttotal: row ? String(row.totalBayar) : '',
        txtstatus: row?.status ?? 'Dipesan',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(row ? '/updatebooking' : '/insertbooking', {
            preserveState: true,
            preserveScroll: true,
            onSuccess: onDone,
        });
    };

    return (
        <SheetForm
            title={row ? 'Edit Booking' : 'Tambah Booking'}
            onSubmit={submit}
            processing={processing}
            submitLabel={row ? 'Simpan Perubahan' : 'Simpan'}
        >
            <div>
                <Label htmlFor="txtpenyewa">Penyewa</Label>
                <FormSelect
                    id="txtpenyewa"
                    className="mt-1"
                    value={data.txtpenyewa}
                    onChange={(v) => setData('txtpenyewa', v)}
                    placeholder="Pilih Penyewa"
                    options={datapenyewa.map((p) => ({
                        value: String(p.idPenyewa),
                        label: p.namaPenyewa,
                    }))}
                />
                <InputError message={errors.txtpenyewa} className="mt-1" />
            </div>

            <div>
                <Label htmlFor="txtlapangan">Lapangan</Label>
                <FormSelect
                    id="txtlapangan"
                    className="mt-1"
                    value={data.txtlapangan}
                    onChange={(v) => setData('txtlapangan', v)}
                    placeholder="Pilih Lapangan"
                    options={datalapangan.map((l) => ({
                        value: String(l.idLapangan),
                        label: l.namaLapangan,
                    }))}
                />
                <InputError message={errors.txtlapangan} className="mt-1" />
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
                <Label htmlFor="txttanggal">Tanggal</Label>
                <Input
                    id="txttanggal"
                    type="date"
                    className="mt-1"
                    value={data.txttanggal}
                    onChange={(e) => setData('txttanggal', e.target.value)}
                />
                <InputError message={errors.txttanggal} className="mt-1" />
            </div>

            <div className="flex gap-4">
                <div className="flex-1">
                    <Label htmlFor="txtjammulai">Jam Mulai</Label>
                    <Input
                        id="txtjammulai"
                        type="time"
                        className="mt-1"
                        value={data.txtjammulai}
                        onChange={(e) => setData('txtjammulai', e.target.value)}
                    />
                    <InputError message={errors.txtjammulai} className="mt-1" />
                </div>

                <div className="flex-1">
                    <Label htmlFor="txtjamselesai">Jam Selesai</Label>
                    <Input
                        id="txtjamselesai"
                        type="time"
                        className="mt-1"
                        value={data.txtjamselesai}
                        onChange={(e) => setData('txtjamselesai', e.target.value)}
                    />
                    <InputError message={errors.txtjamselesai} className="mt-1" />
                </div>
            </div>

            <div>
                <Label htmlFor="txttotal">Total Bayar (Rp)</Label>
                <CurrencyInput
                    id="txttotal"
                    className="mt-1"
                    value={data.txttotal === '' ? null : Number(data.txttotal)}
                    onValueChange={(v) => setData('txttotal', v == null ? '' : String(v))}
                />
                <InputError message={errors.txttotal} className="mt-1" />
            </div>

            <div>
                <Label htmlFor="txtstatus">Status</Label>
                <FormSelect
                    id="txtstatus"
                    className="mt-1"
                    value={data.txtstatus}
                    onChange={(v) => setData('txtstatus', v)}
                    options={[
                        { value: 'Dipesan', label: 'Dipesan' },
                        { value: 'Dibayar', label: 'Dibayar' },
                        { value: 'Dikonfirmasi', label: 'Dikonfirmasi' },
                        { value: 'Dibatalkan', label: 'Dibatalkan' },
                    ]}
                />
                <InputError message={errors.txtstatus} className="mt-1" />
            </div>
        </SheetForm>
    );
}
