<?php

use App\Http\Controllers\LogAktivitasController;
use App\Support\FotoLapangan;
use App\Support\LogAktivitas;
use App\Support\Pemesanan;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\File;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('booking:batalkan-kedaluwarsa', function () {
    $this->info(Pemesanan::batalkanKedaluwarsa().' booking dibatalkan.');
})->purpose('Batalkan booking Dipesan yang belum mengunggah bukti setelah batas bayar');

Artisan::command('log:periksa {--penuh : Telusuri dari entri pertama, bukan dari titik terakhir yang lolos}', function () {
    // titik terakhir yang lolos disimpan supaya pemeriksaan harian hanya menelusuri entri baru
    $titik = Cache::get(LogAktivitasController::CACHE_TITIK);
    $mulai = $this->option('penuh') ? null : $titik;
    $hasil = LogAktivitas::periksa($mulai['id'] ?? 0, $mulai['hash'] ?? LogAktivitas::AWAL);
    if ($hasil['utuh'] && ! LogAktivitas::titikMasihAda($titik)) {
        $hasil = [...$hasil, 'utuh' => false, 'rusakPada' => $titik['id']];
    }
    Cache::forever(LogAktivitasController::CACHE_PERIKSA, [...$hasil, 'waktu' => now()->toIso8601String()]);

    if (! $hasil['utuh']) {
        $this->error('Log tidak utuh: rantai putus di entri #'.$hasil['rusakPada'].'.');

        return 1;
    }
    if ($hasil['idTerakhir']) {
        Cache::forever(LogAktivitasController::CACHE_TITIK, ['id' => $hasil['idTerakhir'], 'hash' => $hasil['hashTerakhir']]);
    }
    $this->info('Log utuh: '.$hasil['diperiksa'].' entri baru diperiksa.');
})->purpose('Periksa rantai hash log aktivitas');

// Manager tidak bisa direset dari aplikasi (tidak ada peran di atasnya); pemilik server memakai perintah ini
Artisan::command('manager:reset-password {username}', function (string $username) {
    $manager = DB::table('managers')->where('username', $username)->first(['idManager', 'namaManager']);
    if (! $manager) {
        $this->error('Manager dengan username '.$username.' tidak ada.');

        return 1;
    }
    $baru = (string) $this->secret('Password baru');
    $ulang = (string) $this->secret('Ulangi password baru');
    $cek = Validator::make(['password' => $baru, 'password_confirmation' => $ulang], ['password' => ['required', 'confirmed', Password::defaults()]]);
    if ($cek->fails()) {
        $this->error($cek->errors()->first('password'));

        return 1;
    }

    DB::transaction(function () use ($manager, $username, $baru) {
        DB::table('managers')->where('idManager', $manager->idManager)->update(['password' => Hash::make($baru)]);
        LogAktivitas::catat('reset', 'Akun', $username, [['Password', '••••••', 'diganti']], 'Lewat perintah artisan di server', olehSistem: true);
    });
    // sesi Manager yang sedang login berakhir di permintaan berikutnya (middleware auth.session)
    $this->info('Password '.$manager->namaManager.' diganti.');
})->purpose('Ganti password Manager dari server');

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
Schedule::command('log:periksa')->dailyAt('02:00');
// sekali seminggu dari entri pertama: menangkap baris lama yang diubah di luar aplikasi
Schedule::command('log:periksa --penuh')->weeklyOn(0, '03:00');
