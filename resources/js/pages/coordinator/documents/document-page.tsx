import { DocumentGeneratorDialog } from '@/components/DocumentGeneratorDialog';
import type { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

export default function DocumentPage() {
    // You should fetch or receive the defenseRequest data here
    // For demo, use a placeholder or get from props
    const { props } = usePage<SharedData & { defenseRequest: { id: number } | null }>();
    const defenseRequest = props.defenseRequest;

    return <DocumentGeneratorDialog open={true} onOpenChange={() => {}} defenseRequest={defenseRequest} asPage />;
}
