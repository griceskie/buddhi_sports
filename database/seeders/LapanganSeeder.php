<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LapanganSeeder extends Seeder
{
    /**
     * 3 hall bulu tangkis dan 1 lapangan basket (PRD).
     */
    public function run(): void
    {
        $lapangan = [
            ['Lapangan Bulu Tangkis 1', 'Bulu Tangkis', 50000],
            ['Lapangan Bulu Tangkis 2', 'Bulu Tangkis', 50000],
            ['Lapangan Bulu Tangkis 3', 'Bulu Tangkis', 50000],
            ['Lapangan Basket', 'Basket', 100000],
        ];

        foreach ($lapangan as [$nama, $jenis, $tarif]) {
            DB::table('lapangans')->updateOrInsert(
                ['namaLapangan' => $nama],
                ['jenisLapangan' => $jenis, 'tarifPerJam' => $tarif, 'status' => 'Kosong'],
            );
        }
    }
}
