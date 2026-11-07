import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { router } from '@inertiajs/react';
import { Check, Clock, RotateCcw } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';

type HistoryEntry = {
    action?: string;
    to_state?: string;
    timestamp?: string;
    user_name?: string | null;
    comment?: string | null;
    student_response?: string | null;
};

export type DefenseProgressFields = {
    workflow_history?: HistoryEntry[] | null;
    correction_notes?: string | null;
    correction_requested_by?: number | null;
    correction_requested_at?: string | null;
    correction_stage?: string | null;
    correction_count?: number;
};

const attachments = [
    ['manuscript_proposal', 'Manuscript / proposal'],
    ['similarity_index', 'Similarity report'],
    ['rec_endorsement', 'REC endorsement'],
    ['proof_of_payment', 'Proof of payment'],
    ['avisee_adviser_attachment', 'Advisee–adviser document'],
] as const;
type AttachmentField = (typeof attachments)[number][0];
type ProgressRequest = DefenseProgressFields & {
    id: number;
    thesis_title: string;
    workflow_state?: string;
    created_at?: string;
    adviser_comments?: string | null;
    coordinator_comments?: string | null;
} & Partial<Record<AttachmentField, string | null>>;

const stages = ['Submitted', 'Adviser endorsed', 'Coordinator approved', 'Panel assigned', 'Scheduled', 'Completed'];
const progress: Record<string, { step: number; label: string; next: string }> = {
    submitted: { step: 0, label: 'Awaiting adviser review', next: 'Your adviser will review your documents and endorse the request.' },
    'adviser-review': { step: 0, label: 'Awaiting adviser review', next: 'Your adviser will review your documents and endorse the request.' },
    'adviser-corrections': {
        step: 0,
        label: 'Your action is needed',
        next: 'Address your adviser’s feedback below, then resubmit for adviser review.',
    },
    'adviser-approved': {
        step: 1,
        label: 'Awaiting academic coordinator review',
        next: 'Your academic coordinator will assess the endorsed request.',
    },
    'coordinator-review': {
        step: 1,
        label: 'Awaiting academic coordinator review',
        next: 'Your academic coordinator will assess the endorsed request.',
    },
    'coordinator-corrections': {
        step: 1,
        label: 'Your action is needed',
        next: 'Address your coordinator’s feedback below, then resubmit for coordinator review.',
    },
    'coordinator-approved': {
        step: 2,
        label: 'Approved — awaiting panel assignment',
        next: 'Your academic coordinator will assign your defense panel and arrange the schedule.',
    },
    'panels-assigned': {
        step: 3,
        label: 'Awaiting defense schedule',
        next: 'Your academic coordinator will confirm the defense date, time, and venue.',
    },
    'panel-assigned': {
        step: 3,
        label: 'Awaiting defense schedule',
        next: 'Your academic coordinator will confirm the defense date, time, and venue.',
    },
    scheduled: { step: 4, label: 'Defense scheduled', next: 'Prepare for your defense. Check the date, time, venue, and committee below.' },
    completed: { step: 5, label: 'Defense completed', next: 'Your defense workflow is complete.' },
    cancelled: { step: -1, label: 'Request cancelled', next: 'This request is closed.' },
    'adviser-rejected': {
        step: -1,
        label: 'Rejected by adviser',
        next: 'This request is closed. Review the feedback in the activity history and contact your adviser if needed.',
    },
    'coordinator-rejected': {
        step: -1,
        label: 'Rejected by coordinator',
        next: 'This request is closed. Review the feedback in the activity history and contact your coordinator if needed.',
    },
    rejected: { step: -1, label: 'Request rejected', next: 'This request is closed. Review the feedback in the activity history.' },
};

function readable(value: string) {
    return value.replace(/[-_]/g, ' ').replace(/^\w/, (letter) => letter.toUpperCase());
}

