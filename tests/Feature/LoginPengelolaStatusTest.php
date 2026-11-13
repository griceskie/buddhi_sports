<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Penyewa;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Panel pratinjau login pengelola: status publik hanya berupa tingkat, tanpa angka, nama atau nominal. */
class LoginPengelolaStatusTest extends TestCase
{
    use RefreshDatabase;

    private function menunggu(int $n): void
    {
        $penyewa = Penyewa::create(['namaPenyewa' => 'Rina Rahasia', 'noHp' => '081', 'email' => 'rina@example.com', 'password' => Hash::make('rahasia123')]);
        $lap = DB::table('lapangans')->insertGetId(['namaLapangan' => 'Airlangga', 'jenisLapangan' => 'Bulu Tangkis', 'tarifPerJam' => 50000, 'status' => 'Tersedia'], 'idLapangan');
        for ($i = 0; $i < $n; $i++) {
            $b = DB::table('bookings')->insertGetId(['idPenyewa' => $penyewa->idPenyewa, 'idLapangan' => $lap, 'tanggal' => '2026-11-20', 'jamMulai' => '10:00', 'jamSelesai' => '11:00', 'totalBayar' => 75000, 'status' => 'Dipesan'], 'idBooking');
            DB::table('pembayarans')->insert(['idBooking' => $b, 'tglBayar' => '2026-11-13', 'jumlahBayar' => 75000, 'buktiBayar' => 'bukti/a.jpg', 'status' => 'Menunggu Verifikasi']);
        }
    }

    public function test_halaman_login_memakai_komponen_baru(): void
    {
        $this->get('/login-pengelola')->assertInertia(fn (Assert $page) => $page->component('Auth/LoginPengelola')->where('temaPanel', true));
    }

    public function test_status_hanya_tingkat_tanpa_angka_atau_nama(): void
    {
        $this->getJson('/login-pengelola/status')->assertExactJson(['admin' => 'tidak ada', 'manager' => 'tidak ada']);

        Cache::flush();
        $this->menunggu(2);
        $respons = $this->getJson('/login-pengelola/status')->assertExactJson(['admin' => 'ada', 'manager' => 'tidak ada']);
        $this->assertDoesNotMatchRegularExpression('/\d/', $respons->getContent());
        $this->assertStringNotContainsString('Rina', $respons->getContent());

        Cache::flush();
        $this->menunggu(3);
        $this->getJson('/login-pengelola/status')->assertJson(['admin' => 'banyak']);
    }

    public function test_status_disimpan_di_cache(): void
    {
        $this->getJson('/login-pengelola/status')->assertJson(['admin' => 'tidak ada']);
        $this->menunggu(1);
        // belum berubah sampai cache habis
        $this->getJson('/login-pengelola/status')->assertJson(['admin' => 'tidak ada']);
    }

    public function test_status_dibatasi_lajunya(): void
    {
        for ($i = 0; $i < 30; $i++) {
            $this->getJson('/login-pengelola/status')->assertOk();
        }
        $this->getJson('/login-pengelola/status')->assertStatus(429);
    }

    public function test_login_admin_tetap_bekerja(): void
    {
        Admin::create(['namaAdmin' => 'Budi', 'username' => 'Admin1', 'password' => Hash::make('Admin123')]);
        $this->post('/login-pengelola', ['role' => 'admin', 'username' => 'Admin1', 'password' => 'Admin123'])->assertRedirect();
        $this->assertAuthenticated('admin');
    }
}
