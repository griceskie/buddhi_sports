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

class LaporanPembayaranTest extends TestCase
{
    use RefreshDatabase;

    private Admin $admin;

    private Manager $manager;

    private Penyewa $penyewa;

    private int $lapangan;

    private string $ttd;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-31 10:00:00'));
        Storage::fake('local');
        $this->ttd = trim(file_get_contents(base_path('tests/Fixtures/tanda-tangan.txt')));
        $this->admin = Admin::create(['namaAdmin' => 'Budi', 'username' => 'Admin1', 'password' => Hash::make('Admin123')]);
        $this->manager = Manager::create(['namaManager' => 'Juan', 'username' => 'Manager1', 'password' => Hash::make('Manager123')]);
        $this->penyewa = Penyewa::create(['namaPenyewa' => 'Rina', 'noHp' => '081', 'email' => 'rina@example.com', 'password' => Hash::make('rahasia123')]);
        $this->lapangan = DB::table('lapangans')->insertGetId(['namaLapangan' => 'Airlangga', 'jenisLapangan' => 'Bulu Tangkis', 'tarifPerJam' => 50000, 'status' => 'Tersedia'], 'idLapangan');

        $this->pembayaran('2026-10-05', 100000, 'Terverifikasi');
        $this->pembayaran('2026-10-20', 50000, 'Terverifikasi');
        $this->pembayaran('2026-10-21', 50000, 'Menunggu Verifikasi');
        $this->pembayaran('2026-09-30', 70000, 'Terverifikasi');
    }

    private function pembayaran(string $tgl, int $jumlah, string $status): void
    {
        $b = DB::table('bookings')->insertGetId([
            'idPenyewa' => $this->penyewa->idPenyewa, 'idLapangan' => $this->lapangan, 'tanggal' => $tgl,
            'jamMulai' => '18:00:00', 'jamSelesai' => '20:00:00', 'totalBayar' => $jumlah,
            'status' => $status === 'Terverifikasi' ? 'Dikonfirmasi' : 'Dipesan',
        ], 'idBooking');
        DB::table('pembayarans')->insert(['idBooking' => $b, 'tglBayar' => $tgl, 'jumlahBayar' => $jumlah, 'buktiBayar' => 'bukti/x.jpg', 'status' => $status]);
    }

    private function buat(array $ubah = [])
    {
        return $this->actingAs($this->admin, 'admin')->from('/tampilpembayaran?periode=2026-10')->post('/laporanpembayaran/buat', array_merge([
            'bulan' => 10, 'tahun' => 2026, 'tglLaporan' => '2026-10-31',
            'idManager' => $this->manager->idManager, 'tandaTangan' => $this->ttd,
        ], $ubah));
    }

    public function test_halaman_pembayaran_menampilkan_ringkasan_periode(): void
    {
        $this->actingAs($this->admin, 'admin')->get('/tampilpembayaran?periode=2026-10')->assertInertia(fn (Assert $p) => $p
            ->component('Master/Pembayaran/TampilData')
            ->has('datapembayaran', 3)
            ->where('periode', ['bulan' => 10, 'tahun' => 2026])
            ->where('namaLaporan', 'Laporan Pembayaran Oktober 2026')
            ->where('ringkasan', [
                'terverifikasi' => ['jumlah' => 2, 'total' => 150000],
                'menunggu' => ['jumlah' => 1, 'total' => 50000],
                'ditolak' => ['jumlah' => 0, 'total' => 0],
            ])
            ->where('laporan', null)
            ->has('datamanager', 1));

        $this->actingAs($this->admin, 'admin')->get('/tampilpembayaran?periode=2026-13')
            ->assertInertia(fn (Assert $p) => $p->where('periode', ['bulan' => 10, 'tahun' => 2026]));
    }

    public function test_buat_laporan_menyimpan_pdf_dan_catatan(): void
    {
        $this->buat()->assertRedirect('/tampilpembayaran?periode=2026-10')
            ->assertSessionHas('success', 'Laporan Pembayaran Oktober 2026 berhasil dibuat dan tersimpan di Laporan Pembayaran.');

        $l = DB::table('laporan_pembayarans')->first();
        $this->assertSame('Laporan Pembayaran Oktober 2026', $l->namaLaporan);
        $this->assertSame(150000, (int) $l->totalPemasukan);
        $this->assertSame([10, 2026], [(int) $l->bulan, (int) $l->tahun]);
        $this->assertSame($this->admin->idAdmin, (int) $l->idAdmin);
        $this->assertSame($this->manager->idManager, (int) $l->idManager);
        $this->assertSame('laporan/laporan-pembayaran-2026-10.pdf', $l->filePdf);
        Storage::disk('local')->assertExists($l->filePdf);
        $pdf = Storage::disk('local')->get($l->filePdf);
        $this->assertStringStartsWith('%PDF', $pdf);
        $this->assertGreaterThan(2000, strlen($pdf));
    }

    public function test_buat_ulang_menimpa_laporan_periode_yang_sama(): void
    {
        $this->buat();
        $this->pembayaran('2026-10-25', 30000, 'Terverifikasi');
        $this->buat(['tglLaporan' => '2026-10-30']);

        $this->assertSame(1, DB::table('laporan_pembayarans')->count());
        $l = DB::table('laporan_pembayarans')->first();
        $this->assertSame(180000, (int) $l->totalPemasukan);
        $this->assertSame('2026-10-30', $l->tglLaporan);
    }

    public function test_tanda_tangan_wajib_dan_harus_jpeg(): void
    {
        $this->buat(['tandaTangan' => ''])->assertSessionHasErrors(['tandaTangan' => 'Tanda tangan wajib diisi.']);
        $this->buat(['tandaTangan' => 'data:image/jpeg;base64,'.base64_encode('<script>bukan gambar</script>')])
            ->assertSessionHasErrors(['tandaTangan' => 'Tanda tangan tidak valid.']);
        $this->buat(['tandaTangan' => 'data:image/png;base64,iVBORw0KGgo='])->assertSessionHasErrors('tandaTangan');
        $this->buat(['idManager' => 999])->assertSessionHasErrors('idManager');
        $this->assertSame(0, DB::table('laporan_pembayarans')->count());
    }

    public function test_pdf_bisa_dibuka_admin_dan_manager_saja(): void
    {
        $this->buat();
        $id = DB::table('laporan_pembayarans')->value('idLaporan');

        $this->actingAs($this->admin, 'admin')->get("/laporanpembayaran/$id/pdf")
            ->assertOk()->assertHeader('content-type', 'application/pdf');
        $this->actingAs($this->manager, 'manager')->get("/laporanpembayaran/$id/pdf")->assertOk();
        $this->actingAs($this->admin, 'admin')->get('/laporanpembayaran/999/pdf')->assertNotFound();
    }

    public function test_penyewa_dan_tamu_tidak_bisa_membuka_pdf(): void
    {
        Storage::disk('local')->put('laporan/rahasia.pdf', '%PDF-1.4');
        $id = DB::table('laporan_pembayarans')->insertGetId([
            'idAdmin' => $this->admin->idAdmin, 'idManager' => $this->manager->idManager, 'bulan' => 10, 'tahun' => 2026,
            'totalPemasukan' => 0, 'tglLaporan' => '2026-10-31', 'namaLaporan' => 'X', 'filePdf' => 'laporan/rahasia.pdf',
        ], 'idLaporan');

        $this->get("/laporanpembayaran/$id/pdf")->assertRedirect('/login-pengelola');
        $this->actingAs($this->penyewa)->get("/laporanpembayaran/$id/pdf")->assertRedirect('/login-pengelola');
    }

    public function test_hapus_laporan_ikut_menghapus_pdf(): void
    {
        $this->buat();
        $l = DB::table('laporan_pembayarans')->first();

        $this->actingAs($this->admin, 'admin')->get("/deletelaporanpembayaran/{$l->idLaporan}");
        $this->assertSame(0, DB::table('laporan_pembayarans')->count());
        Storage::disk('local')->assertMissing($l->filePdf);
    }

    public function test_admin_tidak_bisa_mengelola_data_admin_dan_manager(): void
    {
        foreach (['/tampiladmin', '/formadmin', '/tampilmanager', '/formmanager', "/deleteadmin/{$this->admin->idAdmin}", "/deletemanager/{$this->manager->idManager}"] as $url) {
            $this->actingAs($this->admin, 'admin')->get($url)->assertNotFound();
        }
        $this->actingAs($this->admin, 'admin')->post('/insertadmin', ['txtnama' => 'X', 'txtusername' => 'x', 'txtpassword' => '123456'])->assertNotFound();
        $this->assertSame(1, DB::table('admins')->count());
        $this->assertSame(1, DB::table('managers')->count());
    }
}
