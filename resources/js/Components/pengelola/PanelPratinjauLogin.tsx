import { Skeleton } from '@/Components/ui/skeleton';
import { CalendarDays, Clock, FileText, LucideIcon, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';

type Peran = 'admin' | 'manager';
type Tingkat = 'tidak ada' | 'ada' | 'banyak';

const WARNA: Record<Tingkat, string> = {
    'tidak ada': 'bg-accessible-gray text-accessible-gray',
    ada: 'bg-accessible-orange text-accessible-orange',
    banyak: 'bg-accessible-red text-accessible-red',
};

const KALIMAT: Record<Peran, Record<Tingkat, string>> = {
    admin: {
        'tidak ada': 'Belum ada pembayaran yang menunggu',
        ada: 'Ada pembayaran yang menunggu Anda',
        banyak: 'Banyak pembayaran menunggu Anda',
    },
    manager: {
        'tidak ada': 'Semua laporan sudah diperiksa',
        ada: 'Ada laporan yang menunggu Anda',
        banyak: 'Beberapa laporan menunggu Anda',
    },
};

const AJAKAN: Record<Peran, string> = {
    admin: 'Yuk cek buktinya. Yang paling lama dikirim ada di atas.',
    manager: 'Yuk periksa dan tandai setelah login.',
};

const FITUR: Record<Peran, { ikon: LucideIcon; teks: string }[]> = {
    admin: [
        { ikon: Clock, teks: 'Antrean bukti bayar, urut waktu kirim' },
        { ikon: CalendarDays, teks: 'Jadwal semua lapangan hari ini' },
        { ikon: FileText, teks: 'Laporan pembayaran bulanan' },
    ],
    manager: [
        { ikon: Wallet, teks: 'Pemasukan bulan ini dan tahun ini' },
        { ikon: FileText, teks: 'Laporan dari Admin untuk diperiksa' },
        { ikon: CalendarDays, teks: 'Daftar pembayaran dan lapangan' },
    ],
};

/**
 * Panel kanan halaman login pengelola. Statusnya dari GET /login-pengelola/status, yang sengaja hanya memberi
 * tingkat (tidak ada / ada / banyak): halaman ini publik, jadi tanpa jumlah, nama atau nominal.
 */
export default function PanelPratinjauLogin({ peran }: { peran: Peran }) {
    const [status, setStatus] = useState<Record<Peran, Tingkat> | null>(null);
    const [gagal, setGagal] = useState(false);

    useEffect(() => {
        window.axios
            .get(route('login.pengelola.status'))
            .then((r) => setStatus(r.data))
            .catch(() => setGagal(true));
    }, []);

    const tingkat = status?.[peran];

    return (
        <div className="flex flex-col gap-6" key={peran}>
            <div className="flex flex-col gap-2">
                <p className="text-xs font-medium tracking-[0.04em] text-muted-foreground uppercase">Menunggu Anda hari ini</p>
                <h2 className="text-[22px] leading-7 font-semibold tracking-[-0.01em] text-balance">
                    {peran === 'admin' ? 'Verifikasi pembayaran penyewa' : 'Laporan dan pemasukan bulan ini'}
                </h2>
            </div>

            {!gagal && (
                <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-xs" aria-live="polite">
                    {tingkat ? (
                        <>
                            <span aria-hidden className={`size-2.5 shrink-0 rounded-full ring-4 ring-current/20 ${WARNA[tingkat]}`} />
                            <div className="min-w-0">
                                <p className="font-medium">{KALIMAT[peran][tingkat]}</p>
                                <p className="mt-0.5 text-[0.8rem] leading-[18px] text-muted-foreground">
                                    {tingkat === 'tidak ada' ? 'Semua beres untuk saat ini.' : AJAKAN[peran]}
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="flex w-full flex-col gap-2">
                            <Skeleton className="h-4 w-2/3" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    )}
                </div>
            )}

            <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
                <p className="border-b px-4 py-3 font-semibold">Di panel Anda</p>
                <ul>
                    {FITUR[peran].map(({ ikon: Ikon, teks }) => (
                        <li key={teks} className="flex items-center gap-3 border-t px-4 py-3 first:border-t-0">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                <Ikon className="size-4" aria-hidden />
                            </span>
                            {teks}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
