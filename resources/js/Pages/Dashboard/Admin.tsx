import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';

export default function AdminDashboard({
    admin,
}: {
    admin: { idAdmin: number; namaAdmin: string; username: string };
}) {
    return (
        <AdminLayout
            header={
                <h2 className="text-xl leading-tight font-semibold text-foreground">
                    Halo, {admin.namaAdmin}
                </h2>
            }
        >
            <Head title="Dashboard Admin" />
        </AdminLayout>
    );
}
