<?php

namespace App\Console\Commands;

use App\Models\AuditLog;
use App\Models\Membership;
use App\Models\Notification;
use Carbon\Carbon;
use Illuminate\Console\Command;

class CheckMembershipExpiries extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'memberships:check-expiries';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Identify expiring memberships (7 and 3 days), send renewal reminders, and mark expired memberships';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $today = Carbon::today();
        $this->info("Running membership expiry and reminder check for date: {$today->toDateString()}");

        // 1. Mark expired memberships
        $expiredMemberships = Membership::where('status', 'active')
            ->whereDate('expiry_date', '<', $today)
            ->get();

        $expiredCount = 0;
        foreach ($expiredMemberships as $m) {
            $m->update(['status' => 'expired']);
            $expiredCount++;

            Notification::create([
                'user_id' => $m->user_id,
                'title' => 'Membership Expired',
                'message' => "Your subscription expired on {$m->expiry_date->toFormattedDateString()}. Please renew online to restore full gym access.",
                'type' => 'membership_expiry',
                'link_url' => '/memberships',
            ]);

            AuditLog::record($m->user_id, 'membership_expired', 'Membership', $m->id);
        }
        $this->line("Marked {$expiredCount} memberships as expired.");

        // 2. Identify 7-day reminder
        $target7Days = $today->copy()->addDays(7)->toDateString();
        $memberships7Days = Membership::where('status', 'active')
            ->whereDate('expiry_date', $target7Days)
            ->get();

        $reminders7Count = 0;
        foreach ($memberships7Days as $m) {
            // Check duplicate reminder for this date
            $alreadyNotified = Notification::where('user_id', $m->user_id)
                ->where('type', 'membership_expiry')
                ->where('created_at', '>=', $today->startOfDay())
                ->exists();

            if (!$alreadyNotified) {
                Notification::create([
                    'user_id' => $m->user_id,
                    'title' => 'Membership Expiry Notice: 7 Days Remaining',
                    'message' => "Your gym membership will expire in 7 days on {$m->expiry_date->toFormattedDateString()}. Renew now to avoid service interruption.",
                    'type' => 'membership_expiry',
                    'link_url' => '/memberships',
                ]);
                $reminders7Count++;
            }
        }
        $this->line("Sent {$reminders7Count} 7-day renewal reminder notifications.");

        // 3. Identify 3-day reminder
        $target3Days = $today->copy()->addDays(3)->toDateString();
        $memberships3Days = Membership::where('status', 'active')
            ->whereDate('expiry_date', $target3Days)
            ->get();

        $reminders3Count = 0;
        foreach ($memberships3Days as $m) {
            $alreadyNotified = Notification::where('user_id', $m->user_id)
                ->where('type', 'membership_expiry')
                ->where('created_at', '>=', $today->startOfDay())
                ->exists();

            if (!$alreadyNotified) {
                Notification::create([
                    'user_id' => $m->user_id,
                    'title' => 'Urgent: Membership Expires in 3 Days',
                    'message' => "Only 3 days left on your membership! Please renew your subscription to keep enjoying classes and facilities.",
                    'type' => 'membership_expiry',
                    'link_url' => '/memberships',
                ]);
                $reminders3Count++;
            }
        }
        $this->line("Sent {$reminders3Count} 3-day renewal reminder notifications.");

        $this->info("Membership automated reminder process completed successfully.");
        return Command::SUCCESS;
    }
}
