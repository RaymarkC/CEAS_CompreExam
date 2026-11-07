<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequestV2;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionV2Controller extends Controller
{
    public function create(Request $request): Response
    {
        abort_unless($this->enabled(), 404);

        return Inertia::render('auth/LoginV2', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
            'debugLoginV2' => true,
        ]);
    }

    public function store(LoginRequestV2 $request): RedirectResponse
    {
        abort_unless($this->enabled(), 404);
        $request->authenticate();
        $request->session()->regenerate();

        return redirect()->intended(route('dashboard', absolute: false));
    }

    protected function enabled(): bool
    {
        return (bool) env('DEBUG_LOGIN_V2', false) || env('APP_ENV') !== 'production';
    }
}
