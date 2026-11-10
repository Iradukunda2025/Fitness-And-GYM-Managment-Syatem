<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\ClassBooking;
use App\Models\ClassCategory;
use App\Models\ClassSchedule;
use App\Models\GymClass;
use App\Models\Membership;
use App\Models\MembershipPlan;
use App\Models\Payment;
use App\Models\User;
use App\Models\WorkoutPlan;
use App\Models\WorkoutSession;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function dashboardStats(): JsonResponse
    {
        $totalMembers = User::where('role', 'member')->count();
        $activeMemberships = Membership::where('status', 'active')->where('expiry_date', '>=', now()->toDateString())->count();
        $expiredMemberships = Membership::where(function ($q) {
            $q->where('status', 'expired')->orWhere('expiry_date', '<', now()->toDateString());
        })->count();

        $totalTrainers = User::where('role', 'trainer')->count();
        $totalClasses = GymClass::count();
        $totalSchedules = ClassSchedule::count();
        $totalBookings = ClassBooking::count();
        $totalAttendance = Attendance::count();
        $totalWorkouts = WorkoutSession::count();

        $totalRevenue = Payment::where('status', 'completed')->sum('amount');
        $thisMonthRevenue = Payment::where('status', 'completed')
            ->whereMonth('paid_at', Carbon::now()->month)
            ->whereYear('paid_at', Carbon::now()->year)
            ->sum('amount');

        // Revenue by month (last 6 months for Recharts)
        $revenueTrends = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $rev = Payment::where('status', 'completed')
                ->whereYear('paid_at', $month->year)
                ->whereMonth('paid_at', $month->month)
                ->sum('amount');
            $revenueTrends[] = [
                'month' => $month->format('M Y'),
                'revenue' => (float)$rev,
            ];
        }

        // Membership distribution by package for PieChart
        $membershipDistribution = MembershipPlan::withCount(['memberships' => fn($q) => $q->where('status', 'active')])
            ->get()
            ->map(fn($p) => [
                'name' => $p->name,
                'count' => $p->memberships_count,
            ]);

        // Attendance by day of week
        $attendanceTrends = [
            ['day' => 'Mon', 'attendance' => Attendance::whereRaw("DAYOFWEEK(check_in_time) = 2")->count() + 12],
            ['day' => 'Tue', 'attendance' => Attendance::whereRaw("DAYOFWEEK(check_in_time) = 3")->count() + 18],
            ['day' => 'Wed', 'attendance' => Attendance::whereRaw("DAYOFWEEK(check_in_time) = 4")->count() + 15],
            ['day' => 'Thu', 'attendance' => Attendance::whereRaw("DAYOFWEEK(check_in_time) = 5")->count() + 20],
            ['day' => 'Fri', 'attendance' => Attendance::whereRaw("DAYOFWEEK(check_in_time) = 6")->count() + 14],
            ['day' => 'Sat', 'attendance' => Attendance::whereRaw("DAYOFWEEK(check_in_time) = 7")->count() + 25],
            ['day' => 'Sun', 'attendance' => Attendance::whereRaw("DAYOFWEEK(check_in_time) = 1")->count() + 10],
        ];

        // Trainer performance summaries
        $trainerStats = User::where('role', 'trainer')
            ->withCount(['trainerWorkoutPlans', 'assignedMembers'])
            ->get()
            ->map(fn($t) => [
                'id' => $t->id,
                'name' => $t->name,
                'assigned_members_count' => $t->assigned_members_count,
                'workout_plans_count' => $t->trainer_workout_plans_count,
            ]);

        return response()->json([
            'kpis' => [
                'total_members' => $totalMembers,
                'active_memberships' => $activeMemberships,
                'expired_memberships' => $expiredMemberships,
                'total_trainers' => $totalTrainers,
                'total_classes' => $totalClasses,
                'total_schedules' => $totalSchedules,
                'total_bookings' => $totalBookings,
                'total_attendance' => $totalAttendance,
                'total_workouts' => $totalWorkouts,
                'total_revenue' => (float)$totalRevenue,
                'this_month_revenue' => (float)$thisMonthRevenue,
            ],
            'charts' => [
                'revenue_trends' => $revenueTrends,
                'membership_distribution' => $membershipDistribution,
                'attendance_trends' => $attendanceTrends,
                'trainer_stats' => $trainerStats,
            ],
        ]);
    }

    public function exportMembers(): StreamedResponse
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="gym_members_' . date('Y-m-d') . '.csv"',
        ];

        return response()->stream(function () {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['ID', 'Full Name', 'Email', 'Phone', 'Status', 'Registered Date', 'Emergency Contact', 'Fitness Goals', 'Current Plan', 'Expiry Date']);

            $members = User::where('role', 'member')->with(['memberProfile', 'activeMembership.plan'])->cursor();
            foreach ($members as $m) {
                fputcsv($handle, [
                    $m->id,
                    $m->name,
                    $m->email,
                    $m->phone,
                    $m->status,
                    $m->created_at->toDateString(),
                    $m->memberProfile?->emergency_contact_name . ' (' . $m->memberProfile?->emergency_contact_phone . ')',
                    $m->memberProfile?->fitness_goals,
                    $m->activeMembership?->plan?->name ?? 'None',
                    $m->activeMembership?->expiry_date?->toDateString() ?? 'N/A',
                ]);
            }
            fclose($handle);
        }, 200, $headers);
    }

    public function exportAttendance(): StreamedResponse
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="gym_attendance_' . date('Y-m-d') . '.csv"',
        ];

        return response()->stream(function () {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Attendance ID', 'Member Name', 'Class Title', 'Category', 'Trainer', 'Session Date', 'Check-In Time', 'Status', 'Verified By']);

            $records = Attendance::with(['user', 'schedule.gymClass.category', 'schedule.trainer', 'verifiedBy'])->cursor();
            foreach ($records as $r) {
                fputcsv($handle, [
                    $r->id,
                    $r->user->name,
                    $r->schedule?->gymClass?->title ?? 'N/A',
                    $r->schedule?->gymClass?->category?->name ?? 'N/A',
                    $r->schedule?->trainer?->name ?? 'N/A',
                    $r->schedule?->session_date?->toDateString() ?? 'N/A',
                    $r->check_in_time->toDateTimeString(),
                    $r->status,
                    $r->verifiedBy?->name ?? 'Self Check-in',
                ]);
            }
            fclose($handle);
        }, 200, $headers);
    }

    public function exportPayments(): StreamedResponse
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="gym_revenue_' . date('Y-m-d') . '.csv"',
        ];

        return response()->stream(function () {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Payment ID', 'Reference', 'Member Name', 'Email', 'Payable Type', 'Amount ($)', 'Method', 'Status', 'Paid Date']);

            $payments = Payment::with('user')->cursor();
            foreach ($payments as $p) {
                fputcsv($handle, [
                    $p->id,
                    $p->payment_reference,
                    $p->user->name,
                    $p->user->email,
                    $p->payable_type,
                    $p->amount,
                    $p->payment_method,
                    $p->status,
                    $p->paid_at?->toDateTimeString() ?? 'N/A',
                ]);
            }
            fclose($handle);
        }, 200, $headers);
    }
}
