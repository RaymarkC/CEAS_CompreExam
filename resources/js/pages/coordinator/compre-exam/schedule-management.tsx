import { AlertTriangle, CalendarFold, ClipboardList } from 'lucide-react';
import { FormEvent, useState } from 'react';

type Schedule = {
    id: number;
    program: string;
    exam_date: string;
    exam_time: string;
    venue: string;
    proctors?: string[];
    proctor_ids?: Array<number | ''>;
    teacher_assigned: string | null;
};

type ProctorOption = {
    id: number;
    name: string;
    email: string;
};

function scheduleRequestHeaders(): Record<string, string> {
    const xsrfCookie = document.cookie
        .split(';')
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith('XSRF-TOKEN='));
    const xsrfToken = xsrfCookie ? decodeURIComponent(xsrfCookie.slice('XSRF-TOKEN='.length)) : '';
    const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

    return {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : { 'X-CSRF-TOKEN': csrfToken }),
    };
}

async function scheduleErrorMessage(response: Response, fallback: string): Promise<string> {
    if (response.status === 419) {
        return 'Your session token expired or no longer matches. Refresh the page, sign in again if asked, and retry.';
    }

    const body = await response.json().catch(() => null);
    const validationMessage = body?.errors ? Object.values(body.errors as Record<string, string[]>).flat()[0] : null;
    if (validationMessage) {
        return validationMessage;
    }

    return body?.message || fallback;
}

type Props = {
    schedules: Schedule[];
    proctorOptions: ProctorOption[];
};

