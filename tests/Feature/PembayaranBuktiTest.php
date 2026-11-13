<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Penyewa;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Halaman Pembayaran mengirim bukti periode itu untuk drawer verifikasi (klik baris tabel). */
class PembayaranBuktiTest extends TestCase
{
    use RefreshDatabase;

    public function test_halaman_pembayaran_mengirim_bukti_periode_dan_bentrokan(): void
    {
        $admin = Admin::create(['namaAdmin' => 'Budi', 'username' => 'Admin1', 'password' => Hash::make('Admin123')]);
        $penyewa = Penyewa::create(['namaPenyewa' => 'Rina', 'noHp' => '081', 'email' => 'rina@example.com', 'password' => Hash::make('rahasia123')]);
        $lap = DB::table('lapangans')->insertGetId(['namaLapangan' => 'Airlangga', 'jenisLapangan' => 'Bulu Tangkis', 'tarifPerJam' => 50000, 'status' => 'Tersedia'], 'idLapangan');
        $buat = fn (string $status, string $tgl) => DB::table('bookings')->insertGetId([
            'idPenyewa' => $penyewa->idPenyewa, 'idLapangan' => $lap, 'tanggal' => $tgl,
            'jamMulai' => '10:00:00', 'jamSelesai' => '12:00:00', 'totalBayar' => 100000, 'status' => $status,
        ], 'idBooking');
        $dikonfirmasi = $buat('Dikonfirmasi', '2026-10-25');
        $menunggu = $buat('Dipesan', '2026-10-25'); // jam sama dengan yang sudah dikonfirmasi
        $diLuarPeriode = $buat('Dipesan', '2026-09-10');
        $p = fn (int $b, string $tgl, string $st) => DB::table('pembayarans')->insertGetId([
            'idBooking' => $b, 'tglBayar' => $tgl, 'jumlahBayar' => 100000, 'buktiBayar' => 'bukti/a.jpg', 'status' => $st,
        ], 'idPembayaran');
        $p($dikonfirmasi, '2026-10-24', 'Terverifikasi');
        $idMenunggu = $p($menunggu, '2026-10-25', 'Menunggu Verifikasi');
        $p($diLuarPeriode, '2026-09-10', 'Menunggu Verifikasi');

        $this->actingAs($admin, 'admin')->get('/tampilpembayaran?periode=2026-10')->assertInertia(fn (Assert $page) => $page
            ->component('Master/Pembayaran/TampilData')
            ->has('bukti', 2)
            ->where('bukti.1.idPembayaran', $idMenunggu)
            ->where('bukti.1.totalBayar', 100000)
            ->where('bukti.1.bentrokDengan', 'BK-'.str_pad((string) $dikonfirmasi, 4, '0', STR_PAD_LEFT))
            ->where('bukti.0.bentrokDengan', null));
    }
}
