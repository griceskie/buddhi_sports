import PenyewaLayout from '@/Layouts/PenyewaLayout';
import { Head } from '@inertiajs/react';

export default function Booking() {
    return (
        <PenyewaLayout
            header={
                <h2 className="text-xl leading-tight font-semibold text-foreground">
                    Booking
                </h2>
            }
        >
            <Head title="Booking" />
        </PenyewaLayout>
    );
}