export default function CoordinatorCompreScheduleManagement({ schedules: initialSchedules = [], proctorOptions = [] }: Props) {
    const [schedules, setSchedules] = useState(
        initialSchedules.map((schedule) => ({
            ...schedule,
            proctors: schedule.proctors?.length ? schedule.proctors : [''],
        })),
    );
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [proctors, setProctors] = useState(['']);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        const form = event.currentTarget;
        const formData = new FormData(form);
        const response = await fetch('/coordinator/compre-schedule', {
            method: 'POST',
            headers: scheduleRequestHeaders(),
            credentials: 'same-origin',
            body: formData,
        });

        if (!response.ok) {
            setError(await scheduleErrorMessage(response, 'The schedule could not be saved.'));
            return;
        }

        const body = await response.json();
        setSchedules((current) => [body.schedule, ...current]);
        form.reset();
        setProctors(['']);
    };

    const handleEdit = (schedule: Schedule) => {
        setEditingId(schedule.id);
        setError(null);
    };

    const handleUpdate = async (event: FormEvent<HTMLFormElement>, id: number) => {
        event.preventDefault();
        setError(null);
        const formData = new FormData(event.currentTarget);
        formData.append('_method', 'PUT');
        const response = await fetch(`/coordinator/compre-schedule/${id}`, {
            method: 'POST',
            headers: scheduleRequestHeaders(),
            credentials: 'same-origin',
            body: formData,
        });

        if (!response.ok) {
            setError(await scheduleErrorMessage(response, 'The schedule could not be updated.'));
            return;
        }

        const body = await response.json();
        setSchedules((current) => current.map((schedule) => (schedule.id === id ? body.schedule : schedule)));
        setEditingId(null);
    };

    const unassignedSchedules = schedules.filter((schedule) => !schedule.proctors?.some((proctor) => proctor.trim()));

    return (
        <section className="mt-8 border-t pt-6">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-500 bg-blue-500/10">
                    <CalendarFold className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                    <h2 className="text-base font-semibold">Exam Schedule and Proctor Assignments</h2>
                    <p className="text-muted-foreground text-xs">
                        Check exam requirements, enter the number of rooms, and select one or more proctors for each schedule.
                    </p>
                </div>
            </div>
            {unassignedSchedules.length > 0 && (
                <div
                    role="alert"
                    className="mt-4 flex items-center gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300"
                >
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>
                        {unassignedSchedules.length} exam room{unassignedSchedules.length === 1 ? '' : 's'} still need a proctor assignment.
                    </span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 max-w-3xl rounded-lg border p-5">
                <div className="flex items-center gap-2 font-medium">
                    <ClipboardList className="h-4 w-4" />
                    Create exam schedule
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2 text-sm">
                        Program
                        <input name="program" required className="rounded-md border bg-transparent px-3 py-2" placeholder="Enter program" />
                    </label>
                    <label className="grid gap-2 text-sm">
                        Date
                        <input
                            name="date"
                            type="date"
                            min="1000-01-01"
                            max="9999-12-31"
                            required
                            className="rounded-md border bg-transparent px-3 py-2"
                        />
                    </label>
                    <label className="grid gap-2 text-sm">
                        Time
                        <input name="time" type="time" required className="rounded-md border bg-transparent px-3 py-2" />
                    </label>
                    <label className="grid gap-2 text-sm">
                        Number of rooms
                        <input
                            name="venue"
                            type="text"
                            required
                            className="rounded-md border bg-transparent px-3 py-2"
                            placeholder="Enter number of rooms"
                        />
                    </label>
                    <label className="grid gap-2 text-sm sm:col-span-2">
                        Proctors
                        {proctors.map((proctorId, index) => (
                            <div key={index} className="flex gap-2">
                                <select
                                    name="proctor_ids[]"
                                    value={proctorId}
                                    onChange={(event) =>
                                        setProctors((current) => current.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))
                                    }
                                    required
                                    className="w-full rounded-md border bg-white px-3 py-2 text-black"
                                >
                                    <option value="" className="bg-white text-black">
                                        Select a proctor
                                    </option>
                                    {proctorOptions.map((option) => (
                                        <option
                                            key={option.id}
                                            value={option.id}
                                            disabled={proctors.some(
                                                (selected, selectedIndex) => selectedIndex !== index && selected === String(option.id),
                                            )}
                                            className="bg-white text-black"
                                        >
                                            {option.name}
                                        </option>
                                    ))}
                                </select>
                                {index > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setProctors((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                                        className="rounded-md border px-3"
                                    >
                                        -
                                    </button>
                                )}
                            </div>
                        ))}
                        {proctorOptions.length === 0 && (
                            <p className="text-muted-foreground text-xs">
                                No Proctor accounts found. Run `php artisan demo:proctor-accounts` to create the demo accounts.
                            </p>
                        )}
                        <button
                            type="button"
                            disabled={proctors.length >= proctorOptions.length}
                            onClick={() => setProctors((current) => [...current, ''])}
                            className="w-fit rounded-md border px-3 py-1 text-sm disabled:opacity-50"
                        >
                            + Add proctor
                        </button>
                    </label>
                    <label className="grid gap-2 text-sm sm:col-span-2">
                        Teacher assigned
                        <input
                            name="teacher_assigned"
                            required
                            className="rounded-md border bg-transparent px-3 py-2"
                            placeholder="Enter teacher name"
                        />
                    </label>
                </div>
                <button type="submit" className="bg-primary text-primary-foreground mt-5 rounded-md px-4 py-2 text-sm">
                    Save schedule
                </button>
                {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
            </form>

            <div className="mt-6 max-w-3xl rounded-lg border p-5">
                <h2 className="font-medium">Saved schedules</h2>
                {schedules.length === 0 ? (
                    <p className="text-muted-foreground mt-3 text-sm">No schedules have been saved yet.</p>
                ) : (
                    <div className="mt-3 space-y-3">
                        {schedules.map((schedule) => (
                            <div key={schedule.id} className="rounded-md border p-3 text-sm">
                                {editingId === schedule.id ? (
                                    <form onSubmit={(event) => handleUpdate(event, schedule.id)} className="grid gap-3 sm:grid-cols-2">
                                        <input
                                            name="program"
                                            defaultValue={schedule.program}
                                            required
                                            className="rounded-md border bg-transparent px-3 py-2"
                                        />
                                        <input
                                            name="date"
                                            type="date"
                                            min="1000-01-01"
                                            max="9999-12-31"
                                            defaultValue={schedule.exam_date}
                                            required
                                            className="rounded-md border bg-transparent px-3 py-2"
                                        />
                                        <input
                                            name="time"
                                            type="time"
                                            defaultValue={schedule.exam_time.slice(0, 5)}
                                            required
                                            className="rounded-md border bg-transparent px-3 py-2"
                                        />
                                        <input
                                            name="venue"
                                            type="text"
                                            defaultValue={schedule.venue}
                                            aria-label="Number of rooms"
                                            placeholder="Number of rooms"
                                            required
                                            className="rounded-md border bg-transparent px-3 py-2"
                                        />
                                        {(schedule.proctor_ids?.length ? schedule.proctor_ids.map(String) : ['']).map((proctorId, index) => (
                                            <div key={index} className="flex gap-2 sm:col-span-2">
                                                <select
                                                    name="proctor_ids[]"
                                                    value={proctorId}
                                                    onChange={(event) =>
                                                        setSchedules((current) =>
                                                            current.map((item) =>
                                                                item.id === schedule.id
                                                                    ? {
                                                                          ...item,
                                                                          proctor_ids: (item.proctor_ids || []).map((id, itemIndex) =>
                                                                              itemIndex === index
                                                                                  ? event.target.value === ''
                                                                                      ? ''
                                                                                      : Number(event.target.value)
                                                                                  : id,
                                                                          ),
                                                                      }
                                                                    : item,
                                                            ),
                                                        )
                                                    }
                                                    required
                                                    className="w-full rounded-md border bg-white px-3 py-2 text-black"
                                                >
                                                    <option value="" className="bg-white text-black">
                                                        Select a proctor
                                                    </option>
                                                    {proctorOptions.map((option) => (
                                                        <option
                                                            key={option.id}
                                                            value={option.id}
                                                            disabled={(schedule.proctor_ids || []).some(
                                                                (id) => id !== Number(proctorId) && id === option.id,
                                                            )}
                                                            className="bg-white text-black"
                                                        >
                                                            {option.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                {index > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setSchedules((current) =>
                                                                current.map((item) =>
                                                                    item.id === schedule.id
                                                                        ? {
                                                                              ...item,
                                                                              proctor_ids: (item.proctor_ids || []).filter(
                                                                                  (_, itemIndex) => itemIndex !== index,
                                                                              ),
                                                                          }
                                                                        : item,
                                                                ),
                                                            )
                                                        }
                                                        className="rounded-md border px-3"
                                                    >
                                                        -
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <input
                                            name="teacher_assigned"
                                            defaultValue={schedule.teacher_assigned || ''}
                                            required
                                            className="rounded-md border bg-transparent px-3 py-2"
                                            placeholder="Enter teacher name"
                                        />
                                        <button
                                            type="button"
                                            disabled={(schedule.proctor_ids || []).length >= proctorOptions.length}
                                            onClick={() =>
                                                setSchedules((current) =>
                                                    current.map((item) =>
                                                        item.id === schedule.id ? { ...item, proctor_ids: [...(item.proctor_ids || []), ''] } : item,
                                                    ),
                                                )
                                            }
                                            className="w-fit rounded-md border px-3 py-1 text-sm disabled:opacity-50"
                                        >
                                            + Add proctor
                                        </button>
                                        <div className="flex gap-2">
                                            <button type="submit" className="bg-primary text-primary-foreground rounded-md px-3 py-2">
                                                Save
                                            </button>
                                            <button type="button" onClick={() => setEditingId(null)} className="rounded-md border px-3 py-2">
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="font-medium">{schedule.program}</div>
                                            <div className="text-muted-foreground mt-1">
                                                {schedule.exam_date} at {schedule.exam_time} · Number of rooms: {schedule.venue || 'Not assigned'} ·
                                                Proctors: {(schedule.proctors || []).filter(Boolean).join(', ') || 'Not assigned'} · Teacher:{' '}
                                                {schedule.teacher_assigned || 'Not assigned'}
                                            </div>
                                        </div>
                                        <button type="button" onClick={() => handleEdit(schedule)} className="rounded-md border px-3 py-1 text-sm">
                                            Edit
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
