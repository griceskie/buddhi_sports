<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('laporan_pembayarans', function (Blueprint $table) {
            $table->string('namaLaporan')->nullable()->after('idPembayaran');
            // path PDF di disk 'local' (privat), diunduh lewat route yang dijaga login Admin/Manager
            $table->string('filePdf')->nullable()->after('namaLaporan');
        });
    }

    public function down(): void
    {
        Schema::table('laporan_pembayarans', function (Blueprint $table) {
            $table->dropColumn(['namaLaporan', 'filePdf']);
        });
    }
};
