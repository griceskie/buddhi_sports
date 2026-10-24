import { formatRupiah } from '@/Components/ui/format';
import { StatCard } from '@/Components/ui/stat-card';
import { Wallet } from 'lucide-react';

type PerStatus = { jumlah: number; total: number };
export type Ringkasan = { terverifikasi: PerStatus; menunggu: PerStatus; ditolak: PerStatus };

const STATUS_PEMBAYARAN = [
    { key: 'terverifikasi', label: 'Terverifikasi', warna: 'bg-success' },
    { key: 'menunggu', label: 'Menunggu verifikasi', warna: 'bg-accessible-orange' },
    { key: 'ditolak', label: 'Ditolak', warna: 'bg-destructive' },
] as const;

/** Total pemasukan + Status pembayaran untuk satu periode (halaman Pembayaran Admin dan Manager). */
export default function RingkasanPembayaran({ ringkasan }: { ringkasan: Ringkasan }) {
    return (
        <div className="grid gap-3 sm:grid-cols-2">
            <StatCard
                label="Total pemasukan"
                value={formatRupiah(ringkasan.terverifikasi.total)}
                description={`dari ${ringkasan.terverifikasi.jumlah} pembayaran terverifikasi, masuk laporan`}
                icon={<Wallet className="text-success" />}
            />
            <StatusPembayaran ringkasan={ringkasan} />
        </div>
    );
}

function StatusPembayaran({ ringkasan }: { ringkasan: Ringkasan }) {
    const semua = STATUS_PEMBAYARAN.reduce((n, s) => n + ringkasan[s.key].jumlah, 0);

    return (
        <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
            <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-muted-foreground">Status pembayaran</p>
                <p className="text-sm text-muted-foreground tabular-nums">{semua} pembayaran</p>
            </div>

            <div className="flex h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                {semua > 0 &&
                    STATUS_PEMBAYARAN.map((s) => (
                        <div
                            key={s.key}
                            className={s.warna}
                            style={{ width: `${(ringkasan[s.key].jumlah / semua) * 100}%` }}
                        />
                    ))}
            </div>

            <ul className="grid gap-1.5 text-sm">
                {STATUS_PEMBAYARAN.map((s) => (
                    <li key={s.key} className="flex items-center gap-2">
                        <span className={`size-2 shrink-0 rounded-full ${s.warna}`} aria-hidden="true" />
                        <span className="flex-1">{s.label}</span>
                        <span className="font-medium tabular-nums">{ringkasan[s.key].jumlah}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
