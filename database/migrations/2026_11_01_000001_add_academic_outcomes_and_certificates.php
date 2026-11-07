<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_progress_records', function (Blueprint $t) {
            $t->string('classification')->nullable();
            $t->string('school_year', 20)->nullable();
        });
        Schema::create('defense_academic_outcomes', function (Blueprint $t) {
            $t->id();
            $t->foreignId('defense_request_id')->unique()->constrained()->cascadeOnDelete();
            $t->string('completion')->default('not-yet-done');
            $t->string('result')->default('not-recorded');
            $t->string('subject')->nullable();
            $t->date('completed_on')->nullable();
            $t->text('reason')->nullable();
            $t->string('next_stage')->nullable();
            $t->string('snapshot_hash', 64);
            $t->unsignedInteger('version')->default(1);
            $t->foreignId('recorded_by')->constrained('users');
            $t->json('history')->nullable();
            $t->timestamps();
        });
        Schema::create('defense_certificate_requests', function (Blueprint $t) {
            $t->id();
            $t->foreignId('defense_request_id')->unique()->constrained()->cascadeOnDelete();
            $t->foreignId('student_id')->constrained('users');
            $t->string('status')->default('requested');
            $t->string('pdf_path')->nullable();
            $t->foreignId('released_by')->nullable()->constrained('users');
            $t->timestamp('released_at')->nullable();
            $t->unsignedInteger('outcome_version')->nullable();
            $t->string('email_status')->default('not-sent');
            $t->timestamp('emailed_at')->nullable();
            $t->json('history')->nullable();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('defense_certificate_requests');
        Schema::dropIfExists('defense_academic_outcomes');
        Schema::table('student_progress_records', fn (Blueprint $t) => $t->dropColumn(['classification', 'school_year']));
    }
};
