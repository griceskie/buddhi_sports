<?php

namespace Tests\Feature;

use App\Http\Controllers\LogAktivitasController;
use App\Models\Admin;
use App\Models\Manager;
use App\Models\Penyewa;
use App\Support\LogAktivitas;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Celah prioritas rendah dari audit: 8.9, 8.10 (login), 8.13, 8.14, 8.16, B4. */
class CelahPrioritasRendahTest extends TestCase
{
    use RefreshDatabase;

    private Admin $admin;

    private int $booking;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = Admin::create(['namaAdmin' => 'Budi', 'username' => 'admin1', 'password' => Hash::make('rahasia123')]);
        $penyewa = Penyewa::create(['namaPenyewa' => 'Rina', 'noHp' => '081', 'email' => 'rina@example.com', 'password' => Hash::make('rahasia123')]);
        $lapangan = DB::table('lapangans')->insertGetId(['namaLapangan' => 'Airlangga', 'jenisLapangan' => 'Bulu Tangkis', 'tarifPerJam' => 50000, 'status' => 'Tersedia'], 'idLapangan');
        $this->booking = DB::table('bookings')->insertGetId([
            'idPenyewa' => $penyewa->idPenyewa, 'idLapangan' => $lapangan, 'tanggal' => '2026-10-24',
            'jamMulai' => '18:00:00', 'jamSelesai' => '20:00:00', 'totalBayar' => 100000, 'status' => 'Dikonfirmasi',
        ], 'idBooking');
    }

    // 8.9: path bukti dari form hanya boleh di folder bukti/, dan file di luar folder itu tidak pernah dilayani
    public function test_path_bukti_harus_di_folder_bukti(): void
    {
        foreach (['laporan/laporan-pembayaran-2026-10.pdf', 'bukti/../laporan/x.pdf'] as $path) {
            $this->actingAs($this->admin, 'admin')->from('/tampilpembayaran')->post('/insertpembayaran', [
                'txtbooking' => $this->booking, 'txttglbayar' => '2026-10-23', 'txtjumlah' => 100000, 'txtstatus' => 'Menunggu Verifikasi', 'txtbukti' => $path,
            ])->assertSessionHasErrors('txtbukti');
        }
        $this->assertDatabaseCount('pembayarans', 0);

        // data lama yang sudah terlanjur menunjuk ke luar folder bukti/
        $id = DB::table('pembayarans')->insertGetId(['idBooking' => $this->booking, 'tglBayar' => '2026-10-23', 'jumlahBayar' => 1, 'buktiBayar' => 'laporan/x.pdf', 'status' => 'Ditolak'], 'idPembayaran');
        $this->get("/pembayaran/{$id}/bukti")->assertNotFound();
    }

    // 8.16: pilihan Admin/Manager tidak membawa hash password
    public function test_pilihan_admin_dan_manager_tanpa_password(): void
    {
        Manager::create(['namaManager' => 'Jarwo', 'username' => 'manager1', 'password' => Hash::make('rahasia123')]);
        $this->actingAs($this->admin, 'admin')->get('/tampilpembayaran')->assertInertia(fn (Assert $p) => $p
            ->has('dataadmin.0', fn (Assert $a) => $a->has('idAdmin')->has('namaAdmin')->missing('password')));
        $this->get('/tampillaporanpembayaran')->assertInertia(fn (Assert $p) => $p
            ->has('dataadmin.0', fn (Assert $a) => $a->has('idAdmin')->has('namaAdmin')->missing('password'))
            ->has('datamanager.0', fn (Assert $m) => $m->has('idManager')->has('namaManager')->missing('password')));
    }

    // 8.10: login berhasil dan gagal (untuk username yang ada) tercatat; tebakan username acak tidak
    public function test_login_pengelola_tercatat_di_log(): void
    {
        $masuk = fn (string $user, string $pw) => $this->post('/login-pengelola', ['role' => 'admin', 'username' => $user, 'password' => $pw]);

        $masuk('admin1', 'salah');
        $masuk('tidakada', 'salah');
        $this->assertDatabaseCount('log_aktivitas', 1);
        $this->assertDatabaseHas('log_aktivitas', ['aksi' => 'gagal', 'kodeObjek' => 'admin1', 'peran' => 'sistem']);

        $masuk('admin1', 'rahasia123')->assertRedirect(route('dashboard.admin'));
        $this->assertDatabaseHas('log_aktivitas', ['aksi' => 'masuk', 'kodeObjek' => 'admin1', 'peran' => 'admin', 'namaAdmin' => 'Budi']);
        $this->assertTrue(LogAktivitas::periksa()['utuh']);
    }

    // 8.13: booking Dikonfirmasi tanpa pembayaran Terverifikasi diberi tanda
    public function test_booking_dikonfirmasi_tanpa_pembayaran_ditandai(): void
    {
        $this->actingAs($this->admin, 'admin')->get('/tampilbooking')->assertInertia(fn (Assert $p) => $p->where('databooking.0.tanpaBayar', true));

        DB::table('pembayarans')->insert(['idBooking' => $this->booking, 'tglBayar' => '2026-10-23', 'jumlahBayar' => 100000, 'status' => 'Terverifikasi']);
        $this->get('/tampilbooking')->assertInertia(fn (Assert $p) => $p->where('databooking.0.tanpaBayar', false));
    }

    // 8.14: tombol Periksa hanya menelusuri entri setelah titik terakhir yang lolos
    public function test_periksa_log_bertahap(): void
    {
        DB::transaction(fn () => LogAktivitas::catat('ubah', 'Booking', 'BK-0001', olehSistem: true));
        DB::transaction(fn () => LogAktivitas::catat('ubah', 'Booking', 'BK-0002', olehSistem: true));

        $this->actingAs($this->admin, 'admin')->post('/log-aktivitas/periksa')->assertSessionHas('success');
        $this->assertSame(2, Cache::get(LogAktivitasController::CACHE_PERIKSA)['diperiksa']);

        DB::transaction(fn () => LogAktivitas::catat('ubah', 'Booking', 'BK-0003', olehSistem: true));
        $this->post('/log-aktivitas/periksa')->assertSessionHas('success');
        $this->assertSame(1, Cache::get(LogAktivitasController::CACHE_PERIKSA)['diperiksa']);
    }

    // B4: password Manager bisa diganti dari server
    public function test_reset_password_manager_lewat_artisan(): void
    {
        Manager::create(['namaManager' => 'Jarwo', 'username' => 'manager1', 'password' => Hash::make('rahasia123')]);

        $this->artisan('manager:reset-password', ['username' => 'manager1'])
            ->expectsQuestion('Password baru', 'pendek')->expectsQuestion('Ulangi password baru', 'pendek')->assertFailed();
        $this->artisan('manager:reset-password', ['username' => 'manager1'])
            ->expectsQuestion('Password baru', 'barubaru1')->expectsQuestion('Ulangi password baru', 'barubaru1')->assertSuccessful();

        $this->assertTrue(Hash::check('barubaru1', DB::table('managers')->where('username', 'manager1')->value('password')));
        $this->assertDatabaseHas('log_aktivitas', ['aksi' => 'reset', 'kodeObjek' => 'manager1', 'peran' => 'sistem']);
        $this->artisan('manager:reset-password', ['username' => 'tidakada'])->assertFailed();
    }

    // 8.12: Admin tidak bisa mengubah password penyewa lewat Edit
    public function test_admin_tidak_bisa_mengubah_password_penyewa(): void
    {
        $id = DB::table('penyewas')->value('idPenyewa');
        $this->actingAs($this->admin, 'admin')->post('/updatepenyewa', [
            'txtid' => $id, 'txtnama' => 'Rina', 'txtnohp' => '081', 'txtemail' => 'rina@example.com', 'txtpassword' => 'diubahadmin',
        ])->assertRedirect();
        $this->assertTrue(Hash::check('rahasia123', DB::table('penyewas')->where('idPenyewa', $id)->value('password')));
    }
}
