<?php

namespace Tests\Feature;

use App\Support\FotoLapangan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/** Perintah lapangan:foto-contoh memasang foto dari database/foto-contoh ke lapangan tanpa foto. */
class FotoContohLapanganTest extends TestCase
{
    use RefreshDatabase;

    private function lapangan(string $nama, string $jenis, ?array $foto = null): int
    {
        return DB::table('lapangans')->insertGetId([
            'namaLapangan' => $nama,
            'jenisLapangan' => $jenis,
            'tarifPerJam' => 50000,
            'status' => 'Tersedia',
            'foto' => $foto ? json_encode($foto) : null,
        ]);
    }

    private function foto(int $id): array
    {
        return FotoLapangan::paths(DB::table('lapangans')->where('idLapangan', $id)->value('foto'));
    }

    public function test_lapangan_tanpa_foto_diberi_lima_foto_dan_yang_sudah_punya_dibiarkan(): void
    {
        Storage::fake('public');
        $a = $this->lapangan('Airlangga', 'Bulu Tangkis');
        $b = $this->lapangan('Cendrawasih', 'Bulu Tangkis');
        $basket = $this->lapangan('Basket', 'Basket');
        $punya = $this->lapangan('Gajah Mada', 'Bulu Tangkis', ['lapangan/milik-admin.jpg']);

        $this->artisan('lapangan:foto-contoh')->expectsOutput('3 lapangan diberi foto contoh.')->assertSuccessful();

        foreach ([$a, $b, $basket] as $id) {
            $this->assertCount(5, $this->foto($id));
            foreach ($this->foto($id) as $path) {
                Storage::disk('public')->assertExists($path);
            }
        }
        $this->assertSame(['lapangan/milik-admin.jpg'], $this->foto($punya));

        // lapangan sejenis berikutnya memulai dari foto kedua
        $this->assertSame(
            Storage::disk('public')->get($this->foto($a)[1]),
            Storage::disk('public')->get($this->foto($b)[0]),
        );
    }

    public function test_opsi_timpa_mengganti_foto_lama(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('lapangan/lama.jpg', 'x');
        $id = $this->lapangan('Airlangga', 'Bulu Tangkis', ['lapangan/lama.jpg']);

        $this->artisan('lapangan:foto-contoh', ['--timpa' => true])->assertSuccessful();

        $this->assertCount(5, $this->foto($id));
        Storage::disk('public')->assertMissing('lapangan/lama.jpg');
    }
}
