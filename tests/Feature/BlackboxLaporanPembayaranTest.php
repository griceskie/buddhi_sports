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

/**
 * Kasus uji H01-H04 di blackbox-testing.md (Laporan Pembayaran / PDF).
 */
class BlackboxLaporanPembayaranTest extends TestCase
{
    use RefreshDatabase;

    private Admin $admin;

    private Manager $manager;

    private int $lapangan;

    private string $ttd;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(\Illuminate\Support\Carbon::parse('2026-05-31 10:00:00'));
        Storage::fake('local');
        $this->ttd = trim(file_get_contents(base_path('tests/Fixtures/tanda-tangan.txt')));
        $this->admin = Admin::create(['namaAdmin' => 'Budi', 'username' => 'admin1', 'password' => Hash::make('rahasia123')]);
        $this->manager = Manager::create(['namaManager' => 'Juan', 'username' => 'manager1', 'password' => Hash::make('rahasia123')]);
        $this->lapangan = DB::table('lapangans')->insertGetId([
            'namaLapangan' => 'Lapangan 1', 'jenisLapangan' => 'Badminton', 'tarifPerJam' => 50000, 'status' => 'Tersedia',
        ], 'idLapangan');
    }

    private function buatPembayaran(string $tgl, int $jumlah): void
    {
        $penyewa = Penyewa::create(['namaPenyewa' => 'Rina', 'noHp' => '081', 'email' => uniqid().'@example.com', 'password' => Hash::make('rahasia123')]);
        $b = DB::table('bookings')->insertGetId([
            'idPenyewa' => $penyewa->idPenyewa, 'idLapangan' => $this->lapangan, 'tanggal' => $tgl,
            'jamMulai' => '18:00:00', 'jamSelesai' => '20:00:00', 'totalBayar' => $jumlah, 'status' => 'Dikonfirmasi',
        ], 'idBooking');
        DB::table('pembayarans')->insert(['idBooking' => $b, 'tglBayar' => $tgl, 'jumlahBayar' => $jumlah, 'buktiBayar' => 'bukti/x.jpg', 'status' => 'Terverifikasi']);
    }

    private function buat(array $ubah = [])
    {
        return $this->actingAs($this->admin, 'admin')->post('/laporanpembayaran/buat', array_merge([
            'bulan' => 5, 'tahun' => 2026, 'tglLaporan' => '2026-05-31',
            'idManager' => $this->manager->idManager, 'tandaTangan' => $this->ttd,
        ], $ubah));
    }

    // H01: buat laporan dengan tanggal, Manager, dan tanda tangan -> PDF dibuat, satu baris per bulan.
    public function test_h01_buat_laporan_valid(): void
    {
        $this->buatPembayaran('2026-05-10', 100000);
        $this->buatPembayaran('2026-05-20', 50000);

        $this->buat()->assertSessionHas('success');

        $this->assertSame(1, DB::table('laporan_pembayarans')->where('bulan', 5)->where('tahun', 2026)->count());
        $laporan = DB::table('laporan_pembayarans')->first();
        $this->assertSame(150000, (int) $laporan->totalPemasukan);
        Storage::disk('local')->assertExists($laporan->filePdf);
        $pdf = Storage::disk('local')->get($laporan->filePdf);
        $this->assertStringStartsWith('%PDF', $pdf);
    }

    // H02: tanpa tanda tangan / tanpa Manager -> ditolak.
    public function test_h02_tanpa_tanda_tangan_ditolak(): void
    {
        $this->buat(['tandaTangan' => ''])->assertSessionHasErrors('tandaTangan');
        $this->assertSame(0, DB::table('laporan_pembayarans')->count());
    }

    public function test_h02_tanpa_manager_ditolak(): void
    {
        $this->buat(['idManager' => ''])->assertSessionHasErrors('idManager');
        $this->assertSame(0, DB::table('laporan_pembayarans')->count());
    }

    // H03: buat ulang laporan untuk bulan yang sama -> baris lama diperbarui, tidak dobel.
    public function test_h03_buat_ulang_bulan_sama_tidak_dobel(): void
    {
        $this->buatPembayaran('2026-05-10', 100000);
        $this->buat();

        $this->buatPembayaran('2026-05-25', 30000);
        $this->buat(['tglLaporan' => '2026-06-01']);

        $this->assertSame(1, DB::table('laporan_pembayarans')->where('bulan', 5)->where('tahun', 2026)->count());
        $laporan = DB::table('laporan_pembayarans')->first();
        $this->assertSame(130000, (int) $laporan->totalPemasukan);
        $this->assertSame('2026-06-01', $laporan->tglLaporan);
    }

    // H04: buka dan unduh PDF -> isi dan total sesuai.
    public function test_h04_buka_dan_unduh_pdf_isi_sesuai(): void
    {
        $this->buatPembayaran('2026-05-10', 100000);
        $this->buatPembayaran('2026-05-20', 50000);
        $this->buat();
        $id = DB::table('laporan_pembayarans')->value('idLaporan');

        // dibuka di tab browser.
        $this->actingAs($this->admin, 'admin')->get("/laporanpembayaran/{$id}/pdf")
            ->assertOk()->assertHeader('content-type', 'application/pdf');

        // diunduh sebagai file.
        $this->actingAs($this->admin, 'admin')->get("/laporanpembayaran/{$id}/pdf?unduh=1")
            ->assertOk()->assertHeader('content-disposition');

        $this->assertSame(150000, (int) DB::table('laporan_pembayarans')->value('totalPemasukan'));
    }

    // H04: kolom nominal rata kanan (diperiksa di berkas Blade yang merender PDF, bukan secara visual).
    public function test_h04_kolom_nominal_rata_kanan(): void
    {
        $blade = file_get_contents(resource_path('views/pdf/laporan-pembayaran.blade.php'));
        $this->assertStringContainsString('.r { text-align: right', $blade);
        $this->assertStringContainsString('<th class="r">Jumlah</th>', $blade);
    }
}
