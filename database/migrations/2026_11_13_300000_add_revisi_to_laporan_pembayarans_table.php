<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Manager bisa meminta revisi laporan: catatan dan waktunya; dikosongkan lagi saat Admin membuat ulang laporan. */
    public function up(): void
    {
        Schema::table('laporan_pembayarans', function (Blueprint $table) {
            $table->text('catatanRevisi')->nullable();
            $table->timestamp('revisiPada')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('laporan_pembayarans', function (Blueprint $table) {
            $table->dropColumn(['catatanRevisi', 'revisiPada']);
        });
    }
};
