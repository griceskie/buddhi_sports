<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Status lapangan kini hanya Tersedia / Perbaikan. Ketersediaan per jam dihitung dari booking,
     * jadi status lama Kosong dan Terbooking sama-sama berarti lapangan bisa dipakai.
     */
    public function up(): void
    {
        DB::table('lapangans')->whereIn('status', ['Kosong', 'Terbooking'])->update(['status' => 'Tersedia']);
    }

    public function down(): void
    {
        DB::table('lapangans')->where('status', 'Tersedia')->update(['status' => 'Kosong']);
    }
};
