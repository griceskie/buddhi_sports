import { Head } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';

export default function Test() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
            <Head title="Test Page" />
            
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm w-full max-w-sm p-8 text-center space-y-6">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Hi 👋</h1>
                
                <p className="text-muted-foreground text-sm">
                    Ini adalah halaman test menggunakan React, Inertia.js, dan shadcn/ui!
                </p>

                <Button className="w-full" onClick={() => alert('Button shadcn/ui berhasil diklik!')}>
                    Klik Saya!
                </Button>
            </div>
        </div>
    );
}
