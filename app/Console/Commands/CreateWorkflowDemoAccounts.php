<?php

namespace App\Console\Commands;

use App\Models\Role;
use App\Models\CoordinatorProgram;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class CreateWorkflowDemoAccounts extends Command
{
    protected $signature = 'demo:workflow-accounts';

    protected $description = 'Create local demo accounts for the Student-to-Registrar workflow';

    public function handle(): int
    {
        if (! app()->environment(['local', 'testing'])) {
            $this->error('Workflow demo accounts can only be created in a local/testing environment.');

            return self::FAILURE;
        }

        $accounts = config('demo.workflow_accounts', []);

        return DB::transaction(function () use ($accounts): int {
            $existing = User::whereIn('email', array_keys($accounts))->lockForUpdate()->get();
            $users = [];

            foreach ($accounts as $email => $data) {
                $role = Role::firstOrCreate(['name' => $data['role']]);
                $user = $existing->firstWhere('email', $email) ?? new User;
                $user->forceFill($data + [
                    'email' => $email,
                    'password' => Hash::make('password'),
                    'role_id' => $role->id,
                    'role_manually_assigned' => true,
                    'is_demo_account' => true,
                    'email_verified_at' => now(),
                    'program' => $data['role'] === 'Student' ? 'Master of Arts in Education' : null,
                ])->save();
                $user->roles()->sync([$role->id]);
                $users[$email] = $user;
            }

            foreach (config('demo.workflow_coordinator_programs', []) as $email => $programs) {
                $coordinator = $users[$email] ?? User::where('email', $email)->first();
                if (! $coordinator || $coordinator->role !== 'Coordinator') {
                    continue;
                }

                foreach ($programs as $program) {
                    CoordinatorProgram::firstOrCreate([
                        'coordinator_id' => $coordinator->id,
                        'program' => $program,
                    ]);
                }
            }

            $this->table(['Email', 'Role', 'Password'], collect($accounts)
                ->map(fn ($data, $email) => [$email, $data['role'], 'password'])->values()->all());
            $this->info('Use the normal login page. These accounts are limited to local/testing environments.');

            return self::SUCCESS;
        });
    }
}
