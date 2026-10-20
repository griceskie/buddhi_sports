<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // waktu booking dibuat penyewa: dasar batas bayar 2 jam
            $table->timestamp('created_at')->nullable();
            // ketersediaan dicari per lapangan per tanggal
            $table->index(['idLapangan', 'tanggal'], 'bookings_lapangan_tanggal_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // MySQL bisa membuang indeks bawaan foreign key setelah indeks gabungan dibuat,
            // jadi indeks idLapangan dipasang lagi sebelum indeks gabungan dihapus
            $table->index('idLapangan');
            $table->dropIndex('bookings_lapangan_tanggal_index');
            $table->dropColumn('created_at');
        });
    }
};
