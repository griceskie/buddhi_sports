<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Data dasar yang selalu dibutuhkan: akun Manager dan Admin (sama dengan PRD, Appendices) dan empat lapangan.
 * Aman dijalankan ulang: baris yang sudah ada tidak digandakan. Data contoh untuk pengujian ada di DemoSeeder.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (! DB::table('managers')->where('username', 'Manager1')->exists()) {
            DB::table('managers')->insert(['namaManager' => 'Jarwo', 'username' => 'Manager1', 'password' => Hash::make('Manager123')]);
        }
        if (! DB::table('admins')->where('username', 'Admin1')->exists()) {
            DB::table('admins')->insert(['namaAdmin' => 'Budi', 'username' => 'Admin1', 'password' => Hash::make('Admin123')]);
        }

        // 3 hall bulu tangkis dan 1 lapangan basket (PRD)
        foreach ([
            ['Airlangga', 'Bulu Tangkis', 50000],
            ['Cendrawasih', 'Bulu Tangkis', 50000],
            ['Garuda', 'Bulu Tangkis', 50000],
            ['Merpati', 'Basket', 100000],
        ] as [$nama, $jenis, $tarif]) {
            if (! DB::table('lapangans')->where('namaLapangan', $nama)->exists()) {
                DB::table('lapangans')->insert(['namaLapangan' => $nama, 'jenisLapangan' => $jenis, 'tarifPerJam' => $tarif, 'status' => 'Tersedia']);
            }
        }
    }
}
