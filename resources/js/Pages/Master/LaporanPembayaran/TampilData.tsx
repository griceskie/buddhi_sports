import { Analitik, AngkaUtama, BookingDanBatal, GrafikPemasukan, KeterisianLapangan, PetaJam } from '@/Components/admin/AnalitikLaporan';
import DeleteButton from '@/Components/DeleteButton';
import FormSelect from '@/Components/FormSelect';
import FormSheet, { SheetForm, useFormSheet } from '@/Components/FormSheet';
import InputError from '@/Components/InputError';
import DataTable from '@/Components/pengelola/DataTable';
import DialogLaporan from '@/Components/pengelola/DialogLaporan';
import { Ringkasan } from '@/Components/RingkasanPembayaran';
import { Alert, AlertDescription, AlertTitle } from '@/Components/ui/alert';
import { Period, PeriodPicker } from '@/Components/ui/period-picker';
import { Badge } from '@/Components/ui/badge';
import { Button, buttonVariants } from '@/Components/ui/button';
import { CurrencyInput } from '@/Components/ui/currency-input';
import { DateInput } from '@/Components/ui/date-input';
import { BULAN, formatRupiah, formatTanggal } from '@/Components/ui/format';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { cn } from 'cn';
import { CircleAlert, CircleCheck, FileText, Lock, MessageSquareWarning, Pencil } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

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
    revisiPada: string | null;
    catatanRevisi: string | null;
};
type Admin = { idAdmin: number; namaAdmin: string };
type Manager = { idManager: number; namaManager: string };
type Pembayaran = { idPembayaran: number; kode: string; namaPenyewa: string; jumlahBayar: number };
type Pilihan = { dataadmin: Admin[]; datamanager: Manager[]; datapembayaran: Pembayaran[] };

type Keadaan = 'kosong' | 'depan' | 'berjalan' | 'tertahan' | 'siap' | 'belum' | 'revisi' | 'cek';
type Tinjauan = {
    periode: Period;
    namaLaporan: string;
    keadaan: Keadaan;
    menunggu: number;
    laporan: {
        idLaporan: number;
        tglLaporan: string;
        filePdf: string | null;
        diperiksaPada: string | null;
        revisiPada: string | null;
        catatanRevisi: string | null;
        idManager: number;
    } | null;
    awalBerikut: string;
    batasSerah: string;
    hariTerlambat: number;
    ringkasan: Ringkasan;
    kini: Analitik;
    lalu: Analitik;
};

const BADGE: Record<Keadaan, { teks: string; kelas: string }> = {
    kosong: { teks: 'Tidak ada data', kelas: 'text-muted-foreground' },
    depan: { teks: 'Belum dimulai', kelas: 'text-muted-foreground' },
    berjalan: { teks: 'Berjalan', kelas: 'text-primary' },
    tertahan: { teks: 'Belum bisa dibuat', kelas: 'text-accessible-orange' },
    siap: { teks: 'Siap dibuat', kelas: 'text-primary' },
    belum: { teks: 'Menunggu diperiksa', kelas: 'text-muted-foreground' },
    revisi: { teks: 'Perlu revisi', kelas: 'text-accessible-orange' },
    cek: { teks: 'Sudah diperiksa', kelas: 'text-accessible-green' },
};

const statusBaris = (l: Laporan): 'belum' | 'revisi' | 'cek' => (l.diperiksaPada ? 'cek' : l.revisiPada ? 'revisi' : 'belum');
const tgl = (iso: string) => formatTanggal(iso, 'EEEE, d MMMM yyyy');

