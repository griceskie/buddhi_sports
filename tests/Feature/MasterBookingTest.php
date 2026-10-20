<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Penyewa;
use Database\Seeders\LapanganSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class MasterBookingTest extends TestCase
{
    use RefreshDatabase;

    private Admin $admin;

    private Penyewa $penyewa;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(LapanganSeeder::class);
        $this->admin = Admin::create(['namaAdmin' => 'Admin', 'username' => 'admin', 'password' => Hash::make('password')]);
        $this->penyewa = Penyewa::create([
            'namaPenyewa' => 'Penyewa',
            'noHp' => '081234567890',
            'email' => 'rina@example.com',
            'password' => Hash::make('password'),
        ]);
    }

    private function simpan(array $data = [])
    {
        return $this->actingAs($this->admin, 'admin')->post('/insertbooking', array_merge([
            'txtpenyewa' => $this->penyewa->idPenyewa,
            'txtlapangan' => 4,
            'txtadmin' => $this->admin->idAdmin,
            'txttanggal' => '2026-10-21',
            'txtjammulai' => '10:00',
            'txtjamselesai' => '11:00',
            'txttotal' => 1,
            'txtstatus' => 'Dipesan',
        ], $data));
    }

    private function bookingLama(string $status): void
    {
        DB::table('bookings')->insert([
            'idPenyewa' => $this->penyewa->idPenyewa,
            'idLapangan' => 4,
            'tanggal' => '2026-10-21',
            'jamMulai' => '10:00:00',
            'jamSelesai' => '12:00:00',
            'totalBayar' => 200000,
            'status' => $status,
        ]);
    }

    public function test_total_dihitung_dari_tarif_lapangan(): void
    {
        $this->simpan()->assertRedirect('/tampilbooking');

        $this->assertSame(100000, (int) DB::table('bookings')->value('totalBayar'));
    }

    public function test_booking_dibatalkan_tidak_menahan_slot(): void
    {
        $this->bookingLama('Dibatalkan');

        $this->simpan()->assertRedirect('/tampilbooking');

        $this->assertSame(2, DB::table('bookings')->count());
    }

    public function test_booking_aktif_tetap_menahan_slot(): void
    {
        $this->bookingLama('Dibayar');

        $this->simpan(['txtjammulai' => '11:00', 'txtjamselesai' => '12:00'])
            ->assertRedirect('/formbooking')
            ->assertSessionHas('error');
    }

    public function test_jam_selesai_harus_setelah_jam_mulai(): void
    {
        $this->simpan(['txtjammulai' => '12:00', 'txtjamselesai' => '10:00'])
            ->assertSessionHasErrors('txtjamselesai');

        $this->assertSame(0, DB::table('bookings')->count());
    }
}
