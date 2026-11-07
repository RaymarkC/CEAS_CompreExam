<?php

namespace App\Console\Commands;

use App\Models\Role;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class CreateFinanceDemoAccount extends Command
{
    protected $signature = 'demo:finance-account';

    protected $description = 'Create a local Finance demo account without changing existing accounts';

    public function handle(): int
    {
        if (! app()->environment(['local', 'testing'])) {
            return self::FAILURE;
        }
        if (User::where('email', 'finance@uic.edu.ph')->where('is_demo_account', false)->exists()) {
            $this->error('An existing account uses this email.');

            return self::FAILURE;
        }
        DB::transaction(function () {
            $role = Role::firstOrCreate(['name' => 'Finance']);
            $user = User::firstOrNew(['email' => 'finance@uic.edu.ph']);
            $user->forceFill(['first_name' => 'Demo', 'last_name' => 'Finance', 'school_id' => 'DEMO-FINANCE', 'role' => 'Finance', 'role_id' => $role->id, 'password' => Hash::make('password'), 'role_manually_assigned' => true, 'is_demo_account' => true, 'email_verified_at' => now()])->save();
            $user->roles()->sync([$role->id]);
        });
        $this->info('Finance demo login: finance@uic.edu.ph / password');

        return self::SUCCESS;
    }
}
