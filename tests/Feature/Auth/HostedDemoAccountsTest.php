<?php

use App\Models\User;
use App\Services\LegacyPortalClient;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->previousDemoPassword = getenv('HOSTED_DEMO_PASSWORD');
    putenv('HOSTED_DEMO_PASSWORD=private-hosted-demo-password-2026');
    config(['demo.hosted_enabled' => true]);
    app()->instance('env', 'production');
    $this->withoutMiddleware([ValidateCsrfToken::class, VerifyCsrfToken::class]);
});

afterEach(function () {
    putenv($this->previousDemoPassword === false ? 'HOSTED_DEMO_PASSWORD' : 'HOSTED_DEMO_PASSWORD='.$this->previousDemoPassword);
});

it('requires explicit enablement and a strong runtime password', function () {
    config(['demo.hosted_enabled' => false]);
    $this->artisan('demo:hosted-accounts')->assertFailed();
    config(['demo.hosted_enabled' => true]);
    putenv('HOSTED_DEMO_PASSWORD=password');
    $this->artisan('demo:hosted-accounts')->assertFailed();
    $this->assertDatabaseCount('users', 0);
});

it('preserves profiles and data on restart and rotates the testing password', function () {
    $this->artisan('demo:hosted-accounts')->assertSuccessful();
    $user = User::where('email', 'student@uic.edu.ph')->firstOrFail();
    $user->update(['first_name' => 'Edited']);
    putenv('HOSTED_DEMO_PASSWORD=a-new-private-testing-password');
    $this->artisan('demo:hosted-accounts')->assertSuccessful();
    expect($user->fresh()->first_name)->toBe('Edited');
    expect(Hash::check('a-new-private-testing-password', $user->fresh()->password))->toBeTrue();
    $accounts = config('demo.workflow_accounts') + config('demo.accounts') + config('demo.proctor_accounts') + [
        'finance@uic.edu.ph' => ['role' => 'Finance'],
    ];
    $this->assertDatabaseCount('users', count($accounts));
    $this->assertDatabaseMissing('users', ['email' => 'superadmin@uic.edu.ph']);
});

it('does not change any users when an email belongs to a non-demo account', function () {
    $user = User::factory()->create(['email' => 'dean@uic.edu.ph', 'is_demo_account' => false]);
    $original = $user->fresh()->getRawOriginal();
    $this->artisan('demo:hosted-accounts')->assertFailed();
    expect($user->fresh()->getRawOriginal())->toBe($original);
    $this->assertDatabaseCount('users', 1);
});

it('allows each hosted role to sign in with the configured password only', function (string $email) {
    $this->artisan('demo:hosted-accounts')->assertSuccessful();
    $this->mock(LegacyPortalClient::class)->shouldNotReceive('login', 'loginCoordinator');
    $this->post('/login', ['identifier' => $email, 'password' => 'password'])->assertSessionHasErrors('identifier');
    $this->assertGuest();
    $this->post('/login', ['identifier' => $email, 'password' => 'private-hosted-demo-password-2026'])->assertRedirect();
    $this->assertAuthenticatedAs(User::where('email', $email)->firstOrFail());
})->with([
    'student@uic.edu.ph', 'aa@uic.edu.ph', 'coordinator@uic.edu.ph',
    'registrar@uic.edu.ph', 'dean@uic.edu.ph',
    'student@uic.edu.ph', 'student2@uic.edu.ph', 'adviser@uic.edu.ph',
    'acadcoor@uic.edu.ph', 'aa@uic.edu.ph', 'dean@uic.edu.ph', 'finance@uic.edu.ph',
    'proctor1@uic.edu.ph', 'proctor2@uic.edu.ph', 'proctor3@uic.edu.ph',
    'proctor4@uic.edu.ph', 'proctor5@uic.edu.ph',
]);

it('disables new demo logins when hosted testing is turned off', function () {
    $this->artisan('demo:hosted-accounts')->assertSuccessful();
    config(['demo.hosted_enabled' => false]);
    $this->mock(LegacyPortalClient::class)->shouldReceive('loginCoordinator')->once()->andThrow(new RuntimeException('No school authentication for this fixture'));
    $this->post('/login', ['identifier' => 'aa@uic.edu.ph', 'password' => 'private-hosted-demo-password-2026'])->assertSessionHasErrors('identifier');
    $this->assertGuest();
});
