<?php

namespace App\Console\Commands;

use App\Models\Role;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class CreateDiagramAccounts extends Command
{
    protected $signature = 'demo:diagram-accounts';

    protected $description = 'Create the five diagram-role demo accounts on a local installation';

    public function handle(): int
    {
        if (! app()->environment(['local', 'testing'])) {
            $this->error('Demo accounts can only be created in a local/testing environment.');

            return self::FAILURE;
        }

        $accounts = config('demo.accounts');
        if (User::whereIn('email', array_keys($accounts))->where('is_demo_account', false)->exists()) {
            $this->error('An email is already used by a non-demo account. No accounts were changed.');

            return self::FAILURE;
        }

        DB::transaction(function () use ($accounts) {
            foreach ($accounts as $email => $data) {
                $role = Role::firstOrCreate(['name' => $data['role']]);
                $user = User::firstOrNew(['email' => $email]);
                $user->forceFill($data + [
                    'password' => Hash::make('password'),
                    'role_id' => $role->id,
                    'role_manually_assigned' => true,
                    'is_demo_account' => true,
                    'email_verified_at' => now(),
                    'program' => 'Master of Arts in Education',
                ])->save();
                $user->roles()->sync([$role->id]);
            }
        });

        $this->table(['Email', 'Role', 'Password'], collect($accounts)
            ->map(fn ($data, $email) => [$email, $data['role'], 'password'])->values()->all());
        $this->info('Use the normal login page. Demo login is limited to local/testing environments.');

        return self::SUCCESS;
    }
}
