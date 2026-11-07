import MenuAkun from '@/Components/MenuAkun';
import { Tabs, TabsIndicator, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import Wordmark from '@/Components/Wordmark';
import { Link } from '@inertiajs/react';
import { cn } from 'cn';
import { useEffect, useState } from 'react';
import { IKON_JENIS, IKON_LAPANGAN, Lapangan } from './jadwal';
import PilihLapangan from './PilihLapangan';
import PillLapangan from './PillLapangan';
import { TitikStatus } from './StatusBuka';

/**
 * Header Home (pola Airbnb): logo + titik status buka, kategori lapangan di tengah, menu akun avatar,
 * lalu pilihan lapangan. Mulai `sm` header menempel dan meringkas saat digulir: kategori naik dan hilang,
 * pill lapangan naik ke baris nav dan mengecil (aturan transform di app.css, `.kepala-beranda`).
 * Di HP header ikut tergulir tanpa animasi, dan pilihan lapangan memakai kartu `PilihLapangan`.
 */
export default function HeaderBeranda({
    jenisList,
    jenis,
    onJenis,
    lapangan,
    value,
    onLapangan,
    jamKosong,
    buka,
    onStatus,
}: {
    jenisList: string[];
    jenis: string;
    onJenis: (jenis: string) => void;
    /** Lapangan jenis terpilih. */
    lapangan: Lapangan[];
    value: number | null;
    onLapangan: (idLapangan: number) => void;
    jamKosong: (l: Lapangan) => number;
    buka: boolean;
    /** Titik status diklik: tampilkan island jam buka. */
    onStatus: () => void;
}) {
    const ringkas = useRingkas();

    return (
        <div className={cn('kepala-beranda', ringkas && 'ringkas')}>
            <nav className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 px-4 pt-3 sm:px-6 lg:h-20 lg:px-8 lg:pt-0">
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

                {jenisList.length > 1 && (
                    <Tabs
                        value={jenis}
                        onValueChange={(v) => onJenis(v as string)}
                        className="kategori-beranda order-3 mt-1 basis-full lg:absolute lg:top-0 lg:left-1/2 lg:order-none lg:mt-0 lg:basis-auto lg:-translate-x-1/2"
                    >
                        <TabsList
                            variant="line"
                            aria-label="Jenis lapangan"
                            className="relative w-full justify-start gap-8 rounded-none p-0 group-data-horizontal/tabs:h-15 sm:justify-center sm:gap-10 lg:gap-7 lg:group-data-horizontal/tabs:h-20"
                        >
                            {jenisList.map((j) => (
                                <TabsTrigger
                                    key={j}
                                    value={j}
                                    className="h-full flex-none gap-2.5 px-0.5 text-footnote font-semibold text-muted-foreground after:hidden data-active:text-foreground"
                                >
                                    {IKON_JENIS[j] && (
                                        <img src={IKON_JENIS[j]} alt="" className="size-7.5 object-contain sm:size-9" />
                                    )}
                                    {j}
                                </TabsTrigger>
                            ))}
                            <TabsIndicator className="bottom-0 lg:bottom-3" />
                        </TabsList>
                    </Tabs>
                )}

                <MenuAkun tampilan="avatar" />
            </nav>

            <div className="bawah-beranda border-b">
                <div className="mx-auto max-w-7xl px-4 pt-0.5 pb-1.5 sm:px-6 sm:pt-2 sm:pb-7 lg:px-8">
                    <div className="baris-pill max-sm:hidden">
                        <PillLapangan
                            lapangan={lapangan}
                            value={value}
                            onChange={onLapangan}
                            jamKosong={jamKosong}
                            ikon={IKON_LAPANGAN[jenis]}
                        />
                    </div>
                    <div className="pt-1.5 pb-3 sm:hidden">
                        <PilihLapangan
                            lapangan={lapangan}
                            value={value}
                            onChange={onLapangan}
                            jamKosong={jamKosong}
                            ikon={IKON_LAPANGAN[jenis]}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

/** true setelah digulir 48px, kembali false hanya di dekat puncak (jeda supaya tidak berkedip). Tidak berlaku di HP. */
function useRingkas() {
    const [ringkas, setRingkas] = useState(false);
    useEffect(() => {
        const sm = window.matchMedia('(min-width: 640px)');
        const cek = () => {
            const y = window.scrollY;
            setRingkas((r) => (!sm.matches ? false : !r && y > 48 ? true : r && y < 8 ? false : r));
        };
        cek();
        window.addEventListener('scroll', cek, { passive: true });
        sm.addEventListener('change', cek);
        return () => {
            window.removeEventListener('scroll', cek);
            sm.removeEventListener('change', cek);
        };
    }, []);
    return ringkas;
}
