<?php

namespace Tests\Feature;

use App\Models\Penyewa;
use Database\Seeders\LapanganSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class BookingPenyewaTest extends TestCase
{
    use RefreshDatabase;

    private Penyewa $penyewa;

    protected function setUp(): void
    {
        parent::setUp();

        // Selasa 20 Oktober 2026, 09:30 WIB
        $this->travelTo(Carbon::create(2026, 10, 20, 9, 30, 0, 'Asia/Jakarta'));
        $this->seed(LapanganSeeder::class);
        $this->penyewa = $this->buatPenyewa('rina@example.com');
    }

    private function buatPenyewa(string $email): Penyewa
    {
        return Penyewa::create([
            'namaPenyewa' => 'Penyewa',
            'noHp' => '081234567890',
            'email' => $email,
            'password' => Hash::make('password'),
        ]);
    }

    private function buatBooking(array $data): int
    {
        return DB::table('bookings')->insertGetId(array_merge([
            'idPenyewa' => $this->penyewa->idPenyewa,
            'idLapangan' => 1,
            'idAdmin' => null,
            'tanggal' => '2026-10-21',
            'jamMulai' => '10:00:00',
            'jamSelesai' => '12:00:00',
            'totalBayar' => 100000,
            'status' => 'Dipesan',
            'created_at' => now(),
        ], $data), 'idBooking');
    }

    private function bayar(int $idBooking): void
    {
        DB::table('pembayarans')->insert([
            'idAdmin' => null,
            'idBooking' => $idBooking,
            'tglBayar' => now()->toDateString(),
            'jumlahBayar' => 100000,
            'buktiBayar' => 'bukti.jpg',
            'status' => 'menunggu verifikasi',
        ]);
    }

    private function pesan(array $data = [])
    {
        return $this->actingAs($this->penyewa)->post('/booking', array_merge([
            'idLapangan' => 1,
            'tanggal' => '2026-10-21',
            'jamMulai' => '10:00',
            'jamSelesai' => '12:00',
        ], $data));
    }

    public function test_home_menampilkan_lapangan_dan_jam_yang_masih_terisi(): void
    {
        $lain = $this->buatPenyewa('lain@example.com');
        $this->buatBooking(['idPenyewa' => $lain->idPenyewa]);
        $this->buatBooking(['jamMulai' => '13:00:00', 'jamSelesai' => '14:00:00', 'status' => 'Dibatalkan']);
        $this->buatBooking(['jamMulai' => '15:00:00', 'jamSelesai' => '16:00:00', 'created_at' => now()->subHours(3)]);
        $this->buatBooking(['jamMulai' => '18:00:00', 'jamSelesai' => '20:00:00']);
        $this->buatBooking(['tanggal' => '2026-12-01', 'idPenyewa' => $lain->idPenyewa]);

        $this->actingAs($this->penyewa)->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->has('lapangan', 4)
                ->has('terisi', 2)
                ->where('terisi.0.jamMulai', '10:00')
                ->where('terisi.0.milikSaya', false)
                ->where('terisi.1.jamMulai', '18:00')
                ->where('terisi.1.milikSaya', true)
                ->where('belumDibayar', 1)
                ->where('aturan.hariIni', '2026-10-20')
                ->where('aturan.jamSekarang', 9)
                ->where('aturan.hariKeDepan', 30));
    }

    public function test_penyewa_bisa_booking_dan_total_dihitung_server(): void
    {
        $this->pesan(['jamSelesai' => '13:00', 'totalBayar' => 1])
            ->assertRedirect(route('dashboard'))
            ->assertSessionHas('success', 'Booking berhasil disimpan.');

        $booking = DB::table('bookings')->first();
        $this->assertSame($this->penyewa->idPenyewa, (int) $booking->idPenyewa);
        $this->assertSame(150000, (int) $booking->totalBayar);
        $this->assertSame('Dipesan', $booking->status);
        $this->assertSame('10:00:00', $booking->jamMulai);
        $this->assertNotNull($booking->created_at);
    }

    public function test_jam_yang_tumpang_tindih_ditolak(): void
    {
        $this->buatBooking([]);

        $this->pesan(['jamMulai' => '11:00', 'jamSelesai' => '13:00'])
            ->assertSessionHas('error', 'Lapangan sudah terbooking pada jam tersebut.');

        $this->assertSame(1, DB::table('bookings')->count());
    }

    public function test_jam_yang_bersebelahan_boleh(): void
    {
        $this->buatBooking([]);

        $this->pesan(['jamMulai' => '12:00', 'jamSelesai' => '14:00'])
            ->assertSessionHas('success');

        $this->assertSame(2, DB::table('bookings')->count());
    }

    public function test_booking_dibatalkan_dan_kedaluwarsa_tidak_menahan_slot(): void
    {
        $this->buatBooking(['status' => 'Dibatalkan']);
        $this->buatBooking(['jamMulai' => '12:00:00', 'jamSelesai' => '14:00:00', 'created_at' => now()->subMinutes(121)]);

        $this->pesan(['jamMulai' => '10:00', 'jamSelesai' => '14:00'])
            ->assertSessionHas('success');
    }

    public function test_booking_lewat_batas_yang_sudah_ada_pembayaran_tetap_menahan_slot(): void
    {
        $this->bayar($this->buatBooking(['created_at' => now()->subHours(5)]));

        $this->pesan()->assertSessionHas('error');
    }

    public static function jadwalTidakValid(): array
    {
        return [
            'tanggal lewat' => [['tanggal' => '2026-10-19']],
            'lebih dari 30 hari' => [['tanggal' => '2026-11-20']],
            'bukan jam penuh' => [['jamMulai' => '10:30', 'jamSelesai' => '12:00']],
            'sebelum jam buka' => [['jamMulai' => '07:00', 'jamSelesai' => '09:00']],
            'lewat jam tutup' => [['jamMulai' => '21:00', 'jamSelesai' => '23:00']],
            'selesai sebelum mulai' => [['jamMulai' => '12:00', 'jamSelesai' => '10:00']],
            'jam hari ini sudah lewat' => [['tanggal' => '2026-10-20', 'jamMulai' => '09:00', 'jamSelesai' => '10:00']],
            'lapangan tidak ada' => [['idLapangan' => 99]],
        ];
    }

    #[DataProvider('jadwalTidakValid')]
    public function test_jadwal_tidak_valid_ditolak(array $data): void
    {
        $this->pesan($data)->assertSessionHasErrors();

        $this->assertSame(0, DB::table('bookings')->count());
    }

    public function test_jam_berikutnya_hari_ini_boleh(): void
    {
        $this->pesan(['tanggal' => '2026-10-20', 'jamMulai' => '10:00', 'jamSelesai' => '11:00'])
            ->assertSessionHas('success');
    }

    public function test_tamu_tidak_bisa_booking(): void
    {
        $this->post('/booking', ['idLapangan' => 1])->assertRedirect('/login');
    }

    public function test_perintah_membatalkan_booking_yang_lewat_batas_bayar(): void
    {
        $kedaluwarsa = $this->buatBooking(['created_at' => now()->subMinutes(121)]);
        $sudahBayar = $this->buatBooking(['jamMulai' => '12:00:00', 'jamSelesai' => '13:00:00', 'created_at' => now()->subHours(3)]);
        $this->bayar($sudahBayar);
        $baru = $this->buatBooking(['jamMulai' => '14:00:00', 'jamSelesai' => '15:00:00', 'created_at' => now()->subMinutes(30)]);
        $dariAdmin = $this->buatBooking(['jamMulai' => '16:00:00', 'jamSelesai' => '17:00:00', 'created_at' => null]);

        $this->artisan('booking:batalkan-kedaluwarsa')->assertSuccessful();

        $status = DB::table('bookings')->pluck('status', 'idBooking');
        $this->assertSame('Dibatalkan', $status[$kedaluwarsa]);
        $this->assertSame('Dipesan', $status[$sudahBayar]);
        $this->assertSame('Dipesan', $status[$baru]);
        $this->assertSame('Dipesan', $status[$dariAdmin]);
    }
}
