<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

return new class extends Migration
{
    /**
     * Bukti bayar pindah dari disk public (bisa dibuka siapa saja lewat /storage) ke disk local (privat).
     * Path di pembayarans.buktiBayar tetap sama ("bukti/xxx.jpg"), hanya filenya yang dipindah.
     */
    public function up(): void
    {
        $this->pindahkan('public', 'local');
    }

    public function down(): void
    {
        $this->pindahkan('local', 'public');
    }

    private function pindahkan(string $dari, string $ke): void
    {
        foreach (DB::table('pembayarans')->whereNotNull('buktiBayar')->pluck('buktiBayar') as $path) {
            if (Storage::disk($dari)->exists($path) && ! Storage::disk($ke)->exists($path)) {
                Storage::disk($ke)->put($path, Storage::disk($dari)->get($path));
                Storage::disk($dari)->delete($path);
            }
        }
    }
};
