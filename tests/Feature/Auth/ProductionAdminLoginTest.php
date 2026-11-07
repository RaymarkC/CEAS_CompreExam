<?php

use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Support\Facades\Hash;

it('never auto-creates the built-in administrator in a hosted production environment', function () {
    app()->instance('env', 'production');
    $this->withoutMiddleware([ValidateCsrfToken::class, VerifyCsrfToken::class]);
    $this->post('/login', ['identifier' => 'superadmin@uic.edu.ph', 'password' => 'supersecurepassword'])->assertSessionHasErrors('identifier');
    $this->assertGuest();
    $this->assertDatabaseMissing('users', ['email' => 'superadmin@uic.edu.ph']);
});
it('requires the stored password for an existing hosted administrator', function () {
    app()->instance('env', 'production');
    $this->withoutMiddleware([ValidateCsrfToken::class, VerifyCsrfToken::class]);
    $admin = User::factory()->create(['email' => 'superadmin@uic.edu.ph', 'role' => 'Super Admin', 'password' => Hash::make('unique-test-admin-secret')]);
    $this->post('/login', ['identifier' => $admin->email, 'password' => 'supersecurepassword'])->assertSessionHasErrors('identifier');
    $this->assertGuest();
    $this->post('/login', ['identifier' => $admin->email, 'password' => 'unique-test-admin-secret'])->assertRedirect();
    $this->assertAuthenticatedAs($admin);
});
