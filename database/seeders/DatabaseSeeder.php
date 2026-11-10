<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\AuditLog;
use App\Models\ClassBooking;
use App\Models\ClassCategory;
use App\Models\ClassSchedule;
use App\Models\Conversation;
use App\Models\Dispute;
use App\Models\Exercise;
use App\Models\FitnessMetric;
use App\Models\FraudFlag;
use App\Models\GymClass;
use App\Models\Invoice;
use App\Models\MemberProfile;
use App\Models\Membership;
use App\Models\MembershipPlan;
use App\Models\MembershipRenewal;
use App\Models\Message;
use App\Models\Notification;
use App\Models\Payment;
use App\Models\Receipt;
use App\Models\TrainerCertification;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Models\WorkoutPlan;
use App\Models\WorkoutPlanExercise;
use App\Models\WorkoutSession;
use App\Models\WorkoutSessionExercise;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Admin User
        $admin = User::create([
            'name' => 'Admin SAFARI Cyprien',
            'email' => 'admin@apexfit.com',
            'phone' => '+250788123456',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'status' => 'active',
        ]);

        // 2. Trainers
        $trainer1 = User::create([
            'name' => 'Coach John Mugabo',
            'email' => 'trainer.john@apexfit.com',
            'phone' => '+250788223344',
            'password' => Hash::make('password123'),
            'role' => 'trainer',
            'status' => 'active',
        ]);
        TrainerProfile::create([
            'user_id' => $trainer1->id,
            'bio' => 'Certified Strength and Conditioning Specialist with over 8 years of elite athletic coaching.',
            'specialties' => 'Strength & Conditioning, Weight Training, HIIT',
            'years_of_experience' => 8,
            'qualifications' => 'BSc Sports Science, CSCS Certified',
            'availability_status' => 'available',
        ]);
        TrainerCertification::create([
            'trainer_id' => $trainer1->id,
            'title' => 'Certified Strength & Conditioning Specialist (CSCS)',
            'issuing_organization' => 'National Strength & Conditioning Association (NSCA)',
            'issue_date' => '2022-03-15',
            'expiry_date' => '2027-03-15',
        ]);

        $trainer2 = User::create([
            'name' => 'Coach Sarah Uwase',
            'email' => 'trainer.sarah@apexfit.com',
            'phone' => '+250788334455',
            'password' => Hash::make('password123'),
            'role' => 'trainer',
            'status' => 'active',
        ]);
        TrainerProfile::create([
            'user_id' => $trainer2->id,
            'bio' => 'Experienced Yoga and Pilates instructor passionate about mindful movement and flexibility.',
            'specialties' => 'Yoga, Pilates, Mobility & Flexibility',
            'years_of_experience' => 5,
            'qualifications' => 'RYT-500 Certified Yoga Teacher',
            'availability_status' => 'available',
        ]);

        $trainer3 = User::create([
            'name' => 'Coach David Gasana',
            'email' => 'trainer.david@apexfit.com',
            'phone' => '+250788445566',
            'password' => Hash::make('password123'),
            'role' => 'trainer',
            'status' => 'active',
        ]);
        TrainerProfile::create([
            'user_id' => $trainer3->id,
            'bio' => 'High intensity interval training specialist focusing on cardiovascular endurance and fat loss.',
            'specialties' => 'Spinning, Aerobics, Cardio Training',
            'years_of_experience' => 6,
            'qualifications' => 'ACE Personal Trainer, Spinning Master Instructor',
            'availability_status' => 'available',
        ]);

        // 3. Members
        $member1 = User::create([
            'name' => 'Alice Umutoni',
            'email' => 'member.alice@apexfit.com',
            'phone' => '+250788556677',
            'password' => Hash::make('password123'),
            'role' => 'member',
            'status' => 'active',
        ]);
        MemberProfile::create([
            'user_id' => $member1->id,
            'date_of_birth' => '1998-05-14',
            'gender' => 'female',
            'address' => 'Kigali / Karongi',
            'emergency_contact_name' => 'Eric Kayitare',
            'emergency_contact_phone' => '+250788990011',
            'emergency_contact_relation' => 'Brother',
            'fitness_goals' => 'Cardio endurance and tone upper body muscle',
            'health_notes' => 'Mild seasonal asthma, uses inhaler before heavy cardio',
            'assigned_trainer_id' => $trainer1->id,
        ]);

        $member2 = User::create([
            'name' => 'Bob Rukundo',
            'email' => 'member.bob@apexfit.com',
            'phone' => '+250788667788',
            'password' => Hash::make('password123'),
            'role' => 'member',
            'status' => 'active',
        ]);
        MemberProfile::create([
            'user_id' => $member2->id,
            'date_of_birth' => '1995-11-20',
            'gender' => 'male',
            'address' => 'Karongi Lake Road',
            'emergency_contact_name' => 'Diane Umwali',
            'emergency_contact_phone' => '+250788771122',
            'emergency_contact_relation' => 'Spouse',
            'fitness_goals' => 'Muscle hypertrophy and strength building',
            'health_notes' => 'No known allergies or chronic conditions',
            'assigned_trainer_id' => $trainer1->id,
        ]);

        $member3 = User::create([
            'name' => 'Clara Mutesi',
            'email' => 'member.clara@apexfit.com',
            'phone' => '+250788778899',
            'password' => Hash::make('password123'),
            'role' => 'member',
            'status' => 'active',
        ]);
        MemberProfile::create([
            'user_id' => $member3->id,
            'date_of_birth' => '2000-02-18',
            'gender' => 'female',
            'address' => 'Rubavu Town',
            'emergency_contact_name' => 'Jean Mutesi',
            'emergency_contact_phone' => '+250788330044',
            'emergency_contact_relation' => 'Father',
            'fitness_goals' => 'Flexibility, core strength, stress reduction',
            'health_notes' => 'Lower back stiffness from desk work',
            'assigned_trainer_id' => $trainer2->id,
        ]);

        // 4. Membership Plans
        $planMonthly = MembershipPlan::create([
            'name' => 'Monthly Starter',
            'description' => 'Ideal for beginners seeking flexible access to gym equipment and cardio zones.',
            'duration_months' => 1,
            'price' => 45.00,
            'included_services' => ['Full Gym Floor Access', 'Locker Room & Showers', 'Fitness Orientation Session'],
            'access_conditions' => 'Standard hours 06:00 - 22:00',
            'is_active' => true,
        ]);

        $planQuarterly = MembershipPlan::create([
            'name' => 'Quarterly Pro',
            'description' => 'Comprehensive 3-month package with all group fitness classes and sauna included.',
            'duration_months' => 3,
            'price' => 120.00,
            'included_services' => ['Full Gym Floor Access', 'Unlimited Group Fitness Classes', 'Sauna & Steam Bath', 'Personal Locker'],
            'access_conditions' => 'All open hours 7 days/week',
            'is_active' => true,
        ]);

        $planYearly = MembershipPlan::create([
            'name' => 'Yearly VIP Elite',
            'description' => 'The ultimate all-inclusive fitness lifestyle membership with personalized trainer sessions.',
            'duration_months' => 12,
            'price' => 420.00,
            'included_services' => ['24/7 VIP Gym Access', 'All Classes Included', 'Monthly 1-on-1 Trainer Session', 'Sauna, Spa & Recovery Lounge', 'Free Guest Pass Monthly'],
            'access_conditions' => '24/7 Access with biometric / card key',
            'is_active' => true,
        ]);

        // 5. Active & Historical Memberships
        $sub1 = Membership::create([
            'user_id' => $member1->id,
            'membership_plan_id' => $planQuarterly->id,
            'start_date' => Carbon::now()->subDays(20)->toDateString(),
            'expiry_date' => Carbon::now()->addDays(70)->toDateString(),
            'status' => 'active',
            'auto_renew' => true,
        ]);

        $sub2 = Membership::create([
            'user_id' => $member2->id,
            'membership_plan_id' => $planYearly->id,
            'start_date' => Carbon::now()->subMonths(2)->toDateString(),
            'expiry_date' => Carbon::now()->addMonths(10)->toDateString(),
            'status' => 'active',
            'auto_renew' => false,
        ]);

        $sub3 = Membership::create([
            'user_id' => $member3->id,
            'membership_plan_id' => $planMonthly->id,
            'start_date' => Carbon::now()->subDays(26)->toDateString(),
            'expiry_date' => Carbon::now()->addDays(4)->toDateString(), // Approaching expiry for reminder demonstration!
            'status' => 'active',
            'auto_renew' => false,
        ]);

        // 6. Payments, Invoices, Receipts
        $p1 = Payment::create([
            'user_id' => $member1->id,
            'payable_type' => 'membership',
            'payable_id' => $sub1->id,
            'amount' => 120.00,
            'payment_method' => 'momo_mtn',
            'payment_reference' => 'PAY-MOMO-' . Str::upper(Str::random(8)),
            'status' => 'completed',
            'paid_at' => Carbon::now()->subDays(20),
            'notes' => 'Quarterly Pro Membership payment via MTN MoMo',
        ]);
        $inv1 = Invoice::create([
            'invoice_number' => 'INV-2026-0001',
            'user_id' => $member1->id,
            'payment_id' => $p1->id,
            'description' => 'Quarterly Pro Membership (3 Months)',
            'amount' => 120.00,
            'tax' => 0.00,
            'total_amount' => 120.00,
            'issue_date' => Carbon::now()->subDays(20)->toDateString(),
            'due_date' => Carbon::now()->subDays(20)->toDateString(),
            'status' => 'paid',
        ]);
        Receipt::create([
            'receipt_number' => 'REC-2026-0001',
            'invoice_id' => $inv1->id,
            'payment_id' => $p1->id,
            'user_id' => $member1->id,
            'amount_paid' => 120.00,
            'payment_date' => Carbon::now()->subDays(20),
            'payment_method' => 'MTN Mobile Money',
            'notes' => 'Payment received in full. Thank you!',
        ]);

        $p2 = Payment::create([
            'user_id' => $member2->id,
            'payable_type' => 'membership',
            'payable_id' => $sub2->id,
            'amount' => 420.00,
            'payment_method' => 'card',
            'payment_reference' => 'PAY-CARD-' . Str::upper(Str::random(8)),
            'status' => 'completed',
            'paid_at' => Carbon::now()->subMonths(2),
            'notes' => 'Yearly VIP Elite Membership payment via Visa Card',
        ]);
        $inv2 = Invoice::create([
            'invoice_number' => 'INV-2026-0002',
            'user_id' => $member2->id,
            'payment_id' => $p2->id,
            'description' => 'Yearly VIP Elite Membership (12 Months)',
            'amount' => 420.00,
            'tax' => 0.00,
            'total_amount' => 420.00,
            'issue_date' => Carbon::now()->subMonths(2)->toDateString(),
            'due_date' => Carbon::now()->subMonths(2)->toDateString(),
            'status' => 'paid',
        ]);
        Receipt::create([
            'receipt_number' => 'REC-2026-0002',
            'invoice_id' => $inv2->id,
            'payment_id' => $p2->id,
            'user_id' => $member2->id,
            'amount_paid' => 420.00,
            'payment_date' => Carbon::now()->subMonths(2),
            'payment_method' => 'Visa Card',
            'notes' => 'Yearly VIP Membership payment confirmed.',
        ]);

        // 7. Class Categories
        $catYoga = ClassCategory::create(['name' => 'Yoga', 'description' => 'Mindfulness, flexibility and core alignment flows', 'icon' => 'self_improvement']);
        $catSpinning = ClassCategory::create(['name' => 'Spinning', 'description' => 'High-cadence indoor stationary cycling intervals', 'icon' => 'directions_bike']);
        $catAerobics = ClassCategory::create(['name' => 'Aerobics', 'description' => 'Dynamic rhythmic cardio conditioning with music', 'icon' => 'fitness_center']);
        $catWeight = ClassCategory::create(['name' => 'Weight Training', 'description' => 'Structured barbell, dumbbell and resistance lifting', 'icon' => 'sports_gymnastics']);
        $catCardio = ClassCategory::create(['name' => 'Cardio Training', 'description' => 'Heart-rate elevation and stamina building workouts', 'icon' => 'speed']);
        $catPilates = ClassCategory::create(['name' => 'Pilates', 'description' => 'Core control, posture improvement and pelvic stability', 'icon' => 'accessibility_new']);
        $catStrength = ClassCategory::create(['name' => 'Strength & Conditioning', 'description' => 'Total body athletic performance and functional movement', 'icon' => 'military_tech']);

        // 8. Classes
        $class1 = GymClass::create([
            'category_id' => $catStrength->id,
            'trainer_id' => $trainer1->id,
            'title' => 'Total Body Strength & Power',
            'description' => 'Compound lifts, kettlebell work, and plyometrics designed to build raw athletic capability.',
            'capacity' => 15,
            'duration_minutes' => 60,
            'room_location' => 'Main Performance Studio A',
            'is_active' => true,
        ]);

        $class2 = GymClass::create([
            'category_id' => $catYoga->id,
            'trainer_id' => $trainer2->id,
            'title' => 'Sunrise Vinyasa Flow',
            'description' => 'Energizing breath-to-movement flow that cultivates mental focus and flexibility.',
            'capacity' => 20,
            'duration_minutes' => 50,
            'room_location' => 'Zen Mind-Body Studio B',
            'is_active' => true,
        ]);

        $class3 = GymClass::create([
            'category_id' => $catSpinning->id,
            'trainer_id' => $trainer3->id,
            'title' => 'High Octane RPM Spin',
            'description' => 'High intensity rhythm-based indoor cycling with simulated hill climbs and sprints.',
            'capacity' => 18,
            'duration_minutes' => 45,
            'room_location' => 'Spin Arena C',
            'is_active' => true,
        ]);

        // 9. Class Schedules (Today, Tomorrow, and Previous Days)
        $today = Carbon::today();
        $sched1 = ClassSchedule::create([
            'class_id' => $class1->id,
            'trainer_id' => $trainer1->id,
            'session_date' => $today->toDateString(),
            'start_time' => '09:00:00',
            'end_time' => '10:00:00',
            'max_capacity' => 15,
            'status' => 'scheduled',
        ]);

        $sched2 = ClassSchedule::create([
            'class_id' => $class2->id,
            'trainer_id' => $trainer2->id,
            'session_date' => $today->toDateString(),
            'start_time' => '17:30:00',
            'end_time' => '18:20:00',
            'max_capacity' => 20,
            'status' => 'scheduled',
        ]);

        $sched3 = ClassSchedule::create([
            'class_id' => $class3->id,
            'trainer_id' => $trainer3->id,
            'session_date' => $today->copy()->addDay()->toDateString(),
            'start_time' => '07:00:00',
            'end_time' => '07:45:00',
            'max_capacity' => 18,
            'status' => 'scheduled',
        ]);

        // Past schedule for historical attendance
        $pastSched = ClassSchedule::create([
            'class_id' => $class1->id,
            'trainer_id' => $trainer1->id,
            'session_date' => $today->copy()->subDays(2)->toDateString(),
            'start_time' => '09:00:00',
            'end_time' => '10:00:00',
            'max_capacity' => 15,
            'status' => 'completed',
        ]);

        // 10. Bookings & Attendance
        $booking1 = ClassBooking::create([
            'schedule_id' => $sched1->id,
            'user_id' => $member1->id,
            'booking_reference' => 'BK-' . strtoupper(Str::random(8)),
            'status' => 'confirmed',
            'booked_at' => Carbon::now()->subHours(6),
        ]);

        $booking2 = ClassBooking::create([
            'schedule_id' => $sched2->id,
            'user_id' => $member3->id,
            'booking_reference' => 'BK-' . strtoupper(Str::random(8)),
            'status' => 'confirmed',
            'booked_at' => Carbon::now()->subHours(4),
        ]);

        // Past booking & Attendance
        $pastBooking = ClassBooking::create([
            'schedule_id' => $pastSched->id,
            'user_id' => $member2->id,
            'booking_reference' => 'BK-' . strtoupper(Str::random(8)),
            'status' => 'attended',
            'booked_at' => Carbon::now()->subDays(3),
        ]);
        Attendance::create([
            'booking_id' => $pastBooking->id,
            'schedule_id' => $pastSched->id,
            'user_id' => $member2->id,
            'check_in_time' => Carbon::now()->subDays(2)->setTime(8, 55, 0),
            'status' => 'present',
            'verified_by_user_id' => $trainer1->id,
            'notes' => 'Checked in promptly. Completed full session.',
        ]);

        // 11. Exercises Library
        $ex1 = Exercise::create(['name' => 'Barbell Back Squat', 'category' => 'Legs', 'target_muscle' => 'Quadriceps & Glutes', 'equipment' => 'Barbell & Squat Rack', 'description' => 'Fundamental lower body compound exercise. Keep chest proud and depth below parallel.']);
        $ex2 = Exercise::create(['name' => 'Barbell Bench Press', 'category' => 'Chest', 'target_muscle' => 'Pectorals & Triceps', 'equipment' => 'Barbell & Flat Bench', 'description' => 'Primary upper body pushing exercise. Maintain 5-point contact and controlled bar descent.']);
        $ex3 = Exercise::create(['name' => 'Conventional Deadlift', 'category' => 'Back', 'target_muscle' => 'Posterior Chain & Erector Spinae', 'equipment' => 'Barbell', 'description' => 'Full posterior chain pull from the floor. Neutral spine throughout the lift.']);
        $ex4 = Exercise::create(['name' => 'Overhead Shoulder Press', 'category' => 'Shoulders', 'target_muscle' => 'Deltoids', 'equipment' => 'Barbell / Dumbbells', 'description' => 'Strict vertical press focusing on shoulder strength and core stabilization.']);
        $ex5 = Exercise::create(['name' => 'Lat Pulldown', 'category' => 'Back', 'target_muscle' => 'Latissimus Dorsi', 'equipment' => 'Cable Machine', 'description' => 'Pull bar smoothly to upper chest while engaging shoulder blades.']);
        $ex6 = Exercise::create(['name' => 'Plank Hold', 'category' => 'Core', 'target_muscle' => 'Transverse Abdominis', 'equipment' => 'Mat', 'description' => 'Isometric core brace. Neutral spine and tight glutes.']);

        // 12. Workout Plans
        $planAlice = WorkoutPlan::create([
            'member_id' => $member1->id,
            'trainer_id' => $trainer1->id,
            'title' => 'Lean Muscle & Metabolic Conditioning',
            'objective' => 'Fat Loss & Muscle Toning',
            'description' => 'Structured 4-day hybrid split incorporating compound lifts and interval finishes.',
            'start_date' => Carbon::now()->subDays(10)->toDateString(),
            'end_date' => Carbon::now()->addDays(50)->toDateString(),
            'status' => 'active',
            'structured_exercises' => [
                ['name' => 'Barbell Back Squat', 'sets' => 3, 'reps' => '12', 'rest' => 60, 'day' => 'Monday'],
                ['name' => 'Lat Pulldown', 'sets' => 3, 'reps' => '12-15', 'rest' => 45, 'day' => 'Monday'],
                ['name' => 'Plank Hold', 'sets' => 3, 'reps' => '45 sec', 'rest' => 45, 'day' => 'Monday'],
                ['name' => 'Barbell Bench Press', 'sets' => 3, 'reps' => '10', 'rest' => 60, 'day' => 'Wednesday'],
            ],
        ]);

        WorkoutPlanExercise::create([
            'workout_plan_id' => $planAlice->id,
            'exercise_id' => $ex1->id,
            'exercise_name' => 'Barbell Back Squat',
            'target_muscle' => 'Quadriceps & Glutes',
            'sets' => 3,
            'repetitions' => '12',
            'rest_period_seconds' => 60,
            'scheduled_day' => 'Monday',
            'exercise_order' => 1,
            'trainer_instructions' => 'Warm up with 1 empty bar set. Focus on smooth eccentric tempo.',
        ]);

        WorkoutPlanExercise::create([
            'workout_plan_id' => $planAlice->id,
            'exercise_id' => $ex5->id,
            'exercise_name' => 'Lat Pulldown',
            'target_muscle' => 'Latissimus Dorsi',
            'sets' => 3,
            'repetitions' => '12-15',
            'rest_period_seconds' => 45,
            'scheduled_day' => 'Monday',
            'exercise_order' => 2,
            'trainer_instructions' => 'Squeeze lats for 1 second at the bottom of the pull.',
        ]);

        // 13. Workout Sessions
        $session1 = WorkoutSession::create([
            'user_id' => $member1->id,
            'workout_plan_id' => $planAlice->id,
            'session_date' => Carbon::now()->subDays(3)->toDateString(),
            'start_time' => Carbon::now()->subDays(3)->setTime(10, 0),
            'end_time' => Carbon::now()->subDays(3)->setTime(10, 52),
            'duration_minutes' => 52,
            'status' => 'completed',
            'notes' => 'Felt strong on squats. Hit full target reps with 40kg.',
        ]);

        WorkoutSessionExercise::create([
            'workout_session_id' => $session1->id,
            'exercise_name' => 'Barbell Back Squat',
            'sets_completed' => 3,
            'reps_completed' => '12, 12, 12',
            'weight_used_kg' => 40.0,
            'notes' => 'Good form throughout all sets.',
        ]);

        // 14. Fitness Metrics History (Demonstrating Recharts progress tracking!)
        FitnessMetric::create([
            'user_id' => $member1->id,
            'recorded_date' => Carbon::now()->subDays(60)->toDateString(),
            'weight_kg' => 68.5,
            'height_cm' => 165.0,
            'bmi' => FitnessMetric::calculateBMI(68.5, 165.0),
            'body_fat_percentage' => 28.5,
            'waist_cm' => 79.0,
            'workout_frequency_weekly' => 2,
            'notes' => 'Baseline measurement upon joining.',
        ]);
        FitnessMetric::create([
            'user_id' => $member1->id,
            'recorded_date' => Carbon::now()->subDays(30)->toDateString(),
            'weight_kg' => 66.8,
            'height_cm' => 165.0,
            'bmi' => FitnessMetric::calculateBMI(66.8, 165.0),
            'body_fat_percentage' => 26.8,
            'waist_cm' => 76.5,
            'workout_frequency_weekly' => 3,
            'notes' => 'Consistent progress following the workout plan.',
        ]);
        FitnessMetric::create([
            'user_id' => $member1->id,
            'recorded_date' => Carbon::now()->subDays(5)->toDateString(),
            'weight_kg' => 64.9,
            'height_cm' => 165.0,
            'bmi' => FitnessMetric::calculateBMI(64.9, 165.0),
            'body_fat_percentage' => 25.0,
            'waist_cm' => 74.0,
            'workout_frequency_weekly' => 4,
            'notes' => 'Outstanding improvement. Reached secondary fitness milestone.',
        ]);

        // 15. Communication: Conversations & Messages
        $conv1 = Conversation::create([
            'member_id' => $member1->id,
            'trainer_id' => $trainer1->id,
            'last_message_at' => Carbon::now()->subHours(2),
        ]);
        Message::create([
            'conversation_id' => $conv1->id,
            'sender_id' => $trainer1->id,
            'receiver_id' => $member1->id,
            'message' => 'Hello Alice! I have updated your workout plan for this week. Focus on keeping your rest periods under 60 seconds.',
            'is_read' => true,
            'read_at' => Carbon::now()->subHours(3),
        ]);
        Message::create([
            'conversation_id' => $conv1->id,
            'sender_id' => $member1->id,
            'receiver_id' => $trainer1->id,
            'message' => 'Thank you Coach John! I completed the session today and felt great. Should I add 5kg to the squats next week?',
            'is_read' => true,
            'read_at' => Carbon::now()->subHours(2),
        ]);
        Message::create([
            'conversation_id' => $conv1->id,
            'sender_id' => $trainer1->id,
            'receiver_id' => $member1->id,
            'message' => 'Yes, absolutely. 2.5kg to 5kg progression is perfect if form remains solid.',
            'is_read' => false,
        ]);

        // 16. System Notifications
        Notification::create([
            'user_id' => $member1->id,
            'title' => 'Class Booking Confirmed',
            'message' => 'Your booking for Total Body Strength & Power today at 09:00 AM is confirmed.',
            'type' => 'booking',
            'is_read' => false,
        ]);
        Notification::create([
            'user_id' => $member3->id,
            'title' => 'Membership Expiry Reminder',
            'message' => 'Your Monthly Starter membership will expire in 4 days. Please renew to maintain uninterrupted gym access.',
            'type' => 'membership_expiry',
            'is_read' => false,
        ]);
        Notification::create([
            'user_id' => $admin->id,
            'title' => 'New Member Subscription',
            'message' => 'Alice Umutoni subscribed to Quarterly Pro for $120.00 via MTN MoMo.',
            'type' => 'payment',
            'is_read' => true,
            'read_at' => Carbon::now()->subDays(19),
        ]);

        // 17. Fraud Flags (Demonstration for Admin review)
        FraudFlag::create([
            'user_id' => $member3->id,
            'flag_type' => 'repeated_invalid_checkin',
            'severity' => 'low',
            'description' => 'Member attempted check-in 2 hours before the scheduled class start time.',
            'metadata' => ['schedule_id' => $sched2->id, 'attempt_time' => Carbon::now()->subHours(6)->toDateTimeString()],
            'status' => 'flagged',
        ]);

        // 18. Audit Logs
        AuditLog::record($admin->id, 'system_init', 'System', 1, ['message' => 'Initial database seed and setup completed']);
        AuditLog::record($member1->id, 'user_register', 'User', $member1->id, ['email' => $member1->email]);
        AuditLog::record($member1->id, 'membership_create', 'Membership', $sub1->id, ['plan' => 'Quarterly Pro']);
        AuditLog::record($member1->id, 'payment_confirm', 'Payment', $p1->id, ['amount' => 120.00]);
        AuditLog::record($member1->id, 'booking_create', 'ClassBooking', $booking1->id, ['schedule_id' => $sched1->id]);
    }
}
