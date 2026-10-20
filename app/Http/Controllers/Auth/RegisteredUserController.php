<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Penyewa;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'namaPenyewa' => 'required|string|max:255',
            'noHp' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.Penyewa::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $penyewa = Penyewa::create([
            'namaPenyewa' => $request->namaPenyewa,
            'noHp' => $request->noHp,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        event(new Registered($penyewa));

        Auth::login($penyewa, $request->boolean('remember'));

        return redirect(route('dashboard', absolute: false));
    }
}
