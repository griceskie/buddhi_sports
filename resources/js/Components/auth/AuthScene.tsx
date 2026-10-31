import { CSSProperties } from 'react';

/**
 * Sports objects around the guest pages' form (design: canvas "Buddhi Sports — Login & Daftar").
 * Each image in public/images/auth carries its own shadow, lit from the left, so do not rotate or flip them.
 * Desktop (>= 1100px): six objects plus two soft ambience shadows, placed relative to the page centre
 * (offsets from the 1280x800 Login design) so they keep their distance from the form at any size.
 * Smaller screens: only the top and bottom objects, smaller, tucked into the corners.
 */
type Item = { name: string; w: number; h: number; style: CSSProperties };

const centred = (name: string, w: number, h: number, x: number, y: number): Item => ({
    name,
    w,
    h,
    style: { left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` },
});

const DESKTOP: Item[] = [
    centred('bayangan-tirai', 660, 365, -330, -396),
    centred('bayangan-daun', 720, 420, -455, 76),
    centred('raket', 506, 579.5, -760, -4.5),
    centred('handuk', 302, 338, -705, -474),
    centred('kok', 180, 191, -584, -151),
    centred('sepatu', 383, 430, 273, -215),
    centred('bola-basket', 336.5, 322, 295.5, -481),
    centred('botol', 447, 370, 188, 131),
];

const MOBILE: Item[] = [
    { name: 'handuk', w: 127, h: 142, style: { left: -22, top: -38 } },
    { name: 'bola-basket', w: 141, h: 135, style: { right: -22, top: -42 } },
    { name: 'raket', w: 192, h: 220, style: { left: -52, bottom: -96 } },
    { name: 'botol', w: 170, h: 141, style: { right: -34, bottom: -42 } },
];

function Images({ items, className }: { items: Item[]; className: string }) {
    return items.map((item) => (
        <img
            key={item.name}
            src={`/images/auth/${item.name}.webp`}
            alt=""
            width={item.w}
            height={item.h}
            decoding="async"
            className={`absolute max-w-none ${className}`}
            style={{ ...item.style, width: item.w, height: item.h }}
        />
    ));
}

export default function AuthScene() {
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 select-none"
        >
            <Images items={DESKTOP} className="hidden min-[1100px]:block" />
            <Images items={MOBILE} className="min-[1100px]:hidden" />
        </div>
    );
}
