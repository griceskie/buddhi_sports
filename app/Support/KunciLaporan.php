<?php

namespace App\Support;

use App\Http\Controllers\LaporanPembayaranController;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Pembayaran dikunci setelah laporan bulannya diserahkan, supaya PDF yang sudah diserahkan tetap cocok dengan data.
 * Kunci terbuka lagi selama Manager meminta revisi (revisiPada terisi); membuat ulang laporan atau menandainya
 * diperiksa menghapus permintaan revisi, jadi kunci menutup lagi.
 */
class KunciLaporan
{
    /** Apakah pembayaran bertanggal bayar $tanggal (YYYY-MM-DD) terkunci oleh laporan bulannya. */
    public static function terkunci(?string $tanggal): bool
    {
        if (! $tanggal) {
            return false;
        }
        $t = Carbon::parse($tanggal);

        return DB::table('laporan_pembayarans')
            ->where('bulan', $t->month)->where('tahun', $t->year)
            ->whereNotNull('filePdf')->where('filePdf', '!=', '')
            ->whereNull('revisiPada')
            ->exists();
    }

    public static function pesan(string $tanggal): string
    {
        $t = Carbon::parse($tanggal);

        return LaporanPembayaranController::namaLaporan($t->month, $t->year).' sudah diserahkan, jadi pembayaran di bulan itu tidak bisa ditambah, diubah, atau dihapus.';
    }
}
