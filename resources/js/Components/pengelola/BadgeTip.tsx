import { formatJam, formatTanggal } from '@/Components/ui/format';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/Components/ui/tooltip';
import { ReactElement } from 'react';

/** Badge status dengan tooltip saat diarahkan kursor atau difokus (aturan DS: semua badge punya tooltip). */
export default function BadgeTip({ tip, children }: { tip: string; children: ReactElement }) {
    return (
        <Tooltip>
            <TooltipTrigger render={<span tabIndex={0} className="inline-flex rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring" />}>
                {children}
            </TooltipTrigger>
            <TooltipContent className="text-sm">{tip}</TooltipContent>
        </Tooltip>
    );
}

const waktu = (nilai: string) => `${formatTanggal(nilai.slice(0, 10), 'd MMM yyyy')}, ${formatJam(nilai.slice(11, 16))}`;

export function tipPembayaran(p: { status: string; alasanTolak?: string | null; dikirimPada?: string | null; diverifikasiPada?: string | null }): string {
    switch (p.status) {
        case 'Terverifikasi':
            return p.diverifikasiPada ? `Diterima ${waktu(p.diverifikasiPada)}. Status ini tidak bisa diubah lagi.` : 'Diterima. Status ini tidak bisa diubah lagi.';
        case 'Ditolak':
            return p.alasanTolak ? `Alasan: ${p.alasanTolak} Penyewa bisa mengirim bukti baru.` : 'Penyewa bisa mengirim bukti baru.';
        default:
            return p.dikirimPada ? `Bukti dikirim ${waktu(p.dikirimPada)}. Admin perlu menerima atau menolaknya.` : 'Admin perlu menerima atau menolak bukti ini.';
    }
}

export function tipBooking(status: string, tanpaBayar = false): string {
    if (status === 'Dikonfirmasi' && tanpaBayar) return 'Dikonfirmasi tanpa pembayaran terverifikasi. Jamnya ditahan, tetapi tidak dihitung di pemasukan laporan.';
    if (status === 'Dikonfirmasi') return 'Pembayaran sudah diterima. Jam ini ditahan untuk penyewa.';
    if (status === 'Dibatalkan') return 'Booking batal. Jamnya kembali kosong.';
    return 'Belum dikonfirmasi. Jam ini belum ditahan untuk penyewa.';
}

export function tipLapangan(status: string): string {
    return status === 'Perbaikan' ? 'Tidak bisa dipesan sampai Admin mengubah statusnya.' : 'Bisa dipesan penyewa.';
}
