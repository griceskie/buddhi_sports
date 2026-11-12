<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Log aktivitas: hanya bisa ditambah. Tanpa foreign key (nama disalin sebagai teks), supaya menghapus data
     * tidak mengubah riwayatnya. Trigger menolak UPDATE dan DELETE di database, apa pun aplikasinya; hash berantai
     * (hashSebelumnya -> hash) membuat perubahan langsung di luar aplikasi ketahuan. Lihat App\Support\LogAktivitas.
     */
    public function up(): void
    {
        Schema::create('log_aktivitas', function (Blueprint $table) {
            $table->id();
            $table->dateTime('waktu');
            $table->unsignedBigInteger('idAdmin')->nullable();
            $table->string('namaAdmin');
            $table->string('aksi', 20);
            $table->string('jenisObjek', 30);
            $table->string('kodeObjek');
            $table->string('ringkasan');
            $table->text('rincian');
            $table->string('catatan')->nullable();
            $table->char('hashSebelumnya', 64);
            $table->char('hash', 64);
            $table->index('waktu');
        });

        $pesan = 'log_aktivitas hanya bisa ditambah, tidak bisa diubah atau dihapus';
        if (DB::getDriverName() === 'mysql' || DB::getDriverName() === 'mariadb') {
            DB::unprepared("CREATE TRIGGER log_aktivitas_tolak_ubah BEFORE UPDATE ON log_aktivitas FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '$pesan'");
            DB::unprepared("CREATE TRIGGER log_aktivitas_tolak_hapus BEFORE DELETE ON log_aktivitas FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '$pesan'");
        } elseif (DB::getDriverName() === 'sqlite') {
            DB::unprepared("CREATE TRIGGER log_aktivitas_tolak_ubah BEFORE UPDATE ON log_aktivitas BEGIN SELECT RAISE(ABORT, '$pesan'); END");
            DB::unprepared("CREATE TRIGGER log_aktivitas_tolak_hapus BEFORE DELETE ON log_aktivitas BEGIN SELECT RAISE(ABORT, '$pesan'); END");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('log_aktivitas');
    }
};
