<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Daftar path foto lapangan (JSON) di disk public, folder lapangan/. Foto pertama = foto utama. */
    public function up(): void
    {
        Schema::table('lapangans', function (Blueprint $table) {
            $table->json('foto')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('lapangans', function (Blueprint $table) {
            $table->dropColumn('foto');
        });
    }
};
