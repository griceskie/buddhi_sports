import DrawerVerifikasi, { BuktiAntrean } from '@/Components/admin/DrawerVerifikasi';
import DeleteButton from '@/Components/DeleteButton';
import FormSelect from '@/Components/FormSelect';
import FormSheet, { SheetForm, useFormSheet } from '@/Components/FormSheet';
import RingkasanPembayaran, { Ringkasan } from '@/Components/RingkasanPembayaran';
import InputError from '@/Components/InputError';
import DataTable, { NilaiFilter } from '@/Components/pengelola/DataTable';
import DialogLaporan from '@/Components/pengelola/DialogLaporan';
import { PaymentStatusBadge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { CurrencyInput } from '@/Components/ui/currency-input';
import { DateInput } from '@/Components/ui/date-input';
import { formatRupiah, formatTanggal } from '@/Components/ui/format';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Period, PeriodPicker } from '@/Components/ui/period-picker';
import { ProofPreview } from '@/Components/ui/proof-review';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { cn } from 'cn';
import { FileText, Pencil, Plus } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

type Pembayaran = {
    idPembayaran: number;
    idAdmin: number | null;
    idBooking: number;
    tglBayar: string;
    jumlahBayar: number;
    buktiBayar: string | null;
    status: string;
    alasanTolak: string | null;
};

type Laporan = {
    idLaporan: number;
    namaLaporan: string | null;
    tglLaporan: string;
    filePdf: string | null;
    diperiksaPada: string | null;
};
type Manager = { idManager: number; namaManager: string };
type Booking = { idBooking: number; kode: string; tanggal: string; namaPenyewa: string; namaLapangan: string };
type Admin = { idAdmin: number; namaAdmin: string };

type Props = {
    datapembayaran: Pembayaran[];
    bukti: BuktiAntrean[];
    periode: Period;
    namaLaporan: string;
    ringkasan: Ringkasan;
    laporan: Laporan | null;
    datamanager: Manager[];
    databooking: Booking[];
    dataadmin: Admin[];
};

const TAB = [
    { id: 'semua', label: 'Semua' },
    { id: 'Menunggu Verifikasi', label: 'Menunggu verifikasi' },
    { id: 'Terverifikasi', label: 'Terverifikasi' },
    { id: 'Ditolak', label: 'Ditolak' },
];

