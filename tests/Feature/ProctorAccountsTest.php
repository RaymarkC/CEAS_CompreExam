<?php

use App\Models\ComprehensiveExamSchedule;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Illuminate\Support\Facades\Hash;

it('creates five local demo proctor accounts with the documented credentials', function () {
    $this->artisan('demo:proctor-accounts')->assertSuccessful();

    expect(User::where('role', 'Proctor')->count())->toBe(5);
    expect(Hash::check('password', User::where('email', 'proctor1@uic.edu.ph')->firstOrFail()->password))->toBeTrue();

    $this->post('/login', ['identifier' => 'proctor1@uic.edu.ph', 'password' => 'password'])
        ->assertRedirect();
    $this->assertAuthenticatedAs(User::where('email', 'proctor1@uic.edu.ph')->firstOrFail());
});

it('shows each proctor only schedules assigned to their own account', function () {
    $proctor = User::factory()->create(['role' => 'Proctor']);
    $anotherProctor = User::factory()->create(['role' => 'Proctor']);
    $assigned = ComprehensiveExamSchedule::create([
        'exam_id' => 'assigned-exam',
        'program' => 'Assigned Program',
        'exam_date' => '2026-11-10',
        'exam_time' => '09:00',
        'venue' => 'Room 4',
        'proctor_name' => $proctor->display_name,
        'proctors' => [$proctor->display_name, $anotherProctor->display_name],
        'teacher_assigned' => 'Assigned Teacher',
    ]);
    $assigned->proctorUsers()->sync([$proctor->id, $anotherProctor->id]);

    $other = ComprehensiveExamSchedule::create([
        'exam_id' => 'other-exam',
        'program' => 'Private Program',
        'exam_date' => '2026-11-11',
        'exam_time' => '10:00',
        'venue' => 'Room 5',
        'proctor_name' => $anotherProctor->display_name,
        'proctors' => [$anotherProctor->display_name],
        'teacher_assigned' => 'Private Teacher',
    ]);
    $other->proctorUsers()->sync([$anotherProctor->id]);

    $this->actingAs($proctor)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/Index')
            ->has('assignedSchedules.data', 1)
            ->where('assignedSchedules.data.0.id', $assigned->id)
            ->where('assignedSchedules.data.0.program', 'Assigned Program')
            ->where('assignedSchedules.data.0.teacher_assigned', 'Assigned Teacher')
            ->where('assignedSchedules.data.0.other_proctors.0', trim($anotherProctor->first_name.' '.$anotherProctor->last_name))
            ->missing('assignedSchedules.data.1')
            ->missing('assignedSchedules.data.0.password'));
});

it('does not allow a Proctor to open the coordinator schedule management page', function () {
    $this->actingAs(User::factory()->create(['role' => 'Proctor']))
        ->get('/coordinator/compre-schedule')
        ->assertForbidden();
});
