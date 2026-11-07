import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { router } from '@inertiajs/react';
import { MessageSquare, RotateCcw } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import { toast } from 'sonner';

export type CorrectionDetails = {
    workflow_state?: string;
    correction_notes?: string | null;
    correction_stage?: string | null;
    correction_requested_at?: string | null;
    correction_count?: number;
};

export function isAwaitingCorrections(state?: string) {
    return state === 'adviser-corrections' || state === 'coordinator-corrections';
}

export function CorrectionsNotice({ request }: { request: CorrectionDetails }) {
    if (!isAwaitingCorrections(request.workflow_state)) return null;

    return (
        <section
            className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100"
            aria-label="Corrections requested"
        >
            <h2 className="flex items-center gap-2 font-semibold">
                <MessageSquare className="h-4 w-4" /> Awaiting student corrections
            </h2>
            <p className="mt-1 text-sm">The student must update and resubmit this request before review can continue.</p>
            {request.correction_notes && <p className="mt-3 text-sm break-words whitespace-pre-wrap">{request.correction_notes}</p>}
        </section>
    );
}

export function RequestCorrectionsButton({
    requestId,
    stage,
    disabled,
    onReturned,
}: {
    requestId: number;
    stage: 'adviser' | 'coordinator';
    disabled?: boolean;
    onReturned: (request: CorrectionDetails) => void;
}) {
    const [open, setOpen] = useState(false);
    const [notes, setNotes] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const notesId = useId();

    async function submit(event: FormEvent) {
        event.preventDefault();
        if (busy || !notes.trim()) return;
        setBusy(true);
        setError('');
        try {
            const response = await fetch(`/defense-requests/${requestId}/request-corrections`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '',
                },
                body: JSON.stringify({ stage, notes: notes.trim() }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(
                    data.errors?.notes?.[0] || data.message || data.error || 'Could not return this request. Please refresh and try again.',
                );
            }
            onReturned(data.request || { workflow_state: `${stage}-corrections`, correction_notes: notes.trim(), correction_stage: stage });
            setOpen(false);
            setNotes('');
            toast.success('Returned to the student for corrections.');
            router.reload({ only: ['defenseRequest', 'notifications', 'unreadCount'] });
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Could not connect. Please try again.');
        } finally {
            setBusy(false);
        }
    }

    return (
        <>
            <Button
                size="sm"
                variant="outline"
                disabled={disabled || busy}
                onClick={() => {
                    setError('');
                    setOpen(true);
                }}
            >
                <RotateCcw className="mr-1 h-4 w-4" /> Return for corrections
            </Button>
            <Dialog
                open={open}
                onOpenChange={(value) => {
                    if (!busy) setOpen(value);
                }}
            >
                <DialogContent showCloseButton={!busy}>
                    <DialogTitle>Return for corrections</DialogTitle>
                    <DialogDescription>
                        Explain what the student needs to change. They can update this same request and resubmit it to you.
                    </DialogDescription>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor={notesId} className="text-sm font-medium">
                                Required corrections
                            </label>
                            <textarea
                                id={notesId}
                                required
                                maxLength={5000}
                                rows={6}
                                disabled={busy}
                                value={notes}
                                onChange={(event) => setNotes(event.target.value)}
                                className="bg-background w-full rounded-md border p-3 text-sm"
                                placeholder="List the details or documents that need correction..."
                            />
                            <p className="text-muted-foreground text-xs">{notes.length}/5,000 characters</p>
                        </div>
                        {error && (
                            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                                {error}
                            </p>
                        )}
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="ghost" disabled={busy} onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={busy || !notes.trim()}>
                                {busy ? 'Returning...' : 'Send correction request'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
