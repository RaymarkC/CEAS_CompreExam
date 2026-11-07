<?php

namespace App\Console\Commands;

use App\Models\Role;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class CreateRegistrarDemoAccount extends Command
{
    protected $signature = 'demo:registrar-account';

    protected $description = 'Create the local Registrar demo account without changing other demo accounts';

    public function handle(): int
    {
        if (! app()->environment(['local', 'testing'])) {
            $this->error('The Registrar demo account can only be created in a local/testing environment.');

            return self::FAILURE;
        }

        $email = 'registrar@uic.edu.ph';

        return DB::transaction(function () use ($email): int {
            $user = User::where('email', $email)->lockForUpdate()->first();
            if ($user && ! $user->is_demo_account) {
                $this->error('The Registrar demo email already belongs to a non-demo account. No account was changed.');

                return self::FAILURE;
            }

            if ($user && $user->role === 'Registrar' && $user->is_demo_account) {
                $this->info('The Registrar demo account already exists. Its password and profile were not changed.');

                return self::SUCCESS;
            }

            $role = Role::firstOrCreate(['name' => 'Registrar']);
            $created = ! $user;
            if ($created) {
                $user = new User;
                $user->forceFill([
                    'email' => $email,
                    'password' => Hash::make('password'),
                    'first_name' => 'Demo',
                    'last_name' => 'Registrar',
                    'school_id' => 'DEMO-REGISTRAR',
                    'role' => 'Registrar',
                    'role_id' => $role->id,
                    'role_manually_assigned' => true,
                    'is_demo_account' => true,
                    'email_verified_at' => now(),
                ])->save();
            } else {
                $user->forceFill([
                    'role' => 'Registrar',
                    'role_id' => $role->id,
                    'role_manually_assigned' => true,
                ])->save();
            }

            $user->roles()->sync([$role->id]);
            if ($created) {
                $this->info('Created the local Registrar demo account.');
                $this->line('Login: registrar@uic.edu.ph');
                $this->line('Password: password');
            } else {
                $this->info('Updated the existing demo account to the Registrar role. Its password was preserved.');
            }

            return self::SUCCESS;
        });
    }
}
