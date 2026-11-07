<?php

namespace App\Services;

use App\Helpers\ProgramLevel;
use App\Models\DefenseRequest;
use App\Models\FinanceDocumentSubmission;
use App\Models\HonorariumActivity;
use App\Models\HonorariumDisbursement;
use App\Models\Notification;
use App\Models\Panelist;
use App\Models\PaymentRate;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class HonorariumLedgerService
{
    public function assertVerified(DefenseRequest $dr): void
    {
        app(HonorariumAccess::class)->assertReady($dr);
        $docs = FinanceDocumentSubmission::where('defense_request_id', $dr->id)->get()->keyBy('document_type');
        if ($docs->get('payment_receipt')?->status !== 'verified' || $docs->get('panel_breakdown')?->status !== 'verified') {
            throw ValidationException::withMessages(['workflow' => 'Finance must verify both the receipt and panel breakdown first.']);
        }
        if (($docs['payment_receipt']->payload['receipt_path'] ?? null) !== $dr->proof_of_payment || ($docs['panel_breakdown']->payload['panel_names'] ?? []) !== app(HonorariumAccess::class)->panelNames($dr) || ($docs['panel_breakdown']->payload['panel_affiliations'] ?? []) !== ($dr->panel_affiliations ?? [])) {
            throw ValidationException::withMessages(['workflow' => 'Finance documents no longer match the current defense information. Resubmit them for verification.']);
        }
    }

    public function recipients(DefenseRequest $dr): array
    {
        $recipients = [];
        $seen = [];
        foreach (['defense_chairperson' => 'Panel Chair', 'defense_panelist1' => 'Panel Member', 'defense_panelist2' => 'Panel Member', 'defense_panelist3' => 'Panel Member', 'defense_panelist4' => 'Panel Member'] as $field => $role) {
            $id = $dr->{$field};
            if (! $id) {
                continue;
            }
            $matches = is_numeric($id) ? Panelist::whereKey($id)->get() : Panelist::where('name', $id)->get();
            $p = $matches->count() === 1 ? $matches->first() : null;
            if (! $p) {
                throw ValidationException::withMessages(['panelists' => 'Every panelist must have a registered panelist record.']);
            }
            if (isset($seen[$p->id])) {
                throw ValidationException::withMessages(['panelists' => 'Each panel seat must have a different registered panelist.']);
            }
            $seen[$p->id] = true;
            $recipients[] = ['recipient_key' => 'panel:'.$p->id.':'.$role, 'recipient_name' => $p->name, 'recipient_email' => $p->email, 'recipient_role' => $role];
        }
        if ($dr->adviser_user_id && ($adviser = User::find($dr->adviser_user_id))) {
            $recipients[] = ['recipient_key' => 'adviser:'.$adviser->id, 'recipient_name' => $adviser->full_name, 'recipient_email' => $adviser->email, 'recipient_role' => 'Adviser'];
        }
        if (! $recipients) {
            throw ValidationException::withMessages(['panelists' => 'Assign recipients before preparing honoraria.']);
        }

        return $recipients;
    }

    public function prepare(DefenseRequest $request, User $actor, array $data): void
    {
        DB::transaction(function () use ($request, $actor, $data) {
            $dr = DefenseRequest::lockForUpdate()->findOrFail($request->id);
            $this->assertVerified($dr);
            $service = app(DefenseServiceConfirmation::class)->assertRendered($dr);
            if (HonorariumDisbursement::where('defense_request_id', $dr->id)->where('status', '!=', 'voided')->exists()) {
                throw ValidationException::withMessages(['workflow' => 'This defense already has active honorarium records. Review the existing records.']);
            }
            $rendered = collect($service->participants)->where('attendance', 'rendered');
            if ($rendered->isEmpty()) {
                throw ValidationException::withMessages(['service' => 'No recipients have confirmed rendered service.']);
            }
            foreach ($rendered as $participant) {
                $recipient = collect($participant)->only(['recipient_key', 'recipient_name', 'recipient_email', 'recipient_role'])->all();
                if (($participant['affiliation'] ?? null) === 'external') {
                    $recipient['recipient_role'] = 'External '.$recipient['recipient_role'];
                }
                $types = match ($recipient['recipient_role']) {
                    'Panel Chair' => ['Panel Chair', 'Chairperson', 'Panel Chairperson'],default => [$recipient['recipient_role']]
                };
                $baseRates = PaymentRate::where('program_level', ProgramLevel::getLevel($dr->program))->get()->filter(fn ($r) => $this->normalizeDefense($r->defense_type) === $this->normalizeDefense($dr->defense_type));
                $rates = $baseRates->whereIn('type', $types);
                if ($recipient['recipient_role'] === 'Panel Member') {
                    // Keep existing position-specific Dean rates authoritative when configured.
                    $panelId = explode(':', $recipient['recipient_key'])[1];
                    foreach (['defense_panelist1', 'defense_panelist2', 'defense_panelist3', 'defense_panelist4'] as $index => $field) {
                        if ((string) $dr->{$field} === $panelId) {
                            $specific = $baseRates->where('type', 'Panel Member '.($index + 1));
                            if ($specific->isNotEmpty()) {
                                $rates = $specific;
                            }
                            break;
                        }
                    }
                }
                if ($rates->count() !== 1 || (float) $rates->first()->amount <= 0) {
                    throw ValidationException::withMessages(['rates' => 'Configure one positive Dean payment rate for '.$recipient['recipient_role'].' and this defense type.']);
                }
                HonorariumDisbursement::create($recipient + ['recipient_affiliation' => $participant['affiliation'], 'service_evidence' => ['participant' => $participant, 'completed_on' => $service->completed_on->format('Y-m-d'), 'confirmed_by' => $service->confirmed_by, 'confirmed_at' => $service->confirmed_at->toIso8601String(), 'snapshot_hash' => $service->snapshot_hash], 'defense_request_id' => $dr->id, 'amount' => $rates->first()->amount, 'school_year' => $data['school_year'], 'semester' => $data['semester'], 'status' => 'prepared', 'prepared_by' => $actor->id, 'history' => [$this->entry('prepared', $actor, 'Prepared from confirmed service and configured payment rates.')]]);
            }
            $this->notify($dr, 'Honoraria Prepared', 'Honorarium records are ready for Finance approval.', ['Finance', 'Finance Office', 'Finance Officer']);
        });
    }

    private function normalizeDefense(?string $value): string
    {
        return strtolower(preg_replace('/[^a-z]/i', '', $value ?? ''));
    }

    public function entry(string $action, ?User $actor, string $notes, array $extra = []): array
    {
        return $extra + ['action' => $action, 'actor_id' => $actor?->id, 'actor_name' => $actor?->full_name ?? 'System', 'at' => now()->toIso8601String(), 'notes' => $notes];
    }

    public function transition(HonorariumDisbursement $record, User $actor, array $data): void
    {
        DB::transaction(function () use ($record, $actor, $data) {
            $dr = DefenseRequest::lockForUpdate()->findOrFail($record->defense_request_id);
            $row = HonorariumDisbursement::lockForUpdate()->findOrFail($record->id);
            $this->assertVerified($dr);
            $service = app(DefenseServiceConfirmation::class)->assertRendered($dr);
            if (! $row->service_evidence || $row->service_evidence['snapshot_hash'] !== $service->snapshot_hash) {
                throw ValidationException::withMessages(['service' => 'This payment has no matching current service evidence. Confirm service and prepare unpaid records again.']);
            }
            $next = ['prepared' => 'approved', 'approved' => 'disbursed', 'disbursed' => 'claimed'][$row->status] ?? null;
            if ($row->requires_review || $next !== $data['status']) {
                throw ValidationException::withMessages(['status' => 'This transition is not available. Refresh the record and check any review warnings.']);
            }
            if ($next === 'disbursed') {
                if ($data['event_date'] < $service->completed_on->format('Y-m-d')) {
                    throw ValidationException::withMessages(['event_date' => 'Disbursement cannot precede the confirmed service date.']);
                }
                if ($dr->workflow_state !== 'completed') {
                    throw ValidationException::withMessages(['workflow' => 'Record the completed defense before recording a disbursement.']);
                }
                $row->payment_reference = $data['payment_reference'];
                $row->disbursed_on = $data['event_date'];
            }
            if ($next === 'claimed') {
                if ($data['event_date'] < $row->disbursed_on->format('Y-m-d')) {
                    throw ValidationException::withMessages(['event_date' => 'Claim date cannot be before disbursement.']);
                }
                $row->claimed_on = $data['event_date'];
            }
            $row->status = $next;
            $row->history = [...$row->history, $this->entry($next, $actor, $data['notes'] ?? '', ['event_date' => $data['event_date'] ?? null, 'payment_reference' => $row->payment_reference])];
            $row->save();
            $this->notify($dr, 'Honorarium Status Updated', $row->recipient_name.': honorarium marked '.$next.'.', ['Administrative Assistant', 'Dean']);
            $recipient = User::where('email', $row->recipient_email)->first();
            if ($recipient) {
                Notification::create(['user_id' => $recipient->id, 'defense_request_id' => $dr->id, 'type' => 'honorarium', 'title' => 'Your Honorarium Status Updated', 'message' => 'Your honorarium for “'.$dr->thesis_title.'” is '.$next.'.', 'link' => '/honorarium-ledger', 'read' => false]);
            }
        });
    }

    private function notify(DefenseRequest $dr, string $title, string $message, array $roles): void
    {
        foreach (User::whereIn('role', $roles)->get(['id']) as $u) {
            Notification::create(['user_id' => $u->id, 'defense_request_id' => $dr->id, 'type' => 'honorarium', 'title' => $title, 'message' => $message, 'link' => '/honorarium-ledger', 'read' => false]);
        }
    }

    public function invalidate(DefenseRequest $dr): void
    {
        if (! Schema::hasTable('finance_document_submissions')) {
            return;
        }
        $panelFields = ['defense_chairperson', 'defense_panelist1', 'defense_panelist2', 'defense_panelist3', 'defense_panelist4'];
        $receiptChanged = $dr->wasChanged('proof_of_payment');
        $panelsChanged = $dr->wasChanged(array_merge($panelFields, ['panel_affiliations', 'adviser_user_id', 'program', 'defense_type']));
        $cancelled = $dr->wasChanged('workflow_state') && in_array($dr->workflow_state, ['cancelled', 'rejected', 'coordinator-rejected', 'adviser-rejected'], true);
        if (! $receiptChanged && ! $panelsChanged && ! $cancelled) {
            return;
        }
        $kinds = $receiptChanged || $cancelled ? ['payment_receipt', 'panel_breakdown'] : ['panel_breakdown'];
        DB::transaction(function () use ($dr, $kinds) {
            $documents = FinanceDocumentSubmission::where('defense_request_id', $dr->id)->whereIn('document_type', $kinds)->whereIn('status', ['submitted', 'verified'])->lockForUpdate()->get();
            if ($documents->isEmpty()) {
                return;
            }
            foreach ($documents as $doc) {
                $note = 'Defense information changed. AA must resubmit current documents for Finance verification.';
                HonorariumActivity::create(['defense_request_id' => $dr->id, 'user_id' => auth()->id(), 'finance_document_submission_id' => $doc->id, 'activity_type' => 'document_invalidated', 'title' => 'Finance document needs re-verification', 'description' => $note.' Previous status: '.$doc->status.'. Snapshot: '.json_encode($doc->payload), 'occurred_at' => now()]);
                $doc->update(['status' => 'rejected', 'finance_notes' => $note]);
            }
            if (Schema::hasTable('honorarium_disbursements')) {
                foreach (HonorariumDisbursement::where('defense_request_id', $dr->id)->where('status', '!=', 'voided')->lockForUpdate()->get() as $row) {
                    if (in_array($row->status, ['prepared', 'approved'], true)) {
                        $row->status = 'voided';
                    } else {
                        $row->requires_review = true;
                    }
                    $row->history = [...$row->history, $this->entry('defense-changed', auth()->user(), 'Defense information changed; prior records are retained for review.')];
                    $row->save();
                }
            }
            $this->notify($dr, 'Finance Documents Need Re-verification', 'A receipt, panel assignment, or request status changed. Check the Finance documents and honorarium records.', ['Administrative Assistant', 'Finance', 'Finance Office', 'Finance Officer']);
        });
    }
}
