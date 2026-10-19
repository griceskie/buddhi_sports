import FlashMessage from '@/Components/FlashMessage';
import FormSelect from '@/Components/FormSelect';
import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { CurrencyInput } from '@/Components/ui/currency-input';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

type Penyewa = { idPenyewa: number; namaPenyewa: string };
type Lapangan = { idLapangan: number; namaLapangan: string };
type Admin = { idAdmin: number; namaAdmin: string };

export default function FormTambah({
    datapenyewa,
    datalapangan,
    dataadmin,
}: {
    datapenyewa: Penyewa[];
    datalapangan: Lapangan[];
    dataadmin: Admin[];
}) {
    const { data, setData, post, processing, errors } = useForm({
        txtpenyewa: '',
        txtlapangan: '',
        txtadmin: '',
        txttanggal: '',
        txtjammulai: '',
        txtjamselesai: '',
        txttotal: '',
        txtstatus: 'Dipesan',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/insertbooking');
    };

    return (
        <AdminLayout
            header={
                <h2 className="text-xl leading-tight font-semibold text-foreground">
                    Tambah Booking
                </h2>
            }
        >
            <Head title="Tambah Booking" />

            <FlashMessage />

            <Card className="max-w-md">
                <CardContent>
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <Label htmlFor="txtpenyewa">Penyewa</Label>
                            <FormSelect
                                id="txtpenyewa"
                                className="mt-1"
                                value={data.txtpenyewa}
                                onChange={(v) => setData('txtpenyewa', v)}
                                placeholder="Pilih Penyewa"
                                options={[
                                    ...datapenyewa.map((p) => ({
                                        value: String(p.idPenyewa),
                                        label: p.namaPenyewa,
                                    })),
                                ]}
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
                                options={[
                                    ...datalapangan.map((l) => ({
                                        value: String(l.idLapangan),
                                        label: l.namaLapangan,
                                    })),
                                ]}
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
                                    { value: 'Dibatalkan', label: 'Dibatalkan' },
                                ]}
                            />
                            <InputError message={errors.txtstatus} className="mt-1" />
                        </div>

                        <Button className="w-full" disabled={processing}>Simpan</Button>
                    </form>
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
