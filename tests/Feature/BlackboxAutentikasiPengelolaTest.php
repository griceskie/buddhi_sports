<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Manager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Kasus uji B01-B04 di blackbox-testing.md (Autentikasi Pengelola).
 */
class BlackboxAutentikasiPengelolaTest extends TestCase
{
    use RefreshDatabase;

    private function buatAdmin(string $username = 'admin1', string $password = 'rahasia123'): Admin
    {
        return Admin::create([
            'namaAdmin' => 'Admin Satu',
            'username' => $username,
            'password' => Hash::make($password),
        ]);
    }

    private function buatManager(string $username = 'manager1', string $password = 'rahasia123'): Manager
    {
        return Manager::create([
            'namaManager' => 'Manager Satu',
            'username' => $username,
            'password' => Hash::make($password),
        ]);
    }

    // B01: Tab Admin, username dan password benar -> masuk ke /dashboard-admin.
    public function test_b01_login_admin_benar(): void
    {
        $this->buatAdmin();

        $response = $this->post('/login-pengelola', [
            'role' => 'admin',
            'username' => 'admin1',
            'password' => 'rahasia123',
        ]);

        $this->assertAuthenticated('admin');
        $response->assertRedirect(route('dashboard.admin'));
    }

    // B02: Tab Manager, username dan password benar -> masuk ke /dashboard-manager.
    public function test_b02_login_manager_benar(): void
    {
        $this->buatManager();

        $response = $this->post('/login-pengelola', [
            'role' => 'manager',
            'username' => 'manager1',
            'password' => 'rahasia123',
        ]);

        $this->assertAuthenticated('manager');
        $response->assertRedirect(route('dashboard.manager'));
    }

    // B03: akun Admin dipakai login di tab Manager -> ditolak.
    public function test_b03_akun_admin_dipakai_di_tab_manager(): void
    {
        $this->buatAdmin('admin1', 'rahasia123');

        $response = $this->post('/login-pengelola', [
            'role' => 'manager',
            'username' => 'admin1',
            'password' => 'rahasia123',
        ]);

        $response->assertSessionHasErrors('password');
        $this->assertGuest('admin');
        $this->assertGuest('manager');
    }

    // B03: akun Manager dipakai login di tab Admin -> ditolak.
    public function test_b03_akun_manager_dipakai_di_tab_admin(): void
    {
        $this->buatManager('manager1', 'rahasia123');

        $response = $this->post('/login-pengelola', [
            'role' => 'admin',
            'username' => 'manager1',
            'password' => 'rahasia123',
        ]);

        $response->assertSessionHasErrors('password');
        $this->assertGuest('admin');
        $this->assertGuest('manager');
    }

    // B04: field kosong -> pesan error wajib diisi.
    public function test_b04_field_kosong(): void
    {
        $response = $this->post('/login-pengelola', [
            'role' => '',
            'username' => '',
            'password' => '',
        ]);

        $response->assertSessionHasErrors(['role', 'username', 'password']);
        $this->assertGuest('admin');
        $this->assertGuest('manager');
    }

    // B04: password salah -> pesan error.
    public function test_b04_password_salah(): void
    {
        $this->buatAdmin('admin1', 'rahasia123');

        $response = $this->post('/login-pengelola', [
            'role' => 'admin',
            'username' => 'admin1',
            'password' => 'salah',
        ]);

        $response->assertSessionHasErrors('password');
        $this->assertGuest('admin');
    }
}
