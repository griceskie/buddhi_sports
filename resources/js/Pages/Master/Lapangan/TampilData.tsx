import DeleteButton from '@/Components/DeleteButton';
import FormSelect from '@/Components/FormSelect';
import FormSheet, { SheetForm, useFormSheet } from '@/Components/FormSheet';
import InputError from '@/Components/InputError';
import { CourtStatusBadge } from '@/Components/ui/badge';
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

            <div className="mb-4">
                <Button onClick={() => sheet.buka()}>
                    <Plus />
                    Tambah Lapangan
                </Button>
            </div>

            <Card className="gap-0 overflow-hidden py-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>Jenis</TableHead>
                            <TableHead>Tarif/Jam</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {datalapangan.map((row) => (
                            <TableRow key={row.idLapangan}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        {row.foto[0] ? (
                                            <img src={row.foto[0].url} alt="" className="h-9 w-12 shrink-0 rounded-md object-cover" />
                                        ) : (
                                            <div className="h-9 w-12 shrink-0 rounded-md bg-canvas" />
                                        )}
                                        {row.namaLapangan}
                                    </div>
                                </TableCell>
                                <TableCell>{row.jenisLapangan}</TableCell>
                                <TableCell>{formatRupiah(row.tarifPerJam)}</TableCell>
                                <TableCell><CourtStatusBadge status={row.status} /></TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" size="sm" onClick={() => sheet.buka(row)}>
                                            <Pencil />
                                            Edit
                                        </Button>
                                        <DeleteButton href={`/deletelapangan/${row.idLapangan}`} />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {datalapangan.length === 0 && <TableEmpty colSpan={5} />}
                    </TableBody>
                </Table>
            </Card>

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
                        <div key={f.path} className="relative aspect-4/3 overflow-hidden rounded-md bg-canvas">
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
                        <div key={u} className="relative aspect-4/3 overflow-hidden rounded-md bg-canvas">
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
