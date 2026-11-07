<?php

namespace App\Http\Controllers;

use App\Mail\DefenseCertificateDelivery;
use App\Models\DefenseAcademicOutcome;
use App\Models\DefenseCertificateRequest;
use App\Models\DefenseRequest;
use App\Models\Notification;
use App\Models\User;
use App\Services\DefenseAcademicProgress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class DefenseCertificateController extends Controller
{
    private function aa(Request $request): void
    {
        abort_unless($request->user()->role === 'Administrative Assistant', 403);
    }

    public function index(Request $request, DefenseAcademicProgress $service)
    {
        $user = $request->user();
        abort_unless(in_array($user->role, ['Student', 'Administrative Assistant']), 403);
        $defenses = DefenseRequest::when($user->role === 'Student', fn ($q) => $q->where('submitted_by', $user->id))
            ->when($user->role === 'Administrative Assistant', fn ($q) => $q->whereIn('id', DefenseCertificateRequest::select('defense_request_id')))->latest('id')->get();
        $outcomes = DefenseAcademicOutcome::whereIn('defense_request_id', $defenses->pluck('id'))->get()->keyBy('defense_request_id');
        $certs = DefenseCertificateRequest::whereIn('defense_request_id', $defenses->pluck('id'))->get()->keyBy('defense_request_id');

        return Inertia::render('certificates/Index', ['isAA' => $user->role === 'Administrative Assistant', 'items' => $defenses->map(function ($dr) use ($service, $outcomes, $certs) {
            $row = $outcomes->get($dr->id);
            $cert = $certs->get($dr->id);
            $eligible = $service->eligible($dr, $row);
            $available = $eligible && $cert?->status === 'released' && $cert->outcome_version === $row?->version;

            return ['id' => $dr->id, 'title' => $dr->thesis_title, 'stage' => $dr->defense_type, 'student' => trim($dr->first_name.' '.$dr->last_name), 'outcome' => $service->view($dr, $row), 'eligible' => $eligible,
                'certificate' => $cert ? ['id' => $cert->id, 'status' => $available ? 'released' : ($cert->status === 'released' ? 'needs-review' : $cert->status), 'released_at' => $cert->released_at?->toIso8601String(), 'email_status' => $cert->email_status, 'emailed_at' => $cert->emailed_at?->toIso8601String(), 'download_url' => $available ? '/certificates/'.$cert->id.'/download' : null, 'history' => collect($cert->history ?? [])->map(fn ($event) => collect($event)->only(['event', 'at'])->all())->values()] : null];
        })->values()]);
    }

    public function requestCertificate(Request $request, DefenseRequest $defenseRequest, DefenseAcademicProgress $service)
    {
        abort_unless($request->user()->role === 'Student' && (int) $defenseRequest->submitted_by === (int) $request->user()->id, 403);
        DB::transaction(function () use ($request, $defenseRequest, $service) {
            $dr = DefenseRequest::lockForUpdate()->findOrFail($defenseRequest->id);
            abort_unless((int) $dr->submitted_by === (int) $request->user()->id, 403);
            if (! $service->eligible($dr)) {
                throw ValidationException::withMessages(['certificate' => 'Your coordinator must record this defense as Done and Passed first.']);
            }
            $cert = DefenseCertificateRequest::firstOrCreate(['defense_request_id' => $dr->id], ['student_id' => $request->user()->id, 'status' => 'requested', 'history' => [['event' => 'requested', 'actor' => $request->user()->id, 'at' => now()->toIso8601String()]]]);
            if ($cert->wasRecentlyCreated) {
                foreach (User::where('role', 'Administrative Assistant')->get() as $aa) {
                    Notification::create(['user_id' => $aa->id, 'type' => 'certificate-request', 'title' => 'Certificate requested', 'message' => $request->user()->name.' requested a certificate for '.$dr->defense_type.' defense.', 'link' => '/certificates', 'read' => false]);
                }
            }
        });

        return back()->with('success', 'Certificate request recorded. The Administrative Assistant has been notified.');
    }

    public function release(Request $request, DefenseCertificateRequest $certificate, DefenseAcademicProgress $service)
    {
        $this->aa($request);
        $data = $request->validate(['pdf' => 'required|file|mimes:pdf|max:10240', 'email' => 'required|boolean']);
        $path = $request->file('pdf')->store('defense-certificates', 'local');
        if (! $path) {
            throw ValidationException::withMessages(['pdf' => 'The PDF could not be stored. Try again.']);
        }
        try {
            DB::transaction(function () use ($request, $certificate, $service, $path) {
                $dr = DefenseRequest::lockForUpdate()->findOrFail($certificate->defense_request_id);
                $cert = DefenseCertificateRequest::lockForUpdate()->findOrFail($certificate->id);
                $row = DefenseAcademicOutcome::where('defense_request_id', $dr->id)->first();
                if (! $service->eligible($dr, $row)) {
                    throw ValidationException::withMessages(['certificate' => 'Only a current Done and Passed defense is eligible.']);
                }
                if ((int) $cert->student_id !== (int) $dr->submitted_by) {
                    abort(403);
                }
                $history = $cert->history ?? [];
                $history[] = ['event' => 'released', 'actor' => $request->user()->id, 'at' => now()->toIso8601String(), 'outcome_version' => $row->version, 'previous_pdf' => $cert->pdf_path];
                $cert->fill(['pdf_path' => $path, 'status' => 'released', 'released_by' => $request->user()->id, 'released_at' => now(), 'outcome_version' => $row->version, 'email_status' => 'not-sent', 'emailed_at' => null, 'history' => $history])->save();
                Notification::create(['user_id' => $cert->student_id, 'type' => 'certificate-released', 'title' => 'Your defense certificate is available', 'message' => 'The Administrative Assistant released your '.$dr->defense_type.' defense certificate. Open Certificates to download the PDF.', 'link' => '/certificates', 'read' => false]);
            });
        } catch (\Throwable $error) {
            Storage::disk('local')->delete($path);
            throw $error;
        }
        $message = 'Certificate released. The student can download it in the system.';
        if ($data['email']) {
            $message .= ' '.$this->deliver($request, $certificate, $service);
        }

        return back()->with('success', $message);
    }

    public function email(Request $request, DefenseCertificateRequest $certificate, DefenseAcademicProgress $service)
    {
        $this->aa($request);

        return back()->with('success', $this->deliver($request, $certificate, $service));
    }

    private function deliver(Request $request, DefenseCertificateRequest $certificate, DefenseAcademicProgress $service): string
    {
        return DB::transaction(function () use ($request, $certificate, $service) {
            $dr = DefenseRequest::lockForUpdate()->findOrFail($certificate->defense_request_id);
            $cert = DefenseCertificateRequest::lockForUpdate()->findOrFail($certificate->id);
            $row = DefenseAcademicOutcome::where('defense_request_id', $dr->id)->first();
            if (! $service->eligible($dr, $row) || $cert->status !== 'released' || $cert->outcome_version !== $row->version || ! Storage::disk('local')->exists($cert->pdf_path ?? '')) {
                throw ValidationException::withMessages(['certificate' => 'Release a current eligible PDF before emailing.']);
            }
            $student = User::findOrFail($cert->student_id);
            $history = $cert->history ?? [];
            try {
                $transport = config('mail.mailers.'.config('mail.default').'.transport');
                if (in_array($transport, ['log', 'array']) && ! app()->runningUnitTests()) {
                    throw new \RuntimeException('No delivery mailer configured');
                }
                Mail::to($student->email)->send(new DefenseCertificateDelivery($student->name, $dr->defense_type, $cert->pdf_path));
                $cert->email_status = 'sent';
                $cert->emailed_at = now();
                $history[] = ['event' => 'emailed', 'actor' => $request->user()->id, 'at' => now()->toIso8601String()];
                $message = 'Email with the PDF attachment was accepted by the mail service.';
            } catch (\Throwable $error) {
                report($error);
                $cert->email_status = 'failed';
                $history[] = ['event' => 'email-failed', 'actor' => $request->user()->id, 'at' => now()->toIso8601String()];
                $message = 'Email delivery failed. The PDF remains available in the system. Check email settings and retry.';
            }
            $cert->history = $history;
            $cert->save();

            return $message;
        });
    }

    public function download(Request $request, DefenseCertificateRequest $certificate, DefenseAcademicProgress $service)
    {
        abort_unless($request->user()->role === 'Administrative Assistant' || ($request->user()->role === 'Student' && (int) $certificate->student_id === (int) $request->user()->id), 403);
        $dr = DefenseRequest::findOrFail($certificate->defense_request_id);
        $row = DefenseAcademicOutcome::where('defense_request_id', $dr->id)->first();
        abort_unless($service->eligible($dr, $row) && $certificate->status === 'released' && $certificate->outcome_version === $row->version, 403);
        abort_unless($certificate->pdf_path && Storage::disk('local')->exists($certificate->pdf_path), 404);

        return Storage::disk('local')->download($certificate->pdf_path, 'Defense-Certificate-'.$dr->id.'.pdf', ['Content-Type' => 'application/pdf', 'Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff']);
    }
}
