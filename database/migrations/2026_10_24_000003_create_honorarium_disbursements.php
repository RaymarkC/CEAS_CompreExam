<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('honorarium_disbursements', function (Blueprint $t) {
            $t->id();
            $t->foreignId('defense_request_id')->constrained('defense_requests');
            $t->string('recipient_key');
            $t->string('recipient_name');
            $t->string('recipient_email')->nullable();
            $t->string('recipient_role');
            $t->decimal('amount', 12, 2);
            $t->string('school_year', 20);
            $t->string('semester', 20);
            $t->string('status', 30)->default('prepared');
            $t->boolean('requires_review')->default(false);
            $t->string('payment_reference', 150)->nullable();
            $t->date('disbursed_on')->nullable();
            $t->date('claimed_on')->nullable();
            $t->json('history');
            $t->foreignId('prepared_by')->constrained('users');
            $t->timestamps();
            $t->index(['defense_request_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('honorarium_disbursements');
    }
};
