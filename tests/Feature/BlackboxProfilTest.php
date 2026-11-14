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
        // flash 'success' -> toast di app.tsx (sejak redesign Profile 2026-11-07)
        $response->assertSessionHas('success', 'Profil disimpan.');
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
        // sejak 2026-11-14 ada toast seperti di Profile penyewa
        $response->assertSessionHas('success', 'Profile disimpan.');
    }

    // J02: ganti password Penyewa dengan data benar -> tersimpan, dengan toast.
    public function test_j02_penyewa_ganti_password_berhasil(): void
    {
        $penyewa = Penyewa::factory()->create(); // password default 'password', lihat PenyewaFactory

        $this->actingAs($penyewa)->put('/password', [
            'current_password' => 'password',
            'password' => 'passwordBaru1',
            'password_confirmation' => 'passwordBaru1',
        ])->assertSessionHasNoErrors()->assertSessionHas('success', 'Password diperbarui.');

        $this->assertTrue(Hash::check('passwordBaru1', $penyewa->fresh()->password));
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

    // J04: ubah profile dan password pengelola -> toast bahasa Indonesia, tercatat di Log aktivitas tanpa isi password.
    public function test_j04_perubahan_profil_pengelola_dicatat(): void
    {
        $admin = \App\Models\Admin::create(['namaAdmin' => 'Budi', 'username' => 'budi1', 'password' => \Illuminate\Support\Facades\Hash::make('rahasia123')]);

        $this->actingAs($admin, 'admin')->patch('/profile-pengelola', ['nama' => 'Budi Santoso', 'username' => 'budi1'])
            ->assertSessionHas('success', 'Profile disimpan.');
        $this->put('/profile-pengelola/password', ['current_password' => 'salah', 'password' => 'baru12345', 'password_confirmation' => 'baru12345'])
            ->assertSessionHasErrors(['current_password' => 'Password saat ini salah.']);
        $this->put('/profile-pengelola/password', ['current_password' => 'rahasia123', 'password' => 'baru12345', 'password_confirmation' => 'baru12345'])
            ->assertSessionHas('success', 'Password diganti. Pakai password baru saat masuk berikutnya.');

        $log = \Illuminate\Support\Facades\DB::table('log_aktivitas')->where('jenisObjek', 'Profil')->orderBy('id')->get();
        $this->assertCount(2, $log);
        $this->assertStringContainsString('Budi Santoso', $log[0]->rincian);
        $this->assertStringNotContainsString('baru12345', $log[1]->rincian);
    }
}
