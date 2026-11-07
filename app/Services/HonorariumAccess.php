<?php

namespace App\Services;

use App\Models\DefenseRequest;
use App\Models\Panelist;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class HonorariumAccess
{
    public function role(User $user): string
    {
        return strtolower(trim((string) $user->role));
    }

    public function canSubmit(User $user): bool
    {
        return in_array($this->role($user), ['administrative assistant', 'assistant', 'aa', 'dean', 'super admin', 'superadmin'], true);
    }

    public function canReview(User $user): bool
    {
        return in_array($this->role($user), ['finance', 'finance office', 'finance officer', 'dean', 'super admin', 'superadmin'], true);
    }

    public function scope(Builder $query, User $user): Builder
    {
        if ($this->canSubmit($user) || $this->canReview($user)) {
            return $query;
        }
        if ($this->role($user) === 'coordinator') {
            return $query->where('coordinator_user_id', $user->id);
        }
        abort_unless(in_array($this->role($user), ['adviser', 'faculty', 'panelist'], true), 403);
        // Email ties a panelist record to an account; names alone are not unique identities.
        $ids = Panelist::whereRaw('LOWER(email) = ?', [strtolower($user->email)])->pluck('id');

        return $query->where(function ($q) use ($user, $ids) {
            $q->where('adviser_user_id', $user->id);
            foreach (['defense_chairperson', 'defense_panelist1', 'defense_panelist2', 'defense_panelist3', 'defense_panelist4'] as $field) {
                $q->orWhereIn($field, $ids);
            }
        });
    }

    public function assertReady(DefenseRequest $request): void
    {
        abort_unless(in_array($request->workflow_state, ['coordinator-approved', 'panels-assigned', 'scheduled', 'completed'], true)
            && ! in_array($request->status, ['Cancelled', 'Rejected'], true), 422, 'The defense request must be approved before sending documents to Finance.');
        abort_unless($request->proof_of_payment, 422, 'A student payment receipt is required.');
    }

    public function panelNames(DefenseRequest $request): array
    {
        $ids = collect([$request->defense_chairperson, $request->defense_panelist1, $request->defense_panelist2, $request->defense_panelist3, $request->defense_panelist4])->filter()->unique()->values();

        return $ids->map(function ($value) {
            $panel = is_numeric($value) ? Panelist::find($value) : Panelist::where('name', $value)->first();

            return $panel?->name ?? (string) $value;
        })->filter()->values()->all();
    }

    public function receiptUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }
        if (str_starts_with($path, 'https://') || str_starts_with($path, 'http://')) {
            return $path;
        }

        return '/storage/'.ltrim(preg_replace('#^/?storage/#', '', $path), '/');
    }
}
