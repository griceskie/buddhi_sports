<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Status booking kini hanya Dipesan / Dikonfirmasi / Dibatalkan. Dibayar adalah status lama Admin
     * yang artinya sama dengan Dikonfirmasi (sama-sama menahan jam).
     */
    public function up(): void
    {
        DB::table('bookings')->where('status', 'Dibayar')->update(['status' => 'Dikonfirmasi']);
    }

    public function down(): void
    {
        // Tidak bisa dibedakan lagi mana yang dulu Dibayar.
    }
};
