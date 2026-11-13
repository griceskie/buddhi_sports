import { PropsWithChildren, ReactNode } from 'react';

/** Judul halaman panel Admin (kanvas "Redesign Dashboard Admin"): judul 20px, deskripsi tepat di bawahnya, aksi di kanan. */
export default function JudulHalaman({ judul, deskripsi, children }: PropsWithChildren<{ judul: ReactNode; deskripsi?: ReactNode }>) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-0.5">
                <h2 className="text-xl leading-7 font-medium text-foreground">{judul}</h2>
                {deskripsi && <p className="text-sm text-muted-foreground">{deskripsi}</p>}
            </div>
            {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
        </div>
    );
}
