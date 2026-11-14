<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Siapa pelakunya: admin, manager, atau sistem. Baris lama dibiarkan null (dibaca dari idAdmin: ada = admin,
     * kosong = sistem); trigger hanya menolak UPDATE/DELETE, jadi ADD COLUMN nullable tidak menyentuh baris lama.
     */
    public function up(): void
    {
        Schema::table('log_aktivitas', function (Blueprint $table) {
            $table->string('peran', 10)->nullable();
            $table->index('peran');
        });
    }

    public function down(): void
    {
        Schema::table('log_aktivitas', function (Blueprint $table) {
            $table->dropIndex(['peran']);
            $table->dropColumn('peran');
        });
    }
};
