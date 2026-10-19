import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function FormTambah() {
    const { data, setData, post, processing, errors } = useForm({
        txtnama: '',
        txtnohp: '',
        txtemail: '',
        txtpassword: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/insertpenyewa');
    };

    return (
        <AdminLayout
            header={
                <h2 className="text-xl leading-tight font-semibold text-foreground">
                    Tambah Penyewa
                </h2>
            }
        >
            <Head title="Tambah Penyewa" />

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
                            <Label htmlFor="txtnohp">No HP</Label>
                            <Input
                                id="txtnohp"
                                className="mt-1"
                                value={data.txtnohp}
                                onChange={(e) => setData('txtnohp', e.target.value)}
                            />
                            <InputError message={errors.txtnohp} className="mt-1" />
                        </div>

                        <div>
                            <Label htmlFor="txtemail">Email</Label>
                            <Input
                                id="txtemail"
                                type="email"
                                className="mt-1"
                                value={data.txtemail}
                                onChange={(e) => setData('txtemail', e.target.value)}
                            />
                            <InputError message={errors.txtemail} className="mt-1" />
                        </div>

                        <div>
                            <Label htmlFor="txtpassword">Password</Label>
                            <Input
                                id="txtpassword"
                                type="password"
                                className="mt-1"
                                value={data.txtpassword}
                                onChange={(e) => setData('txtpassword', e.target.value)}
                            />
                            <InputError message={errors.txtpassword} className="mt-1" />
                        </div>

                        <Button className="w-full" disabled={processing}>Simpan</Button>
                    </form>
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
