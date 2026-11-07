<?php

use App\Mail\DefenseCertificateDelivery;
use App\Models\DefenseAcademicOutcome;
use App\Models\DefenseCertificateRequest;
use App\Models\DefenseRequest;
use App\Models\Notification;
use App\Models\User;
use App\Services\DefenseAcademicProgress;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->withoutVite();
    $this->travelTo(Carbon::parse('2026-11-01 12:00:00', 'Asia/Manila'));
    Storage::fake('local');
    Mail::fake();
    $this->student = User::factory()->create(['role' => 'Student']);
    $this->coordinator = User::factory()->create(['role' => 'Coordinator']);
    $this->adviser = User::factory()->create(['role' => 'Adviser']);
    $this->dean = User::factory()->create(['role' => 'Dean']);
    $this->aa = User::factory()->create(['role' => 'Administrative Assistant']);
    $this->adviser->advisedStudents()->attach($this->student->id, ['status' => 'accepted', 'requested_by' => $this->coordinator->id]);
    $this->dr = DefenseRequest::withoutEvents(fn () => DefenseRequest::create(['submitted_by' => $this->student->id, 'coordinator_user_id' => $this->coordinator->id, 'adviser_user_id' => $this->adviser->id, 'school_id' => 'TEST-001', 'defense_adviser' => 'Adviser', 'first_name' => 'Test', 'last_name' => 'Student', 'program' => 'Master of Arts', 'thesis_title' => 'Outcome test', 'defense_type' => 'Proposal', 'workflow_state' => 'scheduled', 'status' => 'Approved', 'scheduled_date' => '2026-10-30', 'scheduled_time' => '09:00', 'scheduled_end_time' => '10:00']));
    $this->url = '/defense-outcomes/'.$this->dr->id;
    $this->payload = ['version' => 0, 'completion' => 'done', 'result' => 'passed', 'subject' => 'Thesis 1', 'completed_on' => '2026-10-30', 'reason' => 'Verified defense result', 'next_stage' => 'Prefinal'];
});
it('separates the academic outcome and explicit next stage from service and graduation', function () {
    $this->actingAs($this->coordinator)->put($this->url, $this->payload)->assertRedirect();
    $row = DefenseAcademicOutcome::firstOrFail();
    expect($row->completion)->toBe('done')->and($row->result)->toBe('passed')->and($row->next_stage)->toBe('Prefinal');
    $this->assertDatabaseCount('defense_service_records', 0);
    $this->assertDatabaseCount('student_progress_records', 0);
    $this->assertDatabaseCount('defense_requests', 1);
    $this->get('/academic-progress/'.$this->student->id)->assertOk()->assertInertia(fn (Assert $p) => $p->where('progress.stage', 'Prefinal')->where('canEdit', true));
    foreach ([$this->adviser, $this->dean] as $reader) {
        $this->actingAs($reader)->get('/academic-progress/'.$this->student->id)->assertOk()->assertInertia(fn (Assert $p) => $p->where('canEdit', false)->where('progress.defenses.0.outcome.result', 'passed'));
    }
});
it('allows only the assigned coordinator to record outcomes or edit academic information', function () {
    foreach ([$this->student, $this->adviser, $this->dean, $this->aa, User::factory()->create(['role' => 'Coordinator'])] as $other) {
        $this->actingAs($other)->put($this->url, $this->payload)->assertForbidden();
        $this->put('/academic-progress/'.$this->student->id, [])->assertForbidden();
    }
});
it('requires reasons for missed defenses and keeps results separate', function () {
    $this->actingAs($this->coordinator)->putJson($this->url, array_replace($this->payload, ['completion' => 'did-not-defend', 'result' => 'not-recorded', 'completed_on' => null, 'next_stage' => null, 'reason' => '']))->assertUnprocessable()->assertJsonValidationErrors('reason');
    $this->putJson($this->url, array_replace($this->payload, ['completion' => 'not-yet-done']))->assertUnprocessable();
    $this->put($this->url, array_replace($this->payload, ['completion' => 'did-not-defend', 'result' => 'not-recorded', 'completed_on' => null, 'next_stage' => null, 'reason' => 'Student requested postponement']))->assertRedirect();
    expect(DefenseAcademicOutcome::first()->reason)->toBe('Student requested postponement');
    $this->actingAs($this->student)->post('/certificates/request/'.$this->dr->id)->assertSessionHasErrors('certificate');
});
it('does not record future outcomes or skip stages', function () {
    $this->actingAs($this->coordinator)->putJson($this->url, array_replace($this->payload, ['next_stage' => 'Final']))->assertUnprocessable();
    DefenseRequest::whereKey($this->dr->id)->update(['scheduled_date' => '2026-11-02']);
    $this->putJson($this->url, $this->payload)->assertUnprocessable();
});
it('preserves history rejects stale saves and suspends certificates after outcome revisions', function () {
    $this->actingAs($this->coordinator)->put($this->url, $this->payload)->assertRedirect();
    $this->putJson($this->url, $this->payload)->assertUnprocessable()->assertJsonValidationErrors('version');
    $this->put($this->url, array_replace($this->payload, ['version' => 1, 'result' => 'for-revision', 'next_stage' => null, 'reason' => 'Panel requested revision']))->assertRedirect();
    $row = DefenseAcademicOutcome::first();
    expect($row->version)->toBe(2)->and($row->history[0]['result'])->toBe('passed');
    expect(app(DefenseAcademicProgress::class)->eligible($this->dr->fresh()))->toBeFalse();
});
it('requires done and passed before allowing certificate requests and deduplicates requests and notices', function () {
    $this->actingAs($this->student)->post('/certificates/request/'.$this->dr->id)->assertSessionHasErrors('certificate');
    $this->actingAs($this->coordinator)->put($this->url, array_replace($this->payload, ['result' => 'for-revision', 'next_stage' => null]))->assertRedirect();
    $this->actingAs($this->student)->post('/certificates/request/'.$this->dr->id)->assertSessionHasErrors('certificate');
    $this->actingAs($this->coordinator)->put($this->url, array_replace($this->payload, ['version' => 1]))->assertRedirect();
    $this->actingAs($this->student)->post('/certificates/request/'.$this->dr->id)->assertRedirect();
    $this->post('/certificates/request/'.$this->dr->id)->assertRedirect();
    $this->assertDatabaseCount('defense_certificate_requests', 1);
    expect(Notification::where('type', 'certificate-request')->where('user_id', $this->aa->id)->count())->toBe(1);
});
function readyCertificate($test): DefenseCertificateRequest
{
    $test->actingAs($test->coordinator)->put($test->url, $test->payload)->assertRedirect();
    $test->actingAs($test->student)->post('/certificates/request/'.$test->dr->id)->assertRedirect();

    return DefenseCertificateRequest::firstOrFail();
}
function certificatePdf(): UploadedFile
{
    return UploadedFile::fake()->createWithContent('certificate.pdf', "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF");
}
it('releases a private PDF only through AA and attaches it to email', function () {
    $cert = readyCertificate($this);
    foreach ([$this->student, $this->adviser, $this->dean, $this->coordinator] as $other) {
        $this->actingAs($other)->post('/certificates/'.$cert->id.'/release', ['pdf' => certificatePdf(), 'email' => false])->assertForbidden();
    }
    $this->actingAs($this->aa)->post('/certificates/'.$cert->id.'/release', ['pdf' => certificatePdf(), 'email' => true])->assertRedirect();
    $cert->refresh();
    expect($cert->status)->toBe('released')->and($cert->email_status)->toBe('sent');
    Storage::disk('local')->assertExists($cert->pdf_path);
    Mail::assertSent(DefenseCertificateDelivery::class, fn ($mail) => $mail->hasTo($this->student->email) && $mail->build()->hasAttachmentFromStorageDisk('local', $cert->pdf_path, 'Defense-Certificate.pdf', ['mime' => 'application/pdf']));
    $this->actingAs($this->student)->get('/certificates/'.$cert->id.'/download')->assertOk()->assertDownload('Defense-Certificate-'.$this->dr->id.'.pdf');
    $this->get('/certificates')->assertInertia(fn (Assert $p) => $p->where('items.0.certificate.status', 'released')->missing('items.0.certificate.pdf_path'));
    $this->actingAs(User::factory()->create(['role' => 'Student']))->get('/certificates/'.$cert->id.'/download')->assertForbidden();
});
it('validates PDF uploads and blocks stolen certificate requests', function () {
    $cert = readyCertificate($this);
    $this->actingAs($this->aa)->post('/certificates/'.$cert->id.'/release', ['pdf' => UploadedFile::fake()->create('bad.txt', 1, 'text/plain'), 'email' => false])->assertSessionHasErrors('pdf');
    $this->actingAs(User::factory()->create(['role' => 'Student']))->post('/certificates/request/'.$this->dr->id)->assertForbidden();
});
it('keeps released PDFs available when email fails and permits AA retry', function () {
    $cert = readyCertificate($this);
    $originalMail = Mail::getFacadeRoot();
    Mail::shouldReceive('to')->once()->andThrow(new RuntimeException('Simulated SMTP failure'));
    $this->actingAs($this->aa)->post('/certificates/'.$cert->id.'/release', ['pdf' => certificatePdf(), 'email' => true])->assertRedirect();
    expect($cert->fresh()->status)->toBe('released')->and($cert->fresh()->email_status)->toBe('failed');
    Mail::swap($originalMail);
    $this->post('/certificates/'.$cert->id.'/email')->assertRedirect();
    Mail::assertSent(DefenseCertificateDelivery::class);
    expect($cert->fresh()->email_status)->toBe('sent');
});
it('blocks stale certificate release download and email after schedule changes', function () {
    $cert = readyCertificate($this);
    $this->actingAs($this->aa)->post('/certificates/'.$cert->id.'/release', ['pdf' => certificatePdf(), 'email' => false])->assertRedirect();
    DefenseRequest::whereKey($this->dr->id)->update(['scheduled_time' => '11:00']);
    $this->actingAs($this->student)->get('/certificates/'.$cert->id.'/download')->assertForbidden();
    $this->actingAs($this->aa)->post('/certificates/'.$cert->id.'/email')->assertSessionHasErrors('certificate');
    $this->post('/certificates/'.$cert->id.'/release', ['pdf' => certificatePdf(), 'email' => false])->assertSessionHasErrors('certificate');
    Mail::assertNothingSent();
});
it('blocks dean and AA scheduling through all scheduling aliases', function () {
    foreach ([$this->dean, $this->aa] as $actor) {
        foreach (['/coordinator/defense/'.$this->dr->id.'/assign-panels', '/coordinator/defense/'.$this->dr->id.'/schedule', '/coordinator/defense-requests/'.$this->dr->id.'/panels', '/coordinator/defense-requests/'.$this->dr->id.'/schedule-json'] as $url) {
            $this->actingAs($actor)->postJson($url, [])->assertForbidden();
        }
    }
});
it('exports scoped formula-safe CSV and keeps invalid ranges invalid', function () {
    DefenseRequest::whereKey($this->dr->id)->update(['thesis_title' => '=HYPERLINK("evil")']);
    $response = $this->actingAs($this->adviser)->get('/defense-register/csv?from=2026-10-01&to=2026-10-31')->assertOk();
    expect($response->streamedContent())->toContain("'=HYPERLINK")->not->toContain('password');
    $this->actingAs($this->student)->get('/defense-register/csv')->assertForbidden();
    $this->actingAs($this->dean)->get('/defense-register/csv?from=2026-01-01&to=2026-12-31')->assertSessionHasErrors('to');
});
it('records structured research course dates with coordinator provenance and read-only access', function () {
    $data = ['version' => 0, 'classification' => 'continuing', 'school_year' => '2026-2027', 'semester' => '1st', 'enrollment_year' => 2023, 'subjects' => [['code' => 'TH1', 'title' => 'Thesis 1', 'research_subject' => 'Thesis 1', 'started_on' => '2026-08-01']], 'record_reference' => 'Enrollment record verified', 'verified_against_school_records' => true];
    $url = '/academic-progress/'.$this->student->id;
    $this->actingAs($this->coordinator)->put($url, $data)->assertRedirect();
    $this->actingAs($this->adviser)->get($url)->assertInertia(fn (Assert $p) => $p->where('canEdit', false)->where('progress.record.subjects.0.started_on', '2026-08-01')->where('progress.record.school_year', '2026-2027'));
    $this->put($url, $data)->assertForbidden();
    $this->actingAs($this->coordinator)->putJson($url, array_replace($data, ['version' => 1, 'school_year' => '2026-2028']))->assertUnprocessable();
});

