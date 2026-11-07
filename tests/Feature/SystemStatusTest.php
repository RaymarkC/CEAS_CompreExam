<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;

test('system checks require authentication', function () {
    $this->getJson('/system-status/checks')->assertUnauthorized();
});

test('system checks report actual database and authenticated session status', function () {
    $this->actingAs(User::factory()->create())->getJson('/system-status/checks')
        ->assertOk()->assertJsonPath('checks.0.status', 'success')
        ->assertJsonPath('checks.1.status', 'success')
        ->assertJsonPath('checks.2.status', 'success');
});

test('a failed database check is not reported as successful and does not expose credentials', function () {
    $user = User::factory()->create();
    DB::shouldReceive('select')->once()->with('select 1')->andThrow(new RuntimeException('secret connection detail'));
    $this->actingAs($user)->getJson('/system-status/checks')
        ->assertOk()->assertJsonPath('checks.0.status', 'error')
        ->assertJsonPath('checks.2.status', 'error')->assertDontSee('secret connection detail');
});
