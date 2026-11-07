<?php

use App\Models\ExamApplication;
use App\Models\ExamApplicationSubject;
use App\Models\PaymentSubmission;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Inertia\Testing\AssertableInertia as Assert;

function createRegistrarReviewApplication(User $student, array $overrides = []): ExamApplication
{
    return ExamApplication::create(array_merge([
        'student_id' => $student->school_id,
        'school_year' => '2026-2027',
        'program' => $student->program ?? 'Master of Arts in Education',
        'permit_status' => 'pending',
        'final_approval_status' => 'approved',
        'created_at' => now(),
    ], $overrides));
}

it('shows Coordinator-approved applications awaiting final approval on the Registrar dashboard', function () {
    $this->withoutVite();
    $student = User::factory()->create([
        'role' => 'Student',
        'program' => 'Master of Arts in Education',
        'school_id' => 'REGISTRAR-REVIEW-STUDENT',
    ]);
    $application = createRegistrarReviewApplication($student);
    ExamApplicationSubject::create([
        'application_id' => $application->application_id,
        'subject_name' => 'Research Methods',
        'exam_date' => '2026-11-12',
        'start_time' => '09:00:00',
        'end_time' => '11:00:00',
    ]);
    createRegistrarReviewApplication($student, [
        'school_year' => '2025-2026',
        'registrar_approval_status' => 'approved',
    ]);
    createRegistrarReviewApplication($student, [
        'school_year' => '2024-2025',
        'final_approval_status' => 'pending',
    ]);

    $this->actingAs(User::factory()->create(['role' => 'Registrar']))
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/Index')
            ->has('registrarApplications.data', 1)
            ->where('registrarApplications.data.0.application_id', $application->application_id)
            ->where('registrarApplications.data.0.student_name', $student->display_name)
            ->where('registrarApplications.data.0.subjects.0.name', 'Research Methods'));
});

it('allows only the Registrar to approve a Coordinator-approved application for payment', function () {
    $student = User::factory()->create(['role' => 'Student', 'school_id' => 'REGISTRAR-APPROVAL-STUDENT']);
    $application = createRegistrarReviewApplication($student);
    $registrar = User::factory()->create(['role' => 'Registrar']);

    $this->actingAs($student)
        ->post('/registrar/comprehensive-exam/'.$application->application_id.'/approve')
        ->assertForbidden();

    $this->actingAs($registrar)
        ->post('/registrar/comprehensive-exam/'.$application->application_id.'/approve')
        ->assertRedirect('/dashboard');

    $this->assertDatabaseHas('exam_application', [
        'application_id' => $application->application_id,
        'registrar_approval_status' => 'approved',
        'registrar_approved_by' => $registrar->id,
    ]);
    expect($application->fresh()->registrar_approved_at)->not->toBeNull();
});

it('does not allow Registrar approval before Coordinator approval', function () {
    $student = User::factory()->create(['role' => 'Student', 'school_id' => 'REGISTRAR-WAIT-STUDENT']);
    $application = createRegistrarReviewApplication($student, ['final_approval_status' => 'pending']);
    $registrar = User::factory()->create(['role' => 'Registrar']);

    $this->actingAs($registrar)
        ->post('/registrar/comprehensive-exam/'.$application->application_id.'/approve')
        ->assertConflict();

    expect($application->fresh()->registrar_approval_status)->toBe('pending');
});

it('requires Registrar approval before showing or accepting exam payment', function () {
    $this->withoutVite();
    $student = User::factory()->create(['role' => 'Student', 'school_id' => 'PAYMENT-GATE-STUDENT']);
    $application = createRegistrarReviewApplication($student);

    $this->actingAs($student)
        ->get('/payment')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('payment/Index')
            ->where('canSubmit', false)
            ->where('approvalStatus', 'registrar_pending'));

    $payload = [
        'or_number' => 'OR-REGISTRAR-1',
        'payment_date' => '2026-11-06',
        'amount_paid' => 500,
        'receipt_image' => UploadedFile::fake()->image('receipt.png'),
    ];
    $this->post('/payment', $payload)->assertSessionHasErrors('form');
    expect(PaymentSubmission::count())->toBe(0);

    $application->update([
        'registrar_approval_status' => 'approved',
        'registrar_approved_at' => now(),
    ]);
    $this->get('/payment')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('canSubmit', true)
            ->where('approvalStatus', 'approved'));
    $this->post('/payment', $payload)->assertRedirect('/payment');
    expect(PaymentSubmission::where('student_id', $student->id)->exists())->toBeTrue();
});
