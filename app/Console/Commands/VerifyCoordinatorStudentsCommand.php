<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\CoordinatorProgramService;
use Illuminate\Console\Command;

class VerifyCoordinatorStudentsCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'verify:coordinator-students {--coordinator= : Specific coordinator email to check}';

    /**
     * The console command description.
     */
    protected $description = 'Verify coordinator-student-program relationships';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $coordinatorEmail = $this->option('coordinator');

        if ($coordinatorEmail) {
            $this->verifySpecificCoordinator($coordinatorEmail);
        } else {
            $this->verifyAllCoordinators();
        }
    }

    /**
     * Verify a specific coordinator's students
     */
    private function verifySpecificCoordinator(string $email)
    {
        if (! CoordinatorProgramService::isCoordinator($email)) {
            $this->error("❌ {$email} is not a registered coordinator.");

            return;
        }

        $this->info("🔍 VERIFYING COORDINATOR: {$email}");
        $this->line('');

        // Get coordinator's assigned programs
        $assignedPrograms = CoordinatorProgramService::getProgramsByEmail($email);

        $this->info('📚 ASSIGNED PROGRAMS ('.count($assignedPrograms).'):');
        foreach ($assignedPrograms as $program) {
            $this->line("   • {$program}");
        }

        $this->line('');

        // Check students in each program
        $totalStudents = 0;
        $this->info('👥 STUDENTS BY PROGRAM:');

        foreach ($assignedPrograms as $program) {
            $students = User::where('role', 'Student')
                ->where('program', $program)
                ->get(['first_name', 'last_name', 'email']);

            $count = $students->count();
            $totalStudents += $count;

            $this->line("   📚 {$program}: {$count} students");

            foreach ($students as $student) {
                $this->line("      • {$student->first_name} {$student->last_name} ({$student->email})");
            }
        }

        $this->line('');
        $this->info('📊 SUMMARY:');
        $this->line('   • Total Programs: '.count($assignedPrograms));
        $this->line("   • Total Students: {$totalStudents}");
    }

    /**
     * Verify all coordinators
     */
    private function verifyAllCoordinators()
    {
        $this->info('🔍 VERIFYING ALL COORDINATOR-STUDENT RELATIONSHIPS');
        $this->line('');

        $coordinators = CoordinatorProgramService::getAllCoordinatorEmails();
        $grandTotal = 0;

        foreach ($coordinators as $email) {
            $programs = CoordinatorProgramService::getProgramsByEmail($email);
            $studentCount = 0;

            foreach ($programs as $program) {
                $count = User::where('role', 'Student')
                    ->where('program', $program)
                    ->count();
                $studentCount += $count;
            }

            $grandTotal += $studentCount;

            $this->line("📧 {$email}: {$studentCount} students across ".count($programs).' programs');
        }

        $this->line('');
        $this->info("📊 GRAND TOTAL: {$grandTotal} students managed by ".count($coordinators).' coordinators');

        // Check for unassigned students
        $unassignedStudents = User::where('role', 'Student')
            ->whereNull('program')
            ->count();

        if ($unassignedStudents > 0) {
            $this->warn("⚠️  WARNING: {$unassignedStudents} students have no program assigned!");
        }

        // Check for students in unknown programs
        $allKnownPrograms = [];
        foreach ($coordinators as $email) {
            $allKnownPrograms = array_merge($allKnownPrograms, CoordinatorProgramService::getProgramsByEmail($email));
        }

        $unknownProgramStudents = User::where('role', 'Student')
            ->whereNotNull('program')
            ->whereNotIn('program', $allKnownPrograms)
            ->count();

        if ($unknownProgramStudents > 0) {
            $this->warn("⚠️  WARNING: {$unknownProgramStudents} students are in unknown programs!");
        }
    }
}
