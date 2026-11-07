// Simple widget: shows ONLY the most recent/active submission (1 record), neutral styling.
import { Calendar, Check, ChevronRight, GraduationCap, Hourglass, Users, X } from 'lucide-react';
import React from 'react';

type RawDefenseRequest = {
    id: number;
    thesis_title: string;
    status?: string;
    normalized_status?: string;
    workflow_state?: string | null;
    created_at?: string | null;
};

type Props = {
    recentRequests?: RawDefenseRequest[];
    loading?: boolean;
    compact?: boolean; // Add compact prop for card style
};

const TERMINAL = new Set(['cancelled', 'adviser-rejected', 'coordinator-rejected', 'completed']);

type WorkflowInfo = { label: string; icon: React.ReactNode };

const WF_MAP: Record<string, WorkflowInfo> = {
    submitted: { label: 'Submitted', icon: <Hourglass className="h-4 w-4 text-gray-500" /> },
    'adviser-review': { label: 'Under Adviser Review', icon: <Hourglass className="h-4 w-4 text-gray-500" /> },
    'adviser-approved': { label: 'Approved by Adviser', icon: <Check className="h-4 w-4 text-gray-500" /> },
    'coordinator-review': { label: 'Coordinator Review', icon: <Hourglass className="h-4 w-4 text-gray-500" /> },
    'coordinator-approved': { label: 'Coordinator Approved', icon: <Check className="h-4 w-4 text-gray-500" /> },
    'panels-assigned': { label: 'Panels Assigned', icon: <Users className="h-4 w-4 text-gray-500" /> },
    scheduled: { label: 'Defense Scheduled', icon: <Calendar className="h-4 w-4 text-gray-500" /> },
    completed: { label: 'Defense Completed', icon: <GraduationCap className="h-4 w-4 text-gray-500" /> },
    'adviser-rejected': { label: 'Rejected (Adviser)', icon: <X className="h-4 w-4 text-gray-500" /> },
    'coordinator-rejected': { label: 'Rejected (Coordinator)', icon: <X className="h-4 w-4 text-gray-500" /> },
    cancelled: { label: 'Cancelled', icon: <X className="h-4 w-4 text-gray-500" /> },
};

function resolveWorkflowLabel(r: RawDefenseRequest): WorkflowInfo {
    const wf = (r.workflow_state || '').toLowerCase();
    if (wf && WF_MAP[wf]) return WF_MAP[wf];

    const status = (r.normalized_status || r.status || '').toLowerCase();
    if (status.includes('reject')) return { label: 'Rejected', icon: <X className="h-4 w-4 text-gray-500" /> };
    if (status.includes('approve')) return { label: 'Approved', icon: <Check className="h-4 w-4 text-gray-500" /> };
    if (status === 'cancelled') return { label: 'Cancelled', icon: <X className="h-4 w-4 text-gray-500" /> };
    return { label: 'Submitted', icon: <Hourglass className="h-4 w-4 text-gray-500" /> };
}

