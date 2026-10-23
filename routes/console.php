<?php

use App\Support\Pemesanan;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('booking:batalkan-kedaluwarsa', function () {
    $this->info(Pemesanan::batalkanKedaluwarsa().' booking dibatalkan.');
})->purpose('Batalkan booking Dipesan yang belum mengunggah bukti setelah batas bayar');

Schedule::command('booking:batalkan-kedaluwarsa')->everyMinute();
