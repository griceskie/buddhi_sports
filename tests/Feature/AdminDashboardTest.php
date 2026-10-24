<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Penyewa;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    private Admin $admin;

    private Penyewa $penyewa;

    private int $lap1;

    private int $lap2;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-23 14:30:00'));
        $this->admin = Admin::create(['namaAdmin' => 'Budi', 'username' => 'Admin1', 'password' => Hash::make('Admin123')]);
        $this->penyewa = Penyewa::create(['namaPenyewa' => 'Rina', 'noHp' => '081', 'email' => 'rina@example.com', 'password' => Hash::make('rahasia123')]);
        $this->lap1 = DB::table('lapangans')->insertGetId(['namaLapangan' => 'Airlangga', 'jenisLapangan' => 'Bulu Tangkis', 'tarifPerJam' => 50000, 'status' => 'Tersedia'], 'idLapangan');
        $this->lap2 = DB::table('lapangans')->insertGetId(['namaLapangan' => 'Lempar masuk', 'jenisLapangan' => 'Basket', 'tarifPerJam' => 100000, 'status' => 'Tersedia'], 'idLapangan');
    }

    private function booking(string $status, string $tanggal, string $mulai, string $selesai, ?int $lap = null): int
    {
        return DB::table('bookings')->insertGetId([
            'idPenyewa' => $this->penyewa->idPenyewa, 'idLapangan' => $lap ?? $this->lap1, 'tanggal' => $tanggal,
            'jamMulai' => $mulai, 'jamSelesai' => $selesai, 'totalBayar' => 100000, 'status' => $status, 'created_at' => now(),
        ], 'idBooking');
    }

    private function bayar(int $idBooking, string $status, string $tgl = '2026-10-23', int $jumlah = 100000, string $bukti = 'bukti/a.jpg'): int
    {
        return DB::table('pembayarans')->insertGetId([
            'idBooking' => $idBooking, 'tglBayar' => $tgl, 'jumlahBayar' => $jumlah, 'buktiBayar' => $bukti, 'status' => $status,
        ], 'idPembayaran');
    }

    public function test_dashboard_menghitung_statistik_dan_antrean(): void
    {
        $this->booking('Dikonfirmasi', '2026-10-23', '10:00:00', '12:00:00');
        $menunggu = $this->booking('Dipesan', '2026-10-23', '18:00:00', '20:00:00');
        $this->booking('Dibatalkan', '2026-10-23', '08:00:00', '09:00:00');
        $this->booking('Dipesan', '2026-10-23', '14:00:00', '15:00:00'); // belum bayar: tidak dihitung dan tidak tampil
        $this->booking('Dipesan', '2026-10-24', '10:00:00', '11:00:00', $this->lap2);
        $idP = $this->bayar($menunggu, 'Menunggu Verifikasi');
        $this->bayar($this->booking('Dikonfirmasi', '2026-10-20', '08:00:00', '10:00:00'), 'Terverifikasi', '2026-10-20', 100000);
        $this->bayar($this->booking('Dikonfirmasi', '2026-09-20', '08:00:00', '09:00:00'), 'Terverifikasi', '2026-09-20', 50000);

        $this->actingAs($this->admin, 'admin')->get('/dashboard-admin')->assertInertia(fn (Assert $p) => $p
            ->component('Dashboard/Admin')
            ->where('stat.bookingHariIni', 2)
            ->where('stat.menungguVerifikasi', 1)
            ->where('stat.pendapatanBulanIni', 100000)
            ->where('stat.pendapatanBulanLalu', 50000)
            ->where('stat.jamTerisi', 2)
            ->where('stat.jamTotal', 28)
            ->has('lapangan', 2)
            ->has('jadwal', 3) // dua hari ini + 20 Okt (masih dalam 7 hari ke belakang); yang belum bayar tidak ikut
            ->has('antrean', 1)
            ->where('antrean.0.idPembayaran', $idP)
            ->where('antrean.0.kode', 'BK-'.str_pad((string) $menunggu, 4, '0', STR_PAD_LEFT))
            ->where('antrean.0.buktiBayar', fn ($url) => str_ends_with($url, "/pembayaran/$idP/bukti"))
            ->has('terbaru', 6)
            ->where('pengelola.menungguVerifikasi', 1));
    }

    public function test_jadwal_dikirim_untuk_rentang_tanggal_tanpa_mengubah_statistik(): void
    {
        $hariIni = $this->booking('Dikonfirmasi', '2026-10-23', '10:00:00', '12:00:00');
        $besok = $this->booking('Dikonfirmasi', '2026-10-24', '08:00:00', '09:00:00', $this->lap2);
        $this->booking('Dikonfirmasi', '2026-10-24', '16:00:00', '18:00:00');
        $jauh = $this->booking('Dikonfirmasi', '2026-12-01', '08:00:00', '10:00:00');

        // bawaan: 7 hari ke belakang sampai 30 hari ke depan dari hari ini, urut tanggal lalu jam
        $this->actingAs($this->admin, 'admin')->get('/dashboard-admin')->assertInertia(fn (Assert $p) => $p
            ->where('tanggalJadwal', '2026-10-23')
            ->where('jadwalDari', '2026-10-16')
            ->where('jadwalSampai', '2026-11-22')
            ->has('jadwal', 3)
            ->where('jadwal.0.idBooking', $hariIni)
            ->where('jadwal.1.idBooking', $besok)
            ->where('jadwal.1.tanggal', '2026-10-24'));

        // tanggal di luar rentang: rentang baru di sekitar tanggal itu, statistik tetap hari ini
        $this->actingAs($this->admin, 'admin')->get('/dashboard-admin?tanggal=2026-11-25')->assertInertia(fn (Assert $p) => $p
            ->where('tanggalJadwal', '2026-11-25')
            ->where('jadwalDari', '2026-11-18')
            ->where('jadwalSampai', '2026-12-25')
            ->has('jadwal', 1)
            ->where('jadwal.0.idBooking', $jauh)
            ->where('stat.bookingHariIni', 1)
            ->where('stat.jamTerisi', 2));

        foreach (['2026-02-30', 'besok', ''] as $salah) {
            $this->actingAs($this->admin, 'admin')->get('/dashboard-admin?tanggal='.$salah)
                ->assertInertia(fn (Assert $p) => $p->where('tanggalJadwal', '2026-10-23')->has('jadwal', 3));
        }
    }


    public function test_terima_mengonfirmasi_booking_dan_menahan_jam(): void
    {
        $b = $this->booking('Dipesan', '2026-10-24', '18:00:00', '20:00:00');
        $p = $this->bayar($b, 'Menunggu Verifikasi');

        $this->actingAs($this->admin, 'admin')->from('/dashboard-admin')->post("/verifikasi/$p/terima")
            ->assertRedirect('/dashboard-admin')
            ->assertSessionHas('success');

        $this->assertSame('Terverifikasi', DB::table('pembayarans')->where('idPembayaran', $p)->value('status'));
        $this->assertSame($this->admin->idAdmin, (int) DB::table('pembayarans')->where('idPembayaran', $p)->value('idAdmin'));
        $this->assertSame('Dikonfirmasi', DB::table('bookings')->where('idBooking', $b)->value('status'));

        $this->actingAs($this->penyewa)->get('/dashboard')->assertInertia(fn (Assert $pg) => $pg->has('terisi', 1));
        $this->actingAs($this->admin, 'admin')->post("/verifikasi/$p/terima")->assertSessionHas('error');
    }

    public function test_terima_ditolak_bila_bentrok_dengan_booking_terkonfirmasi(): void
    {
        $this->booking('Dikonfirmasi', '2026-10-24', '19:00:00', '21:00:00');
        $b = $this->booking('Dipesan', '2026-10-24', '18:00:00', '20:00:00');
        $p = $this->bayar($b, 'Menunggu Verifikasi');

        $this->actingAs($this->admin, 'admin')->post("/verifikasi/$p/terima")
            ->assertSessionHas('error', fn ($pesan) => str_contains($pesan, 'bentrok'));
        $this->assertSame('Menunggu Verifikasi', DB::table('pembayarans')->where('idPembayaran', $p)->value('status'));
        $this->assertSame('Dipesan', DB::table('bookings')->where('idBooking', $b)->value('status'));
    }

    public function test_tolak_lalu_penyewa_bisa_unggah_ulang(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('bukti/lama.jpg', 'x');
        $b = $this->booking('Dipesan', '2026-10-24', '18:00:00', '20:00:00');
        $p = $this->bayar($b, 'Menunggu Verifikasi', bukti: 'bukti/lama.jpg');

        // alasan wajib: tanpa alasan pembayaran tidak berubah
        $this->actingAs($this->admin, 'admin')->post("/verifikasi/$p/tolak", ['alasan' => '  '])->assertSessionHasErrors('alasan');
        $this->assertSame('Menunggu Verifikasi', DB::table('pembayarans')->where('idPembayaran', $p)->value('status'));

        $this->actingAs($this->admin, 'admin')->post("/verifikasi/$p/tolak", ['alasan' => 'Nominal kurang Rp50.000'])
            ->assertSessionHas('error', fn ($pesan) => str_contains($pesan, 'ditolak'));
        $this->assertSame('Ditolak', DB::table('pembayarans')->where('idPembayaran', $p)->value('status'));
        $this->actingAs($this->penyewa)->get('/booking')->assertInertia(fn (Assert $page) => $page
            ->where('bookings.0.alasanTolak', 'Nominal kurang Rp50.000'));
        $this->assertSame('Dipesan', DB::table('bookings')->where('idBooking', $b)->value('status'));

        $this->actingAs($this->penyewa)->post("/booking/$b/bukti", ['bukti' => UploadedFile::fake()->create('baru.jpg', 100, 'image/jpeg')])
            ->assertSessionHasNoErrors();
        $row = DB::table('pembayarans')->where('idBooking', $b)->first();
        $this->assertSame(1, DB::table('pembayarans')->where('idBooking', $b)->count());
        $this->assertSame('Menunggu Verifikasi', $row->status);
        $this->assertNull($row->idAdmin);
        $this->assertNull($row->alasanTolak, 'alasan lama hilang setelah unggah ulang');
        Storage::disk('local')->assertMissing('bukti/lama.jpg');
        Storage::disk('local')->assertExists($row->buktiBayar);

        $this->travel(3)->hours();
        $this->actingAs($this->penyewa)->get('/booking');
        $this->assertSame('Dipesan', DB::table('bookings')->where('idBooking', $b)->value('status'), 'booking dengan bukti tidak ikut batal otomatis');
    }

    public function test_hanya_admin_yang_bisa_membuka_dan_memutuskan(): void
    {
        $p = $this->bayar($this->booking('Dipesan', '2026-10-24', '18:00:00', '20:00:00'), 'Menunggu Verifikasi');

        $this->actingAs($this->penyewa)->get('/dashboard-admin')->assertRedirect('/login-pengelola');
        $this->actingAs($this->penyewa)->post("/verifikasi/$p/terima")->assertRedirect('/login-pengelola');
        $this->assertSame('Menunggu Verifikasi', DB::table('pembayarans')->where('idPembayaran', $p)->value('status'));
    }
}
