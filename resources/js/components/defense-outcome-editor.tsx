import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
export type AcademicOutcome = {
    completion: string;
    result: string;
    subject: string;
    completed_on: string | null;
    reason: string | null;
    next_stage: string | null;
    version: number;
    current: boolean;
    history: { completion: string; result: string; subject: string; reason?: string; updated_at?: string }[];
};
export function DefenseOutcomeEditor({
    id,
    stage,
    outcome,
    canEdit,
}: {
    id: number;
    stage: string | null;
    outcome: AcademicOutcome | null;
    canEdit: boolean;
}) {
    const form = useForm({
        version: outcome?.version ?? 0,
        completion: outcome?.completion ?? 'not-yet-done',
        result: outcome?.result ?? 'not-recorded',
        subject: outcome?.subject ?? '',
        completed_on: outcome?.completed_on ?? '',
        reason: '',
        next_stage: outcome?.next_stage ?? '',
    });
    const select = 'w-full rounded-md border bg-background p-2 text-sm';
    const next = stage === 'Proposal' ? 'Prefinal' : stage === 'Prefinal' ? 'Final' : null;
    return (
        <section className="mt-3 space-y-3 rounded-lg border p-3">
            <h4 className="font-medium">Academic defense outcome</h4>
            <p className="text-sm">
                {outcome
                    ? `${outcome.completion.replaceAll('-', ' ')} / ${outcome.result.replaceAll('-', ' ')} · ${outcome.subject}`
                    : 'Not yet recorded by the Coordinator.'}
            </p>
            {outcome && !outcome.current && (
                <p className="text-amber-600 dark:text-amber-300">Defense information changed. Coordinator reconfirmation is required.</p>
            )}
            {outcome?.completed_on && <p className="text-sm">Defense completed: {outcome.completed_on}</p>}
            {outcome?.reason && <p className="text-sm whitespace-pre-wrap">Notes / reason: {outcome.reason}</p>}
            {outcome?.next_stage && <p className="text-sm">Coordinator-recorded next stage: {outcome.next_stage}</p>}
            {canEdit && (
                <details>
                    <summary className="cursor-pointer text-sm underline">Record or revise outcome</summary>
                    <form
                        className="mt-3 space-y-3"
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.put(`/defense-outcomes/${id}`, {
                                preserveScroll: true,
                                onSuccess: () => {
                                    form.setData('version', form.data.version + 1);
                                    form.setData('reason', '');
                                },
                            });
                        }}
                    >
                        {Object.values(form.errors).length > 0 && (
                            <p role="alert" className="text-destructive">
                                {Object.values(form.errors).join(' ')}
                            </p>
                        )}
                        {form.recentlySuccessful && <p role="status">Outcome saved.</p>}
                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className="text-sm">
                                Completion
                                <select
                                    className={select}
                                    value={form.data.completion}
                                    onChange={(e) =>
                                        form.setData({
                                            ...form.data,
                                            completion: e.target.value,
                                            ...(e.target.value !== 'done' ? { result: 'not-recorded', completed_on: '', next_stage: '' } : {}),
                                        })
                                    }
                                >
                                    <option value="not-yet-done">Not yet done</option>
                                    <option value="done">Done</option>
                                    <option value="did-not-defend">Did not defend</option>
                                </select>
                            </label>
                            <label className="text-sm">
                                Result
                                <select
                                    className={select}
                                    disabled={form.data.completion !== 'done'}
                                    value={form.data.result}
                                    onChange={(e) => form.setData({ ...form.data, result: e.target.value, next_stage: '' })}
                                >
                                    <option value="not-recorded">Not recorded</option>
                                    <option value="passed">Passed</option>
                                    <option value="for-revision">For revision</option>
                                    <option value="repeat-defense">Repeat defense</option>
                                </select>
                            </label>
                            <label className="text-sm">
                                Research subject
                                <select
                                    required
                                    className={select}
                                    value={form.data.subject}
                                    onChange={(e) => form.setData('subject', e.target.value)}
                                >
                                    <option value="">Choose subject</option>
                                    {['Thesis 1', 'Thesis 2', 'Dissertation 1', 'Dissertation 2'].map((s) => (
                                        <option key={s}>{s}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="text-sm">
                                Actual completion date
                                <Input
                                    type="date"
                                    disabled={form.data.completion !== 'done'}
                                    required={form.data.completion === 'done'}
                                    value={form.data.completed_on}
                                    onChange={(e) => form.setData('completed_on', e.target.value)}
                                />
                            </label>
                            <label className="text-sm">
                                Next stage (optional)
                                <select
                                    className={select}
                                    disabled={form.data.result !== 'passed' || !next}
                                    value={form.data.next_stage}
                                    onChange={(e) => form.setData('next_stage', e.target.value)}
                                >
                                    <option value="">Do not advance</option>
                                    {next && <option>{next}</option>}
                                </select>
                            </label>
                        </div>
                        <label className="block text-sm">
                            Notes / reason (required for a missed defense or revision)
                            <Textarea
                                maxLength={2000}
                                required={form.data.completion === 'did-not-defend' || !!outcome}
                                value={form.data.reason}
                                onChange={(e) => form.setData('reason', e.target.value)}
                            />
                        </label>
                        <p className="text-muted-foreground text-xs">
                            Done applies only to this defense. It does not confirm graduation, recipient service, or create a next-stage request.
                        </p>
                        <Button disabled={form.processing}>Save outcome</Button>
                    </form>
                </details>
            )}
            {!!outcome?.history?.length && (
                <details>
                    <summary className="cursor-pointer text-sm">Previous outcomes ({outcome.history.length})</summary>
                    {[...outcome.history].reverse().map((entry, i) => (
                        <p className="my-2 text-sm" key={i}>
                            {entry.updated_at} · {entry.completion} / {entry.result} · {entry.subject} · {entry.reason}
                        </p>
                    ))}
                </details>
            )}
        </section>
    );
}
