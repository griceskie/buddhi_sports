<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Manager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/** Celah 8.1 (batas percobaan login pengelola) dan B1 (sesi Admin berakhir saat password-nya direset). */
class KeamananLoginPengelolaTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_pengelola_dibatasi_lima_percobaan_salah_per_menit(): void
    {
        Admin::create(['namaAdmin' => 'Budi', 'username' => 'admin1', 'password' => Hash::make('rahasia123')]);
        $coba = fn (string $pw) => $this->from('/login-pengelola')->post('/login-pengelola', ['role' => 'admin', 'username' => 'admin1', 'password' => $pw]);

        for ($i = 0; $i < 5; $i++) {
            $coba('salah')->assertSessionHasErrors(['password' => 'Username atau password salah.']);
        }
        // percobaan keenam ditolak walau passwordnya benar
        $coba('rahasia123')->assertSessionHasErrors('password');
        $this->assertStringStartsWith('Terlalu banyak percobaan masuk', session('errors')->first('password'));
        $this->assertGuest('admin');

        // semenit kemudian boleh lagi, dan login berhasil mengosongkan hitungan
        $this->travel(61)->seconds();
        $coba('rahasia123')->assertRedirect(route('dashboard.admin'));
    }

    public function test_sesi_admin_berakhir_saat_manager_mereset_passwordnya(): void
    {
        $admin = Admin::create(['namaAdmin' => 'Budi', 'username' => 'admin1', 'password' => Hash::make('rahasia123')]);
        $manager = Manager::create(['namaManager' => 'Jarwo', 'username' => 'manager1', 'password' => Hash::make('rahasia123')]);

        $this->actingAs($admin, 'admin')->get('/dashboard-admin')->assertOk();

        // Manager mereset password Admin dari perangkat lain
        $this->actingAs($manager, 'manager')->put("/manager/admin/{$admin->idAdmin}/password", ['password' => 'barubaru1'])->assertSessionHasNoErrors();
        $admin->refresh();

        $this->actingAs($admin, 'admin')->get('/dashboard-admin')->assertRedirect(route('login.pengelola'));
    }

    public function test_ganti_password_sendiri_tidak_mengeluarkan_sesi_yang_dipakai(): void
    {
        $admin = Admin::create(['namaAdmin' => 'Budi', 'username' => 'admin1', 'password' => Hash::make('rahasia123')]);

        $this->actingAs($admin, 'admin')->get('/profile-pengelola')->assertOk();
        $this->put('/profile-pengelola/password', ['current_password' => 'rahasia123', 'password' => 'barubaru1', 'password_confirmation' => 'barubaru1'])
            ->assertSessionHasNoErrors();
        $this->get('/profile-pengelola')->assertOk();
    }
}
