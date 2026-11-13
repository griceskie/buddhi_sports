import DeleteButton from '@/Components/DeleteButton';
import FormSelect from '@/Components/FormSelect';
import FormSheet, { SheetForm, useFormSheet } from '@/Components/FormSheet';
import InputError from '@/Components/InputError';
import DataTable from '@/Components/pengelola/DataTable';
import { CourtStatusBadge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { CurrencyInput } from '@/Components/ui/currency-input';
import { formatRupiah } from '@/Components/ui/format';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import { Head, useForm } from '@inertiajs/react';
import { ImagePlus, Pencil, Plus, X } from 'lucide-react';
import { FormEventHandler, useEffect, useMemo } from 'react';

// harus sama dengan FotoLapangan::MAKS di server
const MAKS_FOTO = 6;

type Foto = { path: string; url: string };

type Lapangan = {
    idLapangan: number;
    namaLapangan: string;
    jenisLapangan: string;
    tarifPerJam: number;
    status: string;
    foto: Foto[];
};

export default function TampilData({ datalapangan }: { datalapangan: Lapangan[] }) {
    const sheet = useFormSheet<Lapangan>();

    return (
        <AdminSidebarLayout
            header={
                <h2 className="text-xl leading-tight font-semibold text-foreground">
                    Data Lapangan
                </h2>
            }
        >
            <Head title="Data Lapangan" />

            <div className="mb-6">
                <p className="text-muted-foreground">Lapangan GOR, tarif per jam dan statusnya.</p>
            </div>

            <DataTable
                baris={datalapangan}
                kunci={(r) => r.idLapangan}
                satuan="lapangan"
                cari={(r) => r.namaLapangan}
                placeholderCari="Cari nama lapangan…"
                filter={[
                    {
                        id: 'jenis',
                        label: 'Jenis',
                        nilai: (r) => r.jenisLapangan,
                        opsi: [
                            { id: 'Bulu Tangkis', label: 'Bulu tangkis' },
                            { id: 'Basket', label: 'Basket' },
                        ],
                    },
                    {
                        id: 'status',
                        label: 'Status',
                        nilai: (r) => r.status,
                        opsi: [
                            { id: 'Tersedia', label: 'Tersedia' },
                            { id: 'Perbaikan', label: 'Dalam perbaikan' },
                        ],
                    },
                ]}
                kolom={[
                    {
                        id: 'nama',
                        label: 'Nama',
                        tetap: true,
                        urut: (r) => r.namaLapangan,
                        render: (r) => (
                            <div className="flex items-center gap-3">
                                {r.foto[0] ? (
                                    <img src={r.foto[0].url} alt="" className="h-9 w-12 shrink-0 rounded-md object-cover" />
                                ) : (
                                    <div className="h-9 w-12 shrink-0 rounded-md bg-muted" />
                                )}
                                {r.namaLapangan}
                            </div>
                        ),
                    },
                    { id: 'jenis', label: 'Jenis', render: (r) => r.jenisLapangan },
                    { id: 'tarif', label: 'Tarif per jam', urut: (r) => r.tarifPerJam, render: (r) => formatRupiah(r.tarifPerJam) },
                    { id: 'status', label: 'Status', render: (r) => <CourtStatusBadge status={r.status} /> },
                ]}
                aksi={(r) => (
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => sheet.buka(r)}>
                            <Pencil />
                            Edit
                        </Button>
                        <DeleteButton href={`/deletelapangan/${r.idLapangan}`} />
                    </div>
                )}
                toolbarKanan={
                    <Button onClick={() => sheet.buka()}>
                        <Plus />
                        Tambah lapangan
                    </Button>
                }
            />

            <FormSheet open={sheet.open} onClose={sheet.tutup}>
                <FormLapangan key={sheet.versi} row={sheet.row} onDone={sheet.tutup} />
            </FormSheet>
        </AdminSidebarLayout>
    );
}

