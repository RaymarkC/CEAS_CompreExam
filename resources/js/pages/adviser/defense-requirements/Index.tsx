import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import ShowAllDefenseRequests from './show-all-defense-requests';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'All Defense Requests', href: '/all-defense-requirements' },
];

// Helper to map workflow_state to status label
function getStatus(workflow_state: string) {
    if (['adviser-approved'].includes(workflow_state)) return 'Approved';
    if (['adviser-rejected', 'coordinator-rejected'].includes(workflow_state)) return 'Rejected';
    // All others are considered Pending
    return 'Pending';
}

export default function Index({
    defenseRequests,
    coordinator, // <-- accept coordinator prop
}: {
    defenseRequirements: React.ComponentProps<typeof ShowAllDefenseRequests>['defenseRequests'];
    defenseRequests: React.ComponentProps<typeof ShowAllDefenseRequests>['defenseRequests'];
    coordinator?: { name: string; email: string } | null;
}) {
    // Attach status for display
    const allRequests = (defenseRequests || []).map((r) => ({
        ...r,
        status: getStatus(r.workflow_state),
    }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="All Defense Requests" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-auto rounded-xl pt-5 pl-7">
                <ShowAllDefenseRequests
                    defenseRequests={allRequests}
                    coordinator={coordinator} // <-- pass coordinator prop
                    title="Defense Requests"
                    description="Defense requests submitted by your students. Review and manage their submissions here."
                />
            </div>
        </AppLayout>
    );
}