export default function TampilData({
    datalaporan,
    tinjauan,
    ...pilihan
}: { datalaporan: Laporan[]; tinjauan: Tinjauan } & Pilihan) {
    const sheet = useFormSheet<Laporan>();
    const [buat, setBuat] = useState(false);
    const { periode, keadaan, laporan, namaLaporan, menunggu } = tinjauan;
    const adaData = keadaan !== 'kosong' && keadaan !== 'depan' && keadaan !== 'berjalan';
    const terlambat = (keadaan === 'siap' || keadaan === 'tertahan') && tinjauan.hariTerlambat > 0;
    const admin = new Map(pilihan.dataadmin.map((a) => [a.idAdmin, a.namaAdmin]));
    const bisaBuat = keadaan === 'siap' || keadaan === 'belum' || keadaan === 'revisi';
    const mati = keadaan === 'berjalan' || keadaan === 'tertahan';
    const kodePeriode = `${periode.tahun}-${String(periode.bulan).padStart(2, '0')}`;

    const desk: Record<Keadaan, string> = {
        kosong: 'Aplikasi belum mencatat pembayaran di periode ini.',
        depan: 'Periode ini belum dimulai.',
        berjalan: `Periode masih berjalan. Laporan bisa dibuat mulai ${tgl(tinjauan.awalBerikut)}.`,
        tertahan: `Masih ada ${menunggu} pembayaran yang menunggu verifikasi. Proses dulu sebelum membuat laporan.${terlambat ? '' : ` Batas penyerahan ${tgl(tinjauan.batasSerah)}.`}`,
        siap: terlambat
            ? `Periode sudah selesai, tetapi batas penyerahan ${tgl(tinjauan.batasSerah)} sudah lewat. Buat dan serahkan sekarang.`
            : `Periode sudah selesai. Serahkan ke Manager paling lambat ${tgl(tinjauan.batasSerah)}.`,
        belum: laporan ? `Diserahkan ${tgl(laporan.tglLaporan)}, menunggu diperiksa Manager.` : '',
        revisi: laporan?.revisiPada ? `Manager meminta revisi pada ${tgl(laporan.revisiPada)}. Perbaiki datanya, lalu buat ulang laporan.` : '',
        cek: laporan?.diperiksaPada ? `Diperiksa Manager pada ${tgl(laporan.diperiksaPada)}. Laporan terkunci.` : '',
    };

    const ubahPeriode = (p: Period) =>
        router.get('/tampillaporanpembayaran', { periode: `${p.tahun}-${String(p.bulan).padStart(2, '0')}` }, { preserveScroll: true, preserveState: true, replace: true });

    return (
        <AdminSidebarLayout
            header={
                <h2 className="text-xl leading-tight font-semibold text-foreground">
                    Laporan Pembayaran
                </h2>
            }
        >
            <Head title="Laporan Pembayaran" />

            <div className="flex flex-col gap-6">
                <section className="flex flex-col gap-4 rounded-lg border bg-card p-5 shadow-xs">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-1 basis-80 flex-col gap-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-lg leading-7 font-medium">Laporan {BULAN[periode.bulan - 1]} {periode.tahun}</h3>
                                <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium', BADGE[keadaan].kelas)}>
                                    <span className="size-1.5 rounded-full bg-current" />
                                    {BADGE[keadaan].teks}
                                </span>
                                {terlambat && (
                                    <span className="inline-flex rounded-full bg-accessible-red/10 px-2.5 py-0.5 text-xs font-medium text-accessible-red">
                                        Terlambat {tinjauan.hariTerlambat} hari
                                    </span>
                                )}
                            </div>
                            <p className="max-w-prose text-muted-foreground">{desk[keadaan]}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <PeriodPicker value={periode} onValueChange={ubahPeriode} />
                            {laporan?.filePdf && (
                                <a href={route('laporan.pdf', laporan.idLaporan)} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'outline' })}>
                                    <FileText />
                                    Buka PDF
                                </a>
                            )}
                            {bisaBuat && (
                                <Button variant="elevated" onClick={() => setBuat(true)}>
                                    <FileText />
                                    {laporan ? 'Buat ulang laporan' : 'Buat laporan'}
                                </Button>
                            )}
                            {mati && (
                                <Button disabled title={keadaan === 'berjalan' ? `Bisa dibuat mulai ${tgl(tinjauan.awalBerikut)}` : `Masih ada ${menunggu} pembayaran menunggu verifikasi`}>
                                    <FileText />
                                    Buat laporan
                                </Button>
                            )}
                        </div>
                    </div>

                    {keadaan === 'revisi' && laporan?.catatanRevisi && (
                        <Alert variant="warning">
                            <MessageSquareWarning />
                            <AlertTitle>Catatan revisi dari Manager</AlertTitle>
                            <AlertDescription>{laporan.catatanRevisi}</AlertDescription>
                        </Alert>
                    )}
                    {keadaan === 'tertahan' && (
                        <Alert variant="warning">
                            <CircleAlert />
                            <AlertTitle>
                                {menunggu} pembayaran {BULAN[periode.bulan - 1]} menunggu verifikasi
                            </AlertTitle>
                            <AlertDescription className="flex flex-wrap items-center gap-3">
                                Terima atau tolak semua bukti bayar dulu. Setelah itu laporan bisa dibuat.
                                <Link href={`/tampilpembayaran?periode=${kodePeriode}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                                    Buka pembayaran
                                </Link>
                            </AlertDescription>
                        </Alert>
                    )}
                </section>

                {adaData && (
                    <>
                        <AngkaUtama kini={tinjauan.kini} lalu={tinjauan.lalu} />
                        <GrafikPemasukan key={kodePeriode} data={tinjauan.kini} bulan={periode.bulan} tahun={periode.tahun} />
                        <div className="grid gap-6 lg:grid-cols-2">
                            <PetaJam data={tinjauan.kini} />
                            <KeterisianLapangan data={tinjauan.kini} />
                        </div>
                        <BookingDanBatal data={tinjauan.kini} bulan={periode.bulan} />
                    </>
                )}

                <DataTable
                    baris={datalaporan}
                    kunci={(r) => r.idLaporan}
                    satuan="laporan"
                    cari={(r) => r.namaLaporan ?? ''}
                    placeholderCari="Cari laporan…"
                    perHalaman={10}
                    bisaPilih={false}
                    filter={[
                        {
                            id: 'status',
                            label: 'Status',
                            nilai: statusBaris,
                            opsi: [
                                { id: 'belum', label: 'Menunggu diperiksa' },
                                { id: 'revisi', label: 'Perlu revisi' },
                                { id: 'cek', label: 'Sudah diperiksa' },
                            ],
                        },
                        {
                            id: 'tahun',
                            label: 'Tahun',
                            nilai: (r) => String(r.tahun),
                            opsi: [...new Set(datalaporan.map((r) => r.tahun))].sort((a, b) => b - a).map((t) => ({ id: String(t), label: String(t) })),
                        },
                    ]}
                    kolom={[
                        {
                            id: 'periode',
                            label: 'Nama laporan',
                            tetap: true,
                            className: 'font-medium',
                            urut: (r) => r.tahun * 12 + r.bulan,
                            render: (r) => r.namaLaporan ?? `Laporan ${BULAN[r.bulan - 1]} ${r.tahun}`,
                        },
                        { id: 'total', label: 'Total pemasukan', className: 'tabular-nums', urut: (r) => r.totalPemasukan, render: (r) => formatRupiah(r.totalPemasukan) },
                        { id: 'admin', label: 'Dibuat oleh', render: (r) => admin.get(r.idAdmin) ?? '-' },
                        { id: 'tgl', label: 'Tanggal laporan', render: (r) => formatTanggal(r.tglLaporan, 'EEE, d MMM yyyy') },
                        {
                            id: 'status',
                            label: 'Status',
                            urut: (r) => ['revisi', 'belum', 'cek'].indexOf(statusBaris(r)),
                            render: (r) => {
                                const st = statusBaris(r);
                                return st === 'cek' ? (
                                    <Badge variant="success">
                                        <CircleCheck aria-hidden="true" />
                                        Sudah diperiksa
                                    </Badge>
                                ) : st === 'revisi' ? (
                                    <Badge variant="outline" className="border-accessible-orange/40 text-accessible-orange">Perlu revisi</Badge>
                                ) : (
                                    <Badge variant="outline">Menunggu diperiksa</Badge>
                                );
                            },
                        },
                    ]}
                    aksi={(r) => (
                        <div className="flex justify-end gap-2">
                            {r.filePdf && (
                                <a href={route('laporan.pdf', r.idLaporan)} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                                    <FileText />
                                    PDF
                                </a>
                            )}
                            {/* sudah diperiksa Manager: terkunci */}
                            {r.diperiksaPada ? (
                                <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                                    <Lock className="size-3.5" />
                                    Terkunci
                                </span>
                            ) : (
                                <>
                                    <Button variant="outline" size="sm" onClick={() => sheet.buka(r)}>
                                        <Pencil />
                                        Edit
                                    </Button>
                                    <DeleteButton href={`/deletelaporanpembayaran/${r.idLaporan}`} />
                                </>
                            )}
                        </div>
                    )}
                />
            </div>

            <FormSheet open={sheet.open} onClose={sheet.tutup}>
                <FormLaporan key={sheet.versi} row={sheet.row} onDone={sheet.tutup} {...pilihan} />
            </FormSheet>

            <DialogLaporan
                key={kodePeriode}
                buka={buat}
                onClose={() => setBuat(false)}
                periode={periode}
                namaLaporan={namaLaporan}
                ringkasan={tinjauan.ringkasan}
                datamanager={pilihan.datamanager}
                idManagerAwal={laporan?.idManager}
            />
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
