import AnalitikLaporan, { Analitik } from '@/Components/admin/AnalitikLaporan';
import FormSelect from '@/Components/FormSelect';
import FormSheet, { SheetForm, useFormSheet } from '@/Components/FormSheet';
import InputError from '@/Components/InputError';
import AksiBaris from '@/Components/pengelola/AksiBaris';
import DataTable from '@/Components/pengelola/DataTable';
import BadgeTip from '@/Components/pengelola/BadgeTip';
import JudulHalaman from '@/Components/pengelola/JudulHalaman';
import DialogLaporan from '@/Components/pengelola/DialogLaporan';
import { Ringkasan } from '@/Components/RingkasanPembayaran';
import { Period, PeriodPicker } from '@/Components/ui/period-picker';
import { Badge } from '@/Components/ui/badge';
import { Button, buttonVariants } from '@/Components/ui/button';
import { DateInput } from '@/Components/ui/date-input';
import { BULAN, formatRupiah, formatTanggal } from '@/Components/ui/format';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { cn } from 'cn';
import { CircleAlert, CircleCheck, Clock, FileText, Lock } from 'lucide-react';
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
        idAdmin: number;
    } | null;
    awalBerikut: string;
    batasSerah: string;
    hariTerlambat: number;
    ringkasan: Ringkasan;
    kini: Analitik;
    lalu: Analitik;
};

// warna mengikuti data-nada badge di admin.css
const BADGE: Record<Keadaan, { teks: string; nada: 'abu' | 'biru' | 'oranye' | 'hijau' }> = {
    kosong: { teks: 'Tidak ada data', nada: 'abu' },
    depan: { teks: 'Belum dimulai', nada: 'abu' },
    berjalan: { teks: 'Berjalan', nada: 'biru' },
    tertahan: { teks: 'Belum bisa dibuat', nada: 'oranye' },
    siap: { teks: 'Siap dibuat', nada: 'biru' },
    belum: { teks: 'Menunggu diperiksa', nada: 'abu' },
    revisi: { teks: 'Perlu revisi', nada: 'oranye' },
    cek: { teks: 'Sudah diperiksa', nada: 'hijau' },
};
const STATUS_BARIS = {
    belum: { teks: 'Menunggu diperiksa', nada: 'abu', Ikon: Clock },
    revisi: { teks: 'Perlu revisi', nada: 'oranye', Ikon: CircleAlert },
    cek: { teks: 'Sudah diperiksa', nada: 'hijau', Ikon: CircleCheck },
} as const;

const statusBaris = (l: Laporan): 'belum' | 'revisi' | 'cek' => (l.diperiksaPada ? 'cek' : l.revisiPada ? 'revisi' : 'belum');
const tgl = (iso: string) => formatTanggal(iso, 'EEE, d MMM yyyy');

