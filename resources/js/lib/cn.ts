import { createCn } from 'cn/config';

/**
 * `cn` yang mengenal skala tipografi di app.css (text-headline, text-footnote, text-caption-1, …) sebagai
 * ukuran font. Tanpa ini, `cn('text-footnote', 'text-muted-foreground')` menganggap keduanya warna dan
 * membuang salah satunya. vite.config.js mengarahkan semua import "cn" ke file ini.
 */
export const cn = createCn({
    extend: {
        classGroups: {
            'font-size': [
                {
                    text: [
                        'large-title',
                        'title-1',
                        'title-2',
                        'title-3',
                        'headline',
                        'body',
                        'callout',
                        'subheadline',
                        'footnote',
                        'caption-1',
                        'caption-2',
                    ],
                },
            ],
        },
    },
});
