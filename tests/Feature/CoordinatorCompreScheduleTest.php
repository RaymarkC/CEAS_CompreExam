<?php

use App\Models\ComprehensiveExamSchedule;
use App\Models\User;

function validComprehensiveScheduleData(array $overrides = []): array
{
    $proctor = User::factory()->create(['role' => 'Proctor']);

    return array_merge([
        'program' => 'Master in Technology',
        'date' => '2026-04-05',
        'time' => '17:41',
        'venue' => 'Room 15',
        'proctor_ids' => [$proctor->id],
        'teacher_assigned' => 'John',
    ], $overrides);
}

it('rejects schedule dates with years longer than four digits before database insert', function () {
    $coordinator = User::factory()->create(['role' => 'Coordinator']);

    $this->actingAs($coordinator)
        ->postJson('/coordinator/compre-schedule', validComprehensiveScheduleData(['date' => '55555-04-05']))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('date');

    expect(ComprehensiveExamSchedule::count())->toBe(0);
});

it('assigns real Proctor accounts when creating a schedule', function () {
    $coordinator = User::factory()->create(['role' => 'Coordinator']);
    $proctor = User::factory()->create([
        'role' => 'Proctor',
        'first_name' => 'Demo Proctor',
        'middle_name' => null,
        'last_name' => '1',
    ]);

    $this->actingAs($coordinator)
        ->postJson('/coordinator/compre-schedule', validComprehensiveScheduleData(['proctor_ids' => [$proctor->id]]))
        ->assertCreated()
        ->assertJsonPath('schedule.venue', 'Room 15')
        ->assertJsonPath('schedule.proctor_ids.0', $proctor->id)
        ->assertJsonPath('schedule.proctors.0', $proctor->display_name);

    $schedule = ComprehensiveExamSchedule::firstOrFail();
    expect($schedule->proctorUsers->modelKeys())->toBe([$proctor->id]);
});

it('provides only Proctor accounts as schedule assignment options', function () {
    $coordinator = User::factory()->create(['role' => 'Coordinator']);

    $this->actingAs($coordinator)
        ->get('/coordinator/compre-schedule')
        ->assertRedirect('/coordinator/compre-exam');
});

it('provides schedules and only Proctor accounts on the comprehensive exam page', function () {
    $coordinator = User::factory()->create(['role' => 'Coordinator']);
    $proctor = User::factory()->create(['role' => 'Proctor', 'middle_name' => null]);
    User::factory()->create(['role' => 'Student']);
    $schedule = ComprehensiveExamSchedule::create([
        'exam_id' => 'test-exam-room',
        'program' => 'Master in Technology',
        'exam_date' => '2026-04-05',
        'exam_time' => '17:41',
        'venue' => 'Room 204B',
        'proctor_name' => $proctor->display_name,
        'proctors' => [$proctor->display_name],
        'teacher_assigned' => 'John',
    ]);
    $schedule->proctorUsers()->attach($proctor);

    $this->actingAs($coordinator)
        ->get('/coordinator/compre-exam')
        ->assertOk()
        ->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page
            ->component('coordinator/compre-exam/Index')
            ->has('schedules', 1)
            ->where('schedules.0.id', $schedule->id)
            ->where('schedules.0.venue', 'Room 204B')
            ->has('proctorOptions', 1)
            ->where('proctorOptions.0.id', $proctor->id)
            ->where('proctorOptions.0.name', $proctor->display_name));
});

it('rejects assigning a non-Proctor account to a schedule', function () {
    $coordinator = User::factory()->create(['role' => 'Coordinator']);
    $student = User::factory()->create(['role' => 'Student']);

    $this->actingAs($coordinator)
        ->postJson('/coordinator/compre-schedule', validComprehensiveScheduleData(['proctor_ids' => [$student->id]]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('proctor_ids.0');

    expect(ComprehensiveExamSchedule::count())->toBe(0);
});

it('rejects schedule updates with dates outside the MySQL date range', function () {
    $coordinator = User::factory()->create(['role' => 'Coordinator']);
    $schedule = ComprehensiveExamSchedule::create([
        'exam_id' => 'test-exam-1',
        'program' => 'Master in Technology',
        'exam_date' => '2026-04-05',
        'exam_time' => '17:41',
        'venue' => 'Room 15',
        'proctor_name' => 'Elizabeth',
        'proctors' => ['Elizabeth'],
        'teacher_assigned' => 'John',
    ]);

    $this->actingAs($coordinator)
        ->putJson('/coordinator/compre-schedule/'.$schedule->id, validComprehensiveScheduleData(['date' => '0999-04-05']))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('date');

    expect($schedule->fresh()->exam_date->format('Y-m-d'))->toBe('2026-04-05');
});

it('updates a schedule from multipart form data using Laravel method spoofing', function () {
    $coordinator = User::factory()->create(['role' => 'Coordinator']);
    $schedule = ComprehensiveExamSchedule::create([
        'exam_id' => 'test-exam-2',
        'program' => 'Old program',
        'exam_date' => '2026-04-05',
        'exam_time' => '17:41',
        'venue' => 'Room 1',
        'proctor_name' => 'Old proctor',
        'proctors' => ['Old proctor'],
        'teacher_assigned' => 'Old teacher',
    ]);

    $this->actingAs($coordinator)
        ->post('/coordinator/compre-schedule/'.$schedule->id, array_merge(validComprehensiveScheduleData([
            'program' => 'Updated program',
            'date' => '2026-05-06',
        ]), ['_method' => 'PUT']))
        ->assertOk()
        ->assertJsonPath('schedule.program', 'Updated program');

    expect($schedule->fresh()->program)->toBe('Updated program')
        ->and($schedule->fresh()->exam_date->format('Y-m-d'))->toBe('2026-05-06')
        ->and($schedule->fresh()->proctorUsers->count())->toBe(1);
});
