<?php

namespace App\Services;

use App\Models\DefenseRequest;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class DefenseActivityNotifications
{
    public function sendOnce(DefenseRequest $request, User $recipient, string $event, string $title, string $message, string $link, string $type = 'defense-request'): Notification
    {
        return Notification::firstOrCreate([
            'event_key' => hash('sha256', $request->id.'|'.$recipient->id.'|'.$event),
        ], [
            'user_id' => $recipient->id,
            'defense_request_id' => $request->id,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'link' => $link,
            'read' => false,
        ]);
    }

    public function coordinatorFor(DefenseRequest $request): ?User
    {
        if ($request->coordinator_user_id) {
            $assigned = User::whereKey($request->coordinator_user_id)->where('role', 'Coordinator')->first();
            if ($assigned) {
                return $assigned;
            }
        }
        if ($request->adviser_user_id && $request->submitted_by && Schema::hasTable('adviser_student')) {
            $id = DB::table('adviser_student')->where('adviser_id', $request->adviser_user_id)
                ->where('student_id', $request->submitted_by)->value('requested_by');
            if ($id && ($assigned = User::whereKey($id)->where('role', 'Coordinator')->first())) {
                return $assigned;
            }
        }
        if ($request->adviser_user_id && Schema::hasTable('adviser_coordinator')) {
            $ids = DB::table('adviser_coordinator')->where('adviser_id', $request->adviser_user_id)->pluck('coordinator_id');
            $matches = User::whereIn('id', $ids)->where('role', 'Coordinator')->get();
            if ($matches->count() === 1) {
                return $matches->first();
            }
        }
        if ($request->program && Schema::hasTable('coordinator_program_assignments')) {
            $ids = DB::table('coordinator_program_assignments')->where('program_name', $request->program)
                ->where('is_active', true)->pluck('coordinator_user_id');
            $matches = User::whereIn('id', $ids)->where('role', 'Coordinator')->get();
            if ($matches->count() === 1) {
                return $matches->first();
            }
        }
        if ($request->program && Schema::hasTable('coordinator_programs')) {
            $ids = DB::table('coordinator_programs')->where('program', $request->program)->pluck('coordinator_id');
            $matches = User::whereIn('id', $ids)->where('role', 'Coordinator')->get();
            if ($matches->count() === 1) {
                return $matches->first();
            }
        }
        if ($request->program) {
            $matches = User::where('role', 'Coordinator')->where('program', $request->program)->get();
            if ($matches->count() === 1) {
                return $matches->first();
            }
        }
        if ($request->program) {
            $matches = User::where('role', 'Coordinator')->get()->filter(fn ($user) => in_array($request->program, CoordinatorProgramService::getProgramsByEmail(strtolower($user->email ?? '')), true));
            if ($matches->count() === 1) {
                return $matches->first();
            }
        }

        return null;
    }

    public function submitted(DefenseRequest $request): void
    {
        if ($request->adviser_user_id) {
            $adviser = User::whereKey($request->adviser_user_id)->where('role', 'Adviser')->first();
            if ($adviser) {
                $this->sendOnce($request, $adviser, 'submitted', 'New Defense Request',
                    "A student submitted “{$request->thesis_title}” for your endorsement.",
                    "/adviser/defense-requirements/{$request->id}/details");
            }
        }
        $coordinator = $this->coordinatorFor($request);
        if ($coordinator) {
            $this->sendOnce($request, $coordinator, 'submitted', 'New Defense Request',
                "A student submitted “{$request->thesis_title}”. Adviser endorsement is pending.",
                "/coordinator/defense-requests/{$request->id}/details");
        } else {
            Log::notice('Defense notification has no unambiguous coordinator recipient.', ['defense_request_id' => $request->id]);
        }
    }

    public function changed(DefenseRequest $request, ?string $previous): void
    {
        $state = $request->workflow_state;
        $event = $state.'|'.$previous.'|'.hash('sha256', json_encode($request->workflow_history ?? []));
        $student = $request->user;
        if (in_array($state, ['adviser-corrections', 'coordinator-corrections'], true)) {
            $stage = $state === 'adviser-corrections' ? 'adviser' : 'academic coordinator';
            if ($student) {
                $this->sendOnce($request, $student, $event, 'Corrections Requested',
                    "Your {$stage} returned “{$request->thesis_title}” for corrections. Open the request to read the feedback and resubmit.", '/defense-requirements');
            }
            $this->clearUnreadReminders($request);

            return;
        }
        if (in_array($previous, ['adviser-corrections', 'coordinator-corrections'], true)
            && in_array($state, ['adviser-review', 'adviser-approved'], true)) {
            $reviewer = $previous === 'adviser-corrections' ? $request->adviserUser : $this->coordinatorFor($request);
            $link = $previous === 'adviser-corrections'
                ? "/adviser/defense-requirements/{$request->id}/details" : "/coordinator/defense-requests/{$request->id}/details";
            if ($reviewer) {
                $this->sendOnce($request, $reviewer, $event, 'Defense Corrections Resubmitted',
                    "The student resubmitted “{$request->thesis_title}”. Review their response and updated documents.", $link);
            }

            return;
        }
        $titles = [
            'adviser-approved' => 'Adviser Endorsed Your Defense Request',
            'adviser-rejected' => 'Adviser Rejected Your Defense Request',
            'coordinator-approved' => 'Defense Request Approved',
            'coordinator-rejected' => 'Defense Request Rejected',
            'rejected' => 'Defense Request Rejected',
            'completed' => 'Defense Completed',
            'cancelled' => 'Defense Request Cancelled',
        ];
        if ($student && isset($titles[$state])) {
            $detail = match ($state) {
                'adviser-approved' => 'It is now awaiting academic coordinator review.',
                'adviser-rejected' => 'Open your request to review the adviser feedback.',
                'coordinator-approved' => 'Your academic coordinator has approved the request.',
                'coordinator-rejected' => 'Open your request to review the coordinator feedback.',
                default => 'Open your request to view its latest status.',
            };
            $this->sendOnce($request, $student, $event, $titles[$state], "“{$request->thesis_title}”: {$detail}", '/defense-requirements');
        }
        if ($state === 'adviser-approved' && ($coordinator = $this->coordinatorFor($request))) {
            $this->sendOnce($request, $coordinator, $event, 'Defense Request Ready for Review',
                "The adviser endorsed “{$request->thesis_title}”. Your assessment is now needed.",
                "/coordinator/defense-requests/{$request->id}/details");
        }
    }

    public function scheduled(DefenseRequest $request): void
    {
        if (! $request->scheduled_date || ! $request->user
            || in_array($request->workflow_state, ['cancelled', 'completed', 'coordinator-rejected', 'adviser-rejected'])
            || in_array($request->status, ['Cancelled', 'Completed', 'Rejected'])) {
            return;
        }
        $date = $request->scheduled_date->format('Y-m-d');
        $schedule = $date.'|'.$request->scheduled_time.'|'.$request->scheduled_end_time.'|'.$request->defense_venue;
        $this->sendOnce($request, $request->user, 'schedule|'.$schedule, 'Defense Schedule Updated',
            "Your defense for “{$request->thesis_title}” is scheduled on {$date} at {$request->scheduled_time}. Venue: {$request->defense_venue}.",
            '/defense-requirements');
    }

    public function clearUnreadReminders(DefenseRequest $request): void
    {
        Notification::where('defense_request_id', $request->id)->where('type', 'defense-reminder')->where('read', false)->update(['read' => true]);
    }
}
