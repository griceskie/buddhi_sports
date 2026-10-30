<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** true bila penyewa sendiri yang membatalkan; false untuk batal otomatis atau oleh Admin. */
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->boolean('dibatalkanPenyewa')->default(false)->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn('dibatalkanPenyewa');
        });
    }
};
