<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::transaction(function () {
            $facultyId = DB::table('roles')->where('name', 'Faculty')->value('id');
            $adviserId = DB::table('roles')->where('name', 'Adviser')->value('id');

            if (! $adviserId) {
                if ($facultyId) {
                    // Reuse the original ID to preserve foreign keys and role assignments.
                    DB::table('roles')->where('id', $facultyId)->update(['name' => 'Adviser']);
                    $adviserId = $facultyId;
                } else {
                    $adviserId = DB::table('roles')->insertGetId(['name' => 'Adviser']);
                }
            }

            if ($facultyId && $facultyId !== $adviserId) {
                // Both names already exist: merge memberships without duplicate pivot keys.
                DB::table('role_user')->where('role_id', $facultyId)->orderBy('user_id')
                    ->chunk(500, function ($memberships) use ($adviserId) {
                        DB::table('role_user')->insertOrIgnore($memberships->map(fn ($membership) => [
                            'role_id' => $adviserId,
                            'user_id' => $membership->user_id,
                        ])->all());
                    });

                if (Schema::hasColumn('users', 'role_id')) {
                    DB::table('users')->where('role_id', $facultyId)->update(['role_id' => $adviserId]);
                }
                DB::table('role_user')->where('role_id', $facultyId)->delete();
                DB::table('roles')->where('id', $facultyId)->delete();
            }

            DB::table('users')->where('role', 'Faculty')->update(['role' => 'Adviser']);
            if (Schema::hasColumn('users', 'role_id')) {
                DB::table('users')->where('role', 'Adviser')->whereNull('role_id')->update(['role_id' => $adviserId]);
            }

            if (Schema::hasColumn('honorarium_payments', 'panelist_type')) {
                DB::table('honorarium_payments')->where('panelist_type', 'Faculty')->update(['panelist_type' => 'Adviser']);
            }
        });
    }

    public function down(): void
    {
        // Data-only canonicalization: retain Adviser memberships on rollback. A reverse
        // rename cannot distinguish migrated Faculty users from pre-existing Advisers.
    }
};
