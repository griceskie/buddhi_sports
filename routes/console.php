<?php

use App\Support\FotoLapangan;
use App\Support\Pemesanan;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\File;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Storage;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('booking:batalkan-kedaluwarsa', function () {
    $this->info(Pemesanan::batalkanKedaluwarsa().' booking dibatalkan.');
})->purpose('Batalkan booking Dipesan yang belum mengunggah bukti setelah batas bayar');

Artisan::command('lapangan:foto-contoh {--timpa : Ganti juga foto lapangan yang sudah ada}', function () {
    if (app()->isProduction() && ! $this->confirm('Ini lingkungan production. Tetap pasang foto contoh?')) {
        return;
    }

    // 5 foto per jenis; lapangan sejenis memakai foto yang sama dengan urutan bergeser
    $awalan = ['Bulu Tangkis' => 'bulu-tangkis', 'Basket' => 'basket'];
    $keBerapa = [];
    $dipasang = 0;

    foreach (DB::table('lapangans')->orderBy('idLapangan')->get() as $l) {
        $nama = $awalan[$l->jenisLapangan] ?? null;
        $lama = FotoLapangan::paths($l->foto);
        if (! $nama || ($lama && ! $this->option('timpa'))) {
            continue;
        }

        $n = $keBerapa[$nama] = ($keBerapa[$nama] ?? -1) + 1;
        $paths = [];
        foreach (range(0, 4) as $k) {
            $file = database_path("foto-contoh/{$nama}-".((($k + $n) % 5) + 1).'.webp');
            $paths[] = Storage::disk('public')->putFile('lapangan', new File($file));
        }

        Storage::disk('public')->delete($lama);
        DB::table('lapangans')->where('idLapangan', $l->idLapangan)->update(['foto' => json_encode($paths)]);
        $dipasang++;
    }

    $this->info("{$dipasang} lapangan diberi foto contoh.");
})->purpose('Pasang foto contoh (database/foto-contoh) ke lapangan yang belum punya foto, untuk development');

Schedule::command('booking:batalkan-kedaluwarsa')->everyMinute();
