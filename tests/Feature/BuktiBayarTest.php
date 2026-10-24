<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Manager;
use App\Models\Penyewa;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BuktiBayarTest extends TestCase
{
    use RefreshDatabase;

    private Penyewa $pemilik;

    private int $idPembayaran;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        Storage::disk('local')->put('bukti/a.jpg', 'isi-bukti');

        $this->pemilik = Penyewa::create(['namaPenyewa' => 'Rina', 'noHp' => '081', 'email' => 'rina@example.com', 'password' => Hash::make('rahasia123')]);
        $lapangan = DB::table('lapangans')->insertGetId(['namaLapangan' => 'Airlangga', 'jenisLapangan' => 'Bulu Tangkis', 'tarifPerJam' => 50000, 'status' => 'Tersedia'], 'idLapangan');
        $booking = DB::table('bookings')->insertGetId([
            'idPenyewa' => $this->pemilik->idPenyewa, 'idLapangan' => $lapangan, 'tanggal' => '2026-10-24',
            'jamMulai' => '18:00:00', 'jamSelesai' => '20:00:00', 'totalBayar' => 100000, 'status' => 'Dipesan',
        ], 'idBooking');
        $this->idPembayaran = DB::table('pembayarans')->insertGetId([
            'idBooking' => $booking, 'tglBayar' => '2026-10-24', 'jumlahBayar' => 100000, 'buktiBayar' => 'bukti/a.jpg', 'status' => 'Menunggu Verifikasi',
        ], 'idPembayaran');
    }

    public function test_pemilik_admin_dan_manager_bisa_membuka_bukti(): void
    {
        $admin = Admin::create(['namaAdmin' => 'Budi', 'username' => 'Admin1', 'password' => Hash::make('Admin123')]);
        $manager = Manager::create(['namaManager' => 'Jarwo', 'username' => 'Manager1', 'password' => Hash::make('Manager123')]);
        $url = "/pembayaran/{$this->idPembayaran}/bukti";

        $this->actingAs($this->pemilik, 'web')->get($url)->assertOk()->assertStreamedContent('isi-bukti');
        $this->app['auth']->forgetGuards();
        $this->actingAs($admin, 'admin')->get($url)->assertOk();
        $this->app['auth']->forgetGuards();
        $this->actingAs($manager, 'manager')->get($url)->assertOk();
    }

    public function test_penyewa_lain_ditolak_dan_tamu_diarahkan_ke_login(): void
    {
        $lain = Penyewa::create(['namaPenyewa' => 'Dodi', 'noHp' => '082', 'email' => 'dodi@example.com', 'password' => Hash::make('rahasia123')]);

        $this->get("/pembayaran/{$this->idPembayaran}/bukti")->assertRedirect('/login');
        $this->actingAs($lain, 'web')->get("/pembayaran/{$this->idPembayaran}/bukti")->assertForbidden();
    }

    public function test_bukti_tidak_lagi_bisa_dibuka_lewat_folder_publik(): void
    {
        Storage::disk('public')->assertMissing('bukti/a.jpg');
        $this->actingAs($this->pemilik, 'web')->get('/pembayaran/999/bukti')->assertNotFound();
    }
}
