<?php

namespace App\Support;

use App\Models\Admin;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/** Notifikasi di header panel Admin: maksimal 5 baris, urut terbaru. */
class NotifikasiAdmin
{
    public const BATAS = 5;

    /**
     * @return array{daftar: list<array<string, mixed>>, baru: int}
     */
    public static function untuk(Admin $admin): array
    {
        $dibaca = $admin->notifDibacaPada ? Carbon::parse($admin->notifDibacaPada) : null;

        // Bukti bayar yang menunggu verifikasi; urut waktu kirim terbaru
        $bayar = DB::table('pembayarans')
            ->join('bookings', 'bookings.idBooking', '=', 'pembayarans.idBooking')
            ->join('penyewas', 'penyewas.idPenyewa', '=', 'bookings.idPenyewa')
            ->join('lapangans', 'lapangans.idLapangan', '=', 'bookings.idLapangan')
            ->where('pembayarans.status', 'Menunggu Verifikasi')
            ->orderByDesc('pembayarans.dikirimPada')->orderByDesc('pembayarans.idPembayaran')
            ->limit(self::BATAS)
            ->get(['pembayarans.idPembayaran', 'pembayarans.dikirimPada', 'bookings.idBooking', 'penyewas.namaPenyewa', 'lapangans.namaLapangan'])
            ->map(fn ($r) => [
                'id' => 'bayar-'.$r->idPembayaran,
                'jenis' => 'bayar',
                'judul' => 'Bukti bayar baru · '.$r->namaPenyewa,
                'ket' => Pemesanan::kode($r->idBooking).' · '.$r->namaLapangan,
                'waktu' => $r->dikirimPada ? Carbon::parse($r->dikirimPada)->toIso8601String() : null,
                'href' => route('dashboard.admin', ['bukti' => $r->idPembayaran]),
                'baru' => ! $dibaca || ($r->dikirimPada && Carbon::parse($r->dikirimPada)->gt($dibaca)),
            ]);

        // Laporan yang baru diperiksa Manager (7 hari terakhir)
        $laporan = DB::table('laporan_pembayarans')
            ->whereNotNull('diperiksaPada')
            ->where('diperiksaPada', '>=', now()->subDays(7))
            ->orderByDesc('diperiksaPada')
            ->limit(self::BATAS)
            ->get(['idLaporan', 'namaLaporan', 'diperiksaPada'])
            ->map(fn ($r) => [
                'id' => 'laporan-'.$r->idLaporan,
                'jenis' => 'laporan',
                'judul' => 'Laporan sudah diperiksa Manager',
                'ket' => $r->namaLaporan ?? 'Laporan pembayaran',
                'waktu' => Carbon::parse($r->diperiksaPada)->toIso8601String(),
                'href' => url('/tampillaporanpembayaran'),
                'baru' => false,
            ]);

        // Laporan yang diminta revisi Manager dan belum dibuat ulang (7 hari terakhir)
        $revisi = DB::table('laporan_pembayarans')
            ->whereNotNull('revisiPada')
            ->whereNull('diperiksaPada')
            ->where('revisiPada', '>=', now()->subDays(7))
            ->orderByDesc('revisiPada')
            ->limit(self::BATAS)
            ->get(['idLaporan', 'namaLaporan', 'revisiPada', 'bulan', 'tahun'])
            ->map(fn ($r) => [
                'id' => 'revisi-'.$r->idLaporan,
                'jenis' => 'laporan',
                'judul' => 'Laporan perlu revisi',
                'ket' => ($r->namaLaporan ?? 'Laporan pembayaran').' · catatan dari Manager',
                'waktu' => Carbon::parse($r->revisiPada)->toIso8601String(),
                'href' => url('/tampillaporanpembayaran?periode='.sprintf('%04d-%02d', $r->tahun, $r->bulan)),
                'baru' => false,
            ]);

        // Booking mendatang yang dibatalkan penyewa sendiri (tidak ada waktu batal, jadi ditaruh paling bawah)
        $batal = DB::table('bookings')
            ->join('penyewas', 'penyewas.idPenyewa', '=', 'bookings.idPenyewa')
            ->join('lapangans', 'lapangans.idLapangan', '=', 'bookings.idLapangan')
            ->where('bookings.status', 'Dibatalkan')
            ->where('bookings.dibatalkanPenyewa', true)
            ->where('bookings.tanggal', '>=', today()->toDateString())
            ->orderBy('bookings.tanggal')->orderBy('bookings.jamMulai')
            ->limit(self::BATAS)
            ->get(['bookings.idBooking', 'bookings.tanggal', 'bookings.jamMulai', 'bookings.jamSelesai', 'penyewas.namaPenyewa', 'lapangans.namaLapangan'])
            ->map(fn ($r) => [
                'id' => 'batal-'.$r->idBooking,
                'jenis' => 'batal',
                'judul' => 'Booking dibatalkan · '.$r->namaPenyewa,
                'ket' => Pemesanan::kode($r->idBooking).' · '.$r->namaLapangan.' · '
                    .Carbon::parse($r->tanggal)->locale('id')->translatedFormat('j M').' '.str_replace(':', '.', substr($r->jamMulai, 0, 5)).'–'.str_replace(':', '.', substr($r->jamSelesai, 0, 5)),
                'waktu' => null,
                'href' => url('/tampilbooking'),
                'baru' => false,
            ]);

        $bertanggal = $bayar->concat($laporan)->concat($revisi)->sortByDesc('waktu')->values();
        $daftar = $bertanggal->concat($batal)->take(self::BATAS)->values()->all();

        return [
            'daftar' => $daftar,
            // semua bukti menunggu yang dikirim setelah "Tandai sudah dibaca" terakhir, bukan hanya 5 yang tampil
            'baru' => DB::table('pembayarans')->where('status', 'Menunggu Verifikasi')
                ->when($dibaca, fn ($q) => $q->where('dikirimPada', '>', $dibaca))->count(),
        ];
    }
}
