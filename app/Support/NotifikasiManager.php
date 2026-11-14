<?php

namespace App\Support;

use App\Models\Manager;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/** Notifikasi di header panel Manager: hanya hal yang bisa ditindak Manager, maksimal 5 baris. */
class NotifikasiManager
{
    public const BATAS = 5;

    /**
     * @return array{daftar: list<array<string, mixed>>, baru: int}
     */
    public static function untuk(Manager $manager): array
    {
        $dibaca = $manager->notifDibacaPada ? Carbon::parse($manager->notifDibacaPada) : null;

        // Laporan yang diserahkan Admin dan menunggu diperiksa (bukan yang sedang diminta revisi)
        $menunggu = DB::table('laporan_pembayarans')
            ->whereNotNull('filePdf')->whereNull('diperiksaPada')->whereNull('revisiPada')
            ->orderByDesc('tglLaporan')->orderByDesc('idLaporan')
            ->limit(self::BATAS)
            ->get(['idLaporan', 'namaLaporan', 'tglLaporan']);
        $daftar = $menunggu->map(fn ($r) => [
            'id' => 'laporan-'.$r->idLaporan,
            'jenis' => 'laporan',
            'judul' => 'Laporan menunggu diperiksa',
            'ket' => $r->namaLaporan ?? 'Laporan pembayaran',
            'waktu' => $r->tglLaporan ? Carbon::parse($r->tglLaporan)->toIso8601String() : null,
            'href' => url('/manager/laporan'),
            'baru' => ! $dibaca || ($r->tglLaporan && Carbon::parse($r->tglLaporan)->gt($dibaca)),
        ]);

        // Laporan bulan lalu belum diserahkan sesudah batas tanggal 5
        $lalu = today()->subMonthNoOverflow()->startOfMonth();
        $batas = $lalu->copy()->addMonthNoOverflow()->day(5);
        $ada = DB::table('laporan_pembayarans')->where('bulan', $lalu->month)->where('tahun', $lalu->year)->whereNotNull('filePdf')->exists();
        if (! $ada && today()->gt($batas)) {
            $daftar->push([
                'id' => 'terlambat-'.$lalu->format('Y-m'),
                'jenis' => 'terlambat',
                'judul' => 'Laporan '.$lalu->locale('id')->translatedFormat('F Y').' belum diserahkan',
                'ket' => 'Batas penyerahan '.$batas->locale('id')->translatedFormat('j F').'. Hubungi Admin.',
                'waktu' => null,
                'href' => url('/manager/laporan'),
                'baru' => false,
            ]);
        }

        return [
            'daftar' => $daftar->take(self::BATAS)->values()->all(),
            'baru' => $menunggu->filter(fn ($r) => ! $dibaca || ($r->tglLaporan && Carbon::parse($r->tglLaporan)->gt($dibaca)))->count(),
        ];
    }
}
