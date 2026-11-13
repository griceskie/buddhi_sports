<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Manager;
use App\Models\Penyewa;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Notifikasi header panel Admin (prop pengelola.notifikasi) dan "Tandai sudah dibaca" per akun. */
class HeaderPengelolaTest extends TestCase
{
    use RefreshDatabase;

    private Admin $admin;

    private int $penyewa;

    private int $lap;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-11-13 15:00:00'));
        $this->admin = Admin::create(['namaAdmin' => 'Budi Santoso', 'username' => 'Admin1', 'password' => Hash::make('Admin123')]);
        $this->penyewa = Penyewa::create(['namaPenyewa' => 'Rina', 'noHp' => '081', 'email' => 'rina@example.com', 'password' => Hash::make('rahasia123')])->idPenyewa;
        $this->lap = DB::table('lapangans')->insertGetId(['namaLapangan' => 'Airlangga', 'jenisLapangan' => 'Bulu Tangkis', 'tarifPerJam' => 50000, 'status' => 'Tersedia'], 'idLapangan');
    }

    private function bukti(string $dikirim, string $status = 'Menunggu Verifikasi'): int
    {
        $b = DB::table('bookings')->insertGetId(['idPenyewa' => $this->penyewa, 'idLapangan' => $this->lap, 'tanggal' => '2026-11-14', 'jamMulai' => '10:00', 'jamSelesai' => '11:00', 'totalBayar' => 50000, 'status' => 'Dipesan'], 'idBooking');

        return DB::table('pembayarans')->insertGetId(['idBooking' => $b, 'tglBayar' => '2026-11-13', 'jumlahBayar' => 50000, 'buktiBayar' => 'bukti/a.jpg', 'status' => $status, 'dikirimPada' => $dikirim], 'idPembayaran');
    }

    public function test_notifikasi_urut_terbaru_dan_maksimal_lima(): void
    {
        foreach (['09:00', '14:00', '10:00', '13:00', '11:00', '12:00'] as $jam) {
            $this->bukti("2026-11-13 $jam:00");
        }
        $this->bukti('2026-11-13 14:30:00', 'Terverifikasi'); // bukan antrean
        DB::table('bookings')->insert(['idPenyewa' => $this->penyewa, 'idLapangan' => $this->lap, 'tanggal' => '2026-11-15', 'jamMulai' => '20:00', 'jamSelesai' => '21:00', 'totalBayar' => 50000, 'status' => 'Dibatalkan', 'dibatalkanPenyewa' => true]);

        $this->actingAs($this->admin, 'admin')->get('/dashboard-admin')
            ->assertInertia(fn (Assert $page) => $page
                ->has('pengelola.notifikasi.daftar', 5)
                ->where('pengelola.notifikasi.baru', 6)
                ->where('pengelola.notifikasi.daftar.0.jenis', 'bayar')
                ->where('pengelola.notifikasi.daftar.0.waktu', fn ($w) => str_contains($w, '14:00'))
                ->where('pengelola.notifikasi.daftar.4.waktu', fn ($w) => str_contains($w, '10:00'))
                ->where('pengelola.notifikasi.daftar.0.judul', 'Bukti bayar baru · Rina'));
    }

    public function test_tandai_dibaca_per_akun_dan_bukti_baru_menyalakan_lagi(): void
    {
        $this->bukti('2026-11-13 14:00:00');

        $this->actingAs($this->admin, 'admin')->post('/notifikasi/dibaca')->assertRedirect();
        $this->assertNotNull(DB::table('admins')->where('idAdmin', $this->admin->idAdmin)->value('notifDibacaPada'));

        // di aplikasi akun dimuat ulang tiap permintaan; di tes model yang sama dipakai, jadi segarkan dulu
        $this->actingAs($this->admin->refresh(), 'admin')->get('/dashboard-admin')->assertInertia(fn (Assert $page) => $page->where('pengelola.notifikasi.baru', 0)
            ->where('pengelola.notifikasi.daftar.0.baru', false));

        $this->travel(10)->minutes();
        $this->bukti(now()->toDateTimeString());
        $this->get('/dashboard-admin')->assertInertia(fn (Assert $page) => $page->where('pengelola.notifikasi.baru', 1));
    }

    public function test_manager_tidak_mendapat_notifikasi_admin(): void
    {
        $manager = Manager::create(['namaManager' => 'Jarwo', 'username' => 'Manager1', 'password' => Hash::make('Manager123')]);
        $this->bukti('2026-11-13 14:00:00');

        $this->actingAs($manager, 'manager')->get('/dashboard-manager')
            ->assertInertia(fn (Assert $page) => $page->missing('pengelola.notifikasi'));
        $this->post('/notifikasi/dibaca')->assertRedirect('/login-pengelola');
    }
}
