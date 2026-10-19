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

type Pembayaran = {
    idPembayaran: number;
    idAdmin: number | null;
    idBooking: number;
    tglBayar: string;
    jumlahBayar: number;
    buktiBayar: string | null;
    status: string;
};
type Booking = { idBooking: number; tanggal: string };
type Admin = { idAdmin: number; namaAdmin: string };

export default function FormEdit({
    datapembayaran,
    databooking,
    dataadmin,
}: {
    datapembayaran: Pembayaran;
    databooking: Booking[];
    dataadmin: Admin[];
}) {
    const { data, setData, post, processing, errors } = useForm({
        txtid: datapembayaran.idPembayaran,
        txtadmin: datapembayaran.idAdmin ? String(datapembayaran.idAdmin) : '',
        txtbooking: String(datapembayaran.idBooking),
        txttglbayar: datapembayaran.tglBayar,
        txtjumlah: String(datapembayaran.jumlahBayar),
        txtbukti: datapembayaran.buktiBayar ?? '',
        txtstatus: datapembayaran.status,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/updatepembayaran');
    };

    return (
        <AdminLayout
            header={
                <h2 className="text-xl leading-tight font-semibold text-foreground">
                    Edit Pembayaran
                </h2>
            }
        >
            <Head title="Edit Pembayaran" />

            <FlashMessage />

            <Card className="max-w-md">
                <CardContent>
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <Label htmlFor="txtbooking">Booking</Label>
                            <FormSelect
                                id="txtbooking"
                                className="mt-1"
                                value={data.txtbooking}
                                onChange={(v) => setData('txtbooking', v)}
                                placeholder="Pilih Booking"
                                options={[
                                    ...databooking.map((b) => ({
                                        value: String(b.idBooking),
                                        label: `#${b.idBooking} - ${b.tanggal}`,
                                    })),
                                ]}
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
                            <Input
                                id="txttglbayar"
                                type="date"
                                className="mt-1"
                                value={data.txttglbayar}
                                onChange={(e) => setData('txttglbayar', e.target.value)}
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

                        <Button className="w-full" disabled={processing}>Simpan Perubahan</Button>
                    </form>
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
