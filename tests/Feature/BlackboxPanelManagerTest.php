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

/**
 * Kasus uji I01-I05 di blackbox-testing.md (Panel Manager).
 */
class BlackboxPanelManagerTest extends TestCase
{
    use RefreshDatabase;

    private Manager $manager;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-05-31 10:00:00'));
        $this->manager = Manager::create(['namaManager' => 'Juan', 'username' => 'manager1', 'password' => Hash::make('rahasia123')]);
    }

    private function buatAdmin(string $username = 'admin1', string $password = 'rahasia123'): Admin
    {
        return Admin::create(['namaAdmin' => 'Admin Satu', 'username' => $username, 'password' => Hash::make($password)]);
    }

    private function buatLapangan(): int
    {
        return DB::table('lapangans')->insertGetId([
            'namaLapangan' => 'Lapangan 1', 'jenisLapangan' => 'Badminton', 'tarifPerJam' => 50000, 'status' => 'Tersedia',
        ], 'idLapangan');
    }

    private function buatPembayaran(int $idLapangan, string $tgl, int $jumlah, string $status = 'Terverifikasi'): void
    {
        $penyewa = Penyewa::create(['namaPenyewa' => 'Rina', 'noHp' => '081', 'email' => uniqid().'@example.com', 'password' => Hash::make('rahasia123')]);
        $b = DB::table('bookings')->insertGetId([
            'idPenyewa' => $penyewa->idPenyewa, 'idLapangan' => $idLapangan, 'tanggal' => $tgl,
            'jamMulai' => '18:00:00', 'jamSelesai' => '20:00:00', 'totalBayar' => $jumlah,
            'status' => $status === 'Terverifikasi' ? 'Dikonfirmasi' : 'Dipesan',
        ], 'idBooking');
        DB::table('pembayarans')->insert(['idBooking' => $b, 'tglBayar' => $tgl, 'jumlahBayar' => $jumlah, 'status' => $status]);
    }

    // I01: Pemantauan (pengganti dashboard Manager sejak 2026-11-14) -> isinya sama dengan dashboard Admin, hanya baca.
    // Kartu pemasukan dan grafik pindah ke Analisis bisnis (lihat I06).
    public function test_i01_pemantauan_hanya_baca_dengan_antrean_admin(): void
    {
        $idLapangan = $this->buatLapangan();
        $this->buatPembayaran($idLapangan, '2026-05-31', 100000, 'Menunggu Verifikasi');

        $this->actingAs($this->manager, 'manager')->get('/dashboard-manager')->assertInertia(fn (Assert $p) => $p
            ->component('Manager/Pemantauan')
            ->has('antrean', 1)
            ->missing('terbaru'));
        // tombol Terima/Tolak tetap milik Admin
        $this->post('/verifikasi/1/terima')->assertRedirect('/login-pengelola');
    }

    // I02: halaman Pembayaran dan Lapangan Manager hanya bisa dilihat -> tidak ada rute ubah yang bisa dipakai.
    public function test_i02_pembayaran_dan_lapangan_hanya_baca(): void
    {
        $idLapangan = $this->buatLapangan();
        $idBooking = DB::table('bookings')->insertGetId([
            'idPenyewa' => Penyewa::factory()->create()->idPenyewa, 'idLapangan' => $idLapangan,
            'tanggal' => today()->toDateString(), 'jamMulai' => '10:00:00', 'jamSelesai' => '11:00:00',
            'totalBayar' => 50000, 'status' => 'Dipesan',
        ], 'idBooking');

        // halaman-halamannya bisa dibuka (lihat saja)...
        $this->actingAs($this->manager, 'manager')->get('/manager/pembayaran')->assertOk();
        $this->actingAs($this->manager, 'manager')->get('/manager/lapangan')->assertOk();

        // ...tapi rute untuk mengubah data (khusus guard admin) tetap tertutup buat Manager.
        $this->actingAs($this->manager, 'manager')->post('/insertpembayaran', [
            'txtbooking' => $idBooking, 'txttglbayar' => today()->toDateString(), 'txtjumlah' => 50000, 'txtstatus' => 'Terverifikasi',
        ])->assertRedirect(route('login.pengelola'));

        $this->actingAs($this->manager, 'manager')->post('/updatelapangan', [
            'txtid' => $idLapangan, 'txtnama' => 'Diubah Manager', 'txtjenis' => 'Badminton', 'txttarif' => 1, 'txtstatus' => 'Tersedia',
        ])->assertRedirect(route('login.pengelola'));

        $this->assertDatabaseMissing('lapangans', ['namaLapangan' => 'Diubah Manager']);
    }

    // I03: tambah Admin dengan username duplikat -> ditolak.
    public function test_i03_tambah_admin_username_duplikat(): void
    {
        $this->buatAdmin('admin1');

        $this->actingAs($this->manager, 'manager')->post('/manager/admin', [
            'nama' => 'Admin Baru', 'username' => 'admin1', 'password' => 'rahasia123',
        ])->assertSessionHasErrors('username');

        $this->assertSame(1, DB::table('admins')->where('username', 'admin1')->count());
    }

    // I04: reset password Admin, lalu login dengan password baru -> berhasil.
    public function test_i04_reset_password_admin_lalu_login_berhasil(): void
    {
        $admin = $this->buatAdmin('admin1', 'passwordLama');

        $this->actingAs($this->manager, 'manager')->put("/manager/admin/{$admin->idAdmin}/password", [
            'password' => 'passwordBaru1',
        ])->assertSessionHas('success');
        // actingAs() di atas mengubah guard default ('Auth::shouldUse') ke 'manager' untuk sisa test ini,
        // sehingga middleware 'guest' (yang memeriksa guard default saat tidak diberi parameter) akan salah
        // mengira request berikut sudah "login". Ini kuirk harness test, bukan perilaku aplikasi sungguhan
        // (satu request nyata = satu container baru) — dikembalikan dulu ke 'web' sebelum lanjut.
        \Illuminate\Support\Facades\Auth::shouldUse('web');

        // password lama tidak lagi berfungsi.
        $this->post('/login-pengelola', ['role' => 'admin', 'username' => 'admin1', 'password' => 'passwordLama'])
            ->assertSessionHasErrors('password');

        // password baru berhasil login.
        $this->post('/login-pengelola', ['role' => 'admin', 'username' => 'admin1', 'password' => 'passwordBaru1'])
            ->assertRedirect(route('dashboard.admin'));
        $this->assertAuthenticated('admin');
    }

    // I05: hapus Admin yang masih dipakai di data lain -> ditolak dengan pesan error.
    public function test_i05_hapus_admin_yang_masih_dipakai_ditolak(): void
    {
        $admin = $this->buatAdmin();
        $idLapangan = $this->buatLapangan();
        DB::table('bookings')->insert([
            'idPenyewa' => Penyewa::factory()->create()->idPenyewa, 'idLapangan' => $idLapangan, 'idAdmin' => $admin->idAdmin,
            'tanggal' => today()->toDateString(), 'jamMulai' => '10:00:00', 'jamSelesai' => '11:00:00',
            'totalBayar' => 50000, 'status' => 'Dikonfirmasi',
        ]);

        $this->actingAs($this->manager, 'manager')->delete("/manager/admin/{$admin->idAdmin}")
            ->assertSessionHas('error');

        $this->assertDatabaseHas('admins', ['idAdmin' => $admin->idAdmin]);
    }
}
