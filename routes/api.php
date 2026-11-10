<?php

use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClassBookingController;
use App\Http\Controllers\Api\ClassCategoryController;
use App\Http\Controllers\Api\ClassScheduleController;
use App\Http\Controllers\Api\DisputeController;
use App\Http\Controllers\Api\ExerciseController;
use App\Http\Controllers\Api\FitnessMetricController;
use App\Http\Controllers\Api\FraudFlagController;
use App\Http\Controllers\Api\GymClassController;
use App\Http\Controllers\Api\InvoiceReceiptController;
use App\Http\Controllers\Api\MembershipController;
use App\Http\Controllers\Api\MembershipPlanController;
use App\Http\Controllers\Api\MessagingController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\WorkoutPlanController;
use App\Http\Controllers\Api\WorkoutSessionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/membership-plans', [MembershipPlanController::class, 'index']);
Route::get('/membership-plans/{id}', [MembershipPlanController::class, 'show']);

Route::get('/class-categories', [ClassCategoryController::class, 'index']);
Route::get('/classes', [GymClassController::class, 'index']);
Route::get('/classes/{id}', [GymClassController::class, 'show']);

Route::get('/trainers', [UserController::class, 'trainers']);
Route::get('/schedules', [ClassScheduleController::class, 'index']);
Route::get('/schedules/calendar', [ClassScheduleController::class, 'calendar']);
Route::get('/exercises', [ExerciseController::class, 'index']);

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    // Auth & Profile
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/profile/avatar', [AuthController::class, 'uploadAvatar']);
    Route::put('/password', [AuthController::class, 'changePassword']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);

    // Messaging
    Route::get('/conversations', [MessagingController::class, 'conversations']);
    Route::post('/conversations', [MessagingController::class, 'startConversation']);
    Route::get('/conversations/{id}/messages', [MessagingController::class, 'messages']);
    Route::post('/conversations/{id}/messages', [MessagingController::class, 'sendMessage']);

    // Memberships & Subscriptions
    Route::get('/memberships', [MembershipController::class, 'index']);
    Route::post('/memberships/subscribe', [MembershipController::class, 'subscribe']);
    Route::post('/memberships/{id}/renew', [MembershipController::class, 'renew']);
    Route::get('/memberships/{id}', [MembershipController::class, 'show']);

    // Class Bookings & Attendance
    Route::get('/bookings', [ClassBookingController::class, 'index']);
    Route::post('/bookings', [ClassBookingController::class, 'store']);
    Route::delete('/bookings/{id}', [ClassBookingController::class, 'cancel']);
    Route::post('/attendance/check-in', [AttendanceController::class, 'checkIn']);
    Route::get('/attendance', [AttendanceController::class, 'index']);
    Route::get('/attendance/stats', [AttendanceController::class, 'stats']);

    // Workout Plans & Sessions
    Route::get('/workout-plans', [WorkoutPlanController::class, 'index']);
    Route::get('/workout-plans/{id}', [WorkoutPlanController::class, 'show']);
    Route::get('/workout-sessions', [WorkoutSessionController::class, 'index']);
    Route::post('/workout-sessions', [WorkoutSessionController::class, 'store']);
    Route::get('/workout-sessions/{id}', [WorkoutSessionController::class, 'show']);

    // Fitness Metrics Progress
    Route::get('/fitness-metrics', [FitnessMetricController::class, 'index']);
    Route::post('/fitness-metrics', [FitnessMetricController::class, 'store']);

    // Payments, Invoices & Receipts
    Route::get('/payments', [PaymentController::class, 'index']);
    Route::post('/payments/simulate', [PaymentController::class, 'simulatePayment']);
    Route::get('/invoices', [InvoiceReceiptController::class, 'invoices']);
    Route::get('/invoices/{id}', [InvoiceReceiptController::class, 'showInvoice']);
    Route::get('/receipts', [InvoiceReceiptController::class, 'receipts']);
    Route::get('/receipts/{id}', [InvoiceReceiptController::class, 'showReceipt']);

    // Member Complaints / Disputes
    Route::get('/disputes', [DisputeController::class, 'index']);
    Route::post('/disputes', [DisputeController::class, 'store']);

    /*
    |--------------------------------------------------------------------------
    | Trainer & Admin Protected Routes
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:trainer,admin')->group(function () {
        Route::get('/trainer/assigned-members', [UserController::class, 'assignedMembers']);
        Route::post('/workout-plans', [WorkoutPlanController::class, 'store']);
        Route::put('/workout-plans/{id}', [WorkoutPlanController::class, 'update']);
        Route::delete('/workout-plans/{id}', [WorkoutPlanController::class, 'destroy']);
        Route::post('/attendance/mark', [AttendanceController::class, 'markAttendance']);
        Route::post('/exercises', [ExerciseController::class, 'store']);
        Route::put('/exercises/{id}', [ExerciseController::class, 'update']);
    });

    /*
    |--------------------------------------------------------------------------
    | Administrator Only Protected Routes
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/dashboard', [ReportController::class, 'dashboardStats']);
        Route::get('/admin/users', [UserController::class, 'index']);
        Route::post('/admin/users', [UserController::class, 'store']);
        Route::get('/admin/users/{id}', [UserController::class, 'show']);
        Route::put('/admin/users/{id}', [UserController::class, 'update']);
        Route::patch('/admin/users/{id}/status', [UserController::class, 'updateStatus']);
        Route::post('/admin/members/{id}/assign-trainer', [UserController::class, 'assignTrainer']);

        Route::post('/membership-plans', [MembershipPlanController::class, 'store']);
        Route::put('/membership-plans/{id}', [MembershipPlanController::class, 'update']);
        Route::delete('/membership-plans/{id}', [MembershipPlanController::class, 'destroy']);
        Route::patch('/memberships/{id}/status', [MembershipController::class, 'updateStatus']);

        Route::post('/class-categories', [ClassCategoryController::class, 'store']);
        Route::put('/class-categories/{id}', [ClassCategoryController::class, 'update']);
        Route::delete('/class-categories/{id}', [ClassCategoryController::class, 'destroy']);

        Route::post('/classes', [GymClassController::class, 'store']);
        Route::put('/classes/{id}', [GymClassController::class, 'update']);
        Route::delete('/classes/{id}', [GymClassController::class, 'destroy']);

        Route::post('/schedules', [ClassScheduleController::class, 'store']);
        Route::put('/schedules/{id}', [ClassScheduleController::class, 'update']);
        Route::delete('/schedules/{id}', [ClassScheduleController::class, 'cancel']);

        Route::get('/payments/revenue-summary', [PaymentController::class, 'revenueSummary']);
        Route::get('/fraud-flags', [FraudFlagController::class, 'index']);
        Route::get('/fraud-flags/{id}', [FraudFlagController::class, 'show']);
        Route::post('/fraud-flags/{id}/review', [FraudFlagController::class, 'review']);

        Route::get('/audit-logs', [AuditLogController::class, 'index']);
        Route::put('/disputes/{id}/resolve', [DisputeController::class, 'resolve']);

        Route::get('/reports/export/members', [ReportController::class, 'exportMembers']);
        Route::get('/reports/export/attendance', [ReportController::class, 'exportAttendance']);
        Route::get('/reports/export/payments', [ReportController::class, 'exportPayments']);
    });
});
