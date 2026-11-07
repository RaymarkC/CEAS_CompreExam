<?php

namespace App\Services;

use App\Models\DefenseRequest;
use App\Models\DefenseServiceRecord;
use App\Models\HonorariumDisbursement;
use App\Models\Notification;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DefenseServiceConfirmation
{
    public function canConfirm(User $user, ?DefenseRequest $request = null): bool
    {
        return app(HonorariumAccess::class)->canSubmit($user)
            || ($user->role === 'Coordinator' && (! $request || (int) $request->coordinator_user_id === (int) $user->id));
    }

    public function snapshot(DefenseRequest $request): string
    {
        return hash('sha256', json_encode([
            $request->only([...DefenseConflictService::PANEL_FIELDS, 'panel_affiliations', 'adviser_user_id', 'program', 'defense_type', 'scheduled_time', 'scheduled_end_time', 'defense_venue', 'defense_mode']),
            $request->scheduled_date?->format('Y-m-d'),
            app(HonorariumLedgerService::class)->recipients($request),
        ]));
    }

    public function current(DefenseRequest $request): ?DefenseServiceRecord
    {
        $record = DefenseServiceRecord::where('defense_request_id', $request->id)->first();
        if (! $record || $request->workflow_state !== 'completed' || in_array(strtolower($request->status ?? ''), ['cancelled', 'rejected'], true)) {
            return null;
        }

        return hash_equals($record->snapshot_hash, $this->snapshot($request)) ? $record : null;
    }

    public function assertRendered(DefenseRequest $request): DefenseServiceRecord
    {
        $record = $this->current($request);
        if (! $record) {
            throw ValidationException::withMessages(['service' => 'Confirm defense completion and each recipient’s service in the Defense Register before preparing honoraria.']);
        }

        return $record;
    }

    public function confirm(DefenseRequest $request, User $actor, array $data): void
    {
        DB::transaction(function () use ($request, $actor, $data) {
            $dr = DefenseRequest::lockForUpdate()->findOrFail($request->id);
            abort_unless($this->canConfirm($actor, $dr), 403);
            if (! in_array($dr->workflow_state, ['scheduled', 'completed'], true) || in_array(strtolower($dr->status ?? ''), ['cancelled', 'rejected'], true) || ! $dr->scheduled_date || ! $dr->scheduled_time || ! $dr->scheduled_end_time) {
                throw ValidationException::withMessages(['defense' => 'Choose an active scheduled defense with a recorded start and end time.']);
            }
            $scheduledStart = CarbonImmutable::parse($dr->scheduled_date->format('Y-m-d').' '.$dr->scheduled_time, 'Asia/Manila');
            $scheduledEnd = CarbonImmutable::parse($dr->scheduled_date->format('Y-m-d').' '.$dr->scheduled_end_time, 'Asia/Manila');
            if ($scheduledEnd <= $scheduledStart || $scheduledEnd > CarbonImmutable::now('Asia/Manila') || $data['completed_on'] < $dr->scheduled_date->format('Y-m-d')) {
                throw ValidationException::withMessages(['completed_on' => 'Confirm after the scheduled session ends, using its date or a later actual completion date.']);
            }
            $roster = app(HonorariumLedgerService::class)->recipients($dr);
            $submitted = collect($data['participants'])->keyBy('recipient_key');
            if ($submitted->count() !== count($roster) || array_diff($submitted->keys()->all(), array_column($roster, 'recipient_key'))) {
                throw ValidationException::withMessages(['participants' => 'Confirm every currently assigned participant exactly once. Refresh the page if assignments changed.']);
            }
            $participants = [];
            foreach ($roster as $person) {
                $input = $submitted[$person['recipient_key']];
                if ($person['recipient_role'] !== 'Adviser' && ! in_array($input['affiliation'] ?? null, ['internal', 'external'], true)) {
                    throw ValidationException::withMessages(['participants' => 'Choose internal or external for every panelist.']);
                }
                if ($person['recipient_role'] !== 'Adviser' && ($dr->panel_affiliations[$person['recipient_key']] ?? null) !== $input['affiliation']) {
                    throw ValidationException::withMessages(['participants' => 'Save current panel classifications before confirming service.']);
                }
                $participants[] = $person + ['affiliation' => $person['recipient_role'] === 'Adviser' ? null : $input['affiliation'], 'attendance' => $input['attendance']];
            }
            $record = DefenseServiceRecord::firstOrNew(['defense_request_id' => $dr->id]);
            if ($record->exists && ! trim($data['notes'] ?? '')) {
                throw ValidationException::withMessages(['notes' => 'Explain why this confirmed service record is being revised.']);
            }
            $history = $record->history ?? [];
            if ($record->exists) {
                $history[] = ['action' => 'previous-confirmation', 'participants' => $record->participants, 'completed_on' => $record->completed_on->format('Y-m-d'), 'confirmed_by' => $record->confirmed_by, 'confirmed_at' => $record->confirmed_at->toIso8601String(), 'notes' => $record->notes];
            }
            $from = $dr->workflow_state;
            $dr->workflow_state = 'completed';
            $dr->status = 'Completed';
            $dr->addWorkflowEntry('service-confirmed', $data['notes'] ?? 'Defense held and recipient service recorded.', $actor->id, $from, 'completed');
            $dr->save();
            $record->fill(['participants' => $participants, 'snapshot_hash' => $this->snapshot($dr), 'completed_on' => $data['completed_on'], 'confirmed_by' => $actor->id, 'confirmed_at' => now(), 'notes' => $data['notes'] ?? null, 'history' => $history])->save();
            $payments = HonorariumDisbursement::where('defense_request_id', $dr->id)->where('status', '!=', 'voided')->lockForUpdate()->get();
            foreach ($payments as $row) {
                if (in_array($row->status, ['prepared', 'approved'], true)) {
                    $row->status = 'voided';
                } else {
                    $row->requires_review = true;
                }
                $row->history = [...$row->history, app(HonorariumLedgerService::class)->entry('service-confirmation-changed', $actor, 'Service evidence changed. Unpaid records must be prepared again; paid records require Finance review.')];
                $row->save();
            }
            foreach (User::whereIn('role', ['Finance', 'Administrative Assistant', 'Dean'])->get() as $user) {
                Notification::create(['user_id' => $user->id, 'type' => 'honorarium', 'title' => 'Defense Service Confirmed', 'message' => 'Service evidence for “'.$dr->thesis_title.'” is available. Review any existing honorarium records before preparing again.', 'link' => '/defense-register', 'read' => false]);
            }
        });
    }

    public function classify(DefenseRequest $request, User $actor, array $data): void
    {
        DB::transaction(function () use ($request, $actor, $data) {
            $dr = DefenseRequest::lockForUpdate()->findOrFail($request->id);
            abort_unless($this->canConfirm($actor, $dr), 403);
            if (! in_array($dr->workflow_state, ['scheduled', 'completed'], true) || in_array(strtolower($dr->status ?? ''), ['cancelled', 'rejected'], true)) {
                throw ValidationException::withMessages(['defense' => 'Choose an active scheduled defense.']);
            }
            $keys = collect(app(HonorariumLedgerService::class)->recipients($dr))->where('recipient_role', '!=', 'Adviser')->pluck('recipient_key')->sort()->values()->all();
            $submitted = collect($data['participants'])->keyBy('recipient_key');
            if ($submitted->keys()->sort()->values()->all() !== $keys) {
                throw ValidationException::withMessages(['participants' => 'Classify every currently assigned panelist exactly once.']);
            }
            $classifications = $submitted->map(fn ($person) => $person['affiliation'])->sortKeys()->all();
            $previous = $dr->panel_affiliations ?? [];
            ksort($previous);
            if ($classifications === $previous) {
                return;
            }
            if ($previous && ! trim($data['notes'] ?? '')) {
                throw ValidationException::withMessages(['notes' => 'Explain the change to existing panel classifications.']);
            }
            $dr->panel_affiliations = $classifications;
            $dr->addWorkflowEntry('panel-classified', json_encode(['previous' => $previous, 'current' => $classifications, 'notes' => $data['notes'] ?? null]), $actor->id, $dr->workflow_state, $dr->workflow_state);
            $dr->save();
        });
    }
}
