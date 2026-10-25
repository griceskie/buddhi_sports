<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Diisi saat Manager menandai laporan sudah diperiksa; sejak itu laporan tidak bisa dibuat ulang, diedit, atau dihapus. */
    public function up(): void
    {
        Schema::table('laporan_pembayarans', function (Blueprint $table) {
            $table->dateTime('diperiksaPada')->nullable()->after('filePdf');
        });
    }

    public function down(): void
    {
        Schema::table('laporan_pembayarans', function (Blueprint $table) {
            $table->dropColumn('diperiksaPada');
        });
    }
};
