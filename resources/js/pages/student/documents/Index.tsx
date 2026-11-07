import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { GraduationCap } from 'lucide-react';
import ShowAllDocuments from './show-all-documents';

type FileAttachment = {
    id: number;
    defense_title: string;
    field: string;
    label: string;
    filename: string;
    path: string;
    url: string;
    size: number | null;
    submitted_at?: string;
};

type PageProps = {
    files: FileAttachment[];
    auth: { user: { id: number; first_name: string; last_name: string; school_id: string } };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'My Documents', href: '/student/documents' },
];

export default function StudentDocumentsIndex() {
    const { props } = usePage<PageProps>();
    const { files } = props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Document Attachments" />
            <div className="flex w-full flex-col px-7 pt-5 pb-5">
                {/* Header */}
                <div className="mb-6 w-full overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex w-full flex-row items-center justify-between border-b border-zinc-200 p-6 dark:border-zinc-800">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-rose-500 bg-rose-500/10 dark:border-rose-700 dark:bg-rose-500/20">
                                <GraduationCap className="h-5 w-5 text-rose-400 dark:text-rose-300" />
                            </div>
                            <div>
                                <span className="text-base font-semibold dark:text-white">My Documents</span>
                                <p className="text-muted-foreground block text-xs dark:text-zinc-400">
                                    This section shows all your submitted document attachments for defense requirements.
                                </p>
                            </div>
                        </div>
                        {/* Toolbar/filter row placeholder */}
                    </div>
                    {/* <div className="p-4">Toolbar/Filters row (optional)</div> */}
                </div>
                {/* Cards grid OUTSIDE the header */}
                <ShowAllDocuments files={files} />
            </div>
        </AppLayout>
    );
}
