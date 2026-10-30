<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Penyewa;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Kasus uji C01-C06 di blackbox-testing.md (Hak akses).
 */
class BlackboxHakAksesTest extends TestCase
{
    use RefreshDatabase;

    private function buatAdmin(): Admin
    {
        return Admin::create([
            'namaAdmin' => 'Admin Satu',
            'username' => 'admin1',
            'password' => Hash::make('rahasia123'),
        ]);
    }

    // C01: belum login, buka /dashboard, /dashboard-admin, /manager/admin -> diarahkan ke halaman login.
    public function test_c01_belum_login_dashboard_penyewa(): void
    {
        $this->get('/dashboard')->assertRedirect(route('login'));
    }

    public function test_c01_belum_login_dashboard_admin(): void
    {
        $this->get('/dashboard-admin')->assertRedirect(route('login.pengelola'));
    }

    public function test_c01_belum_login_manager_admin(): void
    {
        $this->get('/manager/admin')->assertRedirect(route('login.pengelola'));
    }

    // C02: Penyewa membuka /tampilbooking (khusus Admin) -> ditolak / diarahkan ke login.
    public function test_c02_penyewa_membuka_tampilbooking(): void
    {
        $penyewa = Penyewa::factory()->create();

        $this->actingAs($penyewa)
            ->get('/tampilbooking')
            ->assertRedirect(route('login.pengelola'));
    }

    // C03: Admin membuka /manager/admin (khusus Manager) -> ditolak.
    public function test_c03_admin_membuka_manager_admin(): void
    {
        $admin = $this->buatAdmin();

        $this->actingAs($admin, 'admin')
            ->get('/manager/admin')
            ->assertRedirect(route('login.pengelola'));
    }

    // C04: Penyewa A membuka booking/{id milik B}/bayar -> ditolak (403/404).
    public function test_c04_penyewa_a_membuka_booking_bayar_milik_b(): void
    {
        $penyewaA = Penyewa::factory()->create();
        $penyewaB = Penyewa::factory()->create();
        $lapangan = DB::table('lapangans')->insertGetId([
            'namaLapangan' => 'Lapangan 1', 'jenisLapangan' => 'Badminton', 'tarifPerJam' => 50000, 'status' => 'Tersedia',
        ], 'idLapangan');
        $idBookingB = DB::table('bookings')->insertGetId([
            'idPenyewa' => $penyewaB->idPenyewa, 'idLapangan' => $lapangan,
            'tanggal' => today()->toDateString(), 'jamMulai' => '10:00:00', 'jamSelesai' => '11:00:00',
            'totalBayar' => 50000, 'status' => 'Dipesan', 'created_at' => now(),
        ], 'idBooking');

        $this->actingAs($penyewaA)
            ->get("/booking/{$idBookingB}/bayar")
            ->assertNotFound();
    }

    // C05: Penyewa A membuka pembayaran/{id milik B}/bukti -> 403.
    public function test_c05_penyewa_a_membuka_bukti_milik_b(): void
    {
        Storage::fake('local');

        $penyewaA = Penyewa::factory()->create();
        $penyewaB = Penyewa::factory()->create();
        $lapangan = DB::table('lapangans')->insertGetId([
            'namaLapangan' => 'Lapangan 1', 'jenisLapangan' => 'Badminton', 'tarifPerJam' => 50000, 'status' => 'Tersedia',
        ], 'idLapangan');
        $idBookingB = DB::table('bookings')->insertGetId([
            'idPenyewa' => $penyewaB->idPenyewa, 'idLapangan' => $lapangan,
            'tanggal' => today()->toDateString(), 'jamMulai' => '10:00:00', 'jamSelesai' => '11:00:00',
            'totalBayar' => 50000, 'status' => 'Dipesan', 'created_at' => now(),
        ], 'idBooking');
        $path = UploadedFile::fake()->create('bukti.jpg', 50, 'image/jpeg')->store('bukti', 'local');
        $idPembayaran = DB::table('pembayarans')->insertGetId([
            'idBooking' => $idBookingB, 'tglBayar' => today()->toDateString(),
            'jumlahBayar' => 50000, 'buktiBayar' => $path, 'status' => 'Menunggu Verifikasi',
        ], 'idPembayaran');

        $this->actingAs($penyewaA)
            ->get("/pembayaran/{$idPembayaran}/bukti")
            ->assertForbidden();
    }

    // C06: Penyewa membuka /laporanpembayaran/{id}/pdf (khusus Admin/Manager) -> ditolak.
    public function test_c06_penyewa_membuka_laporan_pdf(): void
    {
        $penyewa = Penyewa::factory()->create();

        $this->actingAs($penyewa)
            ->get('/laporanpembayaran/1/pdf')
            ->assertRedirect(route('login.pengelola'));
    }
}
