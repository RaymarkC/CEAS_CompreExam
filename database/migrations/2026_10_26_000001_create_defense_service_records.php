<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('defense_requests', fn (Blueprint $table) => $table->json('panel_affiliations')->nullable());
        Schema::create('defense_service_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('defense_request_id')->unique()->constrained('defense_requests');
            $table->string('snapshot_hash', 64);
            $table->json('participants');
            $table->date('completed_on');
            $table->foreignId('confirmed_by')->constrained('users');
            $table->timestamp('confirmed_at');
            $table->text('notes')->nullable();
            $table->json('history');
            $table->timestamps();
        });
        Schema::table('honorarium_disbursements', function (Blueprint $table) {
            $table->string('recipient_affiliation', 20)->nullable();
            $table->json('service_evidence')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('honorarium_disbursements', fn (Blueprint $table) => $table->dropColumn(['recipient_affiliation', 'service_evidence']));
        Schema::dropIfExists('defense_service_records');
        Schema::table('defense_requests', fn (Blueprint $table) => $table->dropColumn('panel_affiliations'));
    }
};
