<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Penyewa;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Tambah/Edit data master kini lewat sheet di halaman TampilData, bukan halaman form terpisah. */
class MasterDataSheetTest extends TestCase
{
    use RefreshDatabase;

    private Admin $admin;

    private int $booking;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = Admin::create(['namaAdmin' => 'Budi', 'username' => 'Admin1', 'password' => Hash::make('Admin123')]);
        $penyewa = Penyewa::create(['namaPenyewa' => 'Rina', 'noHp' => '081', 'email' => 'rina@example.com', 'password' => Hash::make('rahasia123')]);
        $lapangan = DB::table('lapangans')->insertGetId(['namaLapangan' => 'Airlangga', 'jenisLapangan' => 'Bulu Tangkis', 'tarifPerJam' => 50000, 'status' => 'Tersedia'], 'idLapangan');
        $this->booking = DB::table('bookings')->insertGetId([
            'idPenyewa' => $penyewa->idPenyewa, 'idLapangan' => $lapangan, 'tanggal' => '2026-10-24',
            'jamMulai' => '18:00:00', 'jamSelesai' => '20:00:00', 'totalBayar' => 100000, 'status' => 'Dikonfirmasi',
        ], 'idBooking');
    }

    public function test_halaman_tampil_mengirim_pilihan_untuk_form_sheet(): void
    {
        $this->actingAs($this->admin, 'admin')->get('/tampilbooking')->assertInertia(fn (Assert $p) => $p
            ->has('datapenyewa', 1)->has('datalapangan', 1)->has('dataadmin', 1));
        $this->actingAs($this->admin, 'admin')->get('/tampilpembayaran')->assertInertia(fn (Assert $p) => $p
            ->has('databooking', 1)->has('dataadmin', 1));
        $this->actingAs($this->admin, 'admin')->get('/tampillaporanpembayaran')->assertInertia(fn (Assert $p) => $p
            ->has('dataadmin', 1)->has('datamanager', 0)->has('datapembayaran', 0));
    }

    public function test_halaman_form_lama_sudah_tidak_ada(): void
    {
        foreach (['/formpenyewa', '/editpenyewa/1', '/formlapangan', '/formbooking', "/editbooking/{$this->booking}", '/formpembayaran', '/formlaporanpembayaran'] as $url) {
            $this->actingAs($this->admin, 'admin')->get($url)->assertNotFound();
        }
    }

    public function test_kesalahan_kembali_ke_halaman_tampil_sebagai_error_field(): void
    {
        DB::table('pembayarans')->insert(['idBooking' => $this->booking, 'tglBayar' => '2026-10-23', 'jumlahBayar' => 100000, 'status' => 'Terverifikasi']);

        $this->actingAs($this->admin, 'admin')->from('/tampilpembayaran?periode=2026-10')->post('/insertpembayaran', [
            'txtbooking' => $this->booking, 'txttglbayar' => '2026-10-23', 'txtjumlah' => 100000, 'txtstatus' => 'Terverifikasi',
        ])->assertRedirect('/tampilpembayaran?periode=2026-10')->assertSessionHasErrors('txtbooking');

        $b = DB::table('bookings')->first();
        $this->actingAs($this->admin, 'admin')->from('/tampilbooking')->post('/insertbooking', [
            'txtpenyewa' => $b->idPenyewa, 'txtlapangan' => $b->idLapangan, 'txttanggal' => '2026-10-24',
            'txtadmin' => $this->admin->idAdmin, 'txtjammulai' => '19:00', 'txtjamselesai' => '21:00', 'txttotal' => 100000, 'txtstatus' => 'Dikonfirmasi',
        ])->assertRedirect('/tampilbooking')->assertSessionHasErrors('txtlapangan');
    }

    public function test_simpan_pembayaran_kembali_ke_periode_yang_dibuka(): void
    {
        $this->actingAs($this->admin, 'admin')->from('/tampilpembayaran?periode=2026-10')->post('/insertpembayaran', [
            'txtbooking' => $this->booking, 'txttglbayar' => '2026-10-23', 'txtjumlah' => 100000, 'txtstatus' => 'Terverifikasi',
        ])->assertRedirect('/tampilpembayaran?periode=2026-10')->assertSessionHasNoErrors();

        $this->assertDatabaseHas('pembayarans', ['idBooking' => $this->booking, 'jumlahBayar' => 100000]);
    }

    public function test_status_ditolak_lewat_form_wajib_ada_alasan(): void
    {
        $data = ['txtbooking' => $this->booking, 'txttglbayar' => '2026-10-23', 'txtjumlah' => 100000, 'txtstatus' => 'Ditolak'];

        $this->actingAs($this->admin, 'admin')->from('/tampilpembayaran')->post('/insertpembayaran', $data)
            ->assertSessionHasErrors('txtalasan');
        $this->assertDatabaseCount('pembayarans', 0);

        $this->actingAs($this->admin, 'admin')->from('/tampilpembayaran')->post('/insertpembayaran', $data + ['txtalasan' => 'Foto buram'])
            ->assertSessionHasNoErrors();
        $this->assertDatabaseHas('pembayarans', ['idBooking' => $this->booking, 'status' => 'Ditolak', 'alasanTolak' => 'Foto buram']);
    }

    public function test_pesan_validasi_berbahasa_indonesia_dengan_nama_kolom_yang_ramah(): void
    {
        $this->actingAs($this->admin, 'admin')->from('/tampilbooking')->post('/insertbooking', ['txtstatus' => 'Dipesan'])
            ->assertSessionHasErrors([
                'txtpenyewa' => 'Penyewa wajib diisi.',
                'txtadmin' => 'Admin wajib diisi.',
                'txtlapangan' => 'Lapangan wajib diisi.',
                'txtjammulai' => 'Jam mulai wajib diisi.',
                'txttotal' => 'Total bayar wajib diisi.',
            ]);

        $this->actingAs($this->admin, 'admin')->from('/tampilbooking')->post('/insertbooking', ['txttotal' => 'abc'])
            ->assertSessionHasErrors(['txttotal' => 'Total bayar harus berupa bilangan bulat.']);
    }

    public function test_jam_booking_harus_bulat_dalam_jam_operasional_dan_selesai_setelah_mulai(): void
    {
        $b = DB::table('bookings')->first();
        $kirim = fn (string $mulai, string $selesai) => $this->actingAs($this->admin, 'admin')->from('/tampilbooking')->post('/insertbooking', [
            'txtpenyewa' => $b->idPenyewa, 'txtlapangan' => $b->idLapangan, 'txtadmin' => $this->admin->idAdmin, 'txttanggal' => '2026-10-30',
            'txtjammulai' => $mulai, 'txtjamselesai' => $selesai, 'txttotal' => 50000, 'txtstatus' => 'Dipesan',
        ]);

        $kirim('08:00', '08:00')->assertSessionHasErrors(['txtjamselesai' => 'Jam selesai harus setelah jam mulai.']);
        $kirim('12:00', '11:00')->assertSessionHasErrors(['txtjamselesai' => 'Jam selesai harus setelah jam mulai.']);
        $kirim('08:30', '09:30')->assertSessionHasErrors(['txtjammulai', 'txtjamselesai']);
        $kirim('07:00', '08:00')->assertSessionHasErrors('txtjammulai');
        $kirim('21:00', '23:00')->assertSessionHasErrors('txtjamselesai');
        $this->assertDatabaseCount('bookings', 1);

        $kirim('08:00', '09:00')->assertSessionHasNoErrors();
        $this->assertDatabaseHas('bookings', ['tanggal' => '2026-10-30', 'idAdmin' => $this->admin->idAdmin]);
    }

    public function test_admin_wajib_dan_form_tambah_mendapat_admin_yang_login(): void
    {
        $this->actingAs($this->admin, 'admin')->get('/tampilbooking')
            ->assertInertia(fn (Assert $p) => $p->where('idAdminLogin', $this->admin->idAdmin));

        $this->actingAs($this->admin, 'admin')->from('/tampilbooking')->post('/insertbooking', ['txtadmin' => 9999])
            ->assertSessionHasErrors(['txtadmin' => 'Admin yang dipilih tidak valid.']);
    }
}
