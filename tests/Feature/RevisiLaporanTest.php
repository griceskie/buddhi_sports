<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Manager;
use App\Models\Penyewa;
use App\Support\AnalitikLaporan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Alur "Minta revisi" Manager, notifikasi Admin, dan angka analitik halaman Laporan pembayaran. */
class RevisiLaporanTest extends TestCase
{
    use RefreshDatabase;

    private Admin $admin;

    private Manager $manager;

    private int $lapangan;

    private int $idLaporan;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-11-03 10:00:00'));
        Storage::fake('local');
        $this->admin = Admin::create(['namaAdmin' => 'Budi', 'username' => 'Admin1', 'password' => Hash::make('Admin123')]);
        $this->manager = Manager::create(['namaManager' => 'Juan', 'username' => 'Manager1', 'password' => Hash::make('Manager123')]);
        $penyewa = Penyewa::create(['namaPenyewa' => 'Rina', 'noHp' => '081', 'email' => 'rina@example.com', 'password' => Hash::make('rahasia123')]);
        $this->lapangan = DB::table('lapangans')->insertGetId(['namaLapangan' => 'Airlangga', 'jenisLapangan' => 'Bulu Tangkis', 'tarifPerJam' => 50000, 'status' => 'Tersedia'], 'idLapangan');

        $b = DB::table('bookings')->insertGetId([
            'idPenyewa' => $penyewa->idPenyewa, 'idLapangan' => $this->lapangan, 'tanggal' => '2026-10-05',
            'jamMulai' => '18:00:00', 'jamSelesai' => '20:00:00', 'totalBayar' => 100000, 'status' => 'Dikonfirmasi',
        ], 'idBooking');
        DB::table('pembayarans')->insert(['idBooking' => $b, 'tglBayar' => '2026-10-05', 'jumlahBayar' => 100000, 'buktiBayar' => 'bukti/x.jpg', 'status' => 'Terverifikasi']);
        DB::table('bookings')->insert([
            'idPenyewa' => $penyewa->idPenyewa, 'idLapangan' => $this->lapangan, 'tanggal' => '2026-10-06',
            'jamMulai' => '10:00:00', 'jamSelesai' => '11:00:00', 'totalBayar' => 50000, 'status' => 'Dibatalkan', 'dibatalkanPenyewa' => true,
        ]);

        $this->idLaporan = DB::table('laporan_pembayarans')->insertGetId([
            'idAdmin' => $this->admin->idAdmin, 'idManager' => $this->manager->idManager, 'tglLaporan' => '2026-11-01',
            'totalPemasukan' => 100000, 'bulan' => 10, 'tahun' => 2026,
            'namaLaporan' => 'Laporan Pembayaran Oktober 2026', 'filePdf' => 'laporan/laporan-pembayaran-2026-10.pdf',
        ], 'idLaporan');
    }

    private function revisi(string $catatan = 'Total belum cocok dengan rekening.')
    {
        return $this->actingAs($this->manager, 'manager')->post("/manager/laporan/{$this->idLaporan}/revisi", ['catatan' => $catatan]);
    }

    public function test_manager_meminta_revisi_dengan_catatan(): void
    {
        $this->revisi()->assertSessionHas('success');

        $l = DB::table('laporan_pembayarans')->first();
        $this->assertSame('Total belum cocok dengan rekening.', $l->catatanRevisi);
        $this->assertNotNull($l->revisiPada);
    }

    public function test_catatan_revisi_wajib(): void
    {
        $this->revisi('   ')->assertSessionHasErrors('catatan');
        $this->assertNull(DB::table('laporan_pembayarans')->value('revisiPada'));
    }

    public function test_laporan_yang_sudah_diperiksa_tidak_bisa_direvisi(): void
    {
        DB::table('laporan_pembayarans')->update(['diperiksaPada' => now()]);
        $this->revisi()->assertSessionHas('error');
        $this->assertNull(DB::table('laporan_pembayarans')->value('revisiPada'));
    }

    public function test_admin_tidak_bisa_meminta_revisi(): void
    {
        $this->actingAs($this->admin, 'admin')->post("/manager/laporan/{$this->idLaporan}/revisi", ['catatan' => 'x'])->assertRedirect();
        $this->assertNull(DB::table('laporan_pembayarans')->value('revisiPada'));
    }

    public function test_menandai_diperiksa_menghapus_permintaan_revisi(): void
    {
        $this->revisi();
        $this->actingAs($this->manager, 'manager')->post("/manager/laporan/{$this->idLaporan}/diperiksa");

        $l = DB::table('laporan_pembayarans')->first();
        $this->assertNotNull($l->diperiksaPada);
        $this->assertNull($l->catatanRevisi);
        $this->assertNull($l->revisiPada);
    }

    public function test_admin_dapat_notifikasi_revisi(): void
    {
        $this->revisi();

        $this->actingAs($this->admin, 'admin')->get('/dashboard-admin')->assertInertia(fn (Assert $p) => $p
            ->where('pengelola.notifikasi.daftar.0.judul', 'Laporan perlu revisi'));
    }

    public function test_halaman_laporan_mengirim_catatan_revisi_dan_analitik(): void
    {
        $this->revisi();

        $this->actingAs($this->admin, 'admin')->get('/tampillaporanpembayaran?periode=2026-10')->assertInertia(fn (Assert $p) => $p
            ->component('Master/LaporanPembayaran/TampilData')
            ->where('tinjauan.keadaan', 'revisi')
            ->where('tinjauan.laporan.catatanRevisi', 'Total belum cocok dengan rekening.')
            ->where('tinjauan.kini.pemasukan', 100000)
            ->where('tinjauan.kini.jamTerisi', 2)
            ->where('tinjauan.kini.funnel.batal.penyewa.n', 1)
            ->where('tinjauan.lalu.pemasukan', 0));
    }

    public function test_analitik_hitung_pemasukan_keterisian_dan_pembatalan(): void
    {
        $a = AnalitikLaporan::untuk(Carbon::parse('2026-10-01'));

        $this->assertSame(100000, $a['pemasukan']);
        $this->assertSame(2, $a['jamTerisi']);
        $this->assertSame(31 * 14, $a['kapasitas']);
        $this->assertSame(1, $a['funnel']['terkonfirmasi']['n']);
        $this->assertSame(['n' => 1, 'rp' => 50000], $a['funnel']['batal']['penyewa']);
        $this->assertSame(2, $a['funnel']['masuk']);
        // 5 Okt 2026 hari Senin: jam 18 dan 19 masing-masing terisi satu kali
        $this->assertSame(1, $a['peta']['isi'][0][18 - \App\Support\Pemesanan::JAM_BUKA]);
        $this->assertSame(1, $a['peta']['isi'][0][19 - \App\Support\Pemesanan::JAM_BUKA]);
    }
}
