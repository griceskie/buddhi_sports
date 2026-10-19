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
        txtusername: '',
        txtpassword: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/insertadmin');
    };

    return (
        <AdminLayout
            header={
                <h2 className="text-xl leading-tight font-semibold text-foreground">
                    Tambah Admin
                </h2>
            }
        >
            <Head title="Tambah Admin" />

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
