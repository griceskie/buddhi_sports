<?php

namespace Tests\Feature;

use App\Http\Controllers\LaporanPembayaranController;
use App\Support\LogAktivitas;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\DemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/** Data awal untuk instalasi baru dan data contoh untuk pengujian. */
class SeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeder_dasar_membuat_akun_dan_lapangan_tanpa_dobel(): void
    {
        $this->seed(DatabaseSeeder::class);
        $this->seed(DatabaseSeeder::class);

        $this->assertDatabaseCount('admins', 1);
        $this->assertDatabaseCount('managers', 1);
        $this->assertDatabaseCount('lapangans', 4);
        $this->post('/login-pengelola', ['role' => 'admin', 'username' => 'Admin1', 'password' => 'Admin123'])->assertRedirect(route('dashboard.admin'));
    }

    public function test_seeder_demo_siap_untuk_pengujian(): void
    {
        Storage::fake('local');
        $this->travelTo(now()->setDate(2026, 11, 17)->setTime(14, 0));
        $this->seed(DemoSeeder::class);

        // laporan bulan lalu bisa langsung dibuat (bulan selesai, ada data, tidak ada bukti menunggu)
        $this->assertNull(LaporanPembayaranController::alasanTidakBisaDibuat(now()->subMonthNoOverflow()->startOfMonth()));
        // antrean verifikasi dan bukti ditolak milik Rina tersedia
        $this->assertGreaterThanOrEqual(2, DB::table('pembayarans')->where('status', 'Menunggu Verifikasi')->count());
        $this->assertTrue(DB::table('pembayarans')->join('bookings', 'bookings.idBooking', '=', 'pembayarans.idBooking')
            ->join('penyewas', 'penyewas.idPenyewa', '=', 'bookings.idPenyewa')
            ->where('penyewas.email', 'rina@example.com')->where('pembayarans.status', 'Ditolak')->exists());
        // tidak ada jam bentrok di antara booking yang dikonfirmasi
        $bentrok = DB::table('bookings as a')->join('bookings as b', function ($j) {
            $j->on('a.idLapangan', '=', 'b.idLapangan')->on('a.tanggal', '=', 'b.tanggal')->on('a.idBooking', '<', 'b.idBooking')
                ->on('a.jamMulai', '<', 'b.jamSelesai')->on('a.jamSelesai', '>', 'b.jamMulai');
        })->count();
        $this->assertSame(0, $bentrok);
        // rantai log utuh dan penyewa contoh bisa login
        $this->assertTrue(LogAktivitas::periksa()['utuh']);
        $this->post('/login', ['email' => 'rina@example.com', 'password' => DemoSeeder::PASSWORD_PENYEWA])->assertRedirect(route('dashboard', absolute: false));
    }
}
