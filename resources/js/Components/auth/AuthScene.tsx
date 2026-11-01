import { CSSProperties, useEffect, useState } from 'react';

/**
 * Sports objects around the guest pages' form (design: canvas "Buddhi Sports — Login & Daftar").
 * Each image in public/images/auth carries its own shadow, lit from the left, so do not rotate or flip them.
 * Desktop (>= 1100px): six objects plus two soft ambience shadows, placed by their centre relative to the
 * page centre (offsets from the 1280x800 Login design). Up to 1280px the offsets stay fixed; wider screens
 * push them out with the viewport (max 1.5x) and grow the objects (max 1.2x), with CSS clamp() only.
 * Smaller screens: only the top and bottom objects, smaller, tucked into the corners.
 * On the first page load each object slides in 32px from further out (shadows only fade in).
 */
type Item = {
    name: string;
    w: number;
    h: number;
    style: CSSProperties;
    /** Unit direction from the page centre to the object, for the entrance animation. */
    arah: [number, number];
};

// grows with the viewport above 1280px: clamp(n, n * 100vw / 1280px, max * n); the bounds swap for negative n
const ikutLebar = (n: number, max: number) =>
    n < 0
        ? `clamp(${n * max}px, ${n / 12.8}vw, ${n}px)`
        : `clamp(${n}px, ${n / 12.8}vw, ${n * max}px)`;

const centred = (name: string, w: number, h: number, x: number, y: number): Item => {
    // offsets in the design are to the top-left corner; work from the object's centre instead
    const cx = x + w / 2;
    const cy = y + h / 2;
    const panjang = Math.hypot(cx, cy) || 1;
    return {
        name,
        w,
        h,
        arah: [cx / panjang, cy / panjang],
        style: {
            left: `calc(50% + ${ikutLebar(cx, 1.5)})`,
            top: `calc(50% + ${cy}px)`,
            width: ikutLebar(w, 1.2),
            height: ikutLebar(h, 1.2),
            translate: '-50% -50%',
        },
    };
};

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

const DIAGONAL = Math.SQRT1_2;

const MOBILE: Item[] = [
    { name: 'handuk', w: 127, h: 142, style: { left: -22, top: -38 }, arah: [-DIAGONAL, -DIAGONAL] },
    { name: 'bola-basket', w: 141, h: 135, style: { right: -22, top: -42 }, arah: [DIAGONAL, -DIAGONAL] },
    { name: 'raket', w: 192, h: 220, style: { left: -52, bottom: -96 }, arah: [-DIAGONAL, DIAGONAL] },
    { name: 'botol', w: 170, h: 141, style: { right: -34, bottom: -42 }, arah: [DIAGONAL, DIAGONAL] },
];

const JARAK_MASUK = 32;

// Inertia keeps the JS module between Login and Register, so the entrance plays once per page load.
let sudahDiputar = false;

function Images({ items, className, animasi }: { items: Item[]; className: string; animasi: boolean }) {
    return items.map((item, i) => {
        const bayangan = item.name.startsWith('bayangan-');
        return (
            <img
                key={item.name}
                src={`/images/auth/${item.name}.webp`}
                alt=""
                width={item.w}
                height={item.h}
                decoding="async"
                className={`absolute max-w-none ${className} ${
                    animasi
                        ? `${bayangan ? 'animate-[auth-pudar_900ms_cubic-bezier(0.16,1,0.3,1)_both]' : 'animate-[auth-masuk_900ms_cubic-bezier(0.16,1,0.3,1)_both]'} motion-reduce:animate-none`
                        : ''
                }`}
                style={
                    {
                        width: item.w,
                        height: item.h,
                        ...item.style,
                        animationDelay: animasi ? `${i * 70}ms` : undefined,
                        '--auth-dari-x': `${item.arah[0] * JARAK_MASUK}px`,
                        '--auth-dari-y': `${item.arah[1] * JARAK_MASUK}px`,
                    } as CSSProperties
                }
            />
        );
    });
}

export default function AuthScene() {
    // read once per mount; StrictMode's double render happens before the effect, so both renders animate
    const [animasi] = useState(() => !sudahDiputar);
    useEffect(() => {
        sudahDiputar = true;
    }, []);

    return (
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 select-none"
        >
            <Images items={DESKTOP} className="hidden min-[1100px]:block" animasi={animasi} />
            <Images items={MOBILE} className="min-[1100px]:hidden" animasi={animasi} />
        </div>
    );
}
