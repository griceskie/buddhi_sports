<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Manager;
use App\Models\Penyewa;
use App\Support\LogAktivitas;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\View;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Log aktivitas: tercatat bersama aksinya, tidak bisa diubah atau dihapus, dan rantai hashnya bisa diperiksa. */
class LogAktivitasTest extends TestCase
{
    use RefreshDatabase;

    private Admin $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-11-13 10:00:00'));
        $this->admin = Admin::create(['namaAdmin' => 'Budi Santoso', 'username' => 'Admin1', 'password' => Hash::make('Admin123')]);
    }

    private function tambahPenyewa(string $nama = 'Rina Wulan'): void
    {
        $this->actingAs($this->admin, 'admin')->post('/insertpenyewa', [
            'txtnama' => $nama, 'txtnohp' => '081234567890', 'txtemail' => strtolower(explode(' ', $nama)[0]).'@example.com', 'txtpassword' => 'rahasia123',
        ])->assertRedirect('/tampilpenyewa');
    }

    public function test_aksi_admin_tercatat_dengan_rincian_tersensor(): void
    {
        $this->tambahPenyewa();
        $id = DB::table('penyewas')->value('idPenyewa');
        $this->post('/updatepenyewa', ['txtid' => $id, 'txtnama' => 'Rina Wulan', 'txtnohp' => '081299998888', 'txtemail' => 'rina@example.com'])->assertRedirect();

        $log = DB::table('log_aktivitas')->orderBy('id')->get();
        $this->assertCount(2, $log);
        $this->assertSame('tambah', $log[0]->aksi);
        $this->assertSame('Budi Santoso', $log[0]->namaAdmin);
        $this->assertSame('Budi Santoso menambah penyewa Rina Wulan', $log[0]->ringkasan);
        // data pribadi disimpan tersensor, password tidak pernah
        $this->assertStringContainsString('0812 **** 7890', $log[0]->rincian);
        $this->assertStringContainsString('r***@example.com', $log[0]->rincian);
        $this->assertStringNotContainsString('rahasia123', $log[0]->rincian);
        // ubah hanya mencatat isian yang berubah
        $this->assertSame([['No HP', '0812 **** 7890', '0812 **** 8888']], json_decode($log[1]->rincian, true));
    }

    public function test_aksi_gagal_tidak_meninggalkan_log(): void
    {
        $this->tambahPenyewa();
        $id = DB::table('penyewas')->value('idPenyewa');
        $lap = DB::table('lapangans')->insertGetId(['namaLapangan' => 'Airlangga', 'jenisLapangan' => 'Bulu Tangkis', 'tarifPerJam' => 50000, 'status' => 'Tersedia'], 'idLapangan');
        DB::table('bookings')->insert(['idPenyewa' => $id, 'idLapangan' => $lap, 'tanggal' => '2026-11-20', 'jamMulai' => '10:00', 'jamSelesai' => '11:00', 'totalBayar' => 50000, 'status' => 'Dipesan']);

        // penyewa punya booking: hapus ditolak foreign key, transaksi dibatalkan, log tidak bertambah
        $this->get('/deletepenyewa/'.$id)->assertSessionHas('error');
        $this->assertSame(1, DB::table('log_aktivitas')->count());
        $this->assertSame(1, DB::table('penyewas')->count());
    }

    public function test_terima_dan_tolak_bukti_tercatat(): void
    {
        $p = Penyewa::create(['namaPenyewa' => 'Rina', 'noHp' => '081', 'email' => 'rina@example.com', 'password' => Hash::make('x')]);
        $lap = DB::table('lapangans')->insertGetId(['namaLapangan' => 'Airlangga', 'jenisLapangan' => 'Bulu Tangkis', 'tarifPerJam' => 50000, 'status' => 'Tersedia'], 'idLapangan');
        $bayar = function (string $jam) use ($p, $lap) {
            $b = DB::table('bookings')->insertGetId(['idPenyewa' => $p->idPenyewa, 'idLapangan' => $lap, 'tanggal' => '2026-11-20', 'jamMulai' => $jam, 'jamSelesai' => ((int) $jam + 1).':00', 'totalBayar' => 50000, 'status' => 'Dipesan'], 'idBooking');

            return DB::table('pembayarans')->insertGetId(['idBooking' => $b, 'tglBayar' => '2026-11-13', 'jumlahBayar' => 50000, 'buktiBayar' => 'bukti/a.jpg', 'status' => 'Menunggu Verifikasi'], 'idPembayaran');
        };
        $a = $bayar('10:00');
        $b = $bayar('12:00');

        $this->actingAs($this->admin, 'admin')->post("/verifikasi/$a/terima");
        $this->post("/verifikasi/$b/tolak", ['alasan' => 'Nominal kurang']);

        $this->assertSame(['terima', 'tolak'], DB::table('log_aktivitas')->orderBy('id')->pluck('aksi')->all());
        $this->assertStringContainsString('Nominal kurang', DB::table('log_aktivitas')->where('aksi', 'tolak')->value('rincian'));
    }

    public function test_pembatalan_otomatis_atas_nama_sistem(): void
    {
        $p = Penyewa::create(['namaPenyewa' => 'Rina', 'noHp' => '081', 'email' => 'rina@example.com', 'password' => Hash::make('x')]);
        $lap = DB::table('lapangans')->insertGetId(['namaLapangan' => 'Airlangga', 'jenisLapangan' => 'Bulu Tangkis', 'tarifPerJam' => 50000, 'status' => 'Tersedia'], 'idLapangan');
        DB::table('bookings')->insert(['idPenyewa' => $p->idPenyewa, 'idLapangan' => $lap, 'tanggal' => '2026-11-20', 'jamMulai' => '10:00', 'jamSelesai' => '11:00', 'totalBayar' => 50000, 'status' => 'Dipesan', 'created_at' => now()->subHours(3)]);

        $this->artisan('booking:batalkan-kedaluwarsa')->assertSuccessful();

        $this->assertSame('Sistem', DB::table('log_aktivitas')->value('namaAdmin'));
        $this->assertSame('otomatis', DB::table('log_aktivitas')->value('aksi'));
    }

    public function test_log_tidak_bisa_diubah_atau_dihapus_di_database(): void
    {
        $this->tambahPenyewa();

        try {
            DB::table('log_aktivitas')->update(['namaAdmin' => 'Orang lain']);
            $this->fail('UPDATE seharusnya ditolak trigger');
        } catch (QueryException $e) {
            $this->assertStringContainsString('hanya bisa ditambah', $e->getMessage());
        }
        try {
            DB::table('log_aktivitas')->delete();
            $this->fail('DELETE seharusnya ditolak trigger');
        } catch (QueryException $e) {
            $this->assertStringContainsString('hanya bisa ditambah', $e->getMessage());
        }
        $this->assertSame('Budi Santoso', DB::table('log_aktivitas')->value('namaAdmin'));
    }

    public function test_rantai_hash_utuh_dan_perubahan_langsung_terdeteksi(): void
    {
        $this->tambahPenyewa('Rina Wulan');
        $this->tambahPenyewa('Sari Dewi');
        $this->tambahPenyewa('Kevin Tan');

        $hasil = LogAktivitas::periksa();
        $this->assertTrue($hasil['utuh']);
        $this->assertSame(3, $hasil['diperiksa']);

        // orang dengan akses penuh ke database melepas trigger lalu mengubah satu baris
        DB::unprepared('DROP TRIGGER log_aktivitas_tolak_ubah');
        $kedua = DB::table('log_aktivitas')->orderBy('id')->skip(1)->value('id');
        DB::table('log_aktivitas')->where('id', $kedua)->update(['namaAdmin' => 'Orang lain']);

        $hasil = LogAktivitas::periksa();
        $this->assertFalse($hasil['utuh']);
        $this->assertSame($kedua, $hasil['rusakPada']);

        $this->actingAs($this->admin, 'admin')->post('/log-aktivitas/periksa')->assertSessionHas('error');
    }

    public function test_halaman_hanya_baca_dan_hanya_admin(): void
    {
        $this->tambahPenyewa();
        $this->get('/log-aktivitas?aksi=tambah')
            ->assertInertia(fn (Assert $page) => $page->component('Admin/LogAktivitas/TampilData')
                ->has('log.data', 1)
                ->where('log.data.0.rincian.0.0', 'Nama'));

        $manager = Manager::create(['namaManager' => 'Jarwo', 'username' => 'Manager1', 'password' => Hash::make('Manager123')]);
        auth('admin')->logout();
        $this->actingAs($manager, 'manager')->get('/log-aktivitas')->assertRedirect('/login-pengelola');
        // tidak ada rute ubah atau hapus
        $this->assertFalse(collect(app('router')->getRoutes())->contains(fn ($r) => str_contains($r->uri(), 'log-aktivitas') && array_intersect($r->methods(), ['PUT', 'PATCH', 'DELETE'])));
    }

    public function test_laporan_mencetak_jangkar_log_dan_tercatat(): void
    {
        Storage::fake('local');
        $this->tambahPenyewa();
        $jangkar = LogAktivitas::jangkar();
        $manager = Manager::create(['namaManager' => 'Jarwo', 'username' => 'Manager1', 'password' => Hash::make('Manager123')]);

        // tangkap data yang dikirim ke template PDF
        $dataPdf = null;
        View::composer('pdf.laporan-pembayaran', function ($view) use (&$dataPdf) {
            $dataPdf = $view->getData();
        });

        $this->actingAs($this->admin, 'admin')->post('/laporanpembayaran/buat', [
            'bulan' => 11, 'tahun' => 2026, 'tglLaporan' => '2026-11-13', 'idManager' => $manager->idManager,
            'tandaTangan' => trim(file_get_contents(base_path('tests/Fixtures/tanda-tangan.txt'))),
        ])->assertSessionHas('success');

        $this->assertSame($jangkar, $dataPdf['jangkarLog']);
        $this->assertSame('buat', DB::table('log_aktivitas')->orderByDesc('id')->value('aksi'));
    }

    public function test_tabel_dikosongkan_setelah_pernah_diperiksa_terdeteksi(): void
    {
        $this->tambahPenyewa();
        $this->artisan('log:periksa')->assertSuccessful();

        // akses penuh: lepas trigger lalu kosongkan tabel; rantai kosong sendiri terlihat "utuh"
        DB::unprepared('DROP TRIGGER log_aktivitas_tolak_hapus');
        DB::table('log_aktivitas')->delete();

        $this->artisan('log:periksa --penuh')->assertFailed();
        $this->actingAs($this->admin, 'admin')->post('/log-aktivitas/periksa')->assertSessionHas('error');
    }
}
