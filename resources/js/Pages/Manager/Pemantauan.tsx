import AdminDashboard, { Aktivitas } from '@/Pages/Dashboard/Admin';
import { ComponentProps } from 'react';

/** Pemantauan Manager: dashboard Admin yang sama, hanya baca, dengan aktivitas hari ini dan pembaruan otomatis. */
export default function Pemantauan({ aktivitas, ...props }: Omit<ComponentProps<typeof AdminDashboard>, 'pemantauan' | 'terbaru'> & { aktivitas: Aktivitas[] }) {
    return <AdminDashboard {...props} pemantauan={{ aktivitas }} />;
}
