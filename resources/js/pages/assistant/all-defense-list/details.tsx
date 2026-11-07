import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Make sure this import exists
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { DefenseAttachments, WorkflowHistoryEntry } from '@/types/workflows';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { ArrowLeft, CheckCircle, CircleArrowLeft, Clock, FileText, Send, Signature, User, UserCheck, Users, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import PaymentValidationSection from './payment-validation';

type DefenseRequestDetails = {
    id: number;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    school_id?: string;
    program: string;
    thesis_title: string;
    defense_type: string;
    status?: string;
    priority?: string;
    workflow_state?: string;
    scheduled_date?: string;
    scheduled_time?: string;
    scheduled_end_time?: string;
    defense_mode?: string;
    defense_venue?: string;
    scheduling_notes?: string;
    adviser?: string;
    submitted_at?: string;
    panelists?: { id: number | null; name: string }[];
    defense_adviser?: string;
    defense_chairperson?: string;
    defense_panelist1?: string;
    defense_panelist2?: string;
    defense_panelist3?: string;
    defense_panelist4?: string;
    last_status_updated_by?: string;
    last_status_updated_by_name?: string;
    last_status_updated_at?: string;
    workflow_history?: WorkflowHistoryEntry[];
    reference_no?: string;
    attachments?: DefenseAttachments;
    amount?: number;
};

type Props = {
    id?: number;
    defenseRequest?: DefenseRequestDetails;
    onClose?: () => void;
};

function formatDate(d?: string) {
    if (!d) return '—';
    try {
        return format(new Date(d), 'PPP');
    } catch {
        return d;
    }
}

function formatTime12h(time?: string) {
    if (!time) return '';
    const [h, m] = (time || '').split(':');
    if (h === undefined || m === undefined) return time || '';
    const date = new Date();
    date.setHours(Number(h), Number(m));
    return format(date, 'hh:mm a');
}

function getInitials(user: { first_name?: string; last_name?: string }) {
    const first = user.first_name?.trim()?.[0] ?? '';
    const last = user.last_name?.trim()?.[0] ?? '';
    return (first + last).toUpperCase() || 'U';
}

export default function Details({ id, defenseRequest: initialDefenseRequest }: Props) {
    const [details, setDetails] = useState<DefenseRequestDetails | null>(initialDefenseRequest ?? null);
    const [, setLoading] = useState(!initialDefenseRequest);

    // Add tab state
    const [tab, setTab] = useState<'details' | 'payment'>('details');

    useEffect(() => {
        if (details) return; // Already hydrated from server
        if (!id) return;
        setLoading(true);
        fetch(`/api/defense-request/${id}`)
            .then((res) => res.json())
            .then((data) => {
                setDetails(data);
                setLoading(false);
            });
    }, [id, details]);

    // Breadcrumbs
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Defense Requests', href: '/assistant/all-defense-list' },
    ];
    if (details?.id) {
        const thesisForCrumb =
            (details.thesis_title?.length || 0) > 60 ? details.thesis_title.slice(0, 57) + '...' : details.thesis_title || `Request #${details.id}`;
        breadcrumbs.push({
            title: thesisForCrumb,
            href: `/assistant/all-defense-list/${details.id}/details`,
        });
    }

    // Helper for workflow history
    function resolveHistoryFields(item: WorkflowHistoryEntry) {
        const event = item.event_type || item.action || item.status_change || item.status || item.type || 'Event';
        const desc = item.description || item.details || item.note || item.notes || item.remarks || '';
        const from = item.from_state || item.from || item.previous_state;
        const to = item.to_state || item.to || item.new_state;
        const created = item.created_at || item.timestamp || item.performed_at || item.date || '';
        const userName = item.user_name || item.user?.name || item.actor_name || item.actor || item.performed_by_name || item.performed_by || '';
        return { event, desc, from, to, created, userName };
    }

    function formatReadableDate(d?: string) {
        if (!d) return '';
        try {
            return format(new Date(d), 'PPpp');
        } catch {
            return d;
        }
    }

    // Attachments (show all, including manuscript, similarity, avisee, etc.)
    function resolveFileUrl(url?: string | null) {
        if (!url) return null;
        if (/^https?:\/\//i.test(url) || url.startsWith('/storage/')) return url;
        return `/storage/${url.replace(/^\/?storage\//, '')}`;
    }
    const attachments = [
        { label: 'Adviser’s Endorsement', url: resolveFileUrl(details?.attachments?.advisers_endorsement) },
        { label: 'REC Endorsement', url: resolveFileUrl(details?.attachments?.rec_endorsement) },
        { label: 'Proof of Payment', url: resolveFileUrl(details?.attachments?.proof_of_payment) },
        { label: 'Manuscript', url: resolveFileUrl(details?.attachments?.manuscript_proposal) },
        { label: 'Similarity Index', url: resolveFileUrl(details?.attachments?.similarity_index) },
        { label: 'Avisee-Adviser File', url: resolveFileUrl(details?.attachments?.avisee_adviser_attachment) },
        { label: 'AI Detection Certificate', url: resolveFileUrl(details?.attachments?.ai_detection_certificate) },
        { label: 'Endorsement Form', url: resolveFileUrl(details?.attachments?.endorsement_form) },
    ];

    const sectionClass = 'rounded-lg border p-5 space-y-3';

    const workflowSteps = [
        {
            key: 'submitted',
            label: 'Submitted',
            icon: <Send className="h-5 w-5" />,
        },
        {
            key: 'adviser-approved',
            label: 'Endorsed by Adviser',
            icon: <UserCheck className="h-5 w-5" />,
        },
        {
            key: 'coordinator-approved',
            label: 'Approved by Coordinator',
            icon: <Signature className="h-5 w-5" />,
        },
        {
            key: 'rejected',
            label: 'Rejected by Coordinator',
            icon: <XCircle className="h-5 w-5" />,
        },
        {
            key: 'retrieved',
            label: 'Retrieved (Set to Pending)',
            icon: <CircleArrowLeft className="h-5 w-5" />,
        },
        {
            key: 'panels-assigned',
            label: 'Panels Assigned',
            icon: <User className="h-5 w-5" />,
        },
        {
            key: 'scheduled',
            label: 'Scheduled',
            icon: <Clock className="h-5 w-5" />,
        },
    ];

    function getStepForEvent(event: string) {
        event = (event || '').toLowerCase();
        if (event.includes('submit')) return 'submitted';
        if (event.includes('adviser')) return 'adviser-approved';
        if (event.includes('rejected')) return 'rejected';
        if (event.includes('retrieved')) return 'retrieved';
        if (event.includes('coordinator')) return 'coordinator-approved';
        if (event.includes('panel')) return 'panels-assigned';
        if (event.includes('schedule')) return 'scheduled';
        return '';
    }

    // Mark as Completed handler
    async function handleMarkCompleted() {
        if (!details) return;
        try {
            const res = await fetch(`/defense-requests/${details.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ status: 'Completed' }),
            });
            if (res.ok) {
                setDetails({ ...details, status: 'Completed', workflow_state: 'completed' });
                toast.success('Marked as Completed');
            } else {
                toast.error('Failed to mark as completed');
            }
        } catch {
            toast.error('Error marking as completed');
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={details?.thesis_title || `Defense Request #${details?.id ?? ''}`} />
            <div className="space-y-6 p-5">
                {/* Toolbar with Tabs */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => router.visit('/assistant/all-defense-list')} className="h-8 px-2">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        {/* Tabs beside back arrow */}
                        <Tabs value={tab} onValueChange={(v) => setTab(v as 'details' | 'payment')}>
                            <TabsList>
                                <TabsTrigger value="details">Details</TabsTrigger>
                                <TabsTrigger value="payment">Payment Validation</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                    {/* Only show if not completed */}
                    {details?.status !== 'Completed' && tab === 'details' && (
                        <Button size="sm" variant="outline" onClick={handleMarkCompleted} className="gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Mark as Completed
                        </Button>
                    )}
                </div>

                {/* Tab Content */}
                <div className="grid gap-8 md:grid-cols-3">
                    {/* Left: Tabbed content (summary cards) */}
                    <div className="space-y-6 md:col-span-2">
                        <Tabs value={tab} onValueChange={(v) => setTab(v as 'details' | 'payment')}>
                            <TabsContent value="details">
                                {/* Submission summary card */}
                                <div className="rounded-xl border bg-white p-8 dark:bg-zinc-900">
                                    {/* Thesis Title Header with Status */}
                                    <div className="mb-1 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <div className="text-2xl font-semibold">{details?.thesis_title}</div>
                                            <div className="text-muted-foreground mt-0.5 text-xs font-medium">Thesis Title</div>
                                        </div>
                                        <div className="flex flex-col gap-1 md:items-end">
                                            {/* Status */}
                                            {details?.status && (
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                                        details.status === 'Approved'
                                                            ? 'bg-green-100 text-green-600'
                                                            : details.status === 'Rejected'
                                                              ? 'bg-red-100 text-red-600'
                                                              : details.status === 'Pending'
                                                                ? 'bg-yellow-100 text-yellow-700'
                                                                : details.status === 'Completed'
                                                                  ? 'bg-gray-800 text-white'
                                                                  : 'bg-gray-100 text-gray-600'
                                                    }`}
                                                >
                                                    Status: {details.status}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {/* Info Grid */}
                                    <div className="mt-6 grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
                                        <div>
                                            <div className="text-muted-foreground mb-1 text-xs">Presenter</div>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="bg-zinc-200 text-base font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                                                        {getInitials(details!)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="text-sm leading-tight font-medium">
                                                        {details?.first_name} {details?.middle_name ? `${details.middle_name} ` : ''}
                                                        {details?.last_name}
                                                    </div>
                                                    {details?.school_id && (
                                                        <div className="text-muted-foreground mt-0.5 text-xs">{details.school_id}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground mb-1 text-xs">Program</div>
                                            <div className="text-sm font-medium">{details?.program}</div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground mb-1 text-xs">Defense Type</div>
                                            <Badge variant="secondary" className="text-xs font-medium">
                                                {details?.defense_type ?? '—'}
                                            </Badge>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground mb-1 text-xs">Scheduled Date</div>
                                            <div className="text-sm font-medium">{formatDate(details?.scheduled_date)}</div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground mb-1 text-xs">Time</div>
                                            <div className="text-sm font-medium">
                                                {details?.scheduled_time
                                                    ? `${formatTime12h(details.scheduled_time)}${details.scheduled_end_time ? ' - ' + formatTime12h(details.scheduled_end_time) : ''}`
                                                    : '—'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground mb-1 text-xs">Venue</div>
                                            <div className="text-sm font-medium">{details?.defense_venue || '—'}</div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground mb-1 text-xs">Mode</div>
                                            <div className="text-sm font-medium">
                                                {details?.defense_mode ? (details.defense_mode === 'face-to-face' ? 'Face-to-Face' : 'Online') : '—'}
                                            </div>
                                        </div>
                                        <div className="md:col-span-2">
                                            <div className="text-muted-foreground mb-1 text-xs">Notes</div>
                                            <div className="text-sm font-medium">{details?.scheduling_notes || '—'}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Committee (read-only summary) */}
                                <div className={sectionClass}>
                                    <h2 className="flex items-center gap-2 text-sm font-semibold">
                                        <Users className="h-4 w-4" /> Committee
                                    </h2>
                                    <Separator />
                                    <div className="grid gap-4 text-sm md:grid-cols-2">
                                        <div>
                                            <div className="text-muted-foreground text-[11px] tracking-wide uppercase">Adviser</div>
                                            <div className="font-medium">{details?.defense_adviser || details?.adviser || '—'}</div>
                                        </div>
                                        {[
                                            {
                                                label: 'Chairperson',
                                                v: details?.defense_chairperson,
                                            },
                                            {
                                                label: 'Panelist 1',
                                                v: details?.defense_panelist1,
                                            },
                                            {
                                                label: 'Panelist 2',
                                                v: details?.defense_panelist2,
                                            },
                                            {
                                                label: 'Panelist 3',
                                                v: details?.defense_panelist3,
                                            },
                                            {
                                                label: 'Panelist 4',
                                                v: details?.defense_panelist4,
                                            },
                                        ].map((r) => (
                                            <div key={r.label}>
                                                <div className="text-muted-foreground text-[11px] tracking-wide uppercase">{r.label}</div>
                                                <div className="font-medium">{r.v || '—'}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Attachments */}
                                <div className={sectionClass}>
                                    <h2 className="flex items-center gap-2 text-sm font-semibold">
                                        <FileText className="h-4 w-4" /> Attachments
                                    </h2>
                                    <Separator />
                                    <div className="space-y-2 text-sm">
                                        {attachments.filter((a) => !!a.url).length === 0 && (
                                            <p className="text-muted-foreground text-sm">No attachments.</p>
                                        )}
                                        {attachments
                                            .filter((a) => !!a.url)
                                            .map((a) => (
                                                <a
                                                    key={a.label}
                                                    href={a.url!}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="hover:bg-muted flex items-center gap-2 rounded-md border bg-white px-3 py-2 transition dark:bg-zinc-900"
                                                >
                                                    <FileText className="h-4 w-4" />
                                                    <span className="font-medium">{a.label}</span>
                                                    <span className="text-muted-foreground ml-auto max-w-[180px] truncate text-xs">
                                                        {a.url?.split('/').pop()}
                                                    </span>
                                                </a>
                                            ))}
                                        {/* Reference No. as plain text if present */}
                                        {details?.reference_no && (
                                            <div className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 dark:bg-zinc-900">
                                                <FileText className="h-4 w-4" />
                                                <span className="font-medium">Reference No.</span>
                                                <span className="ml-auto text-xs">{details.reference_no}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="text-muted-foreground mt-4 text-[11px]">
                                    Last updated by: {details?.last_status_updated_by_name || details?.last_status_updated_by || '—'}{' '}
                                    {details?.last_status_updated_at ? `(${details.last_status_updated_at})` : ''}
                                </div>
                            </TabsContent>
                            <TabsContent value="payment">
                                <PaymentValidationSection details={details!} resolveFileUrl={resolveFileUrl} />
                            </TabsContent>
                        </Tabs>
                    </div>
                    {/* Sidebar: Workflow Progress (always shown) */}
                    <div className="w-full flex-shrink-0 md:w-[340px]">
                        <div className="rounded-xl border bg-white p-5 dark:bg-zinc-900">
                            <h2 className="mb-8 flex items-center gap-2 text-xs font-semibold">
                                <Clock className="h-4 w-4" /> Workflow Progress
                            </h2>
                            <div className="relative flex flex-col gap-0">
                                {Array.isArray(details?.workflow_history) && details.workflow_history.length > 0 ? (
                                    details.workflow_history.map((item, idx: number) => {
                                        const { event, created, userName } = resolveHistoryFields(item);
                                        const stepKey = getStepForEvent(event);
                                        const step = workflowSteps.find((s) => s.key === stepKey) || {
                                            label: event.charAt(0).toUpperCase() + event.slice(1),
                                            icon: <Clock className="h-5 w-5 text-gray-500" />,
                                        };
                                        const isLast = idx === details.workflow_history!.length - 1;
                                        const iconBoxColor = 'bg-gray-100 text-gray-500';
                                        return (
                                            <div key={idx} className="relative flex items-start gap-3">
                                                <div className="flex flex-col items-center">
                                                    <div className={`flex h-9 w-9 items-center justify-center rounded-md ${iconBoxColor}`}>
                                                        {step.icon}
                                                    </div>
                                                    {!isLast && (
                                                        <div className="mx-auto h-8 border-l-2 border-dotted border-gray-300 dark:border-zinc-700"></div>
                                                    )}
                                                </div>
                                                <div className="pb-4">
                                                    <div className="text-xs font-semibold">{step.label}</div>
                                                    <div className="text-muted-foreground text-[11px]">
                                                        {userName && <span>{userName}</span>}
                                                        {created && <span> &middot; {formatReadableDate(created)}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-muted-foreground text-xs">No workflow history yet.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
