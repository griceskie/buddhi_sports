<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
