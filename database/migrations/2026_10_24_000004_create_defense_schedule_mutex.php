<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('defense_schedule_mutex', function (Blueprint $t) {
            $t->unsignedInteger('id')->primary();
        });
        DB::table('defense_schedule_mutex')->insert(['id' => 1]);
    }

    public function down(): void
    {
        Schema::dropIfExists('defense_schedule_mutex');
    }
};
