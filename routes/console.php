<?php

use App\Support\JadwalBooking;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('booking:batalkan-kedaluwarsa', function () {
    $jumlah = JadwalBooking::kedaluwarsa()->update(['status' => 'Dibatalkan']);
    $this->info("{$jumlah} booking dibatalkan.");
})->purpose('Batalkan booking Dipesan yang belum dibayar lewat '.JadwalBooking::BATAS_BAYAR_MENIT.' menit');

Schedule::command('booking:batalkan-kedaluwarsa')->everyMinute();
