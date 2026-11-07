<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('defense_requests', function (Blueprint $table) {
            $table->text('correction_notes')->nullable();
            $table->string('correction_stage', 20)->nullable();
            $table->unsignedBigInteger('correction_requested_by')->nullable();
            $table->timestamp('correction_requested_at')->nullable();
            $table->unsignedInteger('correction_count')->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('defense_requests', fn (Blueprint $table) => $table->dropColumn([
            'correction_notes', 'correction_stage', 'correction_requested_by', 'correction_requested_at', 'correction_count',
        ]));
    }
};
