<?php

namespace App\Console\Commands;

use App\Services\DefenseReminderService;
use Illuminate\Console\Command;

class SendDefenseReminders extends Command
{
    protected $signature = 'defenses:send-reminders';

    protected $description = 'Create daily student notifications during the final seven days before defense';

    public function handle(DefenseReminderService $reminders): int
    {
        $this->info($reminders->send().' new defense reminder(s) created.');

        return self::SUCCESS;
    }
}
