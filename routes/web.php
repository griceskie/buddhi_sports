<?php

use App\Http\Controllers\Auth\PengelolaAuthenticatedSessionController;
use App\Http\Controllers\Auth\PengelolaProfileController;
use App\Http\Controllers\MasterAdminController;
use App\Http\Controllers\MasterBookingController;
use App\Http\Controllers\MasterLapanganController;
use App\Http\Controllers\MasterLaporanPembayaranController;
use App\Http\Controllers\MasterManagerController;
use App\Http\Controllers\MasterPembayaranController;
use App\Http\Controllers\MasterPenyewaController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
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
Route::get('/dashboard', function () {
    return Inertia::render('Dashboard', ['lapangan' => DB::table('lapangans')->get()]);
})->middleware(['auth', 'verified'])->name('dashboard');
Route::get('/booking', function () {
    return Inertia::render('Booking');
})->middleware(['auth', 'verified'])->name('booking');

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

// Profil Admin & Manager (guard yang login otomatis dipakai oleh $request->user())
Route::middleware('auth:admin,manager')->group(function () {
    Route::get('/profile-pengelola', [PengelolaProfileController::class, 'edit'])->name('profile.pengelola');
    Route::patch('/profile-pengelola', [PengelolaProfileController::class, 'update'])->name('profile.pengelola.update');
    Route::put('/profile-pengelola/password', [PengelolaProfileController::class, 'updatePassword'])->name('profile.pengelola.password');
});

// Panel Admin: dashboard + semua data master
Route::middleware('auth:admin')->group(function () {
    Route::get('/dashboard-admin', function () {
        return Inertia::render('Dashboard/Admin', ['admin' => Auth::guard('admin')->user()]);
    })->name('dashboard.admin');

    Route::get('/tampilpenyewa', [MasterPenyewaController::class, 'tampilData']);
    Route::get('/formpenyewa', [MasterPenyewaController::class, 'tampilFormTambah']);
    Route::get('/editpenyewa/{idedit}', [MasterPenyewaController::class, 'tampilFormEdit']);
    Route::get('/deletepenyewa/{idhapus}', [MasterPenyewaController::class, 'deleteDataPenyewa']);

    Route::post('/insertpenyewa', [MasterPenyewaController::class, 'insertData']);
    Route::post('/updatepenyewa', [MasterPenyewaController::class, 'updateData']);

    Route::get('/tampiladmin', [MasterAdminController::class, 'tampilData']);
    Route::get('/formadmin', [MasterAdminController::class, 'tampilFormTambah']);
    Route::get('/editadmin/{idedit}', [MasterAdminController::class, 'tampilFormEdit']);
    Route::get('/deleteadmin/{idhapus}', [MasterAdminController::class, 'deleteDataAdmin']);

    Route::post('/insertadmin', [MasterAdminController::class, 'insertData']);
    Route::post('/updateadmin', [MasterAdminController::class, 'updateData']);

    Route::get('/tampilmanager', [MasterManagerController::class, 'tampilData']);
    Route::get('/formmanager', [MasterManagerController::class, 'tampilFormTambah']);
    Route::get('/editmanager/{idedit}', [MasterManagerController::class, 'tampilFormEdit']);
    Route::get('/deletemanager/{idhapus}', [MasterManagerController::class, 'deleteDataManager']);

    Route::post('/insertmanager', [MasterManagerController::class, 'insertData']);
    Route::post('/updatemanager', [MasterManagerController::class, 'updateData']);

    Route::get('/tampillapangan', [MasterLapanganController::class, 'tampilData']);
    Route::get('/formlapangan', [MasterLapanganController::class, 'tampilFormTambah']);
    Route::get('/editlapangan/{idedit}', [MasterLapanganController::class, 'tampilFormEdit']);
    Route::get('/deletelapangan/{idhapus}', [MasterLapanganController::class, 'deleteDataLapangan']);

    Route::post('/insertlapangan', [MasterLapanganController::class, 'insertData']);
    Route::post('/updatelapangan', [MasterLapanganController::class, 'updateData']);

    Route::get('/tampilbooking', [MasterBookingController::class, 'tampilData']);
    Route::get('/formbooking', [MasterBookingController::class, 'tampilFormTambah']);
    Route::get('/editbooking/{idedit}', [MasterBookingController::class, 'tampilFormEdit']);
    Route::get('/deletebooking/{idhapus}', [MasterBookingController::class, 'deleteDataBooking']);

    Route::post('/insertbooking', [MasterBookingController::class, 'insertData']);
    Route::post('/updatebooking', [MasterBookingController::class, 'updateData']);

    Route::get('/tampilpembayaran', [MasterPembayaranController::class, 'tampilData']);
    Route::get('/formpembayaran', [MasterPembayaranController::class, 'tampilFormTambah']);
    Route::get('/editpembayaran/{idedit}', [MasterPembayaranController::class, 'tampilFormEdit']);
    Route::get('/deletepembayaran/{idhapus}', [MasterPembayaranController::class, 'deleteDataPembayaran']);

    Route::post('/insertpembayaran', [MasterPembayaranController::class, 'insertData']);
    Route::post('/updatepembayaran', [MasterPembayaranController::class, 'updateData']);

    Route::get('/tampillaporanpembayaran', [MasterLaporanPembayaranController::class, 'tampilData']);
    Route::get('/formlaporanpembayaran', [MasterLaporanPembayaranController::class, 'tampilFormTambah']);
    Route::get('/editlaporanpembayaran/{idedit}', [MasterLaporanPembayaranController::class, 'tampilFormEdit']);
    Route::get('/deletelaporanpembayaran/{idhapus}', [MasterLaporanPembayaranController::class, 'deleteDataLaporanPembayaran']);

    Route::post('/insertlaporanpembayaran', [MasterLaporanPembayaranController::class, 'insertData']);
    Route::post('/updatelaporanpembayaran', [MasterLaporanPembayaranController::class, 'updateData']);
});

// Panel Manager: dashboard saja untuk saat ini (akses ke laporan pembayaran menyusul)
Route::middleware('auth:manager')->group(function () {
    Route::get('/dashboard-manager', function () {
        return Inertia::render('Dashboard/Manager', ['manager' => Auth::guard('manager')->user()]);
    })->name('dashboard.manager');
});

require __DIR__.'/auth.php';
