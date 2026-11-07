<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->string('event_key', 64)->nullable()->unique();
            $table->unsignedBigInteger('defense_request_id')->nullable()->index();
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropUnique(['event_key']);
            $table->dropIndex(['defense_request_id']);
            $table->dropColumn(['event_key', 'defense_request_id']);
        });
    }
};
