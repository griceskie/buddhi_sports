<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Manager;
use App\Models\Penyewa;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ManagerTest extends TestCase
{
    use RefreshDatabase;

    private Manager $manager;

    private Admin $admin;

    private Penyewa $penyewa;

    private int $lapangan;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-24 10:00:00'));
        $this->manager = Manager::create(['namaManager' => 'Jarwo', 'username' => 'Manager1', 'password' => Hash::make('Manager123')]);
        $this->admin = Admin::create(['namaAdmin' => 'Budi', 'username' => 'Admin1', 'password' => Hash::make('Admin123')]);
        $this->penyewa = Penyewa::create(['namaPenyewa' => 'Rina', 'noHp' => '081', 'email' => 'rina@example.com', 'password' => Hash::make('rahasia123')]);
        $this->lapangan = DB::table('lapangans')->insertGetId(['namaLapangan' => 'Airlangga', 'jenisLapangan' => 'Bulu Tangkis', 'tarifPerJam' => 50000, 'status' => 'Tersedia'], 'idLapangan');
    }

    private function bayar(string $tgl, int $jumlah, string $status, string $statusBooking = 'Dikonfirmasi'): int
    {
        $b = DB::table('bookings')->insertGetId([
            'idPenyewa' => $this->penyewa->idPenyewa, 'idLapangan' => $this->lapangan, 'tanggal' => $tgl,
            'jamMulai' => '18:00:00', 'jamSelesai' => '20:00:00', 'totalBayar' => $jumlah, 'status' => $statusBooking,
        ], 'idBooking');

        return DB::table('pembayarans')->insertGetId(
            ['idBooking' => $b, 'tglBayar' => $tgl, 'jumlahBayar' => $jumlah, 'buktiBayar' => 'bukti/a.jpg', 'status' => $status],
            'idPembayaran'
        );
    }

    public function test_pemantauan_mencerminkan_dashboard_admin_tanpa_tindakan(): void
    {
        // jam sekarang 10.00; bukti dikirim kemarin 21.30 -> 30 menit kemarin + 120 menit pagi ini = 150 menit di jam operasional
        $id = $this->bayar('2026-10-24', 100000, 'Menunggu Verifikasi', 'Dipesan');
        DB::table('pembayarans')->where('idPembayaran', $id)->update(['dikirimPada' => '2026-10-23 21:30:00']);
        $this->bayar('2026-10-24', 50000, 'Terverifikasi');

        $this->actingAs($this->manager, 'manager')->get('/dashboard-manager')->assertInertia(fn (Assert $p) => $p
            ->component('Manager/Pemantauan')
            ->has('stat')->has('jadwalHariIni', 2)->has('tugas')
            ->has('antrean', 1)
            ->where('antrean.0.menitTunggu', 150)
            ->missing('terbaru')
            ->has('aktivitas')
            ->where('pengelola.role', 'manager'));
    }

    public function test_manager_melihat_pembayaran_dan_lapangan_tanpa_bisa_mengubah(): void
    {
        $id = $this->bayar('2026-10-05', 100000, 'Terverifikasi');

        $this->actingAs($this->manager, 'manager')->get('/manager/pembayaran?periode=2026-10')->assertInertia(fn (Assert $p) => $p
            ->component('Manager/Pembayaran')
            ->has('pembayaran', 1)
            ->where('pembayaran.0.namaPenyewa', 'Rina')
            ->where('pembayaran.0.buktiBayar', fn ($url) => str_ends_with($url, "/pembayaran/$id/bukti"))
            ->where('ringkasan.terverifikasi', ['jumlah' => 1, 'total' => 100000]));
        $this->actingAs($this->manager, 'manager')->get('/manager/lapangan')->assertInertia(fn (Assert $p) => $p->has('lapangan', 1));

        // halaman dan aksi data master tetap milik Admin
        foreach (['/tampilpembayaran', '/tampillapangan', '/dashboard-admin'] as $url) {
            $this->actingAs($this->manager, 'manager')->get($url)->assertRedirect('/login-pengelola');
        }
        $this->actingAs($this->manager, 'manager')->post("/verifikasi/$id/terima")->assertRedirect('/login-pengelola');
        $this->actingAs($this->manager, 'manager')->post('/updatelapangan', ['txtid' => $this->lapangan])->assertRedirect('/login-pengelola');
    }

    public function test_manager_menambah_reset_password_dan_menghapus_admin(): void
    {
        $this->actingAs($this->manager, 'manager')->from('/manager/admin')
            ->post('/manager/admin', ['nama' => 'Sari', 'username' => 'Admin2', 'password' => 'rahasia1'])
            ->assertRedirect('/manager/admin')->assertSessionHas('success');
        $sari = DB::table('admins')->where('username', 'Admin2')->first();
        $this->assertTrue(Hash::check('rahasia1', $sari->password));

        $this->actingAs($this->manager, 'manager')->from('/manager/admin')
            ->post('/manager/admin', ['nama' => 'Kembar', 'username' => 'Admin2', 'password' => 'rahasia1'])
            ->assertSessionHasErrors('username');

        $this->actingAs($this->manager, 'manager')->from('/manager/admin')
            ->put("/manager/admin/{$sari->idAdmin}/password", ['password' => 'baru123'])
            ->assertSessionHas('success');
        $this->assertTrue(Hash::check('baru123', DB::table('admins')->where('idAdmin', $sari->idAdmin)->value('password')));

        $this->actingAs($this->manager, 'manager')->from('/manager/admin')
            ->delete("/manager/admin/{$sari->idAdmin}")->assertSessionHas('success');
        $this->assertDatabaseMissing('admins', ['idAdmin' => $sari->idAdmin]);
    }

    public function test_admin_yang_masih_tercatat_tidak_bisa_dihapus(): void
    {
        $id = $this->bayar('2026-10-05', 100000, 'Terverifikasi');
        DB::table('pembayarans')->where('idPembayaran', $id)->update(['idAdmin' => $this->admin->idAdmin]);

        $this->actingAs($this->manager, 'manager')->from('/manager/admin')
            ->delete("/manager/admin/{$this->admin->idAdmin}")
            ->assertRedirect('/manager/admin')->assertSessionHas('error');
        $this->assertDatabaseHas('admins', ['idAdmin' => $this->admin->idAdmin]);
    }

    public function test_admin_tidak_bisa_membuka_halaman_manager(): void
    {
        foreach (['/dashboard-manager', '/manager/admin', '/manager/pembayaran'] as $url) {
            $this->actingAs($this->admin, 'admin')->get($url)->assertRedirect('/login-pengelola');
        }
        $this->actingAs($this->admin, 'admin')->post('/manager/admin', ['nama' => 'X', 'username' => 'X', 'password' => 'rahasia1'])
            ->assertRedirect('/login-pengelola');
        $this->assertDatabaseMissing('admins', ['username' => 'X']);
    }

    public function test_pdf_laporan_bisa_dibuka_atau_diunduh(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('laporan/x.pdf', '%PDF-isi');
        $id = DB::table('laporan_pembayarans')->insertGetId([
            'idAdmin' => $this->admin->idAdmin, 'idManager' => $this->manager->idManager, 'bulan' => 9, 'tahun' => 2026,
            'totalPemasukan' => 0, 'tglLaporan' => '2026-10-01', 'namaLaporan' => 'Laporan Pembayaran September 2026', 'filePdf' => 'laporan/x.pdf',
        ], 'idLaporan');

        $this->actingAs($this->manager, 'manager')->get("/laporanpembayaran/$id/pdf")
            ->assertOk()->assertHeader('content-disposition', 'inline; filename="Laporan Pembayaran September 2026.pdf"');
        $this->actingAs($this->manager, 'manager')->get("/laporanpembayaran/$id/pdf?unduh=1")
            ->assertOk()->assertDownload('Laporan Pembayaran September 2026.pdf');
    }

    public function test_halaman_lapangan_admin_dan_laporan_mengirim_ringkasan(): void
    {
        // September (bulan terakhir yang selesai) dan hari ini; hari ini 24 Okt 2026
        $this->bayar('2026-09-10', 100000, 'Terverifikasi');
        $this->bayar('2026-10-24', 100000, 'Terverifikasi');
        DB::table('pembayarans')->update(['idAdmin' => $this->admin->idAdmin]);
        $laporan = DB::table('laporan_pembayarans')->insertGetId(['idAdmin' => $this->admin->idAdmin, 'idManager' => $this->manager->idManager, 'bulan' => 9, 'tahun' => 2026,
            'totalPemasukan' => 100000, 'tglLaporan' => '2026-10-02', 'filePdf' => 'laporan/x.pdf'], 'idLaporan');

        $this->actingAs($this->manager, 'manager')->get('/manager/lapangan')->assertInertia(fn (Assert $p) => $p
            ->where('bulan', 'September')
            ->where('lapangan.0.pemasukan', 100000)
            ->where('lapangan.0.terisi', 0.5) // 2 jam dari 30 hari x 14 jam
            ->where('lapangan.0.hariIni', ['booking' => 1, 'jam' => 2]));
        $this->get('/manager/admin')->assertInertia(fn (Assert $p) => $p
            ->where('admin.0.pembayaran', 2)->where('admin.0.laporan', 1)->missing('admin.0.password'));
        $this->get('/manager/laporan')->assertInertia(fn (Assert $p) => $p->where('menunggu', $laporan));
    }
}
