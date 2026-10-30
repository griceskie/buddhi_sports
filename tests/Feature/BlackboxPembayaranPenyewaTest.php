<?php

namespace Tests\Feature;

use App\Models\Penyewa;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Kasus uji E01-E07 di blackbox-testing.md (Pembayaran Penyewa).
 */
class BlackboxPembayaranPenyewaTest extends TestCase
{
    use RefreshDatabase;

    private function buatBooking(Penyewa $penyewa, string $status = 'Dipesan', ?string $createdAt = null): int
    {
        $idLapangan = DB::table('lapangans')->insertGetId([
            'namaLapangan' => 'Lapangan 1', 'jenisLapangan' => 'Badminton', 'tarifPerJam' => 50000, 'status' => 'Tersedia',
        ], 'idLapangan');

        return DB::table('bookings')->insertGetId([
            'idPenyewa' => $penyewa->idPenyewa, 'idLapangan' => $idLapangan,
            'tanggal' => today()->addDays(5)->toDateString(), 'jamMulai' => '10:00:00', 'jamSelesai' => '11:00:00',
            'totalBayar' => 50000, 'status' => $status, 'created_at' => $createdAt ?? now(),
        ], 'idBooking');
    }

    // E01: unggah bukti JPG/PNG/PDF <= 2 MB -> status pembayaran Menunggu Verifikasi.
    public function test_e01_unggah_bukti_jpg(): void
    {
        Storage::fake('local');
        $penyewa = Penyewa::factory()->create();
        $id = $this->buatBooking($penyewa);

        $this->actingAs($penyewa)->post("/booking/{$id}/bukti", [
            'bukti' => UploadedFile::fake()->create('bukti.jpg', 100, 'image/jpeg'),
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('pembayarans', ['idBooking' => $id, 'status' => 'Menunggu Verifikasi']);
    }

    public function test_e01_unggah_bukti_png(): void
    {
        Storage::fake('local');
        $penyewa = Penyewa::factory()->create();
        $id = $this->buatBooking($penyewa);

        $this->actingAs($penyewa)->post("/booking/{$id}/bukti", [
            'bukti' => UploadedFile::fake()->create('bukti.png', 100, 'image/png'),
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('pembayarans', ['idBooking' => $id, 'status' => 'Menunggu Verifikasi']);
    }

    public function test_e01_unggah_bukti_pdf(): void
    {
        Storage::fake('local');
        $penyewa = Penyewa::factory()->create();
        $id = $this->buatBooking($penyewa);

        $this->actingAs($penyewa)->post("/booking/{$id}/bukti", [
            'bukti' => UploadedFile::fake()->create('bukti.pdf', 100, 'application/pdf'),
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('pembayarans', ['idBooking' => $id, 'status' => 'Menunggu Verifikasi']);
    }

    // E02: file tepat 2 MB -> diterima, 2,1 MB -> ditolak.
    public function test_e02_file_tepat_2mb_diterima(): void
    {
        Storage::fake('local');
        $penyewa = Penyewa::factory()->create();
        $id = $this->buatBooking($penyewa);

        $this->actingAs($penyewa)->post("/booking/{$id}/bukti", [
            'bukti' => UploadedFile::fake()->create('bukti.jpg', 2048, 'image/jpeg'),
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('pembayarans', ['idBooking' => $id]);
    }

    public function test_e02_file_2_1mb_ditolak(): void
    {
        Storage::fake('local');
        $penyewa = Penyewa::factory()->create();
        $id = $this->buatBooking($penyewa);

        $this->actingAs($penyewa)->post("/booking/{$id}/bukti", [
            'bukti' => UploadedFile::fake()->create('bukti.jpg', 2150, 'image/jpeg'),
        ])->assertSessionHasErrors('bukti');

        $this->assertDatabaseMissing('pembayarans', ['idBooking' => $id]);
    }

    // E03: file .docx atau .exe -> ditolak.
    public function test_e03_file_docx_ditolak(): void
    {
        Storage::fake('local');
        $penyewa = Penyewa::factory()->create();
        $id = $this->buatBooking($penyewa);

        $this->actingAs($penyewa)->post("/booking/{$id}/bukti", [
            'bukti' => UploadedFile::fake()->create('bukti.docx', 100, 'application/msword'),
        ])->assertSessionHasErrors('bukti');

        $this->assertDatabaseMissing('pembayarans', ['idBooking' => $id]);
    }

    public function test_e03_file_exe_ditolak(): void
    {
        Storage::fake('local');
        $penyewa = Penyewa::factory()->create();
        $id = $this->buatBooking($penyewa);

        $this->actingAs($penyewa)->post("/booking/{$id}/bukti", [
            'bukti' => UploadedFile::fake()->create('bukti.exe', 100, 'application/x-msdownload'),
        ])->assertSessionHasErrors('bukti');

        $this->assertDatabaseMissing('pembayarans', ['idBooking' => $id]);
    }

    // E04: tidak mengunggah dalam batas waktu bayar -> booking otomatis Dibatalkan.
    public function test_e04_tidak_unggah_dalam_batas_waktu_dibatalkan(): void
    {
        $penyewa = Penyewa::factory()->create();
        $batas = (int) config('pembayaran.batas_bayar_menit');
        $id = $this->buatBooking($penyewa, 'Dipesan', now()->subMinutes($batas + 5));

        // membuka halaman Booking saya memicu pembersihan booking kedaluwarsa.
        $this->actingAs($penyewa)->get('/booking');

        $this->assertDatabaseHas('bookings', ['idBooking' => $id, 'status' => 'Dibatalkan']);
    }

    public function test_e04_belum_lewat_batas_tetap_dipesan(): void
    {
        $penyewa = Penyewa::factory()->create();
        $batas = (int) config('pembayaran.batas_bayar_menit');
        $id = $this->buatBooking($penyewa, 'Dipesan', now()->subMinutes($batas - 5));

        $this->actingAs($penyewa)->get('/booking');

        $this->assertDatabaseHas('bookings', ['idBooking' => $id, 'status' => 'Dipesan']);
    }

    // E05: bukti ditolak Admin -> alasan tampil, penyewa bisa unggah ulang.
    public function test_e05_bukti_ditolak_alasan_tampil_dan_bisa_unggah_ulang(): void
    {
        Storage::fake('local');
        $penyewa = Penyewa::factory()->create();
        $id = $this->buatBooking($penyewa);
        DB::table('pembayarans')->insert([
            'idBooking' => $id, 'tglBayar' => today()->toDateString(), 'jumlahBayar' => 50000,
            'buktiBayar' => 'bukti/lama.jpg', 'status' => 'Ditolak', 'alasanTolak' => 'Nominal tidak sesuai.',
        ]);

        $this->actingAs($penyewa)->get('/booking')->assertInertia(fn (Assert $p) => $p
            ->component('Booking')
            ->where('bookings.0.alasanTolak', 'Nominal tidak sesuai.')
            ->where('bookings.0.statusPembayaran', 'Ditolak'));

        $this->actingAs($penyewa)->post("/booking/{$id}/bukti", [
            'bukti' => UploadedFile::fake()->create('ulang.jpg', 100, 'image/jpeg'),
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('pembayarans', [
            'idBooking' => $id, 'status' => 'Menunggu Verifikasi', 'alasanTolak' => null,
        ]);
    }

    // E06: halaman Booking saya tanpa data -> tampil keadaan kosong.
    public function test_e06_booking_saya_tanpa_data(): void
    {
        $penyewa = Penyewa::factory()->create();

        $this->actingAs($penyewa)->get('/booking')->assertInertia(fn (Assert $p) => $p
            ->component('Booking')
            ->has('bookings', 0));
    }

    // E07: data booking yang dikirim ke tab Aktif/Riwayat sesuai.
    public function test_e07_data_booking_sesuai(): void
    {
        $penyewa = Penyewa::factory()->create();
        $idLama = $this->buatBooking($penyewa, 'Dibatalkan');
        $idBaru = $this->buatBooking($penyewa, 'Dipesan');

        $this->actingAs($penyewa)->get('/booking')->assertInertia(fn (Assert $p) => $p
            ->component('Booking')
            ->has('bookings', 2)
            // diurutkan idBooking menurun: yang terbaru lebih dulu.
            ->where('bookings.0.idBooking', $idBaru)
            ->where('bookings.0.status', 'Dipesan')
            ->where('bookings.1.idBooking', $idLama)
            ->where('bookings.1.status', 'Dibatalkan'));
    }
}
