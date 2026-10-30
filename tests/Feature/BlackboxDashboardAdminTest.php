<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Penyewa;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Kasus uji F01-F05 di blackbox-testing.md (Dashboard Admin dan verifikasi).
 */
class BlackboxDashboardAdminTest extends TestCase
{
    use RefreshDatabase;

    private function buatAdmin(): Admin
    {
        return Admin::create(['namaAdmin' => 'Admin Satu', 'username' => 'admin1', 'password' => Hash::make('rahasia123')]);
    }

    private function buatLapangan(string $nama = 'Lapangan 1'): int
    {
        return DB::table('lapangans')->insertGetId([
            'namaLapangan' => $nama, 'jenisLapangan' => 'Badminton', 'tarifPerJam' => 50000, 'status' => 'Tersedia',
        ], 'idLapangan');
    }

    private function buatPenyewa(string $email): Penyewa
    {
        return Penyewa::create(['namaPenyewa' => 'Rina', 'noHp' => '081', 'email' => $email, 'password' => Hash::make('rahasia123')]);
    }

    private function buatBooking(int $idLapangan, string $tanggal, string $mulai, string $selesai, string $status): int
    {
        return DB::table('bookings')->insertGetId([
            'idPenyewa' => $this->buatPenyewa(uniqid().'@example.com')->idPenyewa, 'idLapangan' => $idLapangan,
            'tanggal' => $tanggal, 'jamMulai' => $mulai, 'jamSelesai' => $selesai,
            'totalBayar' => 50000, 'status' => $status, 'created_at' => now(),
        ], 'idBooking');
    }

    private function buatPembayaran(int $idBooking, string $status, ?string $tglBayar = null): int
    {
        return DB::table('pembayarans')->insertGetId([
            'idBooking' => $idBooking, 'tglBayar' => $tglBayar ?? today()->toDateString(),
            'jumlahBayar' => 50000, 'buktiBayar' => 'bukti/x.jpg', 'status' => $status,
        ], 'idPembayaran');
    }

    // F01: kartu statistik hari ini -> angka sesuai data.
    public function test_f01_kartu_statistik_sesuai_data(): void
    {
        $admin = $this->buatAdmin();
        $l1 = $this->buatLapangan('Lapangan 1');
        $l2 = $this->buatLapangan('Lapangan 2');
        $hariIni = today()->toDateString();

        // Dikonfirmasi hari ini, 2 jam -> masuk bookingHariIni dan jamTerisi.
        $bDikonfirmasi = $this->buatBooking($l1, $hariIni, '10:00:00', '12:00:00', 'Dikonfirmasi');
        $this->buatPembayaran($bDikonfirmasi, 'Terverifikasi', $hariIni);

        // Dipesan + menunggu verifikasi hari ini -> masuk bookingHariIni (bukan jamTerisi) dan menungguVerifikasi.
        $bMenunggu = $this->buatBooking($l2, $hariIni, '14:00:00', '15:00:00', 'Dipesan');
        $this->buatPembayaran($bMenunggu, 'Menunggu Verifikasi');

        // Pendapatan bulan lalu.
        $bBulanLalu = $this->buatBooking($l1, today()->subMonthNoOverflow()->toDateString(), '09:00:00', '10:00:00', 'Dikonfirmasi');
        $this->buatPembayaran($bBulanLalu, 'Terverifikasi', today()->subMonthNoOverflow()->toDateString());

        $this->actingAs($admin, 'admin')->get('/dashboard-admin')->assertInertia(fn (Assert $p) => $p
            ->component('Dashboard/Admin')
            ->where('stat.bookingHariIni', 2)
            ->where('stat.menungguVerifikasi', 1)
            ->where('stat.pendapatanBulanIni', 50000)
            ->where('stat.pendapatanBulanLalu', 50000)
            ->where('stat.jamTerisi', 2)
            ->where('stat.jamTotal', 2 * (22 - 8)));
    }

    // F02: kartu Jadwal berganti sesuai tanggal yang dipilih / kembali ke hari ini.
    public function test_f02_jadwal_tanggal_valid(): void
    {
        $admin = $this->buatAdmin();
        $tanggal = today()->addDays(10)->toDateString();

        $this->actingAs($admin, 'admin')->get("/dashboard-admin?tanggal={$tanggal}")->assertInertia(fn (Assert $p) => $p
            ->component('Dashboard/Admin')
            ->where('tanggalJadwal', $tanggal)
            ->where('jadwalDari', today()->addDays(10)->subDays(7)->toDateString())
            ->where('jadwalSampai', today()->addDays(10)->addDays(30)->toDateString()));
    }

