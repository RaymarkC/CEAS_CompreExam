<?php

namespace App\Http\Controllers;

use App\Models\DefenseRequest;
use App\Models\FinanceDocumentSubmission;
use App\Models\FinanceHonorariumSubmission;
use App\Services\HonorariumAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class HonorariumWorkspaceController extends Controller
{
    public function index(Request $request, HonorariumAccess $access)
    {
        $user = $request->user();
        $requests = $access->scope(DefenseRequest::query(), $user)->with('student')
            ->where(function ($q) {
                $q->whereNotNull('proof_of_payment')->orWhereHas('honorariumPayments');
            })
            ->latest('updated_at')->limit(500)->get();
        $docs = FinanceDocumentSubmission::whereIn('defense_request_id', $requests->pluck('id'))->get()->groupBy('defense_request_id');
        $items = $requests->map(function ($r) use ($docs, $access) {
            $documents = $docs->get($r->id, collect());
            $status = $documents->isEmpty() ? 'not_submitted' : ($documents->contains('status', 'rejected') ? 'rejected' : ($documents->count() === 2 && $documents->every(fn ($d) => $d->status === 'verified') ? 'verified' : 'submitted'));

            return [
                'id' => $r->id, 'student_name' => $r->student?->full_name ?: trim($r->first_name.' '.$r->last_name),
                'student_number' => $r->student?->school_id ?: $r->school_id, 'program' => $r->program,
                'defense_type' => $r->defense_type, 'workflow_state' => $r->workflow_state,
                'scheduled_date' => $r->scheduled_date?->format('Y-m-d'), 'scheduled_time' => $r->scheduled_time,
                'receipt_url' => $access->receiptUrl($r->proof_of_payment), 'panel_names' => $access->panelNames($r),
                'finance_status' => $status, 'finance_notes' => $documents->where('status', 'rejected')->first()?->finance_notes,
                'submitted_at' => $documents->max('submitted_at')?->toIso8601String(), 'finance_submission_id' => null,
            ];
        });

        return Inertia::render('honorarium/workspace/Index', [
            'role' => $access->role($user), 'canSubmitToFinance' => false, 'canVerifyFinance' => false,
            'canManageDocuments' => $access->canSubmit($user) || $access->canReview($user), 'items' => $items,
            'rates' => $access->canSubmit($user) || $access->canReview($user) ? DB::table('payment_rates')->orderBy('program_level')->get() : [],
        ]);
    }

    public function submitToFinance(Request $request, DefenseRequest $defenseRequest)
    {
        return app(FinanceDocumentWorkflowController::class)->submitFirst($request, $defenseRequest);
    }

    public function updateFinanceStatus(Request $request, FinanceHonorariumSubmission $submission)
    {
        // Compatibility with the draft's single-stage URL; use the canonical document record.
        $doc = FinanceDocumentSubmission::where('defense_request_id', $submission->defense_request_id)->where('document_type', 'payment_receipt')->firstOrFail();

        return app(FinanceDocumentWorkflowController::class)->review($request, $doc);
    }
}
