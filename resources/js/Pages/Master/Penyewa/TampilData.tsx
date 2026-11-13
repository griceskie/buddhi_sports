import FormSheet, { SheetForm, useFormSheet } from '@/Components/FormSheet';
import InputError from '@/Components/InputError';
import AksiBaris from '@/Components/pengelola/AksiBaris';
import DataTable from '@/Components/pengelola/DataTable';
import JudulHalaman from '@/Components/pengelola/JudulHalaman';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import { Head, useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { FormEventHandler } from 'react';

type Penyewa = {
    idPenyewa: number;
    namaPenyewa: string;
    noHp: string;
    email: string;
    jumlahBooking: number;
};

// No HP dibaca per 4 digit, seperti PhoneInput
const formatHp = (d: string) => [d.slice(0, 4), d.slice(4, 8), d.slice(8)].filter(Boolean).join(' ');

export default function TampilData({ datapenyewa }: { datapenyewa: Penyewa[] }) {
    const sheet = useFormSheet<Penyewa>();

    return (
        <AdminSidebarLayout header={<JudulHalaman judul="Data penyewa" deskripsi="Akun penyewa yang terdaftar di Buddhi Sports." />}>
            <Head title="Data Penyewa" />

            <DataTable
                baris={datapenyewa}
                kunci={(r) => r.idPenyewa}
                satuan="penyewa"
                cari={(r) => `${r.namaPenyewa} ${r.email} ${r.noHp}`}
                placeholderCari="Cari nama, email atau No HP…"
                kolom={[
                    { id: 'nama', label: 'Nama', tetap: true, className: 'font-medium', urut: (r) => r.namaPenyewa, render: (r) => r.namaPenyewa },
                    { id: 'hp', label: 'No HP', className: 'tabular-nums', render: (r) => formatHp(r.noHp) },
                    { id: 'email', label: 'Email', className: 'text-muted-foreground', urut: (r) => r.email, render: (r) => r.email },
                    { id: 'booking', label: 'Booking', className: 'tabular-nums', urut: (r) => r.jumlahBooking, render: (r) => `${r.jumlahBooking}×` },
                ]}
                aksi={(r) => <AksiBaris nama={r.namaPenyewa} onEdit={() => sheet.buka(r)} hapus={`/deletepenyewa/${r.idPenyewa}`} />}
                toolbarKanan={
                    <Button onClick={() => sheet.buka()}>
                        <Plus />
                        Tambah penyewa
                    </Button>
                }
            />

            <FormSheet open={sheet.open} onClose={sheet.tutup}>
                <FormPenyewa key={sheet.versi} row={sheet.row} onDone={sheet.tutup} />
            </FormSheet>
        </AdminSidebarLayout>
    );
}

function FormPenyewa({ row, onDone }: { row: Penyewa | null; onDone: () => void }) {
    const { data, setData, post, processing, errors } = useForm({
        txtid: row?.idPenyewa ?? '',
        txtnama: row?.namaPenyewa ?? '',
        txtnohp: row?.noHp ?? '',
        txtemail: row?.email ?? '',
        txtpassword: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(row ? '/updatepenyewa' : '/insertpenyewa', {
            preserveState: true,
            preserveScroll: true,
            onSuccess: onDone,
        });
    };

    return (
        <SheetForm
            title={row ? 'Edit Penyewa' : 'Tambah Penyewa'}
            onSubmit={submit}
            processing={processing}
            submitLabel={row ? 'Simpan Perubahan' : 'Simpan'}
        >
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
                <Label htmlFor="txtpassword">{row ? 'Password Baru (opsional)' : 'Password'}</Label>
                <Input
                    id="txtpassword"
                    type="password"
                    className="mt-1"
                    placeholder={row ? 'Biarkan kosong jika tidak diubah' : undefined}
                    value={data.txtpassword}
                    onChange={(e) => setData('txtpassword', e.target.value)}
                />
                <InputError message={errors.txtpassword} className="mt-1" />
            </div>
        </SheetForm>
    );
}
