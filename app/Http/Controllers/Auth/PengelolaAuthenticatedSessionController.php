<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PengelolaAuthenticatedSessionController extends Controller
{
    /**
     * Tampilkan halaman login untuk Admin & Manager (dua tab, satu halaman).
     */
    public function create(): Response
    {
        return Inertia::render('Auth/LoginPengelola');
    }

    /**
     * Status singkat untuk panel pratinjau di halaman login: hanya tingkat per peran, tanpa angka, nama atau nominal,
     * karena endpoint ini publik. Disimpan di cache dan dibatasi lajunya (lihat routes/web.php).
     */
    public function status(): JsonResponse
    {
        $status = Cache::remember('login-pengelola-status', config('pengelola.cache_status_detik'), function () {
            $tingkat = function (int $jumlah, string $peran): string {
                if ($jumlah === 0) {
                    return 'tidak ada';
                }

                return $jumlah >= config("pengelola.ambang_banyak.$peran") ? 'banyak' : 'ada';
            };

            return [
                'admin' => $tingkat(DB::table('pembayarans')->where('status', 'Menunggu Verifikasi')->count(), 'admin'),
                'manager' => $tingkat(DB::table('laporan_pembayarans')->whereNotNull('filePdf')->whereNull('diperiksaPada')->count(), 'manager'),
            ];
        });

        return response()->json($status);
    }

    /**
     * Proses login Admin atau Manager, berdasarkan role yang dipilih pada tab.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'role' => 'required|in:admin,manager',
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $guard = $request->string('role')->toString();

        if (! Auth::guard($guard)->attempt($request->only('username', 'password'))) {
            throw ValidationException::withMessages([
                'password' => 'Username atau password salah.',
            ]);
        }

        $request->session()->regenerate();

        return redirect()->intended(
            $guard === 'admin' ? route('dashboard.admin') : route('dashboard.manager')
        );
    }

    /**
     * Logout dari guard admin atau manager, mana saja yang sedang aktif.
     */
    public function destroy(Request $request): RedirectResponse
    {
        foreach (['admin', 'manager'] as $guard) {
            if (Auth::guard($guard)->check()) {
                Auth::guard($guard)->logout();
            }
        }

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect(route('login.pengelola'));
    }
}
