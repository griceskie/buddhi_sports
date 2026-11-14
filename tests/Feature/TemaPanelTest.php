<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Manager;
use App\Models\Penyewa;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Tema panel pengelola (terang/gelap) untuk Admin, Manager, dan halaman login pengelola; penyewa tidak. */
class TemaPanelTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_dan_login_pengelola_memakai_tema_panel(): void
    {
        $this->get('/login-pengelola')
            ->assertSee('class="tema-pengelola"', false)
            ->assertSee('tema_pengelola', false)
            ->assertInertia(fn (Assert $page) => $page->where('temaPanel', true));

        $admin = Admin::create(['namaAdmin' => 'Budi', 'username' => 'Admin1', 'password' => Hash::make('Admin123')]);
        $this->actingAs($admin, 'admin')->get('/profile-pengelola')
            ->assertInertia(fn (Assert $page) => $page->where('temaPanel', true));
    }

    public function test_manager_memakai_tema_panel(): void
    {
        $manager = Manager::create(['namaManager' => 'Jarwo', 'username' => 'Manager1', 'password' => Hash::make('Manager123')]);
        $this->actingAs($manager, 'manager')->get('/profile-pengelola')
            ->assertSee('class="tema-pengelola"', false)
            ->assertInertia(fn (Assert $page) => $page->where('temaPanel', true));
    }

    public function test_penyewa_tidak_memakai_tema_panel(): void
    {
        $this->get('/login')
            ->assertDontSee('tema-pengelola', false)
            ->assertInertia(fn (Assert $page) => $page->where('temaPanel', false));

        $penyewa = Penyewa::create(['namaPenyewa' => 'Rina', 'noHp' => '081', 'email' => 'rina@example.com', 'password' => Hash::make('rahasia123')]);
        $this->actingAs($penyewa)->get('/profile')
            ->assertInertia(fn (Assert $page) => $page->where('temaPanel', false));

    }
}