function FormLapangan({ row, onDone }: { row: Lapangan | null; onDone: () => void }) {
    const { data, setData, post, processing, errors } = useForm<{
        txtid: number | string;
        txtnama: string;
        txtjenis: string;
        txttarif: string;
        txtstatus: string;
        fotoLama: string[];
        foto: File[];
    }>({
        txtid: row?.idLapangan ?? '',
        txtnama: row?.namaLapangan ?? '',
        txtjenis: row?.jenisLapangan ?? 'Bulu Tangkis',
        txttarif: row ? String(row.tarifPerJam) : '',
        txtstatus: row?.status ?? 'Tersedia',
        fotoLama: row?.foto.map((f) => f.path) ?? [],
        foto: [],
    });

    // pratinjau foto baru; URL dilepas lagi saat daftar berubah atau sheet ditutup
    const pratinjau = useMemo(() => data.foto.map((f) => URL.createObjectURL(f)), [data.foto]);
    useEffect(() => () => pratinjau.forEach((u) => URL.revokeObjectURL(u)), [pratinjau]);
    const lama = (row?.foto ?? []).filter((f) => data.fotoLama.includes(f.path));
    const sisa = MAKS_FOTO - lama.length - data.foto.length;
    const galatFoto =
        errors.foto ??
        Object.entries(errors).find(([k]) => k.startsWith('foto.'))?.[1];

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(row ? '/updatelapangan' : '/insertlapangan', {
            preserveState: true,
            preserveScroll: true,
            onSuccess: onDone,
        });
    };

    return (
        <SheetForm
            title={row ? 'Edit Lapangan' : 'Tambah Lapangan'}
            onSubmit={submit}
            processing={processing}
            submitLabel={row ? 'Simpan Perubahan' : 'Simpan'}
        >
            <div>
                <Label htmlFor="txtnama">Nama Lapangan</Label>
                <Input
                    id="txtnama"
                    className="mt-1"
                    value={data.txtnama}
                    onChange={(e) => setData('txtnama', e.target.value)}
                />
                <InputError message={errors.txtnama} className="mt-1" />
            </div>

            <div>
                <Label htmlFor="txtjenis">Jenis</Label>
                <FormSelect
                    id="txtjenis"
                    className="mt-1"
                    value={data.txtjenis}
                    onChange={(v) => setData('txtjenis', v)}
                    options={[
                        { value: 'Bulu Tangkis', label: 'Bulu Tangkis' },
                        { value: 'Basket', label: 'Basket' },
                    ]}
                />
                <InputError message={errors.txtjenis} className="mt-1" />
            </div>

            <div>
                <Label htmlFor="txttarif">Tarif per Jam (Rp)</Label>
                <CurrencyInput
                    id="txttarif"
                    className="mt-1"
                    value={data.txttarif === '' ? null : Number(data.txttarif)}
                    onValueChange={(v) => setData('txttarif', v == null ? '' : String(v))}
                />
                <InputError message={errors.txttarif} className="mt-1" />
            </div>

            <div>
                <Label htmlFor="txtstatus">Status</Label>
                <FormSelect
                    id="txtstatus"
                    className="mt-1"
                    value={data.txtstatus}
                    onChange={(v) => setData('txtstatus', v)}
                    options={[
                        { value: 'Tersedia', label: 'Tersedia' },
                        { value: 'Perbaikan', label: 'Dalam perbaikan' },
                    ]}
                />
                <InputError message={errors.txtstatus} className="mt-1" />
            </div>

            <div>
                <Label htmlFor="foto">Foto</Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                    JPG, PNG, atau WebP, maks. 2 MB per foto, paling banyak {MAKS_FOTO}. Foto pertama jadi foto utama di Home.
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                    {lama.map((f) => (
                        <div key={f.path} className="relative aspect-4/3 overflow-hidden rounded-md bg-muted">
                            <img src={f.url} alt="" className="size-full object-cover" />
                            <Button
                                type="button"
                                variant="secondary"
                                size="icon-xs"
                                aria-label="Hapus foto"
                                className="absolute top-1 right-1 rounded-full"
                                onClick={() => setData('fotoLama', data.fotoLama.filter((p) => p !== f.path))}
                            >
                                <X />
                            </Button>
                        </div>
                    ))}
                    {pratinjau.map((u, i) => (
                        <div key={u} className="relative aspect-4/3 overflow-hidden rounded-md bg-muted">
                            <img src={u} alt="" className="size-full object-cover" />
                            <Button
                                type="button"
                                variant="secondary"
                                size="icon-xs"
                                aria-label="Hapus foto"
                                className="absolute top-1 right-1 rounded-full"
                                onClick={() => setData('foto', data.foto.filter((_, j) => j !== i))}
                            >
                                <X />
                            </Button>
                        </div>
                    ))}
                    {sisa > 0 && (
                        <label
                            htmlFor="foto"
                            className="flex aspect-4/3 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-input text-xs text-muted-foreground hover:bg-muted"
                        >
                            <ImagePlus className="size-5" aria-hidden="true" />
                            Tambah foto
                            <input
                                id="foto"
                                type="file"
                                multiple
                                accept="image/jpeg,image/png,image/webp"
                                className="sr-only"
                                onChange={(e) => {
                                    const dipilih = Array.from(e.target.files ?? []).slice(0, sisa);
                                    setData('foto', [...data.foto, ...dipilih]);
                                    e.target.value = '';
                                }}
                            />
                        </label>
                    )}
                </div>
                <InputError message={galatFoto} className="mt-1" />
            </div>
        </SheetForm>
    );
}
