<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Schedule::command('defenses:send-reminders')
    ->dailyAt('08:00')->timezone('Asia/Manila')->withoutOverlapping();

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('honorarium:unlock-finance-documents')->dailyAt('00:05')->timezone('Asia/Manila')->withoutOverlapping();
