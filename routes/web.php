<?php

use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\Auth\PengelolaAuthenticatedSessionController;
use App\Http\Controllers\Auth\PengelolaProfileController;
use App\Http\Controllers\BookingPenyewaController;
use App\Http\Controllers\BuktiBayarController;
use App\Http\Controllers\LaporanPembayaranController;
use App\Http\Controllers\ManagerController;
use App\Http\Controllers\MasterBookingController;
use App\Http\Controllers\MasterLapanganController;
use App\Http\Controllers\MasterLaporanPembayaranController;
use App\Http\Controllers\MasterPembayaranController;
use App\Http\Controllers\MasterPenyewaController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/test', function () {
    return Inertia::render('Test');
});
// Penyewa: pesan lapangan, bayar, dan Booking saya
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [BookingPenyewaController::class, 'home'])->name('dashboard');
    Route::get('/booking', [BookingPenyewaController::class, 'daftar'])->name('booking');
    Route::post('/booking', [BookingPenyewaController::class, 'store'])->name('booking.store');
    Route::get('/booking/{idBooking}/bayar', [BookingPenyewaController::class, 'bayar'])->whereNumber('idBooking')->name('booking.bayar');
    Route::post('/booking/{idBooking}/bukti', [BookingPenyewaController::class, 'unggahBukti'])->whereNumber('idBooking')->name('booking.bukti');
});

// Penyewa (mahasiswa / masyarakat umum)
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Login Admin & Manager (dua tab, satu halaman)
Route::middleware('guest')->group(function () {
    Route::get('/login-pengelola', [PengelolaAuthenticatedSessionController::class, 'create'])->name('login.pengelola');
    Route::post('/login-pengelola', [PengelolaAuthenticatedSessionController::class, 'store']);
});
Route::post('/logout-pengelola', [PengelolaAuthenticatedSessionController::class, 'destroy'])->name('logout.pengelola');

// bukti transfer privat: penyewa pemilik, Admin, atau Manager (dicek di controller)
Route::get('/pembayaran/{idPembayaran}/bukti', [BuktiBayarController::class, 'tampil'])
    ->middleware('auth:web,admin,manager')->whereNumber('idPembayaran')->name('pembayaran.bukti');

// Profil Admin & Manager (guard yang login otomatis dipakai oleh $request->user())
Route::middleware('auth:admin,manager')->group(function () {
    Route::get('/profile-pengelola', [PengelolaProfileController::class, 'edit'])->name('profile.pengelola');
    Route::patch('/profile-pengelola', [PengelolaProfileController::class, 'update'])->name('profile.pengelola.update');
    Route::put('/profile-pengelola/password', [PengelolaProfileController::class, 'updatePassword'])->name('profile.pengelola.password');
    // PDF laporan disimpan privat; Admin yang membuat dan Manager yang dituju sama-sama bisa membukanya
    Route::get('/laporanpembayaran/{idLaporan}/pdf', [LaporanPembayaranController::class, 'unduh'])->whereNumber('idLaporan')->name('laporan.pdf');
});

// Panel Admin: dashboard + semua data master
Route::middleware('auth:admin')->group(function () {
    Route::get('/dashboard-admin', [AdminDashboardController::class, 'index'])->name('dashboard.admin');
    Route::post('/verifikasi/{idPembayaran}/terima', [AdminDashboardController::class, 'terima'])->whereNumber('idPembayaran')->name('verifikasi.terima');
    Route::post('/verifikasi/{idPembayaran}/tolak', [AdminDashboardController::class, 'tolak'])->whereNumber('idPembayaran')->name('verifikasi.tolak');
    Route::post('/laporanpembayaran/buat', [LaporanPembayaranController::class, 'buat'])->name('laporan.buat');

    Route::get('/tampilpenyewa', [MasterPenyewaController::class, 'tampilData']);
    Route::get('/deletepenyewa/{idhapus}', [MasterPenyewaController::class, 'deleteDataPenyewa']);

    Route::post('/insertpenyewa', [MasterPenyewaController::class, 'insertData']);
    Route::post('/updatepenyewa', [MasterPenyewaController::class, 'updateData']);

    // Data Admin dan Manager sengaja tidak tersedia untuk Admin: Admin tidak boleh mengubah/menghapus akun Admin lain atau Manager.

    Route::get('/tampillapangan', [MasterLapanganController::class, 'tampilData']);
    Route::get('/deletelapangan/{idhapus}', [MasterLapanganController::class, 'deleteDataLapangan']);

    Route::post('/insertlapangan', [MasterLapanganController::class, 'insertData']);
    Route::post('/updatelapangan', [MasterLapanganController::class, 'updateData']);

    Route::get('/tampilbooking', [MasterBookingController::class, 'tampilData']);
    Route::get('/deletebooking/{idhapus}', [MasterBookingController::class, 'deleteDataBooking']);

    Route::post('/insertbooking', [MasterBookingController::class, 'insertData']);
    Route::post('/updatebooking', [MasterBookingController::class, 'updateData']);

    Route::get('/tampilpembayaran', [MasterPembayaranController::class, 'tampilData']);
    Route::get('/deletepembayaran/{idhapus}', [MasterPembayaranController::class, 'deleteDataPembayaran']);

    Route::post('/insertpembayaran', [MasterPembayaranController::class, 'insertData']);
    Route::post('/updatepembayaran', [MasterPembayaranController::class, 'updateData']);

    Route::get('/tampillaporanpembayaran', [MasterLaporanPembayaranController::class, 'tampilData']);
    Route::get('/deletelaporanpembayaran/{idhapus}', [MasterLaporanPembayaranController::class, 'deleteDataLaporanPembayaran']);

    Route::post('/insertlaporanpembayaran', [MasterLaporanPembayaranController::class, 'insertData']);
    Route::post('/updatelaporanpembayaran', [MasterLaporanPembayaranController::class, 'updateData']);
});

// Panel Manager: dashboard saja untuk saat ini (akses ke laporan pembayaran menyusul)
Route::middleware('auth:manager')->group(function () {
    Route::get('/dashboard-manager', [ManagerController::class, 'dashboard'])->name('dashboard.manager');
    // Manager hanya melihat pembayaran, lapangan, dan laporan; yang bisa diubah hanya akun Admin
    Route::get('/manager/pembayaran', [ManagerController::class, 'pembayaran'])->name('manager.pembayaran');
    Route::get('/manager/lapangan', [ManagerController::class, 'lapangan'])->name('manager.lapangan');
    Route::get('/manager/laporan', [ManagerController::class, 'laporanPembayaran'])->name('manager.laporan');
    Route::get('/manager/admin', [ManagerController::class, 'admin'])->name('manager.admin');
    Route::post('/manager/admin', [ManagerController::class, 'tambahAdmin'])->name('manager.admin.tambah');
    Route::put('/manager/admin/{idAdmin}/password', [ManagerController::class, 'resetPasswordAdmin'])->whereNumber('idAdmin')->name('manager.admin.password');
    Route::delete('/manager/admin/{idAdmin}', [ManagerController::class, 'hapusAdmin'])->whereNumber('idAdmin')->name('manager.admin.hapus');
});

require __DIR__.'/auth.php';
