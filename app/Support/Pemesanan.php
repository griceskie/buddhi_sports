<?php

namespace App\Support;

use Carbon\CarbonInterface;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class Pemesanan
{
    public const JAM_BUKA = 8;

    public const JAM_TUTUP = 22;

    public const HARI_KE_DEPAN = 30;

    public const STATUS = ['Dipesan', 'Dikonfirmasi', 'Dibatalkan'];

    // Status booking yang sudah pasti; tahanJam() juga menghitung booking yang buktinya sedang menunggu verifikasi.
    public const STATUS_MENAHAN_JAM = ['Dikonfirmasi'];

    /**
     * Batasi query tabel bookings ke booking yang menahan jam di sisi penyewa: sudah dikonfirmasi, atau masih Dipesan
     * tetapi buktinya sedang menunggu verifikasi (penyewa sudah transfer, jadi tidak boleh didahului orang lain).
     * Booking tanpa bukti tidak menahan jam, supaya jam tidak bisa dikunci tanpa membayar.
     */
    public static function tahanJam(Builder $q): Builder
    {
        return $q->where(fn ($w) => $w->whereIn('bookings.status', self::STATUS_MENAHAN_JAM)
            ->orWhere(fn ($x) => $x->where('bookings.status', 'Dipesan')->whereExists(fn ($e) => $e->select(DB::raw(1))
                ->from('pembayarans')
                ->whereColumn('pembayarans.idBooking', 'bookings.idBooking')
                ->where('pembayarans.status', 'Menunggu Verifikasi'))));
    }

    /** Booking lain yang menahan jam yang bertabrakan dengan jadwal ini. */
    public static function jamDiambil(int $idLapangan, string $tanggal, string $jamMulai, string $jamSelesai, ?int $kecuali = null): bool
    {
        return self::tahanJam(DB::table('bookings'))
            ->where('bookings.idLapangan', $idLapangan)
            ->where('bookings.tanggal', $tanggal)
            ->where('bookings.jamMulai', '<', $jamSelesai)
            ->where('bookings.jamSelesai', '>', $jamMulai)
            ->when($kecuali, fn ($q) => $q->where('bookings.idBooking', '!=', $kecuali))
            ->exists();
    }

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
        $ids = DB::table('bookings')
            ->where('status', 'Dipesan')
            ->whereNotNull('created_at')
            ->where('created_at', '<=', now()->subMinutes(config('pembayaran.batas_bayar_menit')))
            ->whereNotExists(function ($q) {
                $q->select(DB::raw(1))
                    ->from('pembayarans')
                    ->whereColumn('pembayarans.idBooking', 'bookings.idBooking');
            })
            ->pluck('idBooking');

        if ($ids->isEmpty()) {
            return 0;
        }

        // setiap pembatalan otomatis tercatat di log aktivitas atas nama "Sistem"
        return DB::transaction(function () use ($ids) {
            $jumlah = DB::table('bookings')->whereIn('idBooking', $ids)->where('status', 'Dipesan')->update(['status' => 'Dibatalkan']);
            foreach ($ids as $id) {
                LogAktivitas::catat('otomatis', 'Booking', self::kode((int) $id), [['Status', 'Dipesan', 'Dibatalkan']],
                    'Bukti bayar tidak dikirim dalam '.config('pembayaran.batas_bayar_menit').' menit.', true);
            }

            return $jumlah;
        });
    }

    /**
     * Menit di antara dua waktu yang jatuh di jam operasional (08.00–22.00); malam tidak dihitung dan berlanjut
     * besok paginya. Dipakai untuk lama menunggu verifikasi (batas 1 jam).
     */
    public static function menitOperasional(Carbon $dari, Carbon $sampai): int
    {
        $menit = 0;
        for ($hari = $dari->copy()->startOfDay(); $hari->lte($sampai); $hari->addDay()) {
            $buka = $hari->copy()->setTime(self::JAM_BUKA, 0);
            $tutup = $hari->copy()->setTime(self::JAM_TUTUP, 0);
            $awal = $dari->gt($buka) ? $dari : $buka;
            $akhir = $sampai->lt($tutup) ? $sampai : $tutup;
            if ($akhir->gt($awal)) {
                $menit += (int) $awal->diffInMinutes($akhir);
            }
        }

        return $menit;
    }

    public static function kode(int $idBooking): string
    {
        return 'BK-'.str_pad((string) $idBooking, 4, '0', STR_PAD_LEFT);
    }
}
