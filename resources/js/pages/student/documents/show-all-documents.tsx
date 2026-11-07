import { Button } from '@/components/ui/button';
import dayjs from 'dayjs';
import { Download, Eye, Paperclip } from 'lucide-react';

type FileAttachment = {
    id: number;
    defense_title: string;
    defense_type?: string; // <-- Add this
    field: string;
    label: string;
    filename: string;
    path: string;
    url: string;
    size: number | null;
    submitted_at?: string;
};

type Props = {
    files: FileAttachment[];
};

function formatLabel(label: string) {
    // Replace "Proposal" with "Manuscript" (case-insensitive)
    return label.replace(/proposal/i, 'Manuscript');
}

function getFileExtension(filename: string) {
    const match = filename.match(/\.([a-zA-Z0-9]+)$/);
    return match ? match[1].toUpperCase() : '';
}

// Helper to group files by thesis title
function groupBy<T>(arr: T[], key: (item: T) => string) {
    return arr.reduce(
        (acc, item) => {
            const k = key(item);
            if (!acc[k]) acc[k] = [];
            acc[k].push(item);
            return acc;
        },
        {} as Record<string, T[]>,
    );
}

export default function ShowAllDocuments({ files }: Props) {
    if (!files.length) {
        return <div className="text-muted-foreground text-center">No attachments submitted yet.</div>;
    }

    // Group files by thesis title
    const grouped = groupBy(files, (f) => f.defense_title);

    return (
        <div className="flex flex-col gap-10">
            {Object.entries(grouped).map(([title, groupFiles], idx) => (
                <div key={title}>
                    {/* Thesis Title and Defense Type Badge */}
                    <div className="mb-3 flex items-center gap-3">
                        <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">{title}</h2>
                        {/* Use the first file's defense_type as badge */}
                        {groupFiles[0].defense_type && (
                            <span className="rounded bg-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                {groupFiles[0].defense_type}
                            </span>
                        )}
                    </div>
                    {/* Cards Row */}
                    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {groupFiles.map((file, i) => (
                            <div
                                key={i}
                                className="group relative flex aspect-[0.85/1] min-h-[180px] flex-col justify-between overflow-hidden rounded-xl border border-zinc-200 bg-white transition-shadow hover:shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
                            >
                                <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute inset-0 z-10"
                                    title="View"
                                    tabIndex={0}
                                    aria-label={`View ${formatLabel(file.label)}`}
                                />
                                {/* Header */}
                                <div className="z-20 flex items-center justify-between border-b border-zinc-100 px-4 pt-4 pb-2 dark:border-zinc-800">
                                    <div className="flex min-w-0 flex-col">
                                        <div
                                            className="max-w-[120px] truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                                            title={formatLabel(file.label)}
                                        >
                                            {formatLabel(file.label)}
                                        </div>
                                        <div className="max-w-[120px] truncate text-xs text-zinc-500 dark:text-zinc-400" title={file.filename}>
                                            {file.filename}
                                        </div>
                                    </div>
                                    <Paperclip className="ml-2 h-5 w-5 flex-shrink-0 text-zinc-400" />
                                </div>
                                {/* Footer */}
                                <div className="relative z-20 mt-auto flex flex-col gap-1 border-t border-zinc-200 px-2 py-2 dark:border-zinc-700">
                                    <div className="flex items-center justify-between gap-1">
                                        <span className="rounded-lg bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-500 uppercase dark:bg-zinc-800 dark:text-zinc-300">
                                            {getFileExtension(file.filename)}
                                        </span>
                                        <div className="flex gap-1">
                                            <Button asChild variant="ghost" size="icon" className="text-zinc-500 hover:text-zinc-900" tabIndex={0}>
                                                <a
                                                    href={file.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title="View"
                                                    onClick={(e) => e.stopPropagation()}
                                                    tabIndex={0}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </a>
                                            </Button>
                                            <Button asChild variant="ghost" size="icon" className="text-zinc-500 hover:text-zinc-900" tabIndex={0}>
                                                <a
                                                    href={file.url}
                                                    download={file.filename}
                                                    title="Download"
                                                    onClick={(e) => e.stopPropagation()}
                                                    tabIndex={0}
                                                >
                                                    <Download className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="mt-1 text-right text-[10px] text-zinc-400">
                                        {file.submitted_at ? `Submitted ${dayjs(file.submitted_at).format('MMM D, YYYY h:mm A')}` : ''}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Separator between thesis sections */}
                    {idx < Object.entries(grouped).length - 1 && <hr className="my-8 border-zinc-300 dark:border-zinc-700" />}
                </div>
            ))}
        </div>
    );
}
