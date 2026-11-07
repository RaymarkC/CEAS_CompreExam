import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import ShowAllRequests from './show-all-requests';
import type { DefenseRequestSummary } from './table-all-defense-list';

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Defense Requests', href: '/assistant/all-defense-list' },
];

export default function AssistantAllDefenseListPage() {
    const [defenseRequests, setDefenseRequests] = useState<DefenseRequestSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch('/defense-requests', { headers: { Accept: 'application/json' } })
            .then((res) => res.json())
            .then((data) => {
                setDefenseRequests(Array.isArray(data) ? data : data.defenseRequests || []);
                setLoading(false);
            });
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Defense Requests" />
            <div className="flex min-h-[90vh] w-full flex-1 flex-col gap-4">
                <div className="flex min-h-0 w-full flex-col overflow-x-hidden">
                    {/* Skeleton loader copied from coordinator-dashboard */}
                    {loading ? (
                        <div className="m-0 flex min-h-[70vh] w-full flex-col gap-4 bg-zinc-100 p-0 dark:bg-zinc-900">
                            {/* Top short row */}
                            <div className="mx-8 mt-8 h-6 w-1/6 animate-pulse rounded bg-zinc-300 dark:bg-zinc-800" />
                            {/* Main rows */}
                            <div className="mx-8 h-12 w-3/4 animate-pulse rounded bg-zinc-300 dark:bg-zinc-800" />
                            <div className="mx-8 h-12 w-2/3 animate-pulse rounded bg-zinc-300 dark:bg-zinc-800" />
                            {/* Big rectangle for dashboard body */}
                            <div className="mt-4 h-[500px] w-full animate-pulse rounded bg-zinc-300 dark:bg-zinc-800" />
                        </div>
                    ) : (
                        <ShowAllRequests defenseRequests={defenseRequests} withLayout={false} />
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
