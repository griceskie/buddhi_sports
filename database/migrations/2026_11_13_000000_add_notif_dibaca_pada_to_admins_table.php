<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Kapan Admin terakhir menekan "Tandai sudah dibaca" di notifikasi header; per akun, jadi berlaku di semua perangkat. */
    public function up(): void
    {
        Schema::table('admins', function (Blueprint $table) {
            $table->dateTime('notifDibacaPada')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('admins', function (Blueprint $table) {
            $table->dropColumn('notifDibacaPada');
        });
    }
};