it('requires AA to review and release again after a corrected passed outcome', function () {
    $cert = readyCertificate($this);
    $this->actingAs($this->aa)->post('/certificates/'.$cert->id.'/release', ['pdf' => certificatePdf(), 'email' => false])->assertRedirect();
    $this->actingAs($this->coordinator)->put($this->url, array_replace($this->payload, ['version' => 1, 'reason' => 'Corrected record after reviewing panel minutes']))->assertRedirect();
    expect($cert->fresh()->status)->toBe('needs-review');
    $this->actingAs($this->student)->get('/certificates/'.$cert->id.'/download')->assertForbidden();
    $this->actingAs($this->aa)->post('/certificates/'.$cert->id.'/release', ['pdf' => certificatePdf(), 'email' => false])->assertRedirect();
    expect($cert->fresh()->outcome_version)->toBe(2);
    $this->actingAs($this->student)->get('/certificates/'.$cert->id.'/download')->assertOk();
});
it('keeps a prior missed defense discoverable after a successful revision', function () {
    $this->actingAs($this->coordinator)->put($this->url, array_replace($this->payload, ['completion' => 'did-not-defend', 'result' => 'not-recorded', 'completed_on' => null, 'next_stage' => null, 'reason' => 'Student postponed']))->assertRedirect();
    $this->put($this->url, array_replace($this->payload, ['version' => 1, 'reason' => 'Repeat session held and result verified']))->assertRedirect();
    $this->get('/academic-progress')->assertInertia(fn (Assert $p) => $p->where('students.0.progress.missed_defenses', 1));
});
