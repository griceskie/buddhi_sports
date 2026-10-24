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
import { Pencil, Plus } from 'lucide-react';
import { FormEventHandler } from 'react';

type Lapangan = {
    idLapangan: number;
    namaLapangan: string;
    jenisLapangan: string;
    tarifPerJam: number;
    status: string;
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
                                <TableCell>{row.namaLapangan}</TableCell>
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
    const { data, setData, post, processing, errors } = useForm({
        txtid: row?.idLapangan ?? '',
        txtnama: row?.namaLapangan ?? '',
        txtjenis: row?.jenisLapangan ?? 'Bulu Tangkis',
        txttarif: row ? String(row.tarifPerJam) : '',
        txtstatus: row?.status ?? 'Tersedia',
    });

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
        </SheetForm>
    );
}
