<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Penyewa;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Kasus uji J01-J03 di blackbox-testing.md (Profil).
 */
class BlackboxProfilTest extends TestCase
{
    use RefreshDatabase;

    // J01: Penyewa mengubah nama -> tersimpan.
    public function test_j01_penyewa_ubah_nama_tersimpan(): void
    {
        $penyewa = Penyewa::factory()->create(['namaPenyewa' => 'Nama Lama']);

        $response = $this->actingAs($penyewa)->patch('/profile', [
            'namaPenyewa' => 'Nama Baru', 'noHp' => $penyewa->noHp, 'email' => $penyewa->email,
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('penyewas', ['idPenyewa' => $penyewa->idPenyewa, 'namaPenyewa' => 'Nama Baru']);
        // tidak ada flash 'success' -> toast di app.tsx (tampilkanFlash) tidak akan muncul.
        $this->assertNull($response->getSession()->get('success'));
    }

    // J01: Admin (Pengelola) mengubah nama -> tersimpan.
    public function test_j01_pengelola_ubah_nama_tersimpan(): void
    {
        $admin = Admin::create(['namaAdmin' => 'Nama Lama', 'username' => 'admin1', 'password' => Hash::make('rahasia123')]);

        $response = $this->actingAs($admin, 'admin')->patch('/profile-pengelola', [
            'nama' => 'Nama Baru', 'username' => 'admin1',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('admins', ['idAdmin' => $admin->idAdmin, 'namaAdmin' => 'Nama Baru']);
        // tidak ada flash 'success' -> toast di app.tsx (tampilkanFlash) tidak akan muncul.
        $this->assertNull($response->getSession()->get('success'));
    }

    // J02: ganti password Penyewa dengan password lama salah -> ditolak.
    public function test_j02_penyewa_password_lama_salah_ditolak(): void
    {
        $penyewa = Penyewa::factory()->create(); // password default 'password', lihat PenyewaFactory

        $this->actingAs($penyewa)->put('/password', [
            'current_password' => 'password-salah',
            'password' => 'passwordBaru1',
            'password_confirmation' => 'passwordBaru1',
        ])->assertSessionHasErrors('current_password');
    }

    // J02: ganti password Penyewa dengan konfirmasi tidak sama -> ditolak.
    public function test_j02_penyewa_konfirmasi_tidak_sama_ditolak(): void
    {
        $penyewa = Penyewa::factory()->create();

        $this->actingAs($penyewa)->put('/password', [
            'current_password' => 'password',
            'password' => 'passwordBaru1',
            'password_confirmation' => 'beda-banget',
        ])->assertSessionHasErrors('password');
    }

    // J02: ganti password Admin (Pengelola) dengan password lama salah -> ditolak.
    public function test_j02_pengelola_password_lama_salah_ditolak(): void
    {
        $admin = Admin::create(['namaAdmin' => 'Admin Satu', 'username' => 'admin1', 'password' => Hash::make('rahasia123')]);

        $this->actingAs($admin, 'admin')->put('/profile-pengelola/password', [
            'current_password' => 'salah',
            'password' => 'passwordBaru1',
            'password_confirmation' => 'passwordBaru1',
        ])->assertSessionHasErrors('current_password');
    }

    // J02: ganti password Admin (Pengelola) dengan konfirmasi tidak sama -> ditolak.
    public function test_j02_pengelola_konfirmasi_tidak_sama_ditolak(): void
    {
        $admin = Admin::create(['namaAdmin' => 'Admin Satu', 'username' => 'admin1', 'password' => Hash::make('rahasia123')]);

        $this->actingAs($admin, 'admin')->put('/profile-pengelola/password', [
            'current_password' => 'rahasia123',
            'password' => 'passwordBaru1',
            'password_confirmation' => 'beda-banget',
        ])->assertSessionHasErrors('password');
    }

    // J03: username Pengelola duplikat -> ditolak.
    public function test_j03_username_pengelola_duplikat_ditolak(): void
    {
        Admin::create(['namaAdmin' => 'Admin Lain', 'username' => 'dipakai', 'password' => Hash::make('rahasia123')]);
        $admin = Admin::create(['namaAdmin' => 'Admin Satu', 'username' => 'admin1', 'password' => Hash::make('rahasia123')]);

        $this->actingAs($admin, 'admin')->patch('/profile-pengelola', [
            'nama' => 'Admin Satu', 'username' => 'dipakai',
        ])->assertSessionHasErrors('username');

        $this->assertDatabaseHas('admins', ['idAdmin' => $admin->idAdmin, 'username' => 'admin1']);
    }
}
