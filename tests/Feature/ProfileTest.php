<?php

namespace Tests\Feature;

use App\Models\Penyewa;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_page_is_displayed(): void
    {
        $user = Penyewa::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get('/profile');

        $response->assertOk();
    }

    public function test_profile_information_can_be_updated(): void
    {
        $user = Penyewa::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'namaPenyewa' => 'Test User',
                'noHp' => '081234567890',
                'email' => 'test@example.com',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $user->refresh();

        $this->assertSame('Test User', $user->namaPenyewa);
        $this->assertSame('081234567890', $user->noHp);
        $this->assertSame('test@example.com', $user->email);
    }

    // Penyewa tidak punya verifikasi email (tidak ada kolom email_verified_at), jadi yang diuji: email yang sama tetap tersimpan
    public function test_email_is_unchanged_when_the_email_address_is_unchanged(): void
    {
        $user = Penyewa::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'namaPenyewa' => 'Test User',
                'noHp' => $user->noHp,
                'email' => $user->email,
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $this->assertSame($user->email, $user->refresh()->email);
    }

    public function test_user_can_delete_their_account(): void
    {
        $user = Penyewa::factory()->create();

        $response = $this
            ->actingAs($user)
            ->delete('/profile', [
                'password' => 'password',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/');

        $this->assertGuest();
        $this->assertNull($user->fresh());
    }

    public function test_correct_password_must_be_provided_to_delete_account(): void
    {
        $user = Penyewa::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from('/profile')
            ->delete('/profile', [
                'password' => 'wrong-password',
            ]);

        $response
            ->assertSessionHasErrors('password')
            ->assertRedirect('/profile');

        $this->assertNotNull($user->fresh());
    }
}
