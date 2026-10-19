import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';

export default function ManagerDashboard({
    manager,
}: {
    manager: { idManager: number; namaManager: string; username: string };
}) {
    return (
        <AdminLayout
            header={
                <h2 className="text-xl leading-tight font-semibold text-foreground">
                    Halo, {manager.namaManager}
                </h2>
            }
        >
            <Head title="Dashboard Manager" />
        </AdminLayout>
    );
}
