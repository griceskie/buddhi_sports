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

/** Pembayaran bulan yang laporannya sudah diserahkan tidak bisa ditambah, diubah, atau dihapus (kecuali saat revisi). */
class KunciPembayaranLaporanTest extends TestCase
{
    use RefreshDatabase;

    private Admin $admin;

    private int $booking;

    private int $pembayaran;

    private int $laporan;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-11-03 10:00:00'));
        $this->admin = Admin::create(['namaAdmin' => 'Budi', 'username' => 'Admin1', 'password' => Hash::make('Admin123')]);
        $manager = Manager::create(['namaManager' => 'Juan', 'username' => 'Manager1', 'password' => Hash::make('Manager123')]);
        $penyewa = Penyewa::create(['namaPenyewa' => 'Rina', 'noHp' => '081', 'email' => 'rina@example.com', 'password' => Hash::make('rahasia123')]);
        $lapangan = DB::table('lapangans')->insertGetId(['namaLapangan' => 'Airlangga', 'jenisLapangan' => 'Bulu Tangkis', 'tarifPerJam' => 50000, 'status' => 'Tersedia'], 'idLapangan');
        $this->booking = DB::table('bookings')->insertGetId([
            'idPenyewa' => $penyewa->idPenyewa, 'idLapangan' => $lapangan, 'tanggal' => '2026-10-05',
            'jamMulai' => '18:00:00', 'jamSelesai' => '20:00:00', 'totalBayar' => 100000, 'status' => 'Dikonfirmasi',
        ], 'idBooking');
        $this->pembayaran = DB::table('pembayarans')->insertGetId(
            ['idBooking' => $this->booking, 'tglBayar' => '2026-10-05', 'jumlahBayar' => 100000, 'status' => 'Terverifikasi'], 'idPembayaran');
        $this->laporan = DB::table('laporan_pembayarans')->insertGetId([
            'idAdmin' => $this->admin->idAdmin, 'idManager' => $manager->idManager, 'tglLaporan' => '2026-11-01',
            'totalPemasukan' => 100000, 'bulan' => 10, 'tahun' => 2026,
            'namaLaporan' => 'Laporan Pembayaran Oktober 2026', 'filePdf' => 'laporan/laporan-pembayaran-2026-10.pdf',
        ], 'idLaporan');
    }

    private function ubah(array $timpa = [])
    {
        return $this->actingAs($this->admin, 'admin')->from('/tampilpembayaran')->post('/updatepembayaran', $timpa + [
            'txtid' => $this->pembayaran, 'txtbooking' => $this->booking, 'txttglbayar' => '2026-10-05',
            'txtjumlah' => 90000, 'txtstatus' => 'Terverifikasi',
        ]);
    }

    public function test_bulan_dengan_laporan_diserahkan_menolak_ubah_hapus_dan_tambah(): void
    {
        $this->ubah()->assertSessionHasErrors('txttglbayar');
        $this->assertDatabaseHas('pembayarans', ['idPembayaran' => $this->pembayaran, 'jumlahBayar' => 100000]);

        $this->actingAs($this->admin, 'admin')->from('/tampilpembayaran')->get("/deletepembayaran/{$this->pembayaran}")->assertSessionHas('error');
        $this->assertDatabaseHas('pembayarans', ['idPembayaran' => $this->pembayaran]);

        // booking lain dengan tanggal bayar di bulan terkunci
        $b = DB::table('bookings')->first();
        $lain = DB::table('bookings')->insertGetId([
            'idPenyewa' => $b->idPenyewa, 'idLapangan' => $b->idLapangan, 'tanggal' => '2026-10-07',
            'jamMulai' => '10:00:00', 'jamSelesai' => '11:00:00', 'totalBayar' => 50000, 'status' => 'Dipesan',
        ], 'idBooking');
        $this->actingAs($this->admin, 'admin')->from('/tampilpembayaran')->post('/insertpembayaran', [
            'txtbooking' => $lain, 'txttglbayar' => '2026-10-07', 'txtjumlah' => 50000, 'txtstatus' => 'Menunggu Verifikasi',
        ])->assertSessionHasErrors('txttglbayar');
        $this->assertDatabaseMissing('pembayarans', ['idBooking' => $lain]);
    }

    public function test_memindahkan_tanggal_bayar_ke_bulan_terkunci_juga_ditolak(): void
    {
        DB::table('pembayarans')->where('idPembayaran', $this->pembayaran)->update(['tglBayar' => '2026-11-02']);

        $this->ubah(['txttglbayar' => '2026-10-20'])->assertSessionHasErrors('txttglbayar');
        $this->assertDatabaseHas('pembayarans', ['idPembayaran' => $this->pembayaran, 'tglBayar' => '2026-11-02']);
    }

    public function test_kunci_terbuka_saat_manager_meminta_revisi(): void
    {
        DB::table('laporan_pembayarans')->where('idLaporan', $this->laporan)->update(['revisiPada' => '2026-11-02 09:00:00', 'catatanRevisi' => 'Cek jumlah.']);

        $this->ubah()->assertSessionHasNoErrors();
        $this->assertDatabaseHas('pembayarans', ['idPembayaran' => $this->pembayaran, 'jumlahBayar' => 90000]);
    }

    public function test_bulan_tanpa_laporan_tetap_bisa_diubah(): void
    {
        DB::table('laporan_pembayarans')->where('idLaporan', $this->laporan)->update(['filePdf' => null]);

        $this->ubah()->assertSessionHasNoErrors();
        $this->assertDatabaseHas('pembayarans', ['idPembayaran' => $this->pembayaran, 'jumlahBayar' => 90000]);
    }

    public function test_halaman_pembayaran_mengirim_status_terkunci(): void
    {
        $this->actingAs($this->admin, 'admin')->get('/tampilpembayaran?periode=2026-10')->assertInertia(fn (Assert $p) => $p->where('terkunci', true));
        $this->actingAs($this->admin, 'admin')->get('/tampilpembayaran?periode=2026-11')->assertInertia(fn (Assert $p) => $p->where('terkunci', false));
    }
}
