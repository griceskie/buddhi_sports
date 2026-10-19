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

type Lapangan = {
    idLapangan: number;
    namaLapangan: string;
    jenisLapangan: string;
    tarifPerJam: number;
    status: string;
};

export default function FormEdit({ datalapangan }: { datalapangan: Lapangan }) {
    const { data, setData, post, processing, errors } = useForm({
        txtid: datalapangan.idLapangan,
        txtnama: datalapangan.namaLapangan,
        txtjenis: datalapangan.jenisLapangan,
        txttarif: String(datalapangan.tarifPerJam),
        txtstatus: datalapangan.status,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/updatelapangan');
    };

    return (
        <AdminLayout
            header={
                <h2 className="text-xl leading-tight font-semibold text-foreground">
                    Edit Lapangan
                </h2>
            }
        >
            <Head title="Edit Lapangan" />

            <Card className="max-w-md">
                <CardContent>
                    <form onSubmit={submit} className="space-y-4">
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
                                    { value: 'Kosong', label: 'Kosong' },
                                    { value: 'Terbooking', label: 'Terbooking' },
                                ]}
                            />
                            <InputError message={errors.txtstatus} className="mt-1" />
                        </div>

                        <Button className="w-full" disabled={processing}>Simpan Perubahan</Button>
                    </form>
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
