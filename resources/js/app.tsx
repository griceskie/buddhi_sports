import '../css/app.css';
import './bootstrap';

import { Toaster, toast } from '@/Components/ui/toast';
import { PageProps } from '@/types';
import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Pesan flash dari server (sukses/gagal) tampil sebagai toast di bawah, di halaman mana pun.
const tampilkanFlash = (flash?: PageProps['flash']) => {
    if (flash?.success) toast.success(flash.success);
    if (flash?.error) toast.error(flash.error);
};

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <>
                <App {...props} />
                <Toaster />
            </>,
        );
        tampilkanFlash((props.initialPage.props as unknown as PageProps).flash);
        router.on('success', (event) => tampilkanFlash((event.detail.page.props as unknown as PageProps).flash));
    },
    progress: {
        color: '#4B5563',
    },
});
