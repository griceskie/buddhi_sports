<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Penyewa;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Foto lapangan: diunggah Admin di sheet Lapangan, tampil di Home penyewa. */
class FotoLapanganTest extends TestCase
{
    use RefreshDatabase;

    private Admin $admin;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        $this->admin = Admin::create(['namaAdmin' => 'Budi', 'username' => 'Admin1', 'password' => Hash::make('Admin123')]);
    }

    // PHP di mesin pengembang tidak punya GD, jadi pakai create() dengan MIME gambar, bukan image()
    private function foto(string $nama): UploadedFile
    {
        return UploadedFile::fake()->create($nama, 100, 'image/jpeg');
    }

    private function data(array $tambahan = []): array
    {
        return ['txtnama' => 'Airlangga', 'txtjenis' => 'Bulu Tangkis', 'txttarif' => 50000, 'txtstatus' => 'Tersedia'] + $tambahan;
    }

    private function fotoTersimpan(): array
    {
        return json_decode(DB::table('lapangans')->value('foto'), true);
    }

    public function test_tambah_lapangan_menyimpan_foto_di_disk_public(): void
    {
        $this->actingAs($this->admin, 'admin')
            ->post('/insertlapangan', $this->data(['foto' => [$this->foto('a.jpg'), $this->foto('b.jpg')]]))
            ->assertSessionHasNoErrors();

        $foto = $this->fotoTersimpan();
        $this->assertCount(2, $foto);
        Storage::disk('public')->assertExists($foto);
    }

    public function test_edit_mempertahankan_foto_terpilih_dan_menghapus_sisanya(): void
    {
        $this->actingAs($this->admin, 'admin')->post('/insertlapangan', $this->data(['foto' => [$this->foto('a.jpg'), $this->foto('b.jpg')]]));
        [$a, $b] = $this->fotoTersimpan();
        $id = DB::table('lapangans')->value('idLapangan');

        $this->actingAs($this->admin, 'admin')
            ->post('/updatelapangan', $this->data(['txtid' => $id, 'fotoLama' => [$b, 'lapangan/bukan-milik.jpg'], 'foto' => [$this->foto('c.jpg')]]))
            ->assertSessionHasNoErrors();

        $foto = $this->fotoTersimpan();
        $this->assertCount(2, $foto);
        $this->assertSame($b, $foto[0]);
        Storage::disk('public')->assertMissing($a);
        Storage::disk('public')->assertExists($foto);
    }

    public function test_foto_lebih_dari_enam_ditolak(): void
    {
        $foto = array_map(fn ($i) => $this->foto("f$i.jpg"), range(1, 7));

        $this->actingAs($this->admin, 'admin')
            ->post('/insertlapangan', $this->data(['foto' => $foto]))
            ->assertSessionHasErrors('foto');
        $this->assertSame(0, DB::table('lapangans')->count());
    }

    public function test_home_penyewa_menerima_url_foto(): void
    {
        $this->actingAs($this->admin, 'admin')->post('/insertlapangan', $this->data(['foto' => [$this->foto('a.jpg')]]));
        $penyewa = Penyewa::create(['namaPenyewa' => 'Rina', 'noHp' => '081', 'email' => 'rina@example.com', 'password' => Hash::make('rahasia123')]);

        $this->actingAs($penyewa)->get('/dashboard')->assertInertia(fn (Assert $p) => $p
            ->has('lapangan.0.foto', 1)
            ->where('lapangan.0.foto.0', fn ($url) => str_contains($url, '/storage/lapangan/')));
    }

    public function test_hapus_lapangan_ikut_menghapus_foto(): void
    {
        $this->actingAs($this->admin, 'admin')->post('/insertlapangan', $this->data(['foto' => [$this->foto('a.jpg')]]));
        $foto = $this->fotoTersimpan();

        $this->actingAs($this->admin, 'admin')->get('/deletelapangan/'.DB::table('lapangans')->value('idLapangan'));

        Storage::disk('public')->assertMissing($foto);
    }
}
