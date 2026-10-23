<?php

namespace App\Support;

use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class Pemesanan
{
    public const JAM_BUKA = 8;

    public const JAM_TUTUP = 22;

    public const HARI_KE_DEPAN = 30;

    // Hanya booking yang sudah dikonfirmasi yang menahan jam; Dibayar adalah status lama Admin untuk hal yang sama.
    public const STATUS_MENAHAN_JAM = ['Dikonfirmasi', 'Dibayar'];

    public static function batasBayar(?string $createdAt): ?CarbonInterface
    {
        return $createdAt
            ? Carbon::parse($createdAt)->addMinutes(config('pembayaran.batas_bayar_menit'))
            : null;
    }

    /**
     * Ubah booking Dipesan yang belum mengunggah bukti dan sudah lewat batas bayar menjadi Dibatalkan.
     * Dipanggil oleh scheduler dan di awal halaman penyewa, jadi tetap benar walau scheduler belum jalan.
     */
    public static function batalkanKedaluwarsa(): int
    {
        return DB::table('bookings')
            ->where('status', 'Dipesan')
            ->whereNotNull('created_at')
            ->where('created_at', '<=', now()->subMinutes(config('pembayaran.batas_bayar_menit')))
            ->whereNotExists(function ($q) {
                $q->select(DB::raw(1))
                    ->from('pembayarans')
                    ->whereColumn('pembayarans.idBooking', 'bookings.idBooking');
            })
            ->update(['status' => 'Dibatalkan']);
    }

    public static function kode(int $idBooking): string
    {
        return 'BK-'.str_pad((string) $idBooking, 4, '0', STR_PAD_LEFT);
    }
}
