<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Automated Daily Membership Expiry & Renewal Reminders Scheduler
Schedule::command('memberships:check-expiries')
    ->dailyAt('06:00')
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/membership_reminders.log'));

