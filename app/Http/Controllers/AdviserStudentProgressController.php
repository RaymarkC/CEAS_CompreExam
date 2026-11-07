<?php

namespace App\Http\Controllers;

use App\Models\StudentProgressRecord;
use App\Models\User;
use App\Services\AcademicProgressAccess;
use App\Services\StudentProgressService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AdviserStudentProgressController extends Controller
{
    private function authorizeStudent(Request $request, User $student): void
    {
        app(AcademicProgressAccess::class)->read($request->user(), $student);
    }

    public function index(Request $request, StudentProgressService $service)
    {
        $students = app(AcademicProgressAccess::class)->students($request->user())->orderBy('last_name')->get();
        $summaries = $service->summaries($students);

        return Inertia::render('academic-progress/Index', ['students' => $students->map(fn ($s) => ['id' => $s->id, 'name' => $s->name, 'program' => $s->program, 'progress' => $summaries[$s->id] ?? null])->values()]);
    }

    public function show(Request $request, User $student, StudentProgressService $service)
    {
        $this->authorizeStudent($request, $student);

        return Inertia::render('adviser/students-list/progress', ['progress' => $service->detail($student, $request->user()), 'canEdit' => $request->user()->role === 'Coordinator']);
    }

    public function update(Request $request, User $student)
    {
        app(AcademicProgressAccess::class)->edit($request->user(), $student);
        $year = now('Asia/Manila')->year;
        $data = $request->validate([
            'version' => 'required|integer|min:0', 'enrollment_year' => 'nullable|integer|min:1900|max:'.$year,
            'completion_year' => 'nullable|integer|min:1900|max:'.$year,
            'semester' => 'nullable|string|max:150', 'subjects' => 'present|array|max:50',
            'classification' => 'nullable|in:new,continuing', 'school_year' => ['nullable', 'regex:/^\d{4}-\d{4}$/'],
            'subjects.*.research_subject' => 'nullable|in:Thesis 1,Thesis 2,Dissertation 1,Dissertation 2',
            'subjects.*.started_on' => 'nullable|date_format:Y-m-d|before_or_equal:'.now('Asia/Manila')->toDateString(),
            'subjects.*.code' => 'nullable|string|max:40', 'subjects.*.title' => 'required|string|max:200',
            'record_reference' => 'required|string|min:5|max:1500', 'verified_against_school_records' => 'required|accepted',
        ]);
        $data += ['enrollment_year' => null, 'completion_year' => null, 'semester' => null, 'classification' => null, 'school_year' => null];
        if ($data['completion_year'] !== null && ($data['enrollment_year'] === null || $data['completion_year'] < $data['enrollment_year'])) {
            throw ValidationException::withMessages(['completion_year' => 'Enter an enrollment year, and choose a completion year on or after it.']);
        }
        if ($data['subjects'] && ! filled($data['semester'])) {
            throw ValidationException::withMessages(['semester' => 'Enter the semester or school year for these subjects.']);
        }
        if ($data['school_year']) {
            [$first,$last] = array_map('intval', explode('-', $data['school_year']));
            if ($first < 1900 || $last !== $first + 1 || $first > $year) {
                throw ValidationException::withMessages(['school_year' => 'Use consecutive years, for example 2026-2027.']);
            }
        }
        foreach ($data['subjects'] as $index => $subject) {
            if (! empty($subject['research_subject']) && (empty($subject['started_on']) || empty($data['school_year']) || empty($data['semester']))) {
                throw ValidationException::withMessages(["subjects.$index.started_on" => 'Research subjects require a start date, school year and semester.']);
            }
        }
        DB::transaction(function () use ($student, $data, $request) {
            User::whereKey($student->id)->lockForUpdate()->firstOrFail();
            app(AcademicProgressAccess::class)->edit($request->user(), $student);
            $record = StudentProgressRecord::where('student_id', $student->id)->lockForUpdate()->first();
            if (($record?->version ?? 0) !== (int) $data['version']) {
                throw ValidationException::withMessages(['version' => 'This record changed while you were editing. Reload the page before saving again.']);
            }
            $history = $record?->history ?? [];
            if ($record) {
                $history[] = [
                    'at' => $record->recorded_at->toIso8601String(), 'actor_name' => $record->recorder?->name ?? 'Former staff member',
                    'actor_id' => $record->recorded_by, 'enrollment_year' => $record->enrollment_year,
                    'completion_year' => $record->completion_year, 'semester' => $record->semester,
                    'classification' => $record->classification, 'school_year' => $record->school_year, 'subjects' => $record->subjects, 'record_reference' => $record->record_reference,
                ];
            }
            $record ??= new StudentProgressRecord(['student_id' => $student->id]);
            $record->fill([
                'enrollment_year' => $data['enrollment_year'], 'completion_year' => $data['completion_year'],
                'classification' => $data['classification'], 'school_year' => $data['school_year'], 'semester' => $data['semester'], 'subjects' => collect($data['subjects'])->map(fn ($subject) => ['code' => trim($subject['code'] ?? ''), 'title' => trim($subject['title']), 'research_subject' => $subject['research_subject'] ?? null, 'started_on' => $subject['started_on'] ?? null, 'school_year' => $data['school_year'], 'semester' => $data['semester']])->values()->all(),
                'record_reference' => trim($data['record_reference']), 'recorded_by' => $request->user()->id,
                'recorded_at' => now(), 'version' => $record->exists ? $record->version + 1 : 1, 'history' => $history,
            ])->save();
        });

        return back()->with('success', 'Student progress information saved.');
    }
}
