<?php

use App\Models\Role;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        Role::firstOrCreate(['name' => 'Finance']);
    }

    public function down(): void
    { /* Keep assigned roles intact on rollback. */
    }
};
