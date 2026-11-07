<?php

namespace App\Http\Controllers;

use App\Models\DefenseAcademicOutcome;
use App\Models\DefenseCertificateRequest;
use App\Models\DefenseRequest;
use App\Models\Notification;
use App\Services\DefenseAcademicProgress;
use App\Services\StudentProgressService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class DefenseAcademicOutcomeController extends Controller
{
    public function update(Request $request, DefenseRequest $defenseRequest, DefenseAcademicProgress $service)
    {
        abort_unless($request->user()->role === 'Coordinator' && (int) $defenseRequest->coordinator_user_id === (int) $request->user()->id, 403);
        $data = $request->validate(['version' => 'required|integer|min:0', 'completion' => ['required', Rule::in(['not-yet-done', 'done', 'did-not-defend'])],
            'result' => ['required', Rule::in(['not-recorded', 'passed', 'for-revision', 'repeat-defense'])],
            'subject' => ['required', Rule::in($service::SUBJECTS)], 'completed_on' => 'nullable|date_format:Y-m-d|before_or_equal:'.now('Asia/Manila')->toDateString(),
            'reason' => 'nullable|string|max:2000', 'next_stage' => ['nullable', Rule::in(['Proposal', 'Prefinal', 'Final'])]]);
        $data += ['completed_on' => null, 'reason' => null, 'next_stage' => null];
        if ($data['completion'] !== 'done' && ($data['result'] !== 'not-recorded' || ! empty($data['completed_on']) || ! empty($data['next_stage']))) {
            throw ValidationException::withMessages(['completion' => 'Only a done defense can have a result, completion date or next stage.']);
        }
        if ($data['completion'] === 'done' && empty($data['completed_on'])) {
            throw ValidationException::withMessages(['completed_on' => 'Enter the actual defense completion date.']);
        }
        if ($data['completion'] === 'did-not-defend' && ! trim($data['reason'] ?? '')) {
            throw ValidationException::withMessages(['reason' => 'Explain why the student did not defend.']);
        }
        DB::transaction(function () use ($request, $defenseRequest, $data, $service) {
            $dr = DefenseRequest::lockForUpdate()->findOrFail($defenseRequest->id);
            abort_unless((int) $dr->coordinator_user_id === (int) $request->user()->id, 403);
            if (! in_array($dr->workflow_state, ['scheduled', 'completed']) || in_array(strtolower($dr->status ?? ''), ['cancelled', 'rejected'])) {
                throw ValidationException::withMessages(['defense' => 'Record outcomes for an active scheduled defense.']);
            }
            if ($data['completion'] !== 'not-yet-done') {
                $end = $dr->scheduled_date && $dr->scheduled_end_time ? CarbonImmutable::parse($dr->scheduled_date->format('Y-m-d').' '.$dr->scheduled_end_time, 'Asia/Manila') : null;
                if (! $end || $end->isFuture() || (! empty($data['completed_on']) && $data['completed_on'] < $dr->scheduled_date->format('Y-m-d'))) {
                    throw ValidationException::withMessages(['completed_on' => 'Record the outcome after the scheduled session ends, using the defense date or later.']);
                }
            }
            $stage = app(StudentProgressService::class)->stage($dr->defense_type);
            $next = ['Proposal' => 'Prefinal', 'Prefinal' => 'Final'];
            if (! empty($data['next_stage']) && ($data['result'] !== 'passed' || ($next[$stage] ?? null) !== $data['next_stage'])) {
                throw ValidationException::withMessages(['next_stage' => 'Only a passed defense can progress to its next stage. Final defense does not mark graduation.']);
            }
            $row = DefenseAcademicOutcome::where('defense_request_id', $dr->id)->lockForUpdate()->first();
            if (($row?->version ?? 0) !== (int) $data['version']) {
                throw ValidationException::withMessages(['version' => 'This outcome changed. Refresh before saving.']);
            }
            if ($row && ! trim($data['reason'] ?? '')) {
                throw ValidationException::withMessages(['reason' => 'Explain the revision to this outcome.']);
            }
            $history = $row?->history ?? [];
            if ($row) {
                $history[] = $row->only(['completion', 'result', 'subject', 'completed_on', 'reason', 'next_stage', 'recorded_by', 'updated_at', 'version']);
            }
            $row ??= new DefenseAcademicOutcome(['defense_request_id' => $dr->id]);
            $row->fill(array_intersect_key($data, array_flip(['completion', 'result', 'subject', 'completed_on', 'reason', 'next_stage'])) + ['snapshot_hash' => $service->snapshot($dr), 'recorded_by' => $request->user()->id, 'history' => $history]);
            $row->version = $row->exists ? $row->version + 1 : 1;
            $row->save();
            DefenseCertificateRequest::where('defense_request_id', $dr->id)->where('status', 'released')->update(['status' => 'needs-review']);
            Notification::create(['user_id' => $dr->submitted_by, 'type' => 'defense-outcome', 'title' => 'Defense outcome updated', 'message' => $dr->defense_type.': '.str_replace('-', ' ', $row->completion).' / '.str_replace('-', ' ', $row->result).($row->reason ? ' — '.$row->reason : ''), 'link' => '/certificates', 'read' => false]);
        });

        return back()->with('success', 'Defense outcome saved. No graduation or new defense request was created.');
    }
}