const DefenseStatusWidget: React.FC<Props> = ({ recentRequests = [], loading = false, compact = false }) => {
    const sorted = [...recentRequests].sort((a, b) => {
        const at = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bt = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bt - at;
    });

    const active = sorted.find((r) => !TERMINAL.has((r.workflow_state || '').toLowerCase())) || sorted[0];
    const list = active ? [active] : [];

    // --- COMPACT CARD STYLE (for dashboard metric row) ---
    if (compact) {
        const { label, icon } = list[0]
            ? resolveWorkflowLabel(list[0])
            : { label: 'No Submission', icon: <Hourglass className="h-4 w-4 text-rose-500" /> };
        return (
            <div
                className="col-span-1 flex h-[92px] min-h-0 flex-col justify-between rounded-xl border border-gray-200 bg-white p-0 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                style={{ minWidth: 0 }}
            >
                <div className="flex items-center justify-between px-5 pt-3 pb-0">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-200">Defense Status</div>
                    <a href="/defense-requirements" className="text-xs font-semibold text-gray-900 transition hover:text-rose-500 dark:text-white">
                        View More
                    </a>
                </div>
                <div className="flex items-end justify-between px-5 pt-1 pb-2">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-[1.1rem] font-bold text-gray-900 dark:text-white">
                                {icon}
                                {loading ? (
                                    <span className="inline-block h-5 w-16 animate-pulse rounded bg-gray-200 dark:bg-zinc-800" />
                                ) : (
                                    <span>{label}</span>
                                )}
                            </span>
                        </div>
                        <div className="mt-0.5 max-w-[140px] truncate text-xs leading-tight text-gray-400 italic dark:text-gray-500">
                            {list[0]?.thesis_title
                                ? list[0]?.thesis_title.length > 22
                                    ? list[0]?.thesis_title.slice(0, 22) + '…'
                                    : list[0]?.thesis_title
                                : 'Untitled Thesis'}
                        </div>
                    </div>
                    <div className="flex items-center justify-center rounded-full bg-gray-50 p-1.5 dark:bg-zinc-800">
                        <GraduationCap className="size-4 text-rose-500 dark:text-rose-400" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="border-sidebar-border/70 dark:border-sidebar-border flex min-h-[180px] flex-1 flex-col rounded-xl border bg-white p-5 dark:bg-zinc-900">
            <a
                href="/defense-requirements"
                className="group mb-4 flex items-center justify-between rounded-md focus:ring-2 focus:ring-rose-400/50 focus:outline-none"
            >
                <span className="flex flex-col">
                    <span className="text-base leading-tight font-semibold text-gray-800 md:text-lg dark:text-gray-100">Defense Submissions</span>
                    <span className="mt-0.5 text-[10px] leading-snug font-normal text-gray-500 dark:text-gray-400">
                        Showing your most recent active submission status
                    </span>
                </span>
                <div className="flex items-center gap-3">
                    <span className="hidden rounded-full bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-600 md:inline-block dark:bg-zinc-800 dark:text-gray-300">
                        {recentRequests.length} total
                    </span>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500 shadow-sm">
                        <GraduationCap className="h-7 w-7 text-white" />
                    </div>
                    <ChevronRight className="h-6 w-6 text-rose-400 transition-all duration-200 group-hover:translate-x-1 group-hover:text-rose-500" />
                </div>
            </a>

            <div className="flex-1">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="pb-2 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400">Thesis Title</th>
                            <th className="w-40 pb-2 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr className="animate-pulse">
                                <td className="py-2">
                                    <div className="h-3 w-48 rounded bg-gray-100 dark:bg-zinc-800" />
                                </td>
                                <td className="py-2">
                                    <div className="h-3 w-28 rounded bg-gray-100 dark:bg-zinc-800" />
                                </td>
                            </tr>
                        )}

                        {!loading && list.length === 0 && (
                            <tr>
                                <td className="py-3 text-[12px] text-gray-400 italic dark:text-gray-500">None</td>
                                <td className="flex items-center gap-1 py-3 text-[12px] text-gray-500">
                                    <Hourglass className="h-4 w-4" /> No Submission
                                </td>
                            </tr>
                        )}

                        {!loading &&
                            list.map((r) => {
                                const { label, icon } = resolveWorkflowLabel(r);
                                return (
                                    <tr
                                        key={r.id}
                                        onClick={() => {
                                            window.location.href = '/defense-requirements';
                                        }}
                                        className="cursor-pointer border-b border-gray-100 transition last:border-b-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-zinc-800/60"
                                    >
                                        <td className="py-2 pr-3">
                                            <span
                                                title={r.thesis_title}
                                                className="line-clamp-1 text-[12px] font-medium text-gray-700 dark:text-gray-200"
                                            >
                                                {r.thesis_title || <span className="text-gray-400 italic">Untitled</span>}
                                            </span>
                                            {r.created_at && (
                                                <div className="text-[10px] text-gray-400 dark:text-gray-500">
                                                    {new Date(r.created_at).toLocaleDateString()}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-2">
                                            <div className="flex items-center gap-1 text-[12px] font-medium text-gray-600 dark:text-gray-300">
                                                {icon}
                                                {label}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DefenseStatusWidget;
