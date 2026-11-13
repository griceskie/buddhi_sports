<?php

return [
    /*
    | Panel pratinjau di halaman login pengelola hanya menampilkan tingkat ("tidak ada", "ada", "banyak"),
    | tidak pernah jumlah, nama atau nominal, karena halaman itu bisa dibuka siapa saja sebelum login.
    | "banyak" mulai dari angka di bawah: Admin = pembayaran menunggu verifikasi, Manager = laporan belum diperiksa.
    */
    'ambang_banyak' => [
        'admin' => 5,
        'manager' => 2,
    ],

    // Lama hasil status disimpan di cache, supaya halaman publik tidak menekan database.
    'cache_status_detik' => 300,
];
