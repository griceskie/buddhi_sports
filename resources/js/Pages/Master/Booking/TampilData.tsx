import DeleteButton from '@/Components/DeleteButton';
import { jam, JAM_BUKA, JAM_TUTUP } from '@/Components/booking/jadwal';
import FormCombobox from '@/Components/FormCombobox';
import FormSelect from '@/Components/FormSelect';
import FormSheet, { SheetForm, useFormSheet } from '@/Components/FormSheet';
import InputError from '@/Components/InputError';
import { BookingStatusBadge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import { CurrencyInput } from '@/Components/ui/currency-input';
import { DateInput } from '@/Components/ui/date-input';
import { formatRupiah, formatTanggal } from '@/Components/ui/format';
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
// jam bulat dalam jam operasional: mulai 08:00-21:00, selesai paling lambat 22:00
const rentangJam = (dari: number, sampai: number) =>
    Array.from({ length: sampai - dari + 1 }, (_, i) => ({ value: jam(dari + i), label: jam(dari + i) }));
const angkaJam = (j: string) => Number(j.slice(0, 2));
type Penyewa = { idPenyewa: number; namaPenyewa: string; email: string };
type Lapangan = { idLapangan: number; namaLapangan: string };
type Admin = { idAdmin: number; namaAdmin: string };
type Pilihan = { datapenyewa: Penyewa[]; datalapangan: Lapangan[]; dataadmin: Admin[]; idAdminLogin: number | null };

export default function TampilData({ databooking, ...pilihan }: { databooking: Booking[] } & Pilihan) {
    const sheet = useFormSheet<Booking>();
    const { url } = usePage();
    const namaPenyewa = new Map(pilihan.datapenyewa.map((p) => [p.idPenyewa, p.namaPenyewa]));
    const namaLapangan = new Map(pilihan.datalapangan.map((l) => [l.idLapangan, l.namaLapangan]));

    // "Tambah booking" di dashboard Admin membuka halaman ini dengan ?tambah
    useEffect(() => {
        if (new URLSearchParams(url.split('?')[1]).has('tambah')) sheet.buka();
    }, []);

    return (
        <AdminSidebarLayout
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
                            <TableHead>Penyewa</TableHead>
                            <TableHead>Lapangan</TableHead>
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
                                <TableCell className="font-medium">{namaPenyewa.get(row.idPenyewa) ?? '-'}</TableCell>
                                <TableCell>{namaLapangan.get(row.idLapangan) ?? '-'}</TableCell>
                                <TableCell>{formatTanggal(row.tanggal, 'EEE, d MMM yyyy')}</TableCell>
                                <TableCell className="tabular-nums">
                                    {row.jamMulai.slice(0, 5)}–{row.jamSelesai.slice(0, 5)}
                                </TableCell>
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
        </AdminSidebarLayout>
    );
}

function FormBooking({
    row,
    onDone,
    datapenyewa,
    datalapangan,
    dataadmin,
    idAdminLogin,
}: { row: Booking | null; onDone: () => void } & Pilihan) {
    const { data, setData, post, processing, errors } = useForm({
        txtid: row?.idBooking ?? '',
        txtpenyewa: row ? String(row.idPenyewa) : '',
        txtlapangan: row ? String(row.idLapangan) : '',
        // booking baru langsung tercatat atas nama Admin yang sedang login
        txtadmin: row ? (row.idAdmin ? String(row.idAdmin) : '') : idAdminLogin ? String(idAdminLogin) : '',
        txttanggal: row?.tanggal ?? '',
        txtjammulai: row ? row.jamMulai.slice(0, 5) : '',
        txtjamselesai: row ? row.jamSelesai.slice(0, 5) : '',
        txttotal: row ? String(row.totalBayar) : '',
        txtstatus: row?.status ?? 'Dipesan',
    });

    // jam selesai otomatis 1 jam setelah jam mulai bila masih kosong atau tidak lagi setelah jam mulai
    const pilihJamMulai = (mulai: string) =>
        setData((d) => ({
            ...d,
            txtjammulai: mulai,
            txtjamselesai:
                mulai && (!d.txtjamselesai || angkaJam(d.txtjamselesai) <= angkaJam(mulai))
                    ? jam(angkaJam(mulai) + 1)
                    : d.txtjamselesai,
        }));

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
                <FormCombobox
                    id="txtpenyewa"
                    className="mt-1"
                    value={data.txtpenyewa}
                    onChange={(v) => setData('txtpenyewa', v)}
                    placeholder="Cari nama atau email penyewa"
                    options={datapenyewa.map((p) => ({
                        value: String(p.idPenyewa),
                        label: `${p.namaPenyewa} · ${p.email}`,
                    }))}
                />
                <InputError message={errors.txtpenyewa} className="mt-1" />
            </div>

            <div>
                <Label htmlFor="txtlapangan">Lapangan</Label>
                <FormCombobox
                    id="txtlapangan"
                    className="mt-1"
                    value={data.txtlapangan}
                    onChange={(v) => setData('txtlapangan', v)}
                    placeholder="Cari lapangan"
                    options={datalapangan.map((l) => ({
                        value: String(l.idLapangan),
                        label: l.namaLapangan,
                    }))}
                />
                <InputError message={errors.txtlapangan} className="mt-1" />
            </div>

            <div>
                <Label htmlFor="txtadmin">Admin</Label>
                <FormCombobox
                    id="txtadmin"
                    className="mt-1"
                    value={data.txtadmin}
                    onChange={(v) => setData('txtadmin', v)}
                    placeholder="Pilih admin"
                    clearable={false}
                    options={dataadmin.map((a) => ({
                        value: String(a.idAdmin),
                        label: a.namaAdmin,
                    }))}
                />
                <InputError message={errors.txtadmin} className="mt-1" />
            </div>

            <div>
                <Label htmlFor="txttanggal">Tanggal</Label>
                <DateInput
                    id="txttanggal"
                    className="mt-1"
                    value={data.txttanggal}
                    onValueChange={(v) => setData('txttanggal', v)}
                    aria-invalid={!!errors.txttanggal}
                />
                <InputError message={errors.txttanggal} className="mt-1" />
            </div>

            <div className="flex gap-4">
                <div className="flex-1">
                    <Label htmlFor="txtjammulai">Jam Mulai</Label>
                    <FormSelect
                        id="txtjammulai"
                        className="mt-1 w-full"
                        value={data.txtjammulai}
                        onChange={pilihJamMulai}
                        placeholder="Pilih jam"
                        options={rentangJam(JAM_BUKA, JAM_TUTUP - 1)}
                    />
                    <InputError message={errors.txtjammulai} className="mt-1" />
                </div>

                <div className="flex-1">
                    <Label htmlFor="txtjamselesai">Jam Selesai</Label>
                    {/* dipasang ulang saat jam mulai berubah: Select tidak mengenali nilai yang berganti bersamaan dengan daftar pilihannya */}
                    <FormSelect
                        key={data.txtjammulai}
                        id="txtjamselesai"
                        className="mt-1 w-full"
                        value={data.txtjamselesai}
                        onChange={(v) => setData('txtjamselesai', v)}
                        placeholder="Pilih jam"
                        options={rentangJam(data.txtjammulai ? angkaJam(data.txtjammulai) + 1 : JAM_BUKA + 1, JAM_TUTUP)}
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
                <FormCombobox
                    id="txtstatus"
                    className="mt-1"
                    value={data.txtstatus}
                    onChange={(v) => setData('txtstatus', v)}
                    clearable={false}
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
