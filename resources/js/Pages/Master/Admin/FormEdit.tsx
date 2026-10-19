import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

type Admin = {
    idAdmin: number;
    namaAdmin: string;
    username: string;
};

export default function FormEdit({ dataadmin }: { dataadmin: Admin }) {
    const { data, setData, post, processing, errors } = useForm({
        txtid: dataadmin.idAdmin,
        txtnama: dataadmin.namaAdmin,
        txtusername: dataadmin.username,
        txtpassword: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/updateadmin');
    };

    return (
        <AdminLayout
            header={
                <h2 className="text-xl leading-tight font-semibold text-foreground">
                    Edit Admin
                </h2>
            }
        >
            <Head title="Edit Admin" />

            <Card className="max-w-md">
                <CardContent>
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <Label htmlFor="txtnama">Nama</Label>
                            <Input
                                id="txtnama"
                                className="mt-1"
                                value={data.txtnama}
                                onChange={(e) => setData('txtnama', e.target.value)}
                            />
                            <InputError message={errors.txtnama} className="mt-1" />
                        </div>

                        <div>
                            <Label htmlFor="txtusername">Username</Label>
                            <Input
                                id="txtusername"
                                className="mt-1"
                                value={data.txtusername}
                                onChange={(e) => setData('txtusername', e.target.value)}
                            />
                            <InputError message={errors.txtusername} className="mt-1" />
                        </div>

                        <div>
                            <Label htmlFor="txtpassword">Password Baru (opsional)</Label>
                            <Input
                                id="txtpassword"
                                type="password"
                                className="mt-1"
                                placeholder="Biarkan kosong jika tidak diubah"
                                value={data.txtpassword}
                                onChange={(e) => setData('txtpassword', e.target.value)}
                            />
                            <InputError message={errors.txtpassword} className="mt-1" />
                        </div>

                        <Button className="w-full" disabled={processing}>Simpan Perubahan</Button>
                    </form>
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
