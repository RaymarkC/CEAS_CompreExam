<?php

namespace App\Console\Commands;

use App\Models\Role;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class CreateProctorDemoAccounts extends Command
{
    protected $signature = 'demo:proctor-accounts';

    protected $description = 'Create the five local Proctor demo accounts without changing other accounts';

    public function handle(): int
    {
        if (! app()->environment(['local', 'testing'])) {
            $this->error('Proctor demo accounts can only be created in a local/testing environment.');

            return self::FAILURE;
        }

        $accounts = config('demo.proctor_accounts', []);
        $existing = User::whereIn('email', array_keys($accounts))->get()->keyBy('email');
        if ($existing->contains(fn (User $user) => ! $user->is_demo_account)) {
            $this->error('A Proctor demo email belongs to a non-demo account. No accounts were changed.');

            return self::FAILURE;
        }

        $createdEmails = DB::transaction(function () use ($accounts, $existing) {
            $role = Role::firstOrCreate(['name' => 'Proctor']);
            $createdEmails = [];

            foreach ($accounts as $email => $profile) {
                $user = $existing->get($email);
                if ($user) {
                    $user->forceFill([
                        'role' => 'Proctor',
                        'role_id' => $role->id,
                        'role_manually_assigned' => true,
                    ])->save();
                } else {
                    $user = new User;
                    $user->forceFill($profile + [
                        'email' => $email,
                        'password' => Hash::make('password'),
                        'role_id' => $role->id,
                        'role_manually_assigned' => true,
                        'is_demo_account' => true,
                        'email_verified_at' => now(),
                    ])->save();
                    $createdEmails[] = $email;
                }

                $user->roles()->sync([$role->id]);
            }

            return $createdEmails;
        });

        $this->table(['Proctor', 'Email', 'Password'], collect($accounts)
            ->map(fn (array $profile, string $email) => [
                $profile['first_name'].' '.$profile['last_name'],
                $email,
                in_array($email, $createdEmails, true) ? 'password' : 'unchanged',
            ])
            ->values()
            ->all());
        $this->line('New accounts use password "password"; existing demo passwords were preserved.');
        $this->info('These local demo accounts can only view schedules assigned to their own account.');

        return self::SUCCESS;
    }
}
