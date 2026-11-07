<?php

namespace App\Http\Controllers;

use App\Models\ComprehensiveExamSchedule;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CoordinatorCompreScheduleController extends Controller
{
    public function index(Request $request)
    {
        $this->authorizeCoordinator($request);

        return to_route('coordinator.compre-exam.index');
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeCoordinator($request);

        $data = $request->validate([
            'program' => ['required', 'string', 'max:255'],
            'date' => ['required', 'regex:/^\d{4}-\d{2}-\d{2}$/', 'date_format:Y-m-d', 'after_or_equal:1000-01-01'],
            'time' => ['required', 'date_format:H:i'],
            'venue' => ['required', 'string', 'max:255'],
            'proctor_ids' => ['required', 'array', 'min:1'],
            'proctor_ids.*' => ['required', 'integer', 'distinct', Rule::exists('users', 'id')->where('role', 'Proctor')],
            'teacher_assigned' => ['required', 'string', 'max:255'],
        ]);
        $proctors = User::query()->whereIn('id', $data['proctor_ids'])->get()->keyBy('id');
        $proctorNames = collect($data['proctor_ids'])->map(fn (int $id) => $proctors->get($id)->display_name)->all();

        $schedule = ComprehensiveExamSchedule::create([
            'exam_id' => (string) Str::uuid(),
            'program' => $data['program'],
            'exam_date' => $data['date'],
            'exam_time' => $data['time'],
            'venue' => $data['venue'],
            'proctor_name' => $proctorNames[0],
            'proctors' => $proctorNames,
            'teacher_assigned' => $data['teacher_assigned'],
        ]);
        $schedule->proctorUsers()->sync($data['proctor_ids']);
        $schedule->load('proctorUsers:id,first_name,last_name');

        return response()->json(['schedule' => $this->scheduleData($schedule)], 201);
    }

    public function update(Request $request, ComprehensiveExamSchedule $schedule): JsonResponse
    {
        $this->authorizeCoordinator($request);

        $data = $request->validate([
            'program' => ['required', 'string', 'max:255'],
            'date' => ['required', 'regex:/^\d{4}-\d{2}-\d{2}$/', 'date_format:Y-m-d', 'after_or_equal:1000-01-01'],
            'time' => ['required', 'date_format:H:i'],
            'venue' => ['required', 'string', 'max:255'],
            'proctor_ids' => ['required', 'array', 'min:1'],
            'proctor_ids.*' => ['required', 'integer', 'distinct', Rule::exists('users', 'id')->where('role', 'Proctor')],
            'teacher_assigned' => ['required', 'string', 'max:255'],
        ]);
        $proctors = User::query()->whereIn('id', $data['proctor_ids'])->get()->keyBy('id');
        $proctorNames = collect($data['proctor_ids'])->map(fn (int $id) => $proctors->get($id)->display_name)->all();

        $schedule->update([
            'program' => $data['program'],
            'exam_date' => $data['date'],
            'exam_time' => $data['time'],
            'venue' => $data['venue'],
            'proctor_name' => $proctorNames[0],
            'proctors' => $proctorNames,
            'teacher_assigned' => $data['teacher_assigned'],
        ]);
        $schedule->proctorUsers()->sync($data['proctor_ids']);
        $schedule->load('proctorUsers:id,first_name,last_name');

        return response()->json(['schedule' => $this->scheduleData($schedule)]);
    }

    private function scheduleData(ComprehensiveExamSchedule $schedule): array
    {
        $assignedProctors = $schedule->proctorUsers;

        return [
            'id' => $schedule->id,
            'program' => $schedule->program,
            'exam_date' => $schedule->exam_date?->format('Y-m-d'),
            'exam_time' => $schedule->exam_time,
            'venue' => $schedule->venue,
            'proctors' => $assignedProctors->isNotEmpty()
                ? $assignedProctors->map(fn (User $proctor) => $proctor->display_name)->all()
                : ($schedule->proctors ?: [$schedule->proctor_name]),
            'proctor_ids' => $assignedProctors->pluck('id')->all(),
            'teacher_assigned' => $schedule->teacher_assigned,
        ];
    }

    private function authorizeCoordinator(Request $request): void
    {
        abort_unless(in_array($request->user()?->role, ['Coordinator', 'Administrative Assistant', 'Dean'], true), 403);
    }
}