function dateLabel(value?: string | null) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function DefenseRequestProgress({ request }: { request: ProgressRequest }) {
    const state = (request.workflow_state || 'submitted').toLowerCase();
    const needsCorrections = state === 'adviser-corrections' || state === 'coordinator-corrections';
    const current = progress[state] || {
        step: -1,
        label: readable(state),
        next: 'Your request is being processed. Contact your academic coordinator for details.',
    };
    const reviewer = state === 'adviser-corrections' ? 'adviser' : 'academic coordinator';
    const [title, setTitle] = useState(request.thesis_title);
    const [response, setResponse] = useState('');
    const [files, setFiles] = useState<Partial<Record<AttachmentField, File>>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState('');
    const history = Array.isArray(request.workflow_history) ? request.workflow_history : [];

    useEffect(() => {
        setTitle(request.thesis_title);
    }, [request.thesis_title]);
    useEffect(() => {
        if (request.correction_requested_at) setSuccess('');
    }, [request.correction_requested_at]);

    async function resubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (processing) return;
        setProcessing(true);
        setErrors({});
        setSuccess('');
        const form = new FormData();
        form.set('thesis_title', title.trim());
        form.set('student_response', response.trim());
        for (const [field, file] of Object.entries(files)) if (file) form.set(field, file);
        const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
        try {
            const result = await fetch(`/defense-requirements/${request.id}/resubmit`, {
                method: 'POST',
                headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrf },
                body: form,
            });
            const data = await result.json().catch(() => ({}));
            if (!result.ok) {
                const fieldErrors = Object.fromEntries(
                    Object.entries(data.errors || {}).map(([key, value]) => [key, Array.isArray(value) ? String(value[0]) : String(value)]),
                );
                setErrors({
                    ...fieldErrors,
                    form:
                        data.message ||
                        (result.status === 419
                            ? 'Your session expired. Refresh this page and try again.'
                            : 'We could not resubmit your request. Please try again.'),
                });
                return;
            }
            setResponse('');
            setFiles({});
            setSuccess('Your corrections were submitted. The reviewer has been notified.');
            await new Promise<void>((resolve) => router.reload({ only: ['defenseRequirements', 'defenseRequest'], onFinish: () => resolve() }));
        } catch {
            setErrors({ form: 'Connection interrupted. Check your connection and try again.' });
        } finally {
            setProcessing(false);
        }
    }

    return (
        <section className="my-4 space-y-4" aria-label="Request progress">
            <div
                className={`rounded-lg border p-4 ${needsCorrections ? 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30' : 'bg-zinc-50 dark:bg-zinc-800/40'}`}
            >
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                    {needsCorrections ? <RotateCcw className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    {current.label}
                </h3>
                <p className="text-muted-foreground mt-1 text-sm">{current.next}</p>
                {current.step >= 0 && (
                    <ol className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" aria-label="Defense milestones">
                        {stages.map((label, index) => (
                            <li
                                key={label}
                                aria-current={index === current.step ? 'step' : undefined}
                                className={`flex items-start gap-2 text-xs ${index <= current.step ? 'text-rose-700 dark:text-rose-300' : 'text-muted-foreground'}`}
                            >
                                <span
                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${index <= current.step ? 'border-rose-500 bg-rose-500 text-white' : ''}`}
                                >
                                    {index <= current.step ? <Check className="h-3 w-3" /> : index + 1}
                                </span>
                                <span>
                                    {label}
                                    <span className="sr-only">{index <= current.step ? ' reached' : ' pending'}</span>
                                </span>
                            </li>
                        ))}
                    </ol>
                )}
            </div>
            {success && (
                <p
                    role="status"
                    className="rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200"
                >
                    {success}
                </p>
            )}
            {needsCorrections && (
                <form onSubmit={resubmit} className="space-y-4 rounded-lg border border-amber-300 p-4 dark:border-amber-800">
                    <div>
                        <h3 className="text-sm font-semibold">Corrections requested by your {reviewer}</h3>
                        {request.correction_requested_at && (
                            <p className="text-muted-foreground mt-1 text-xs">{dateLabel(request.correction_requested_at)} (Philippine time)</p>
                        )}
                        <p className="bg-muted mt-3 rounded-md p-3 text-sm whitespace-pre-wrap">
                            {request.correction_notes || 'Please contact your reviewer for the required changes.'}
                        </p>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        Update this request and resubmit it below. Existing documents stay attached unless you upload a replacement.
                    </p>
                    <fieldset disabled={processing} className="space-y-4">
                        <div>
                            <label htmlFor={`correction-title-${request.id}`} className="text-sm font-medium">
                                Thesis title
                            </label>
                            <Input
                                id={`correction-title-${request.id}`}
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                required
                                maxLength={255}
                                className="mt-1"
                            />
                            {errors.thesis_title && (
                                <p className="mt-1 text-sm text-red-600" role="alert">
                                    {errors.thesis_title}
                                </p>
                            )}
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {attachments.map(([field, label]) => (
                                <div key={field} className="min-w-0">
                                    <label htmlFor={`${field}-${request.id}`} className="text-sm font-medium">
                                        {label} <span className="text-muted-foreground font-normal">(optional replacement)</span>
                                    </label>
                                    <p className="text-muted-foreground mt-1 text-xs break-all">
                                        Current: {request[field]?.split('/').pop() || 'No document attached'}
                                    </p>
                                    <Input
                                        type="file"
                                        id={`${field}-${request.id}`}
                                        accept={field === 'manuscript_proposal' ? '.pdf,.doc,.docx' : '.pdf,.doc,.docx,.jpg,.jpeg,.png'}
                                        className="mt-2 h-auto py-2"
                                        onChange={(event) => setFiles((previous) => ({ ...previous, [field]: event.target.files?.[0] }))}
                                    />
                                    {errors[field] && (
                                        <p className="mt-1 text-sm text-red-600" role="alert">
                                            {errors[field]}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div>
                            <label htmlFor={`correction-response-${request.id}`} className="text-sm font-medium">
                                What did you change? <span className="text-muted-foreground">(required)</span>
                            </label>
                            <Textarea
                                id={`correction-response-${request.id}`}
                                value={response}
                                onChange={(event) => setResponse(event.target.value)}
                                required
                                maxLength={5000}
                                rows={4}
                                placeholder="Explain how you addressed the reviewer's feedback."
                                className="mt-1"
                            />
                            {errors.student_response && (
                                <p className="mt-1 text-sm text-red-600" role="alert">
                                    {errors.student_response}
                                </p>
                            )}
                        </div>
                        {errors.form && (
                            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                                {errors.form}
                            </p>
                        )}
                        <Button type="submit" disabled={processing || !response.trim() || !title.trim()}>
                            {processing ? 'Submitting corrections…' : 'Resubmit corrections'}
                        </Button>
                    </fieldset>
                </form>
            )}
            <details className="rounded-lg border p-3">
                <summary className="cursor-pointer text-sm font-medium">Activity history {history.length > 0 ? `(${history.length})` : ''}</summary>
                {history.length ? (
                    <ol className="mt-3 space-y-4 border-l pl-4">
                        {[...history].reverse().map((entry, index) => (
                            <li key={`${entry.timestamp}-${index}`} className="text-sm">
                                <p className="font-medium">
                                    {entry.action === 'resubmitted'
                                        ? 'Corrections resubmitted'
                                        : readable(entry.to_state || entry.action || 'Request updated')}
                                </p>
                                <p className="text-muted-foreground mt-0.5 text-xs">
                                    {entry.user_name ? `${entry.user_name} · ` : ''}
                                    {entry.timestamp ? `${dateLabel(entry.timestamp)} (PH)` : 'Date not recorded'}
                                </p>
                                {(entry.comment || entry.student_response) && (
                                    <p className="mt-1 break-words whitespace-pre-wrap">{entry.comment || entry.student_response}</p>
                                )}
                            </li>
                        ))}
                    </ol>
                ) : (
                    <p className="text-muted-foreground mt-2 text-sm">No activity history has been recorded for this request yet.</p>
                )}
            </details>
        </section>
    );
}
