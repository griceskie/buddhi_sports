import { Button } from '@/Components/ui/button';
import { cn } from 'cn';
import { ReactNode, useRef } from 'react';

/**
 * Satu baris di island Profile: label, nilai (tersensor) dan tombol Ubah/Batal.
 * Isi `children` terbuka di bawahnya sebagai accordion; tanpa `children` barisnya hanya punya tombol aksi.
 */
export default function BarisProfil({
    id,
    label,
    nilai,
    nilaiClassName,
    terbuka = false,
    redup = false,
    nonaktif = false,
    aksi = 'Ubah',
    aksiClassName,
    onBuka,
    onTutup,
    children,
}: {
    id: string;
    label: string;
    nilai: ReactNode;
    nilaiClassName?: string;
    terbuka?: boolean;
    /** Baris lain sedang diubah: teks dan tombol diredupkan, latar tetap. */
    redup?: boolean;
    nonaktif?: boolean;
    aksi?: string;
    aksiClassName?: string;
    onBuka?: () => void;
    onTutup?: () => void;
    children?: ReactNode;
}) {
    const baris = useRef<HTMLDivElement>(null);
    const panel = useRef<HTMLDivElement>(null);

    const klik = () => {
        if (terbuka) {
            onTutup?.();
            return;
        }
        onBuka?.();
        if (children) requestAnimationFrame(() => geserKeForm(baris.current, panel.current));
    };

    return (
        <div ref={baris} id={`baris-${id}`} className="scroll-mt-20 px-5 py-4">
            <div className="flex min-h-11 items-center justify-between gap-4">
                <div className={cn('min-w-0 flex-1 transition-opacity duration-200', redup && 'opacity-40')}>
                    <p className="text-footnote font-semibold">{label}</p>
                    <Lipat buka={!terbuka}>
                        <p className={cn('mt-0.5 text-footnote text-muted-foreground', nilaiClassName)}>{nilai}</p>
                    </Lipat>
                </div>
                <span className={cn('transition-opacity duration-200', redup && 'opacity-40')}>
                    <Button
                        type="button"
                        variant="link"
                        className={cn('px-0', aksiClassName)}
                        disabled={redup || nonaktif}
                        aria-expanded={children ? terbuka : undefined}
                        aria-controls={children ? `panel-${id}` : undefined}
                        onClick={klik}
                    >
                        {terbuka ? 'Batal' : aksi}
                    </Button>
                </span>
            </div>
            {children && (
                <Lipat buka={terbuka} id={`panel-${id}`}>
                    <div ref={panel} className="flex flex-col gap-3 pt-2">
                        {children}
                    </div>
                </Lipat>
            )}
        </div>
    );
}

/** Accordion lewat grid-template-rows 0fr -> 1fr; isinya tak terlihat (dan tak bisa di-Tab) saat tertutup. */
function Lipat({ buka, id, children }: { buka: boolean; id?: string; children: ReactNode }) {
    return (
        <div
            id={id}
            className={cn(
                'grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none',
                buka ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
            )}
        >
            <div
                className={cn(
                    'min-h-0 overflow-hidden transition-[visibility] motion-reduce:transition-none',
                    buka ? 'visible delay-0' : 'invisible delay-300',
                )}
            >
                {children}
            </div>
        </div>
    );
}

const JARAK_NAV = 80; // nav sticky 64px + 16px

/**
 * Dipanggil langsung saat Ubah diklik. Kalau ujung bawah form akan lewat bawah layar, halaman digeser
 * per frame selama accordion membuka sampai ujung form terlihat. scrollBy sekali akan terpotong karena
 * halaman belum memanjang. Kalau baris + form lebih tinggi dari layar, cukup bawa judul baris ke bawah nav.
 */
function geserKeForm(baris: HTMLElement | null, panel: HTMLElement | null) {
    if (!baris) return;
    const tinggiPanel = panel?.scrollHeight ?? 0;
    const r = baris.getBoundingClientRect();
    const lebih = r.bottom + tinggiPanel + 24 - window.innerHeight;
    if (lebih <= 0) return;
    const muat = r.height + tinggiPanel <= window.innerHeight - JARAK_NAV - 24;
    const geser = muat ? lebih : r.top - JARAK_NAV;
    if (geser <= 0) return;

    const y0 = window.scrollY;
    const diam = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const durasi = diam ? 0 : 300;
    const mulai = performance.now();
    const langkah = (kini: number) => {
        const t = durasi ? Math.min(1, (kini - mulai) / durasi) : 1;
        window.scrollTo(0, y0 + geser * (1 - Math.pow(1 - t, 3)));
        if (kini - mulai < durasi + 60) requestAnimationFrame(langkah);
    };
    requestAnimationFrame(langkah);
}
