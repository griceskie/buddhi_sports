<?php

namespace Tests\Feature;

use App\Models\Penyewa;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BookingPenyewaTest extends TestCase
{
    use RefreshDatabase;

    private Penyewa $penyewa;

    private int $lapangan;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-23 14:30:00'));
        $this->penyewa = $this->buatPenyewa('rina@example.com');
        $this->lapangan = DB::table('lapangans')->insertGetId([
            'namaLapangan' => 'Lapangan Airlangga', 'jenisLapangan' => 'Bulu Tangkis', 'tarifPerJam' => 50000, 'status' => 'Tersedia',
        ], 'idLapangan');
    }

    private function buatPenyewa(string $email): Penyewa
    {
        return Penyewa::create(['namaPenyewa' => 'Rina', 'noHp' => '081', 'email' => $email, 'password' => Hash::make('rahasia123')]);
    }

    private function pesan(array $ubah = [], ?Penyewa $oleh = null)
    {
        return $this->actingAs($oleh ?? $this->penyewa)->post('/booking', array_merge([
            'idLapangan' => $this->lapangan,
            'tanggal' => '2026-10-24',
            'jamMulai' => '18:00',
            'jamSelesai' => '20:00',
        ], $ubah));
    }

    private function bookingLain(string $status, string $mulai, string $selesai): void
    {
        DB::table('bookings')->insert([
            'idPenyewa' => $this->buatPenyewa(uniqid().'@example.com')->idPenyewa,
            'idLapangan' => $this->lapangan, 'tanggal' => '2026-10-24',
            'jamMulai' => $mulai, 'jamSelesai' => $selesai, 'totalBayar' => 0, 'status' => $status,
        ]);
    }

    public function test_booking_tersimpan_lalu_diarahkan_ke_halaman_bayar(): void
    {
        $res = $this->pesan();

        $b = DB::table('bookings')->first();
        $res->assertRedirect('/booking/'.$b->idBooking.'/bayar');
        $this->assertSame('Dipesan', $b->status);
        $this->assertSame($this->penyewa->idPenyewa, (int) $b->idPenyewa);
        $this->assertSame(100000, (int) $b->totalBayar);
        $this->assertSame('18:00:00', $b->jamMulai);
        $this->assertSame('2026-10-23 14:30:00', Carbon::parse($b->created_at)->format('Y-m-d H:i:s'));
    }

    public function test_jadwal_tidak_valid_ditolak(): void
    {
        $kasus = [
            'tanggal lewat' => [['tanggal' => '2026-10-22'], 'tanggal'],
            'lebih dari 30 hari' => [['tanggal' => '2026-11-22'], 'tanggal'],
            'bukan jam penuh' => [['jamMulai' => '18:30'], 'jamMulai'],
            'sebelum jam buka' => [['jamMulai' => '07:00'], 'jamMulai'],
            'melewati jam tutup' => [['jamMulai' => '21:00', 'jamSelesai' => '23:00'], 'jamMulai'],
            'selesai sebelum mulai' => [['jamMulai' => '20:00', 'jamSelesai' => '18:00'], 'jamSelesai'],
            'jam hari ini sudah lewat' => [['tanggal' => '2026-10-23', 'jamMulai' => '14:00', 'jamSelesai' => '15:00'], 'jamMulai'],
        ];
        foreach ($kasus as $nama => [$ubah, $field]) {
            $this->pesan($ubah)->assertSessionHasErrors($field, null, 'default');
            $this->assertSame(0, DB::table('bookings')->count(), $nama);
        }

        $this->pesan(['tanggal' => '2026-10-23', 'jamMulai' => '15:00', 'jamSelesai' => '16:00'])->assertSessionHasNoErrors();
    }

    public function test_hanya_booking_terkonfirmasi_yang_menahan_jam(): void
    {
        $this->bookingLain('Dikonfirmasi', '18:00:00', '20:00:00');
        $this->bookingLain('Dipesan', '10:00:00', '12:00:00');
        $this->bookingLain('Dibatalkan', '12:00:00', '13:00:00');

        $this->pesan(['jamMulai' => '19:00', 'jamSelesai' => '21:00'])->assertSessionHasErrors(['jamMulai' => 'Lapangan sudah terbooking pada jam tersebut.']);
        $this->pesan(['jamMulai' => '20:00', 'jamSelesai' => '21:00'])->assertSessionHasNoErrors();
        $this->pesan(['jamMulai' => '10:00', 'jamSelesai' => '12:00'])->assertSessionHasNoErrors();
        $this->pesan(['jamMulai' => '12:00', 'jamSelesai' => '13:00'])->assertSessionHasNoErrors();
    }

    public function test_lapangan_perbaikan_ditolak(): void
    {
        DB::table('lapangans')->where('idLapangan', $this->lapangan)->update(['status' => 'Perbaikan']);
        $this->pesan()->assertSessionHasErrors('idLapangan');
    }

    public function test_home_hanya_mengirim_jam_dari_booking_terkonfirmasi(): void
    {
        $this->bookingLain('Dikonfirmasi', '18:00:00', '20:00:00');
        $this->bookingLain('Dipesan', '10:00:00', '12:00:00');

        $this->actingAs($this->penyewa)->get('/dashboard')->assertInertia(fn (Assert $p) => $p
            ->component('Dashboard')
            ->has('lapangan', 1)
            ->has('terisi', 1)
            ->where('terisi.0.jamMulai', '18:00:00'));
    }

    public function test_halaman_bayar_hanya_untuk_pemilik(): void
    {
        $this->pesan();
        $id = DB::table('bookings')->value('idBooking');

        $this->actingAs($this->penyewa)->get("/booking/$id/bayar")->assertInertia(fn (Assert $p) => $p
            ->component('Booking/Bayar')
            ->where('booking.kode', 'BK-'.str_pad((string) $id, 4, '0', STR_PAD_LEFT))
            ->where('booking.totalBayar', 100000)
            ->where('booking.jamMulai', '18:00')
            ->where('booking.statusPembayaran', null)
            ->where('booking.batasBayar', Carbon::parse('2026-10-23 14:30:00')->addMinutes(config('pembayaran.batas_bayar_menit'))->toIso8601String())
            ->where('rekening.nomor', config('pembayaran.nomor_rekening')));

        $this->actingAs($this->buatPenyewa('lain@example.com'))->get("/booking/$id/bayar")->assertNotFound();
        $this->actingAs($this->buatPenyewa('lain2@example.com'))->post("/booking/$id/bukti", [])->assertNotFound();
    }

    public function test_penyewa_bisa_membatalkan_booking_yang_belum_dibayar(): void
    {
        $this->pesan();
        $id = DB::table('bookings')->value('idBooking');

        // bukan pemilik: tidak ditemukan, status tetap
        $this->actingAs($this->buatPenyewa('lain@example.com'))->post("/booking/$id/batal")->assertNotFound();
        $this->assertSame('Dipesan', DB::table('bookings')->value('status'));

        $this->actingAs($this->penyewa)->from('/booking')->post("/booking/$id/batal")
            ->assertRedirect('/booking')->assertSessionHas('success');
        $b = DB::table('bookings')->first();
        $this->assertSame('Dibatalkan', $b->status);
        $this->assertTrue((bool) $b->dibatalkanPenyewa);

        $this->actingAs($this->penyewa)->get('/booking')->assertInertia(fn (Assert $p) => $p
            ->where('bookings.0.status', 'Dibatalkan')
            ->where('bookings.0.dibatalkanPenyewa', true));
    }

    public function test_booking_yang_sudah_ada_bukti_tidak_bisa_dibatalkan_penyewa(): void
    {
        $this->pesan();
        $id = DB::table('bookings')->value('idBooking');
        foreach (['Menunggu Verifikasi', 'Ditolak', 'Terverifikasi'] as $status) {
            DB::table('pembayarans')->updateOrInsert(['idBooking' => $id], ['tglBayar' => '2026-10-23', 'jumlahBayar' => 100000, 'status' => $status]);

            $this->actingAs($this->penyewa)->post("/booking/$id/batal")->assertSessionHas('error');
            $this->assertSame('Dipesan', DB::table('bookings')->value('status'), "status pembayaran $status");
        }

        // batal otomatis (kedaluwarsa) tidak ditandai sebagai dibatalkan penyewa
        DB::table('pembayarans')->delete();
        $this->travel(config('pembayaran.batas_bayar_menit') + 1)->minutes();
        $this->actingAs($this->penyewa)->get('/booking');
        $this->assertSame('Dibatalkan', DB::table('bookings')->value('status'));
        $this->assertFalse((bool) DB::table('bookings')->value('dibatalkanPenyewa'));
    }

    public function test_unggah_bukti_membuat_pembayaran_menunggu_verifikasi(): void
    {
        Storage::fake('local');
        $this->pesan();
        $id = DB::table('bookings')->value('idBooking');

        $this->actingAs($this->penyewa)->from("/booking/$id/bayar")
            ->post("/booking/$id/bukti", ['bukti' => UploadedFile::fake()->create('bukti.jpg', 100, 'image/jpeg')])
            ->assertRedirect("/booking/$id/bayar")
            ->assertSessionHas('success');

        $p = DB::table('pembayarans')->first();
        $this->assertSame('Menunggu Verifikasi', $p->status);
        $this->assertSame(100000, (int) $p->jumlahBayar);
        $this->assertSame('2026-10-23', $p->tglBayar);
        Storage::disk('local')->assertExists($p->buktiBayar);

        $this->actingAs($this->penyewa)->post("/booking/$id/bukti", ['bukti' => UploadedFile::fake()->create('lagi.jpg', 100, 'image/jpeg')])
            ->assertSessionHasErrors(['bukti' => 'Bukti untuk booking ini sudah dikirim.']);
        $this->assertSame(1, DB::table('pembayarans')->count());
    }

    public function test_file_bukti_divalidasi(): void
    {
        Storage::fake('local');
        $this->pesan();
        $id = DB::table('bookings')->value('idBooking');

        $this->actingAs($this->penyewa)->post("/booking/$id/bukti", [])->assertSessionHasErrors(['bukti' => 'Pilih file bukti transfer.']);
        $this->actingAs($this->penyewa)->post("/booking/$id/bukti", ['bukti' => UploadedFile::fake()->create('a.txt', 10, 'text/plain')])
            ->assertSessionHasErrors(['bukti' => 'File harus JPG, PNG, atau PDF.']);
        $this->actingAs($this->penyewa)->post("/booking/$id/bukti", ['bukti' => UploadedFile::fake()->create('besar.jpg', 3000, 'image/jpeg')])
            ->assertSessionHasErrors(['bukti' => 'Ukuran file maksimal 2 MB.']);
        $this->actingAs($this->penyewa)->post("/booking/$id/bukti", ['bukti' => UploadedFile::fake()->create('bukti.pdf', 500, 'application/pdf')])
            ->assertSessionHasNoErrors();
    }

    public function test_booking_tanpa_bukti_batal_otomatis_setelah_2_jam(): void
    {
        Storage::fake('local');
        $this->pesan(['jamMulai' => '18:00', 'jamSelesai' => '19:00']);
        $this->pesan(['jamMulai' => '19:00', 'jamSelesai' => '20:00']);
        [$tanpaBukti, $denganBukti] = DB::table('bookings')->orderBy('idBooking')->pluck('idBooking')->all();
        $this->actingAs($this->penyewa)->post("/booking/$denganBukti/bukti", ['bukti' => UploadedFile::fake()->create('b.jpg', 100, 'image/jpeg')]);
        DB::table('bookings')->insert([
            'idPenyewa' => $this->penyewa->idPenyewa, 'idLapangan' => $this->lapangan, 'tanggal' => '2026-10-24',
            'jamMulai' => '08:00:00', 'jamSelesai' => '09:00:00', 'totalBayar' => 50000, 'status' => 'Dipesan',
        ]);

        $batas = config('pembayaran.batas_bayar_menit');
        $this->travel($batas - 1)->minutes();
        $this->artisan('booking:batalkan-kedaluwarsa')->expectsOutput('0 booking dibatalkan.');

        $this->travel(2)->minutes();
        $this->actingAs($this->penyewa)->get('/booking')->assertInertia(fn (Assert $p) => $p
            ->component('Booking')
            ->has('bookings', 3)
            ->where('bookings.0.status', 'Dipesan')
            ->where('bookings.0.batasBayar', null)
            ->where('bookings.1.status', 'Dipesan')
            ->where('bookings.1.statusPembayaran', 'Menunggu Verifikasi')
            ->where('bookings.2.status', 'Dibatalkan'));
        $this->assertSame('Dibatalkan', DB::table('bookings')->where('idBooking', $tanpaBukti)->value('status'));

        $this->actingAs($this->penyewa)->post("/booking/$tanpaBukti/bukti", ['bukti' => UploadedFile::fake()->create('telat.jpg', 100, 'image/jpeg')])
            ->assertSessionHasErrors(['bukti' => 'Booking sudah dibatalkan karena melewati batas bayar.']);
    }

    public function test_perintah_terjadwal_membatalkan_yang_kedaluwarsa(): void
    {
        $this->pesan();
        $this->travel(config('pembayaran.batas_bayar_menit') + 1)->minutes();
        $this->artisan('booking:batalkan-kedaluwarsa')->expectsOutput('1 booking dibatalkan.')->assertSuccessful();
        $this->assertSame('Dibatalkan', DB::table('bookings')->value('status'));
    }

    public function test_booking_saya_hanya_menampilkan_milik_sendiri(): void
    {
        $this->pesan();
        $this->pesan(['jamMulai' => '10:00', 'jamSelesai' => '11:00'], $this->buatPenyewa('lain@example.com'));

        $this->actingAs($this->penyewa)->get('/booking')->assertInertia(fn (Assert $p) => $p
            ->component('Booking')
            ->has('bookings', 1)
            ->where('bookings.0.namaLapangan', 'Lapangan Airlangga')
            ->where('rekening.bank', config('pembayaran.bank')));
    }
}
