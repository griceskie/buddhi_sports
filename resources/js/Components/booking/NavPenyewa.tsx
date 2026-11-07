import MenuAkun from '@/Components/MenuAkun';
import Wordmark from '@/Components/Wordmark';
import { Link } from '@inertiajs/react';
import { useState } from 'react';
import IslandStatus from './IslandStatus';
import { statusGor } from './jadwal';
import { TitikStatus, useSekarangPerMenit } from './StatusBuka';

/** Logo ke Home + titik status buka/tutup; titik diklik memunculkan island jam buka. */
export function LogoStatus({ buka, onStatus }: { buka: boolean; onStatus: () => void }) {
    return (
        <div className="flex items-center gap-1">
            <Link href={route('dashboard')} className="shrink-0 text-lg">
                <Wordmark className="whitespace-nowrap" />
            </Link>
            <button
                type="button"
                onClick={onStatus}
                aria-label={`Lapangan ${buka ? 'buka' : 'tutup'}, lihat jam buka`}
                className="flex size-9 cursor-pointer items-center justify-center rounded-full outline-none transition-colors hover:bg-foreground/6 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
                <TitikStatus buka={buka} />
            </button>
        </div>
    );
}

/**
 * Nav halaman penyewa selain Home (Booking saya, Profile), sama dengan baris atas header Home:
 * logo + titik status, avatar inisial + tombol menu. Island jam buka ikut tampil di halaman ini.
 */
export default function NavPenyewa() {
    const gor = statusGor(useSekarangPerMenit());
    const [mintaIsland, setMintaIsland] = useState(0);

    return (
        <>
            <nav className="sticky top-0 z-30 border-b bg-background">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-20 lg:px-8">
                    <LogoStatus buka={gor.buka} onStatus={() => setMintaIsland((n) => n + 1)} />
                    <MenuAkun tampilan="avatar" />
                </div>
            </nav>
            <IslandStatus buka={gor.buka} bukaLagi={gor.bukaLagi} minta={mintaIsland} tanpaBarBawah />
        </>
    );
}
