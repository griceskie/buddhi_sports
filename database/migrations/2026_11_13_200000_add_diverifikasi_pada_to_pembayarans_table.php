<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Kapan pembayaran diterima Admin; dipakai KPI "Terverifikasi hari ini" (tglBayar hanya tanggal unggah). */
    public function up(): void
    {
        Schema::table('pembayarans', function (Blueprint $table) {
            $table->dateTime('diverifikasiPada')->nullable()->after('dikirimPada');
        });
    }

    public function down(): void
    {
        Schema::table('pembayarans', function (Blueprint $table) {
            $table->dropColumn('diverifikasiPada');
        });
    }
};