    public function test_f02_jadwal_tanggal_tidak_valid_kembali_ke_hari_ini(): void
    {
        $admin = $this->buatAdmin();

        $this->actingAs($admin, 'admin')->get('/dashboard-admin?tanggal=2026-02-30')->assertInertia(fn (Assert $p) => $p
            ->component('Dashboard/Admin')
            ->where('tanggalJadwal', today()->toDateString()));
    }

    public function test_f02_tombol_hari_ini_tanpa_parameter(): void
    {
        $admin = $this->buatAdmin();

        $this->actingAs($admin, 'admin')->get('/dashboard-admin')->assertInertia(fn (Assert $p) => $p
            ->component('Dashboard/Admin')
            ->where('tanggalJadwal', today()->toDateString()));
    }

    // F03: terima bukti bayar -> pembayaran Terverifikasi, booking Dikonfirmasi, antrean berkurang.
    public function test_f03_terima_bukti_bayar(): void
    {
        $admin = $this->buatAdmin();
        $l1 = $this->buatLapangan();
        $idBooking = $this->buatBooking($l1, today()->addDays(3)->toDateString(), '10:00:00', '11:00:00', 'Dipesan');
        $idPembayaran = $this->buatPembayaran($idBooking, 'Menunggu Verifikasi');

        $before = DB::table('pembayarans')->where('status', 'Menunggu Verifikasi')->count();

        $this->actingAs($admin, 'admin')->post("/verifikasi/{$idPembayaran}/terima")->assertRedirect();

        $this->assertDatabaseHas('pembayarans', ['idPembayaran' => $idPembayaran, 'status' => 'Terverifikasi']);
        $this->assertDatabaseHas('bookings', ['idBooking' => $idBooking, 'status' => 'Dikonfirmasi']);
        $after = DB::table('pembayarans')->where('status', 'Menunggu Verifikasi')->count();
        $this->assertSame($before - 1, $after);
    }

    // F04: terima bukti yang bentrok dengan booking lain yang sudah dikonfirmasi -> ditolak dengan pesan.
    public function test_f04_terima_bentrok_dengan_booking_dikonfirmasi(): void
    {
        $admin = $this->buatAdmin();
        $l1 = $this->buatLapangan();
        $tanggal = today()->addDays(3)->toDateString();

        $this->buatBooking($l1, $tanggal, '10:00:00', '11:00:00', 'Dikonfirmasi');
        $idBooking = $this->buatBooking($l1, $tanggal, '10:00:00', '11:00:00', 'Dipesan');
        $idPembayaran = $this->buatPembayaran($idBooking, 'Menunggu Verifikasi');

        $response = $this->actingAs($admin, 'admin')->post("/verifikasi/{$idPembayaran}/terima");

        $response->assertRedirect();
        $this->assertStringContainsString('bentrok', session('error') ?? '');
        $this->assertDatabaseHas('pembayarans', ['idPembayaran' => $idPembayaran, 'status' => 'Menunggu Verifikasi']);
        $this->assertDatabaseHas('bookings', ['idBooking' => $idBooking, 'status' => 'Dipesan']);
    }

    // F05: tolak bukti tanpa alasan -> ditolak; dengan alasan -> berhasil.
    public function test_f05_tolak_tanpa_alasan_ditolak(): void
    {
        $admin = $this->buatAdmin();
        $l1 = $this->buatLapangan();
        $idBooking = $this->buatBooking($l1, today()->addDays(3)->toDateString(), '10:00:00', '11:00:00', 'Dipesan');
        $idPembayaran = $this->buatPembayaran($idBooking, 'Menunggu Verifikasi');

        $this->actingAs($admin, 'admin')->post("/verifikasi/{$idPembayaran}/tolak", [])
            ->assertSessionHasErrors('alasan');

        $this->assertDatabaseHas('pembayarans', ['idPembayaran' => $idPembayaran, 'status' => 'Menunggu Verifikasi']);
    }

    public function test_f05_tolak_dengan_alasan_berhasil(): void
    {
        $admin = $this->buatAdmin();
        $l1 = $this->buatLapangan();
        $idBooking = $this->buatBooking($l1, today()->addDays(3)->toDateString(), '10:00:00', '11:00:00', 'Dipesan');
        $idPembayaran = $this->buatPembayaran($idBooking, 'Menunggu Verifikasi');

        $this->actingAs($admin, 'admin')->post("/verifikasi/{$idPembayaran}/tolak", ['alasan' => 'Nominal tidak sesuai.'])
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('pembayarans', [
            'idPembayaran' => $idPembayaran, 'status' => 'Ditolak', 'alasanTolak' => 'Nominal tidak sesuai.',
        ]);
        // booking tetap Dipesan, penyewa masih bisa unggah ulang.
        $this->assertDatabaseHas('bookings', ['idBooking' => $idBooking, 'status' => 'Dipesan']);
    }
}
