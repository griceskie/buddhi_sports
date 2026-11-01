import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    resolve: {
        // "cn" -> versi yang mengenal skala tipografi (resources/js/lib/cn.ts)
        alias: [{ find: /^cn$/, replacement: fileURLToPath(new URL('./resources/js/lib/cn.ts', import.meta.url)) }],
    },
});
