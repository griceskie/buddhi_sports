<?php

namespace App\Support;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

/**
 * Aturan jadwal booking yang dipakai Home penyewa dan form booking admin.
 */
class JadwalBooking
{
    public const JAM_BUKA = 8;

    public const JAM_TUTUP = 22;

    public const HARI_KE_DEPAN = 30;

    public const BATAS_BAYAR_MENIT = 120;

    // status yang menahan slot (SLOT_HOLDING_STATUSES di design system)
    public const STATUS_MENAHAN_SLOT = ['Dipesan', 'Dibayar', 'Dikonfirmasi'];

    /**
     * Booking yang masih menahan slot. Booking Dipesan lepas sendiri setelah batas bayar
     * kecuali sudah punya data pembayaran; booking dari admin (created_at kosong) tidak kedaluwarsa.
     */
    public static function aktif(): Builder
    {
        $batas = now()->subMinutes(self::BATAS_BAYAR_MENIT);

        return DB::table('bookings')
            ->whereIn('status', self::STATUS_MENAHAN_SLOT)
            ->where(function ($query) use ($batas) {
                $query->where('status', '!=', 'Dipesan')
                    ->orWhereNull('created_at')
                    ->orWhere('created_at', '>=', $batas)
                    ->orWhereExists(self::punyaPembayaran());
            });
    }

    /**
     * Booking Dipesan yang belum dibayar dan sudah lewat batas bayar.
     */
    public static function kedaluwarsa(): Builder
    {
        return DB::table('bookings')
            ->where('status', 'Dipesan')
            ->whereNotNull('created_at')
            ->where('created_at', '<', now()->subMinutes(self::BATAS_BAYAR_MENIT))
            ->whereNotExists(self::punyaPembayaran());
    }

    // lapangan yang sama tidak boleh dibooking di jam yang tumpang tindih pada tanggal yang sama
    public static function isTerbooking($idLapangan, $tanggal, $jamMulai, $jamSelesai, $idBookingKecuali = null): bool
    {
        return self::aktif()
            ->where('idLapangan', $idLapangan)
            ->where('tanggal', $tanggal)
            ->where('jamMulai', '<', self::jam($jamSelesai))
            ->where('jamSelesai', '>', self::jam($jamMulai))
            ->when($idBookingKecuali, fn ($query) => $query->where('idBooking', '!=', $idBookingKecuali))
            ->exists();
    }

    // totalBayar = tarifPerJam × durasi (jam)
    public static function hitungTotal(int $tarifPerJam, string $jamMulai, string $jamSelesai): int
    {
        $menit = (strtotime(self::jam($jamSelesai)) - strtotime(self::jam($jamMulai))) / 60;

        return (int) round($tarifPerJam * $menit / 60);
    }

    // "08:00" dan "08:00:00" disimpan dan dibandingkan dalam bentuk yang sama
    public static function jam(string $jam): string
    {
        return date('H:i:s', strtotime($jam));
    }

    private static function punyaPembayaran(): \Closure
    {
        return fn ($query) => $query->select(DB::raw(1))
            ->from('pembayarans')
            ->whereColumn('pembayarans.idBooking', 'bookings.idBooking');
    }
}
