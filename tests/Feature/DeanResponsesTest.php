<?php

use App\Models\StudentResponse;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('allows the Dean to view evaluated student response data only', function () {
    StudentResponse::create([
        'user_id' => User::factory()->create()->id,
        'family_name' => 'Student',
        'first_name' => 'Demo',
        'program' => 'Master of Arts',
        'contact_number' => '555-0100',
        'email_address' => 'student@example.test',
        'id_number' => 'STUDENT-001',
        'evaluated_at' => now(),
    ]);
    StudentResponse::create([
        'user_id' => User::factory()->create()->id,
        'family_name' => 'Pending',
        'first_name' => 'Student',
        'program' => 'Master of Arts',
        'contact_number' => '555-0101',
        'email_address' => 'pending@example.test',
        'id_number' => 'STUDENT-002',
    ]);

    $this->actingAs(User::factory()->create(['role' => 'Dean']))
        ->get('/dean/responses')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dean/responses/Index')
            ->has('responses.data', 1)
            ->where('responses.data.0.email_address', 'student@example.test')
            ->has('responses.data.0.evaluated_at'));
});

it('does not allow other roles to view Dean response data', function () {
    $this->actingAs(User::factory()->create(['role' => 'Student']))
        ->get('/dean/responses')
        ->assertForbidden();
});