export default function TampilData({
    datalaporan,
    tinjauan,
    ...pilihan
}: { datalaporan: Laporan[]; tinjauan: Tinjauan } & Pilihan) {
    const sheet = useFormSheet<Laporan>();
    const [buat, setBuat] = useState(false);
    const { periode, keadaan, laporan, namaLaporan, menunggu } = tinjauan;
    const adaData = keadaan !== 'kosong' && keadaan !== 'depan';
    const terlambat = (keadaan === 'siap' || keadaan === 'tertahan') && tinjauan.hariTerlambat > 0;
    const admin = new Map(pilihan.dataadmin.map((a) => [a.idAdmin, a.namaAdmin]));
    const manager = new Map(pilihan.datamanager.map((m) => [m.idManager, m.namaManager]));
    const namaAdmin = laporan ? (admin.get(laporan.idAdmin) ?? 'Admin') : '';
    const namaManager = laporan ? (manager.get(laporan.idManager) ?? 'Manager') : '';
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
        belum: laporan ? `Diserahkan ${tgl(laporan.tglLaporan)} oleh ${namaAdmin}, menunggu diperiksa ${namaManager}.` : '',
        revisi: laporan?.revisiPada ? `${namaManager} meminta revisi pada ${tgl(laporan.revisiPada)}. Perbaiki datanya, lalu buat ulang laporan.` : '',
        cek: laporan?.diperiksaPada ? `Diperiksa ${namaManager} pada ${tgl(laporan.diperiksaPada)}. Laporan terkunci.` : '',
    };
    const peringatan =
        keadaan === 'revisi' && laporan?.catatanRevisi
            ? { judul: `Catatan revisi dari ${namaManager}`, teks: laporan.catatanRevisi, tombol: false }
            : keadaan === 'tertahan'
              ? { judul: `${menunggu} pembayaran ${BULAN[periode.bulan - 1]} menunggu verifikasi`, teks: 'Terima atau tolak semua bukti bayar dulu. Setelah itu laporan bisa dibuat.', tombol: true }
              : null;

    const ubahPeriode = (p: Period) =>
        router.get('/tampillaporanpembayaran', { periode: `${p.tahun}-${String(p.bulan).padStart(2, '0')}` }, { preserveScroll: true, preserveState: true, replace: true });

    return (
        <AdminSidebarLayout
            header={
                <JudulHalaman
                    judul={
                        <>
                            Laporan {BULAN[periode.bulan - 1]} {periode.tahun}
                            <Badge data-nada={BADGE[keadaan].nada} className="ml-2.5 h-[22px] align-[3px]">
                                {BADGE[keadaan].teks}
                            </Badge>
                            {terlambat && (
                                <span className="ml-1.5 inline-flex h-[22px] items-center rounded-full border border-accessible-red/40 px-2 align-[3px] text-xs font-medium text-accessible-red">
                                    Terlambat {tinjauan.hariTerlambat} hari
                                </span>
                            )}
                        </>
                    }
                    deskripsi={desk[keadaan]}
                >
                    <Label>Periode</Label>
                    <PeriodPicker value={periode} onValueChange={ubahPeriode} />
                    {laporan?.filePdf && (
                        <a href={route('laporan.pdf', laporan.idLaporan)} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                            <FileText />
                            Buka PDF
                        </a>
                    )}
                    {bisaBuat && (
                        <Button size="sm" onClick={() => setBuat(true)}>
                            <FileText />
                            {laporan ? 'Buat ulang laporan' : 'Buat laporan'}
                        </Button>
                    )}
                    {mati && (
                        <span className="inline-flex cursor-not-allowed" title={keadaan === 'berjalan' ? `Bisa dibuat mulai ${tgl(tinjauan.awalBerikut)}` : `Masih ada ${menunggu} pembayaran menunggu verifikasi`}>
                            <Button size="sm" disabled>
                                <FileText />
                                Buat laporan
                            </Button>
                        </span>
                    )}
                </JudulHalaman>
            }
        >
            <Head title="Laporan Pembayaran" />

            {peringatan && (
                <div role="alert" className="grid grid-cols-[16px_minmax(0,1fr)_auto] items-start gap-x-3 rounded-lg border bg-card px-4 py-3">
                    <CircleAlert className="mt-0.5 size-4 text-accessible-orange" aria-hidden />
                    <div className="flex min-w-0 flex-col gap-1">
                        <span className="font-medium">{peringatan.judul}</span>
                        <span className="text-muted-foreground">{peringatan.teks}</span>
                    </div>
                    {peringatan.tombol && (
                        <Link href={`/tampilpembayaran?periode=${kodePeriode}`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'self-center')}>
                            Buka pembayaran
                        </Link>
                    )}
                </div>
            )}

            {adaData && <AnalitikLaporan kini={tinjauan.kini} lalu={tinjauan.lalu} bulan={periode.bulan} tahun={periode.tahun} sementara={keadaan === 'berjalan'} />}

            <DataTable
                baris={datalaporan}
                kunci={(r) => r.idLaporan}
                satuan="laporan"
                cari={(r) => r.namaLaporan ?? ''}
                placeholderCari="Cari nama laporan…"
                perHalaman={10}
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
                    { id: 'tgl', label: 'Tanggal laporan', className: 'text-muted-foreground tabular-nums', render: (r) => tgl(r.tglLaporan) },
                    {
                        id: 'status',
                        label: 'Status',
                        urut: (r) => ['revisi', 'belum', 'cek'].indexOf(statusBaris(r)),
                        render: (r) => {
                            const st = STATUS_BARIS[statusBaris(r)];
                            const tip = {
                                belum: 'Sudah diserahkan. Manager belum memeriksanya.',
                                revisi: `Manager meminta revisi${r.catatanRevisi ? `: ${r.catatanRevisi}` : '.'}`,
                                cek: `Diperiksa Manager${r.diperiksaPada ? ` pada ${tgl(r.diperiksaPada)}` : ''}. Laporan terkunci.`,
                            }[statusBaris(r)];
                            return (
                                <BadgeTip tip={tip}>
                                    <Badge data-nada={st.nada}>
                                        <st.Ikon aria-hidden="true" />
                                        {st.teks}
                                    </Badge>
                                </BadgeTip>
                            );
                        },
                    },
                ]}
                aksi={(r) => (
                    <span className="inline-flex items-center gap-0.5">
                        {r.filePdf && (
                            <a
                                href={route('laporan.pdf', r.idLaporan)}
                                target="_blank"
                                rel="noreferrer"
                                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mr-1 h-7 px-2 text-[13px]')}
                            >
                                <FileText />
                                PDF
                            </a>
                        )}
                        {/* sudah diperiksa Manager: terkunci */}
                        {r.diperiksaPada ? (
                            <span title="Sudah diperiksa Manager, laporan terkunci" className="inline-flex size-8 items-center justify-center text-muted-foreground">
                                <Lock className="size-4" aria-label="Terkunci" />
                            </span>
                        ) : (
                            <AksiBaris nama={r.namaLaporan ?? 'laporan'} onEdit={() => sheet.buka(r)} hapus={`/deletelaporanpembayaran/${r.idLaporan}`} />
                        )}
                    </span>
                )}
            />

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
                        onChange={(v) => !row && setData('txtbulan', v)}
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
                        readOnly={!!row}
                        onChange={(e) => setData('txttahun', e.target.value)}
                    />
                    <InputError message={errors.txttahun} className="mt-1" />
                </div>
            </div>

            <div>
                <Label>Total Pemasukan</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                    {row ? `${formatRupiah(row.totalPemasukan)}. ` : ''}Dihitung otomatis dari pembayaran terverifikasi di bulan itu saat disimpan.
                </p>
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
