<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Penyewa;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Kasus uji G01-G08 di blackbox-testing.md (Data master Admin).
 */
class BlackboxMasterDataTest extends TestCase
{
    use RefreshDatabase;

    private Admin $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = Admin::create(['namaAdmin' => 'Admin Satu', 'username' => 'admin1', 'password' => Hash::make('rahasia123')]);
    }

    private function sbg(): \Illuminate\Testing\TestResponse|static
    {
        $this->actingAs($this->admin, 'admin');

        return $this;
    }

    private function buatLapangan(string $status = 'Tersedia'): int
    {
        return DB::table('lapangans')->insertGetId([
            'namaLapangan' => 'Lapangan 1', 'jenisLapangan' => 'Badminton', 'tarifPerJam' => 50000, 'status' => $status,
        ], 'idLapangan');
    }

    private function buatPenyewa(string $email): int
    {
        return Penyewa::create(['namaPenyewa' => 'Rina', 'noHp' => '081', 'email' => $email, 'password' => Hash::make('rahasia123')])->idPenyewa;
    }

    private function buatBooking(int $idPenyewa, int $idLapangan, string $tanggal, string $mulai, string $selesai, string $status = 'Dipesan'): int
    {
        return DB::table('bookings')->insertGetId([
            'idPenyewa' => $idPenyewa, 'idLapangan' => $idLapangan, 'idAdmin' => $this->admin->idAdmin,
            'tanggal' => $tanggal, 'jamMulai' => $mulai, 'jamSelesai' => $selesai,
            'totalBayar' => 50000, 'status' => $status, 'created_at' => now(),
        ], 'idBooking');
    }

    // G01: Lapangan dengan tarif negatif / huruf -> ditolak.
    public function test_g01_tarif_negatif_ditolak(): void
    {
        $this->sbg();
        $this->post('/insertlapangan', [
            'txtnama' => 'Lapangan X', 'txtjenis' => 'Badminton', 'txttarif' => -5000, 'txtstatus' => 'Tersedia',
        ])->assertSessionHasErrors('txttarif');
        $this->assertDatabaseMissing('lapangans', ['namaLapangan' => 'Lapangan X']);
    }

    public function test_g01_tarif_huruf_ditolak(): void
    {
        $this->sbg();
        $this->post('/insertlapangan', [
            'txtnama' => 'Lapangan X', 'txtjenis' => 'Badminton', 'txttarif' => 'abc', 'txtstatus' => 'Tersedia',
        ])->assertSessionHasErrors('txttarif');
        $this->assertDatabaseMissing('lapangans', ['namaLapangan' => 'Lapangan X']);
    }

    // G02: status lapangan selain Tersedia/Perbaikan -> ditolak.
    public function test_g02_status_tidak_valid_ditolak(): void
    {
        $this->sbg();
        $this->post('/insertlapangan', [
            'txtnama' => 'Lapangan X', 'txtjenis' => 'Badminton', 'txttarif' => 50000, 'txtstatus' => 'Kosong',
        ])->assertSessionHasErrors('txtstatus');
        $this->assertDatabaseMissing('lapangans', ['namaLapangan' => 'Lapangan X']);
    }

    // G03: email Penyewa duplikat -> ditolak.
    public function test_g03_email_penyewa_duplikat_ditolak(): void
    {
        $this->buatPenyewa('ada@example.com');
        $this->sbg();

        $this->post('/insertpenyewa', [
            'txtnama' => 'Budi', 'txtnohp' => '0812', 'txtemail' => 'ada@example.com', 'txtpassword' => 'rahasia123',
        ])->assertSessionHasErrors('txtemail');
        $this->assertSame(1, DB::table('penyewas')->where('email', 'ada@example.com')->count());
    }

    // G04: booking yang bentrok dengan jadwal lain -> error di field txtlapangan.
    public function test_g04_booking_bentrok_ditolak(): void
    {
        $idPenyewa = $this->buatPenyewa('a@example.com');
        $idLapangan = $this->buatLapangan();
        $tanggal = today()->addDays(3)->toDateString();
        $this->buatBooking($idPenyewa, $idLapangan, $tanggal, '10:00:00', '11:00:00', 'Dipesan');

        $this->sbg()->post('/insertbooking', [
            'txtpenyewa' => $idPenyewa, 'txtlapangan' => $idLapangan, 'txtadmin' => $this->admin->idAdmin,
            'txttanggal' => $tanggal, 'txtjammulai' => '10:00', 'txtjamselesai' => '11:00',
            'txttotal' => 50000, 'txtstatus' => 'Dipesan',
        ])->assertSessionHasErrors('txtlapangan');
    }

    // G05: jam selesai lebih awal dari jam mulai -> seharusnya ditolak.
    public function test_g05_jam_selesai_lebih_awal_dari_jam_mulai(): void
    {
        $idPenyewa = $this->buatPenyewa('a@example.com');
        $idLapangan = $this->buatLapangan();

        $response = $this->sbg()->post('/insertbooking', [
            'txtpenyewa' => $idPenyewa, 'txtlapangan' => $idLapangan, 'txtadmin' => $this->admin->idAdmin,
            'txttanggal' => today()->addDays(3)->toDateString(), 'txtjammulai' => '15:00', 'txtjamselesai' => '10:00',
            'txttotal' => 50000, 'txtstatus' => 'Dipesan',
        ]);

        $response->assertSessionHasErrors('txtjamselesai');
        $this->assertDatabaseMissing('bookings', ['idPenyewa' => $idPenyewa]);
    }

    // G06: pembayaran dibuat dua kali untuk booking yang sama -> error di field.
    public function test_g06_pembayaran_dobel_untuk_booking_sama(): void
    {
        $idPenyewa = $this->buatPenyewa('a@example.com');
        $idLapangan = $this->buatLapangan();
        $idBooking = $this->buatBooking($idPenyewa, $idLapangan, today()->toDateString(), '10:00:00', '11:00:00');
        DB::table('pembayarans')->insert([
            'idBooking' => $idBooking, 'tglBayar' => today()->toDateString(), 'jumlahBayar' => 50000, 'status' => 'Menunggu Verifikasi',
        ]);

        $this->sbg()->post('/insertpembayaran', [
            'txtbooking' => $idBooking, 'txttglbayar' => today()->toDateString(),
            'txtjumlah' => 50000, 'txtstatus' => 'Menunggu Verifikasi',
        ])->assertSessionHasErrors('txtbooking');
        $this->assertSame(1, DB::table('pembayarans')->where('idBooking', $idBooking)->count());
    }

    // G07: edit pembayaran menjadi Ditolak tanpa alasan -> ditolak.
    public function test_g07_edit_pembayaran_ditolak_tanpa_alasan(): void
    {
        $idPenyewa = $this->buatPenyewa('a@example.com');
        $idLapangan = $this->buatLapangan();
        $idBooking = $this->buatBooking($idPenyewa, $idLapangan, today()->toDateString(), '10:00:00', '11:00:00');
        $idPembayaran = DB::table('pembayarans')->insertGetId([
            'idBooking' => $idBooking, 'tglBayar' => today()->toDateString(), 'jumlahBayar' => 50000, 'status' => 'Menunggu Verifikasi',
        ], 'idPembayaran');

        $this->sbg()->post('/updatepembayaran', [
            'txtid' => $idPembayaran, 'txtbooking' => $idBooking, 'txttglbayar' => today()->toDateString(),
            'txtjumlah' => 50000, 'txtstatus' => 'Ditolak',
        ])->assertSessionHasErrors('txtalasan');

        $this->assertDatabaseHas('pembayarans', ['idPembayaran' => $idPembayaran, 'status' => 'Menunggu Verifikasi']);
    }

    // G08: halaman Pembayaran mengganti ?periode -> ringkasan dan tabel sesuai bulan itu.
    public function test_g08_ganti_periode_pembayaran(): void
    {
        $idPenyewa = $this->buatPenyewa('a@example.com');
        $idLapangan = $this->buatLapangan();

        $idBookingJan = $this->buatBooking($idPenyewa, $idLapangan, '2026-01-10', '10:00:00', '11:00:00');
        DB::table('pembayarans')->insert([
            'idBooking' => $idBookingJan, 'tglBayar' => '2026-01-15', 'jumlahBayar' => 70000, 'status' => 'Terverifikasi',
        ]);
        $idBookingFeb = $this->buatBooking($idPenyewa, $idLapangan, '2026-02-10', '10:00:00', '11:00:00');
        DB::table('pembayarans')->insert([
            'idBooking' => $idBookingFeb, 'tglBayar' => '2026-02-15', 'jumlahBayar' => 90000, 'status' => 'Terverifikasi',
        ]);

        $this->sbg()->get('/tampilpembayaran?periode=2026-01')->assertInertia(fn (Assert $p) => $p
            ->component('Master/Pembayaran/TampilData')
            ->has('datapembayaran', 1)
            ->where('datapembayaran.0.jumlahBayar', 70000)
            ->where('ringkasan.terverifikasi.total', 70000));

        $this->sbg()->get('/tampilpembayaran?periode=2026-02')->assertInertia(fn (Assert $p) => $p
            ->component('Master/Pembayaran/TampilData')
            ->has('datapembayaran', 1)
            ->where('datapembayaran.0.jumlahBayar', 90000)
            ->where('ringkasan.terverifikasi.total', 90000));
    }
}
