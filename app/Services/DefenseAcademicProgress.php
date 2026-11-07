<?php

namespace App\Services;

use App\Models\DefenseAcademicOutcome;
use App\Models\DefenseRequest;

class DefenseAcademicProgress
{
    public const SUBJECTS = ['Thesis 1', 'Thesis 2', 'Dissertation 1', 'Dissertation 2'];

    public function snapshot(DefenseRequest $dr): string
    {
        return hash('sha256', json_encode([$dr->submitted_by, $dr->defense_type, $dr->scheduled_date?->format('Y-m-d'), $dr->scheduled_time, $dr->scheduled_end_time, $dr->adviser_user_id, ...array_map(fn ($field) => $dr->$field, DefenseConflictService::PANEL_FIELDS)]));
    }

    public function current(DefenseRequest $dr, ?DefenseAcademicOutcome $row): bool
    {
        return $row && hash_equals($row->snapshot_hash, $this->snapshot($dr)) && ! in_array(strtolower($dr->status ?? ''), ['cancelled', 'rejected']) && in_array($dr->workflow_state, ['scheduled', 'completed']);
    }

    public function eligible(DefenseRequest $dr, ?DefenseAcademicOutcome $row = null): bool
    {
        $row ??= DefenseAcademicOutcome::where('defense_request_id', $dr->id)->first();

        return $this->current($dr, $row) && $row->completion === 'done' && $row->result === 'passed';
    }

    public function view(DefenseRequest $dr, ?DefenseAcademicOutcome $row): ?array
    {
        return $row ? $row->only(['completion', 'result', 'subject', 'reason', 'next_stage', 'version', 'history']) + ['completed_on' => $row->completed_on?->format('Y-m-d'), 'current' => $this->current($dr, $row), 'recorded_at' => $row->updated_at->toIso8601String()] : null;
    }
}
