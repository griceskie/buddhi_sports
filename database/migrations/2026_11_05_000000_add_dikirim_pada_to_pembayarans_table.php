<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Waktu penyewa mengirim (atau mengirim ulang) bukti; tglBayar hanya menyimpan tanggal. */
    public function up(): void
    {
        Schema::table('pembayarans', function (Blueprint $table) {
            $table->dateTime('dikirimPada')->nullable()->after('buktiBayar');
        });
    }

    public function down(): void
    {
        Schema::table('pembayarans', function (Blueprint $table) {
            $table->dropColumn('dikirimPada');
        });
    }
};
