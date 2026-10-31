<?php

namespace Tests\Feature;

use App\Models\Penyewa;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * Kasus uji A01-A09 di blackbox-testing.md (Autentikasi Penyewa).
 */
class BlackboxAutentikasiPenyewaTest extends TestCase
{
    use RefreshDatabase;

    // A01: Register dengan data lengkap dan valid -> akun dibuat, masuk ke Home.
    public function test_a01_register_data_valid(): void
    {
        $response = $this->post('/register', [
            'namaPenyewa' => 'Budi Santoso',
            'noHp' => '081234567890',
            'email' => 'budi@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
        $this->assertDatabaseHas('penyewas', ['email' => 'budi@example.com']);
    }

    // A02: Register dengan field kosong -> pesan wajib diisi per field.
    public function test_a02_register_field_kosong(): void
    {
        $response = $this->post('/register', [
            'namaPenyewa' => '',
            'noHp' => '',
            'email' => '',
            'password' => '',
        ]);

        $response->assertSessionHasErrors(['namaPenyewa', 'noHp', 'email', 'password']);
        $this->assertGuest();
    }

    // A03: Email salah format / sudah terdaftar -> ditolak dengan pesan error.
    public function test_a03_register_email_salah_format(): void
    {
        $response = $this->post('/register', [
            'namaPenyewa' => 'Budi Santoso',
            'noHp' => '081234567890',
            'email' => 'bukan-email',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_a03_register_email_sudah_terdaftar(): void
    {
        Penyewa::factory()->create(['email' => 'sudah@example.com']);

        $response = $this->post('/register', [
            'namaPenyewa' => 'Budi Santoso',
            'noHp' => '081234567890',
            'email' => 'sudah@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    // A04: Konfirmasi password tidak sama / password terlalu pendek -> ditolak.
    public function test_a04_register_konfirmasi_password_tidak_sama(): void
    {
        $response = $this->post('/register', [
            'namaPenyewa' => 'Budi Santoso',
            'noHp' => '081234567890',
            'email' => 'budi2@example.com',
            'password' => 'password123',
            'password_confirmation' => 'beda123456',
        ]);

        $response->assertSessionHasErrors('password');
        $this->assertGuest();
    }

    public function test_a04_register_password_terlalu_pendek(): void
    {
        $response = $this->post('/register', [
            'namaPenyewa' => 'Budi Santoso',
            'noHp' => '081234567890',
            'email' => 'budi3@example.com',
            'password' => 'abc',
            'password_confirmation' => 'abc',
        ]);

        $response->assertSessionHasErrors('password');
        $this->assertGuest();
    }

    // A05: Login dengan email dan password benar -> masuk ke /dashboard.
    public function test_a05_login_benar(): void
    {
        $penyewa = Penyewa::factory()->create();

        $response = $this->post('/login', [
            'email' => $penyewa->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    // A06: Login dengan password salah / email tidak terdaftar -> pesan "kredensial salah".
    public function test_a06_login_password_salah(): void
    {
        $penyewa = Penyewa::factory()->create();

        $response = $this->post('/login', [
            'email' => $penyewa->email,
            'password' => 'password-salah',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_a06_login_email_tidak_terdaftar(): void
    {
        $response = $this->post('/login', [
            'email' => 'tidak-ada@example.com',
            'password' => 'apapun123',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    // A07: Login gagal berulang kali (5x lebih) -> akun dikunci sementara (throttle).
    public function test_a07_login_berulang_kali_kena_throttle(): void
    {
        $penyewa = Penyewa::factory()->create();

        for ($i = 0; $i < 5; $i++) {
            $this->post('/login', [
                'email' => $penyewa->email,
                'password' => 'password-salah',
            ]);
        }

        // Percobaan ke-6 harus kena rate limit, bukan lagi pesan kredensial salah biasa.
        $response = $this->post('/login', [
            'email' => $penyewa->email,
            'password' => 'password-salah',
        ]);

        $response->assertSessionHasErrors('email');
        $pesan = session('errors')->first('email');
        $this->assertStringContainsString('Too many login attempts', $pesan);
        $this->assertGuest();
    }

    // A08: Lupa password, lalu email dikirim.
    public function test_a08_lupa_password_mengirim_notifikasi(): void
    {
        Notification::fake();

        $penyewa = Penyewa::factory()->create();

        $this->post('/forgot-password', ['email' => $penyewa->email]);

        Notification::assertSentTo($penyewa, ResetPassword::class);
    }

    // A09: Logout -> diarahkan ke /login.
    public function test_a09_logout(): void
    {
        $penyewa = Penyewa::factory()->create();

        $response = $this->actingAs($penyewa)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect('/login');
    }
}
