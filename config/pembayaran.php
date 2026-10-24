<?php

return [

    // Rekening tujuan transfer yang ditampilkan ke penyewa. Isi dengan data asli di .env.
    'bank' => env('BANK_NAMA', 'BCA'),
    'nomor_rekening' => env('BANK_NO_REKENING', '0000000000'),
    'atas_nama' => env('BANK_ATAS_NAMA', 'Buddhi Sports'),

    // Booking yang belum mengunggah bukti dibatalkan setelah sekian menit sejak dipesan.
    'batas_bayar_menit' => 60,

];
