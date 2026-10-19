import FormSelect from '@/Components/FormSelect';
import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { CurrencyInput } from '@/Components/ui/currency-input';
import { BULAN } from '@/Components/ui/format';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

type Admin = { idAdmin: number; namaAdmin: string };
type Manager = { idManager: number; namaManager: string };
type Pembayaran = { idPembayaran: number; jumlahBayar: number };

export default function FormTambah({
    dataadmin,
    datamanager,
    datapembayaran,
}: {
    dataadmin: Admin[];
    datamanager: Manager[];
    datapembayaran: Pembayaran[];
}) {
    const { data, setData, post, processing, errors } = useForm({
        txtadmin: '',
        txtmanager: '',
        txtbulan: '',
        txttahun: '',
        txttotal: '',
        txttgllaporan: '',
        txtpembayaran: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/insertlaporanpembayaran');
    };

    return (
        <AdminLayout
            header={
                <h2 className="text-xl leading-tight font-semibold text-foreground">
                    Tambah Laporan Pembayaran
                </h2>
            }
        >
            <Head title="Tambah Laporan Pembayaran" />

            <Card className="max-w-md">
                <CardContent>
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <Label htmlFor="txtadmin">Admin</Label>
                            <FormSelect
                                id="txtadmin"
                                className="mt-1"
                                value={data.txtadmin}
                                onChange={(v) => setData('txtadmin', v)}
                                placeholder="Pilih Admin"
                                options={[
                                    ...dataadmin.map((a) => ({
                                        value: String(a.idAdmin),
                                        label: a.namaAdmin,
                                    })),
                                ]}
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
                                options={[
                                    ...datamanager.map((m) => ({
                                        value: String(m.idManager),
                                        label: m.namaManager,
                                    })),
                                ]}
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
                            <Input
                                id="txttgllaporan"
                                type="date"
                                className="mt-1"
                                value={data.txttgllaporan}
                                onChange={(e) => setData('txttgllaporan', e.target.value)}
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
                                        label: `#${p.idPembayaran} - Rp${p.jumlahBayar.toLocaleString('id-ID')}`,
                                    })),
                                ]}
                            />
                            <InputError message={errors.txtpembayaran} className="mt-1" />
                        </div>

                        <Button className="w-full" disabled={processing}>Simpan</Button>
                    </form>
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
