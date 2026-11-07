<?php

namespace App\Console\Commands;

use App\Models\Role;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class CreateHostedDemoAccounts extends Command
{
    protected $signature = 'demo:hosted-accounts';

    protected $description = 'Provision explicitly enabled hosted demo accounts using a private environment password';

    public function handle(): int
    {
        if (! config('demo.hosted_enabled')) {
            $this->error('Hosted demo mode is disabled. No accounts were changed.');

            return self::FAILURE;
        }

        // Read the runtime secret directly so it is never written into config cache.
        $password = getenv('HOSTED_DEMO_PASSWORD');
        if (! is_string($password) || strlen($password) < 16 || strlen($password) > 128 || trim($password) !== $password) {
            $this->error('Set HOSTED_DEMO_PASSWORD to a private password of 16-128 characters without surrounding whitespace.');

            return self::FAILURE;
        }

        $accounts = config('demo.workflow_accounts', []) + config('demo.accounts', []) + config('demo.proctor_accounts', []) + [
            'finance@uic.edu.ph' => ['role' => 'Finance', 'first_name' => 'Demo', 'last_name' => 'Finance', 'school_id' => 'DEMO-FINANCE'],
        ];

        return DB::transaction(function () use ($accounts, $password) {
            $existing = User::whereIn('email', array_keys($accounts))->lockForUpdate()->get();
            if ($existing->contains(fn (User $user) => ! $user->is_demo_account)) {
                $this->error('A demo email belongs to an existing non-demo user. No accounts were changed.');

                return self::FAILURE;
            }

            foreach ($accounts as $email => $data) {
                $user = $existing->firstWhere('email', $email);
                if ($user) {
                    // Preserve edited profiles, assignments and records across restarts.
                    if (! Hash::check($password, $user->password)) {
                        $user->forceFill(['password' => Hash::make($password)])->save();
                    }

                    continue;
                }

                $role = Role::firstOrCreate(['name' => $data['role']]);
                $user = new User;
                $user->forceFill($data + [
                    'email' => $email,
                    'password' => Hash::make($password),
                    'role_id' => $role->id,
                    'role_manually_assigned' => true,
                    'is_demo_account' => true,
                    'email_verified_at' => now(),
                    'program' => $data['role'] === 'Student' ? 'Master of Arts in Education' : null,
                ])->save();
                $user->roles()->sync([$role->id]);
            }

            $this->info('Hosted demo accounts are ready. Sign in with the configured private testing password.');

            return self::SUCCESS;
        });
    }
}
