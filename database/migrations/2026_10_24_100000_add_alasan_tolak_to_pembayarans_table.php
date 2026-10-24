<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Alasan wajib dari Admin saat menolak bukti; ditampilkan ke penyewa dan dikosongkan lagi saat bukti diunggah ulang. */
    public function up(): void
    {
        Schema::table('pembayarans', function (Blueprint $table) {
            $table->string('alasanTolak', 500)->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('pembayarans', function (Blueprint $table) {
            $table->dropColumn('alasanTolak');
        });
    }
};
