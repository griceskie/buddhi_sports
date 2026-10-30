<?php

namespace Tests\Feature;

use App\Models\Penyewa;
use App\Support\Pemesanan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Kasus uji D01-D08 di blackbox-testing.md (Booking Penyewa, Home /dashboard).
 */
class BlackboxBookingPenyewaTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function buatLapangan(string $status = 'Tersedia'): int
    {
        return DB::table('lapangans')->insertGetId([
            'namaLapangan' => 'Lapangan 1', 'jenisLapangan' => 'Badminton', 'tarifPerJam' => 50000, 'status' => $status,
        ], 'idLapangan');
    }

    // D01: pilih lapangan, tanggal, dan jam kosong, lalu Booking sekarang -> booking Dipesan, masuk halaman Bayar.
    public function test_d01_booking_valid(): void
    {
        $penyewa = Penyewa::factory()->create();
        $idLapangan = $this->buatLapangan();

        $response = $this->actingAs($penyewa)->post('/booking', [
            'idLapangan' => $idLapangan,
            'tanggal' => today()->addDays(5)->toDateString(),
            'jamMulai' => '10:00',
            'jamSelesai' => '11:00',
        ]);

        $booking = DB::table('bookings')->where('idPenyewa', $penyewa->idPenyewa)->first();
        $this->assertNotNull($booking);
        $this->assertSame('Dipesan', $booking->status);
        $response->assertRedirect(route('booking.bayar', $booking->idBooking));
    }

    // D02: batas jam mulai 08:00, selesai 22:00 -> diterima.
    public function test_d02_batas_jam_mulai_08_diterima(): void
    {
        $penyewa = Penyewa::factory()->create();
        $idLapangan = $this->buatLapangan();

        $response = $this->actingAs($penyewa)->post('/booking', [
            'idLapangan' => $idLapangan,
            'tanggal' => today()->addDays(5)->toDateString(),
            'jamMulai' => '08:00',
            'jamSelesai' => '09:00',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('bookings', ['idPenyewa' => $penyewa->idPenyewa, 'jamMulai' => '08:00:00']);
    }

    public function test_d02_batas_jam_selesai_22_diterima(): void
    {
        $penyewa = Penyewa::factory()->create();
        $idLapangan = $this->buatLapangan();

        $response = $this->actingAs($penyewa)->post('/booking', [
            'idLapangan' => $idLapangan,
            'tanggal' => today()->addDays(5)->toDateString(),
            'jamMulai' => '21:00',
            'jamSelesai' => '22:00',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('bookings', ['idPenyewa' => $penyewa->idPenyewa, 'jamSelesai' => '22:00:00']);
    }

    // D03: jam di luar 08:00-22:00 -> ditolak.
    public function test_d03_jam_mulai_sebelum_jam_buka(): void
    {
        $penyewa = Penyewa::factory()->create();
        $idLapangan = $this->buatLapangan();

        $response = $this->actingAs($penyewa)->post('/booking', [
            'idLapangan' => $idLapangan,
            'tanggal' => today()->addDays(5)->toDateString(),
            'jamMulai' => '07:00',
            'jamSelesai' => '08:00',
        ]);

        $response->assertSessionHasErrors('jamMulai');
        $this->assertDatabaseMissing('bookings', ['idPenyewa' => $penyewa->idPenyewa]);
    }

    public function test_d03_jam_selesai_sesudah_jam_tutup(): void
    {
        $penyewa = Penyewa::factory()->create();
        $idLapangan = $this->buatLapangan();

        $response = $this->actingAs($penyewa)->post('/booking', [
            'idLapangan' => $idLapangan,
            'tanggal' => today()->addDays(5)->toDateString(),
            'jamMulai' => '21:00',
            'jamSelesai' => '23:00',
        ]);

        $response->assertSessionHasErrors('jamMulai');
        $this->assertDatabaseMissing('bookings', ['idPenyewa' => $penyewa->idPenyewa]);
    }

    // D04: tanggal hari ini + batas hari ke depan -> diterima, sehari lebih jauh -> ditolak.
    public function test_d04_tanggal_batas_terjauh_diterima(): void
    {
        $penyewa = Penyewa::factory()->create();
        $idLapangan = $this->buatLapangan();
        $tanggalTerjauh = today()->addDays(Pemesanan::HARI_KE_DEPAN - 1)->toDateString();

        $response = $this->actingAs($penyewa)->post('/booking', [
            'idLapangan' => $idLapangan,
            'tanggal' => $tanggalTerjauh,
            'jamMulai' => '10:00',
            'jamSelesai' => '11:00',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('bookings', ['idPenyewa' => $penyewa->idPenyewa, 'tanggal' => $tanggalTerjauh]);
    }

    public function test_d04_tanggal_lebih_dari_batas_ditolak(): void
    {
        $penyewa = Penyewa::factory()->create();
        $idLapangan = $this->buatLapangan();
        $tanggalTerlalu = today()->addDays(Pemesanan::HARI_KE_DEPAN)->toDateString();

        $response = $this->actingAs($penyewa)->post('/booking', [
            'idLapangan' => $idLapangan,
            'tanggal' => $tanggalTerlalu,
            'jamMulai' => '10:00',
            'jamSelesai' => '11:00',
        ]);

        $response->assertSessionHasErrors('tanggal');
        $this->assertDatabaseMissing('bookings', ['idPenyewa' => $penyewa->idPenyewa]);
    }

    // D05: jam yang sudah lewat hari ini -> ditolak server.
    public function test_d05_jam_hari_ini_sudah_lewat_ditolak(): void
    {
        Carbon::setTestNow(today()->setTime(15, 30));
        $penyewa = Penyewa::factory()->create();
        $idLapangan = $this->buatLapangan();

        $response = $this->actingAs($penyewa)->post('/booking', [
            'idLapangan' => $idLapangan,
            'tanggal' => today()->toDateString(),
            'jamMulai' => '10:00',
            'jamSelesai' => '11:00',
        ]);

        $response->assertSessionHasErrors('jamMulai');
        $this->assertDatabaseMissing('bookings', ['idPenyewa' => $penyewa->idPenyewa]);
    }

    public function test_d05_jam_hari_ini_belum_lewat_diterima(): void
    {
        Carbon::setTestNow(today()->setTime(15, 30));
        $penyewa = Penyewa::factory()->create();
        $idLapangan = $this->buatLapangan();

        $response = $this->actingAs($penyewa)->post('/booking', [
            'idLapangan' => $idLapangan,
            'tanggal' => today()->toDateString(),
            'jamMulai' => '16:00',
            'jamSelesai' => '17:00',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('bookings', ['idPenyewa' => $penyewa->idPenyewa]);
    }

    // D06: slot yang sudah Dikonfirmasi milik orang lain -> tidak bisa dipesan.
    public function test_d06_slot_sudah_dikonfirmasi_orang_lain(): void
    {
        $penyewaLain = Penyewa::factory()->create();
        $penyewa = Penyewa::factory()->create();
        $idLapangan = $this->buatLapangan();
        $tanggal = today()->addDays(5)->toDateString();

        DB::table('bookings')->insert([
            'idPenyewa' => $penyewaLain->idPenyewa, 'idLapangan' => $idLapangan,
            'tanggal' => $tanggal, 'jamMulai' => '10:00:00', 'jamSelesai' => '11:00:00',
            'totalBayar' => 50000, 'status' => 'Dikonfirmasi', 'created_at' => now(),
        ]);

        $response = $this->actingAs($penyewa)->post('/booking', [
            'idLapangan' => $idLapangan,
            'tanggal' => $tanggal,
            'jamMulai' => '10:00',
            'jamSelesai' => '11:00',
        ]);

        $response->assertSessionHasErrors('jamMulai');
        $this->assertDatabaseMissing('bookings', ['idPenyewa' => $penyewa->idPenyewa]);
    }

    // D07: lapangan berstatus Perbaikan -> tidak bisa dipesan.
    public function test_d07_lapangan_perbaikan(): void
    {
        $penyewa = Penyewa::factory()->create();
        $idLapangan = $this->buatLapangan('Perbaikan');

        $response = $this->actingAs($penyewa)->post('/booking', [
            'idLapangan' => $idLapangan,
            'tanggal' => today()->addDays(5)->toDateString(),
            'jamMulai' => '10:00',
            'jamSelesai' => '11:00',
        ]);

        $response->assertSessionHasErrors('idLapangan');
        $this->assertDatabaseMissing('bookings', ['idPenyewa' => $penyewa->idPenyewa]);
    }

    // D08: booking tanpa memilih jam -> pesan error wajib diisi.
    public function test_d08_tanpa_memilih_jam(): void
    {
        $penyewa = Penyewa::factory()->create();
        $idLapangan = $this->buatLapangan();

        $response = $this->actingAs($penyewa)->post('/booking', [
            'idLapangan' => $idLapangan,
            'tanggal' => today()->addDays(5)->toDateString(),
        ]);

        $response->assertSessionHasErrors(['jamMulai', 'jamSelesai']);
        $this->assertDatabaseMissing('bookings', ['idPenyewa' => $penyewa->idPenyewa]);
    }
}