export default function TampilData({
    datapembayaran,
    bukti,
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
    const booking = new Map(databooking.map((b) => [b.idBooking, b]));

    // klik baris membuka drawer verifikasi; antrean di drawer = bukti periode ini yang masih menunggu (terlama dikirim di atas)
    const [filterStatus, setFilterStatus] = useState<NilaiFilter>({});
    const [ditinjau, setDitinjau] = useState<number | null>(null);
    const [memproses, setMemproses] = useState(false);
    const [galatAlasan, setGalatAlasan] = useState<string>();
    const menunggu = bukti.filter((b) => b.status === 'Menunggu Verifikasi');
    const buktiDitinjau = bukti.find((b) => b.idPembayaran === ditinjau) ?? null;
    const posisi = buktiDitinjau ? menunggu.findIndex((b) => b.idPembayaran === buktiDitinjau.idPembayaran) : -1;
    const tinjau = (id: number) => {
        setGalatAlasan(undefined);
        setDitinjau(id);
    };
    const putuskan = (aksi: 'terima' | 'tolak', alasan?: string) => {
        if (!buktiDitinjau) return;
        const lanjut = posisi >= 0 ? (menunggu[posisi + 1] ?? (posisi > 0 ? menunggu[0] : null)) : null;
        router.post(route(`verifikasi.${aksi}`, buktiDitinjau.idPembayaran), aksi === 'tolak' ? { alasan } : {}, {
            preserveScroll: true,
            onStart: () => setMemproses(true),
            onFinish: () => setMemproses(false),
            onError: (e) => setGalatAlasan(e.alasan),
            onSuccess: () => {
                setGalatAlasan(undefined);
                setDitinjau(lanjut?.idPembayaran ?? null);
            },
        });
    };

    const ubahPeriode = (p: Period) =>
        router.get(
            '/tampilpembayaran',
            { periode: `${p.tahun}-${String(p.bulan).padStart(2, '0')}` },
            { preserveScroll: true, preserveState: true, replace: true },
        );

    return (
        <AdminSidebarLayout
            header={
                <h2 className="text-xl leading-tight font-semibold text-foreground">
                    Data Pembayaran
                </h2>
            }
        >
            <Head title="Data Pembayaran" />

            <Card className="mb-4">
                <CardContent className="grid gap-4">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div className="grid gap-1.5">
                            <Label>Periode</Label>
                            <PeriodPicker value={periode} onValueChange={ubahPeriode} />
                        </div>
                        {/* laporan yang sudah diperiksa Manager terkunci */}
                        {!laporan?.diperiksaPada && (
                            <Button onClick={() => setBuatLaporan(true)}>
                                <FileText />
                                {laporan ? 'Buat ulang laporan' : 'Buat laporan'}
                            </Button>
                        )}
                    </div>

                    <RingkasanPembayaran ringkasan={ringkasan} />

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
                            {laporan.diperiksaPada &&
                                ` · Sudah diperiksa Manager ${formatTanggal(laporan.diperiksaPada, 'd MMMM yyyy')}, tidak bisa dibuat ulang.`}
                        </p>
                    )}
                </CardContent>
            </Card>

            <DataTable
                baris={datapembayaran}
                kunci={(r) => r.idPembayaran}
                satuan="pembayaran"
                cari={(r) => `${booking.get(r.idBooking)?.kode ?? ''} ${booking.get(r.idBooking)?.namaPenyewa ?? ''}`}
                placeholderCari="Cari kode atau nama penyewa…"
                nilaiFilter={filterStatus}
                onNilaiFilter={setFilterStatus}
                bukaBaris={(r) => tinjau(r.idPembayaran)}
                atas={
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" role="tablist" aria-label="Status pembayaran">
                        {TAB.map((t) => {
                            const aktif = (filterStatus.status?.[0] ?? 'semua') === t.id;
                            const n = t.id === 'semua' ? datapembayaran.length : datapembayaran.filter((r) => r.status === t.id).length;
                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={aktif}
                                    onClick={() => setFilterStatus(t.id === 'semua' ? {} : { status: [t.id] })}
                                    className={cn(
                                        'flex cursor-pointer flex-col items-start gap-1 rounded-lg border bg-card px-4 py-3 text-left shadow-xs transition-colors hover:bg-muted',
                                        aktif && 'border-primary ring-1 ring-primary',
                                    )}
                                >
                                    <span className={cn('text-sm', aktif ? 'text-primary' : 'text-muted-foreground')}>{t.label}</span>
                                    <span className="text-2xl leading-8 font-semibold tabular-nums">{n}</span>
                                </button>
                            );
                        })}
                    </div>
                }
                filter={[
                    {
                        id: 'status',
                        label: 'Status',
                        nilai: (r) => r.status,
                        opsi: TAB.filter((t) => t.id !== 'semua').map((t) => ({ id: t.id, label: t.label })),
                    },
                ]}
                kolom={[
                    {
                        id: 'kode',
                        label: 'Booking',
                        tetap: true,
                        urut: (r) => booking.get(r.idBooking)?.kode ?? '',
                        render: (r) => (
                            <>
                                <div className="font-medium tabular-nums">{booking.get(r.idBooking)?.kode ?? r.idBooking}</div>
                                <div className="text-muted-foreground">{booking.get(r.idBooking)?.namaPenyewa}</div>
                            </>
                        ),
                    },
                    {
                        id: 'tgl',
                        label: 'Tgl bayar',
                        urut: (r) => r.tglBayar,
                        render: (r) => formatTanggal(r.tglBayar, 'EEE, d MMM yyyy'),
                    },
                    { id: 'jumlah', label: 'Jumlah', urut: (r) => r.jumlahBayar, render: (r) => formatRupiah(r.jumlahBayar) },
                    { id: 'bukti', label: 'Bukti', render: (r) => r.buktiBayar ?? '-' },
                    {
                        id: 'status',
                        label: 'Status',
                        urut: (r) => TAB.findIndex((t) => t.id === r.status),
                        render: (r) => <PaymentStatusBadge status={r.status} />,
                    },
                ]}
                aksi={(r) => (
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => sheet.buka(r)}>
                            <Pencil />
                            Edit
                        </Button>
                        <DeleteButton href={`/deletepembayaran/${r.idPembayaran}`} />
                    </div>
                )}
                toolbarKanan={
                    <Button onClick={() => sheet.buka()}>
                        <Plus />
                        Tambah pembayaran
                    </Button>
                }
            />

            <DrawerVerifikasi
                bukti={buktiDitinjau}
                posisi={posisi}
                jumlah={menunggu.length}
                adaBerikutnya={posisi >= 0 && menunggu.length > 1}
                onSebelum={() => posisi > 0 && tinjau(menunggu[posisi - 1].idPembayaran)}
                onBerikut={() => posisi >= 0 && posisi < menunggu.length - 1 && tinjau(menunggu[posisi + 1].idPembayaran)}
                onTutup={() => setDitinjau(null)}
                onTerima={() => putuskan('terima')}
                onTolak={(alasan) => putuskan('tolak', alasan)}
                galatAlasan={galatAlasan}
                memproses={memproses}
            />

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
        </AdminSidebarLayout>
    );
}

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
        txtalasan: row?.alasanTolak ?? '',
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
            description={row && `Booking ${databooking.find((b) => b.idBooking === row.idBooking)?.kode ?? row.idBooking}`}
            onSubmit={submit}
            processing={processing}
            submitLabel={row ? 'Simpan Perubahan' : 'Simpan'}
        >
            {row && (
                <ProofPreview
                    src={row.buktiBayar ? route('pembayaran.bukti', row.idPembayaran) : null}
                    pdf={row.buktiBayar?.toLowerCase().endsWith('.pdf')}
                />
            )}

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
                        label: `${b.kode} · ${b.namaPenyewa} · ${formatTanggal(b.tanggal, 'd MMM yyyy')}`,
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
                <DateInput
                    id="txttglbayar"
                    className="mt-1"
                    value={data.txttglbayar}
                    onValueChange={(v) => setData('txttglbayar', v)}
                    aria-invalid={!!errors.txttglbayar}
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

            {data.txtstatus === 'Ditolak' && (
                <div>
                    <Label htmlFor="txtalasan">Alasan penolakan</Label>
                    <Textarea
                        id="txtalasan"
                        className="mt-1"
                        rows={3}
                        maxLength={500}
                        placeholder="Ditampilkan ke penyewa, misalnya: nominal transfer kurang."
                        value={data.txtalasan}
                        onChange={(e) => setData('txtalasan', e.target.value)}
                    />
                    <InputError message={errors.txtalasan} className="mt-1" />
                </div>
            )}
        </SheetForm>
    );
}
