import { IKON_JENIS, jam, JAM_BUKA, JAM_TUTUP } from '@/Components/booking/jadwal';
import FormCombobox from '@/Components/FormCombobox';
import FormSelect from '@/Components/FormSelect';
import FormSheet, { SheetForm, useFormSheet } from '@/Components/FormSheet';
import InputError from '@/Components/InputError';
import AksiBaris from '@/Components/pengelola/AksiBaris';
import BadgeTip, { tipBooking } from '@/Components/pengelola/BadgeTip';
import DataTable from '@/Components/pengelola/DataTable';
import JudulHalaman from '@/Components/pengelola/JudulHalaman';
import { BookingStatusBadge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { CurrencyInput } from '@/Components/ui/currency-input';
import { DateInput } from '@/Components/ui/date-input';
import { bookingTotal, formatRupiah, formatTanggal, rentangJam as teksRentangJam } from '@/Components/ui/format';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
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
    Array.from({ length: sampai - dari + 1 }, (_, i) => ({ value: jam(dari + i), label: jam(dari + i).replace(':', '.') }));
const angkaJam = (j: string) => Number(j.slice(0, 2));
type Penyewa = { idPenyewa: number; namaPenyewa: string; email: string };
type Lapangan = { idLapangan: number; namaLapangan: string; jenisLapangan: string; tarifPerJam: number };
type Admin = { idAdmin: number; namaAdmin: string };
type Pilihan = { datapenyewa: Penyewa[]; datalapangan: Lapangan[]; dataadmin: Admin[]; idAdminLogin: number | null };

export default function TampilData({ databooking, ...pilihan }: { databooking: Booking[] } & Pilihan) {
    const sheet = useFormSheet<Booking>();
    const { url } = usePage();
    const namaPenyewa = new Map(pilihan.datapenyewa.map((p) => [p.idPenyewa, p.namaPenyewa]));
    const lapangan = new Map(pilihan.datalapangan.map((l) => [l.idLapangan, l]));

    // "Tambah booking" di dashboard Admin membuka halaman ini dengan ?tambah
    useEffect(() => {
        if (new URLSearchParams(url.split('?')[1]).has('tambah')) sheet.buka();
    }, []);

    return (
        <AdminSidebarLayout header={<JudulHalaman judul="Data booking" deskripsi="Semua booking dari penyewa dan yang dibuat admin." />}>
            <Head title="Data Booking" />

            <DataTable
                baris={databooking}
                kunci={(r) => r.idBooking}
                satuan="booking"
                cari={(r) => `BK-${String(r.idBooking).padStart(4, '0')} ${namaPenyewa.get(r.idPenyewa) ?? ''}`}
                placeholderCari="Cari kode atau penyewa…"
                filter={[
                    {
                        id: 'status',
                        label: 'Status',
                        nilai: (r) => r.status,
                        opsi: [
                            { id: 'Dipesan', label: 'Dipesan' },
                            { id: 'Dikonfirmasi', label: 'Dikonfirmasi' },
                            { id: 'Dibatalkan', label: 'Dibatalkan' },
                        ],
                    },
                    {
                        id: 'lapangan',
                        label: 'Lapangan',
                        nilai: (r) => String(r.idLapangan),
                        opsi: pilihan.datalapangan.map((l) => ({ id: String(l.idLapangan), label: l.namaLapangan })),
                    },
                ]}
                kolom={[
                    { id: 'kode', label: 'Kode', tetap: true, className: 'tabular-nums', render: (r) => `BK-${String(r.idBooking).padStart(4, '0')}` },
                    {
                        id: 'penyewa',
                        label: 'Penyewa',
                        className: 'font-medium',
                        urut: (r) => namaPenyewa.get(r.idPenyewa) ?? '',
                        render: (r) => namaPenyewa.get(r.idPenyewa) ?? '-',
                    },
                    {
                        id: 'lapangan',
                        label: 'Lapangan',
                        render: (r) => {
                            const l = lapangan.get(r.idLapangan);
                            return l ? (
                                <span className="flex items-center gap-2">
                                    <img src={IKON_JENIS[l.jenisLapangan]} alt={l.jenisLapangan} title={l.jenisLapangan} width={20} height={20} className="size-5 shrink-0 object-contain" />
                                    {l.namaLapangan}
                                </span>
                            ) : (
                                '-'
                            );
                        },
                    },
                    {
                        id: 'tanggal',
                        label: 'Tanggal',
                        className: 'text-muted-foreground tabular-nums',
                        urut: (r) => r.tanggal + r.jamMulai,
                        render: (r) => formatTanggal(r.tanggal, 'EEE, d MMM yyyy'),
                    },
                    {
                        id: 'jam',
                        label: 'Jam',
                        className: 'text-muted-foreground tabular-nums',
                        render: (r) => teksRentangJam(r.jamMulai, r.jamSelesai),
                    },
                    { id: 'total', label: 'Total', className: 'tabular-nums', urut: (r) => r.totalBayar, render: (r) => formatRupiah(r.totalBayar) },
                    {
                        id: 'status',
                        label: 'Status',
                        urut: (r) => ['Dipesan', 'Dikonfirmasi', 'Dibatalkan'].indexOf(r.status),
                        render: (r) => (
                            <BadgeTip tip={tipBooking(r.status)}>
                                <BookingStatusBadge status={r.status} />
                            </BadgeTip>
                        ),
                    },
                ]}
                aksi={(r) => {
                    const kode = `BK-${String(r.idBooking).padStart(4, '0')}`;
                    return <AksiBaris nama={kode} onEdit={() => sheet.buka(r)} hapus={`/deletebooking/${r.idBooking}`} />;
                }}
                toolbarKanan={
                    <Button onClick={() => sheet.buka()}>
                        <Plus />
                        Tambah booking
                    </Button>
                }
            />

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
        txtalasanbatal: '',
    });

    // total = tarif lapangan x jumlah jam, dihitung ulang tiap lapangan atau jam berganti; Admin masih bisa mengubahnya
    const denganTotal = (d: typeof data) => {
        const tarif = datalapangan.find((l) => String(l.idLapangan) === d.txtlapangan)?.tarifPerJam;
        return tarif && d.txtjammulai && d.txtjamselesai
            ? { ...d, txttotal: String(bookingTotal(d.txtjammulai, d.txtjamselesai, tarif)) }
            : d;
    };

    // jam selesai otomatis 1 jam setelah jam mulai bila masih kosong atau tidak lagi setelah jam mulai
    const pilihJamMulai = (mulai: string) =>
        setData((d) =>
            denganTotal({
                ...d,
                txtjammulai: mulai,
                txtjamselesai:
                    mulai && (!d.txtjamselesai || angkaJam(d.txtjamselesai) <= angkaJam(mulai))
                        ? jam(angkaJam(mulai) + 1)
                        : d.txtjamselesai,
            }),
        );

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
                    onChange={(v) => setData((d) => denganTotal({ ...d, txtlapangan: v }))}
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
                        onChange={(v) => setData((d) => denganTotal({ ...d, txtjamselesai: v }))}
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
                <p className="mt-1 text-sm text-muted-foreground">Terisi otomatis dari tarif × jumlah jam; bisa diubah.</p>
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
                        { value: 'Dikonfirmasi', label: 'Dikonfirmasi' },
                        { value: 'Dibatalkan', label: 'Dibatalkan' },
                    ]}
                />
                <InputError message={errors.txtstatus} className="mt-1" />
            </div>

            {row && row.status !== 'Dibatalkan' && data.txtstatus === 'Dibatalkan' && (
                <div>
                    <Label htmlFor="txtalasanbatal">Alasan pembatalan</Label>
                    <Textarea
                        id="txtalasanbatal"
                        className="mt-1"
                        rows={3}
                        maxLength={255}
                        placeholder="Misalnya: penyewa minta batal lewat telepon."
                        value={data.txtalasanbatal}
                        onChange={(e) => setData('txtalasanbatal', e.target.value)}
                    />
                    <p className="mt-1 text-sm text-muted-foreground">Tercatat di Log aktivitas dan dibaca Manager.</p>
                    <InputError message={errors.txtalasanbatal} className="mt-1" />
                </div>
            )}
        </SheetForm>
    );
}
