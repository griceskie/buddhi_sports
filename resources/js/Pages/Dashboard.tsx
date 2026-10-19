import { Card, CardContent } from '@/Components/ui/card';
import PenyewaLayout from '@/Layouts/PenyewaLayout';
import { Head } from '@inertiajs/react';

export default function Dashboard() {
    return (
        <PenyewaLayout
            header={
                <h2 className="text-xl leading-tight font-semibold text-foreground">
                    Home
                </h2>
            }
        >
            <Head title="Home" />

            <Card>
                <CardContent>You're logged in!</CardContent>
            </Card>
        </PenyewaLayout>
    );
}
