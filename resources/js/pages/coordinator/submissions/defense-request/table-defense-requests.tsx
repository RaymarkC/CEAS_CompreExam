import { isAwaitingCorrections } from '@/components/defense-request-corrections';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { router } from '@inertiajs/react';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

export type DefenseRequestSummary = {
    id: number;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    program: string;
    thesis_title: string;
    date_of_defense?: string;
    scheduled_date?: string | null;
    defense_type: string;
    mode_defense?: string;
    defense_mode?: string;
    status: 'Pending' | 'In progress' | 'Approved' | 'Rejected' | 'Needs-info';
    priority: 'Low' | 'Medium' | 'High';
    last_status_updated_by?: string;
    last_status_updated_at?: string;
    workflow_state?: string;
    adviser?: string;
};

export type TableDefenseRequestsProps = {
    paged: DefenseRequestSummary[];
    columns: Record<string, boolean>;
    selected: number[];
    toggleSelectOne: (id: number) => void;
    headerChecked: boolean;
    toggleSelectAll: () => void;
    toggleSort: () => void;
    sortDir: 'asc' | 'desc' | null | undefined;
    onPriorityChange: (id: number, priority: string) => Promise<void>;
    tabType?: 'pending' | 'rejected' | 'approved';
    onViewDetails?: (id: number) => void;
    onRowApprove?: (id: number) => void;
    onRowReject?: (id: number) => void;
    onRowRetrieve?: (id: number) => void;
    highlightMissingDateMode?: boolean;
    hideActions?: boolean;
    hideSelect?: boolean;
};

export default function TableDefenseRequests({
    paged,
    columns,
    selected,
    toggleSelectOne,
    headerChecked,
    toggleSelectAll,
    onViewDetails,
    hideSelect,
}: TableDefenseRequestsProps) {
    return (
        <div className="relative w-full">
            <div className="border-border bg-background overflow-x-auto rounded-md border">
                <Table className="w-full table-auto text-sm">
                    <TableHeader>
                        <TableRow>
                            {!hideSelect && (
                                <TableHead className="w-[40px] py-2">
                                    <Checkbox checked={headerChecked} onCheckedChange={toggleSelectAll} />
                                </TableHead>
                            )}
                            {columns.title && <TableHead className="min-w-[180px] px-3">Thesis Title</TableHead>}
                            {columns.presenter && <TableHead className="min-w-[120px] px-2">Presenter</TableHead>}
                            {columns.adviser && <TableHead className="min-w-[120px] px-2">Adviser</TableHead>}
                            {columns.program && <TableHead className="min-w-[100px] px-2">Program</TableHead>}
                            {columns.status && <TableHead className="min-w-[100px] px-2 text-center">Status</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paged.map((r) => {
                            const isSelected = selected.includes(r.id);
                            const handleRowClick = (e: React.MouseEvent) => {
                                const tag = (e.target as HTMLElement).tagName;
                                if (
                                    tag === 'BUTTON' ||
                                    tag === 'INPUT' ||
                                    tag === 'SELECT' ||
                                    (e.target as HTMLElement).closest('.action-btn') ||
                                    (e.target as HTMLElement).closest('.priority-dropdown')
                                ) {
                                    return;
                                }
                                if (onViewDetails) onViewDetails(r.id);
                                else router.visit(`/coordinator/defense-requests/${r.id}/details`);
                            };

                            return (
                                <TableRow key={r.id} className="hover:bg-muted/40 cursor-pointer" onClick={handleRowClick}>
                                    {!hideSelect && (
                                        <TableCell className="px-2 py-2">
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => toggleSelectOne(r.id)}
                                                className="action-btn"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </TableCell>
                                    )}
                                    {columns.title && (
                                        <TableCell className="truncate px-3 py-2 align-middle leading-tight font-medium" title={r.thesis_title}>
                                            {/* Type badge before title */}
                                            <Badge variant="outline" className="mr-2">
                                                {r.defense_type || '—'}
                                            </Badge>
                                            {r.thesis_title}
                                        </TableCell>
                                    )}
                                    {columns.presenter && (
                                        <TableCell
                                            className="text-muted-foreground px-2 py-2 align-middle text-xs whitespace-nowrap"
                                            title={`${r.first_name} ${r.middle_name ? r.middle_name + ' ' : ''}${r.last_name}`}
                                        >
                                            {r.first_name} {r.middle_name ? r.middle_name[0] + '. ' : ''}
                                            {r.last_name}
                                        </TableCell>
                                    )}
                                    {columns.adviser && (
                                        <TableCell className="text-muted-foreground px-2 py-2 align-middle text-xs whitespace-nowrap">
                                            {r.adviser || '—'}
                                        </TableCell>
                                    )}
                                    {columns.program && (
                                        <TableCell className="text-muted-foreground px-2 py-2 align-middle text-xs whitespace-nowrap">
                                            {r.program || '—'}
                                        </TableCell>
                                    )}
                                    {columns.status && (
                                        <TableCell className="px-2 py-2 text-center align-middle text-xs whitespace-nowrap">
                                            <Badge
                                                className={
                                                    r.status === 'Approved'
                                                        ? 'flex items-center gap-1 border-green-200 bg-green-100 text-green-700'
                                                        : r.status === 'Rejected'
                                                          ? 'flex items-center gap-1 border-red-200 bg-red-100 text-red-700'
                                                          : r.status === 'Pending'
                                                            ? 'flex items-center gap-1 border-yellow-200 bg-yellow-100 text-yellow-700'
                                                            : r.status === 'Needs-info'
                                                              ? 'flex items-center gap-1 border-blue-200 bg-blue-100 text-blue-700'
                                                              : r.status === 'In progress'
                                                                ? 'flex items-center gap-1 border-purple-200 bg-purple-100 text-purple-700'
                                                                : 'flex items-center gap-1 border-gray-200 bg-gray-100 text-gray-700'
                                                }
                                            >
                                                {r.status === 'Approved' && <CheckCircle size={14} className="mr-1" />}
                                                {r.status === 'Rejected' && <XCircle size={14} className="mr-1" />}
                                                {r.status === 'Pending' && <Clock size={14} className="mr-1" />}
                                                {isAwaitingCorrections(r.workflow_state) ? 'Awaiting corrections' : r.status}
                                            </Badge>
                                        </TableCell>
                                    )}
                                </TableRow>
                            );
                        })}
                        {paged.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={
                                        (hideSelect ? 0 : 1) +
                                        (columns.title ? 1 : 0) +
                                        (columns.presenter ? 1 : 0) +
                                        (columns.adviser ? 1 : 0) +
                                        (columns.program ? 1 : 0) +
                                        (columns.status ? 1 : 0)
                                    }
                                    className="text-muted-foreground py-10 text-center"
                                >
                                    No requests found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
