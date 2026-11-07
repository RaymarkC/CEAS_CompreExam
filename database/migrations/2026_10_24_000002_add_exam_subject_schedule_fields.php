<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['exam_date', 'start_time', 'end_time'] as $field) {
            if (! Schema::hasColumn('exam_application_subject', $field)) {
                Schema::table('exam_application_subject', function (Blueprint $table) use ($field) {
                    if ($field === 'exam_date') {
                        $table->date($field)->nullable();
                    } else {
                        $table->time($field)->nullable();
                    }
                });
            }
        }
    }

    public function down(): void
    { /* Preserve existing subject schedules. */
    }
};
