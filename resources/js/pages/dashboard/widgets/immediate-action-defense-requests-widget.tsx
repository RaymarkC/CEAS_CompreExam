import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, GraduationCap } from 'lucide-react';
import React from 'react';

// Local lightweight type (avoid depending on a missing or narrower global type)
type SimpleDefenseRequest = {
    id: number;
    thesis_title?: string;
    workflow_state?: string | null;
    created_at?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    school_id?: string | number | null;
};

type Props = {
    requests?: SimpleDefenseRequest[];
    loading?: boolean;
};

function needsActionState(wf?: string | null) {
    const v = (wf || '').toLowerCase();
    return v === 'submitted' || v === 'adviser-review';
}

const ImmediateActionDefenseRequestsWidget: React.FC<Props> = ({ requests = [], loading = false }) => {
    const actionable = requests
        .filter((r) => needsActionState(r.workflow_state))
        .sort((a, b) => {
            const at = a.created_at ? Date.parse(a.created_at) : 0;
            const bt = b.created_at ? Date.parse(b.created_at) : 0;
            return at - bt; // oldest first
        });

    const top = actionable.slice(0, 5);

    return (
        <div className="border-sidebar-border/70 dark:border-sidebar-border flex min-h-[220px] flex-1 flex-col rounded-xl border bg-white p-5 dark:bg-zinc-900">
            {loading ? (
                <div className="flex h-full flex-col gap-3">
                    <div className="mb-2 flex items-center justify-between">
                        <div>
                            <Skeleton className="mb-2 h-8 w-16 bg-gray-100" />
                            <Skeleton className="h-4 w-32 bg-gray-100" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-10 w-10 rounded-full bg-gray-100" />
                            <Skeleton className="h-6 w-6 rounded-full bg-gray-100" />
                        </div>
                    </div>
                    <Skeleton className="mb-2 h-4 w-full bg-gray-100" />
                    <div className="mt-2 flex flex-col gap-2">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <Skeleton className="h-5 w-3/4 bg-gray-100" />
                                <Skeleton className="h-5 w-16 bg-gray-100" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    <a
                        href="/all-defense-requirements"
                        className="group mb-2 flex cursor-pointer items-center justify-between select-none"
                        style={{ textDecoration: 'none' }}
                    >
                        <div>
                            <div className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Pending Defense Submissions</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center rounded-full bg-rose-500 p-2">
                                <GraduationCap className="size-6 text-white" />
                            </span>
                            <ChevronRight className="size-6 text-gray-400 transition-colors transition-transform duration-200 group-hover:translate-x-1 group-hover:text-rose-500" />
                        </div>
                    </a>
                    <hr className="my-2 border-gray-200 dark:border-gray-700" />
                    <div className="overflow-x-auto">
                        {top.length === 0 ? (
                            <div className="text-muted-foreground py-10 text-center text-xs">No immediate action requests.</div>
                        ) : (
                            <table className="w-full table-fixed text-xs">
                                <thead>
                                    <tr className="text-gray-500 dark:text-gray-400">
                                        <th className="w-2/5 py-1 pr-2 text-left">Thesis Title</th>
                                        <th className="w-1/5 px-2 py-1 text-left">Student</th>
                                        <th className="w-1/5 px-2 py-1 text-left">State</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {top.map((r, idx) => {
                                        const state = (r.workflow_state || 'submitted').replace(/-/g, ' ');
                                        const student =
                                            r.first_name || r.last_name ? `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim() : (r.school_id ?? '—');
                                        return (
                                            <tr
                                                key={r.id}
                                                className={` ${
                                                    idx % 2 === 0 ? 'bg-gray-50 dark:bg-zinc-800' : 'bg-white dark:bg-zinc-900'
                                                } hover:bg-rose-50 dark:hover:bg-rose-950`}
                                            >
                                                <td className="w-2/5 truncate py-2 pr-2 font-medium">
                                                    {r.thesis_title || <span className="text-gray-400">N/A</span>}
                                                </td>
                                                <td className="w-1/5 px-2 py-2">{student || <span className="text-gray-400">N/A</span>}</td>
                                                <td className="w-1/5 px-2 py-2">
                                                    <span className="inline-block rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700 capitalize dark:bg-rose-950 dark:text-rose-300">
                                                        {state}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                        {actionable.length > 5 && <span className="mt-2 inline-block text-xs text-rose-500">+{actionable.length - 5} more</span>}
                    </div>
                </>
            )}
        </div>
    );
};

export default ImmediateActionDefenseRequestsWidget;
