import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getProgramAbbreviation } from '@/utils/program-abbreviations';
import { router } from '@inertiajs/react';
import { CircleCheck, X } from 'lucide-react'; // <-- Add CircleCheck
import { useState } from 'react';

export type DefenseRequestSummary = {
    id: number;
    aa_verification_id?: number | null;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    program: string;
    thesis_title: string;
    date_of_defense?: string;
    scheduled_date?: string;
    defense_type: string;
    mode_defense?: string;
    defense_mode?: string;
    status: string;
    priority: string;
    last_status_updated_by?: string;
    last_status_updated_at?: string;
    workflow_state?: string;
    adviser?: string;
    submitted_at?: string;
    panelists?: unknown[];
    expected_rate?: number | null;
    amount?: number | null;
    reference_no?: string | null;
    coordinator?: string | null;
    aa_verification_status?: 'pending' | 'verified' | 'rejected';
};

export type TableAllDefenseListProps = {
    paged: DefenseRequestSummary[];
    setPaged: React.Dispatch<React.SetStateAction<DefenseRequestSummary[]>>;
    columns: Record<string, boolean>;
    selected: number[];
    toggleSelectOne: (id: number) => void;
    headerChecked: boolean;
    toggleSelectAll: () => void;
    toggleSort: () => void;
    sortDir: 'asc' | 'desc' | null | undefined;
    onPriorityChange: (id: number, priority: string) => Promise<void>;
    onViewDetails?: (id: number) => void;
    onRowApprove?: (id: number) => void;
    onRowReject?: (id: number) => void;
    onRowRetrieve?: (id: number) => void;
    highlightMissingDateMode?: boolean;
    hideActions?: boolean;
    hideSelect?: boolean;
    isSidebarCollapsed?: boolean;
    sidebarWidth?: number;
    totalCount?: number;
};

function getAaStatusBadge(status?: 'pending' | 'verified' | 'rejected') {
    if (status === 'verified') {
        return <Badge className="border-green-200 bg-green-100 text-green-700">Verified</Badge>;
    }
    if (status === 'rejected') {
        return <Badge className="border-red-200 bg-red-100 text-red-700">Rejected</Badge>;
    }
    return <Badge className="border-yellow-200 bg-yellow-100 text-yellow-700">Pending</Badge>;
}

export default function TableAllDefenseList({
    paged,
    setPaged,
    columns,
    selected,
    toggleSelectOne,
    headerChecked,
    toggleSelectAll,
    onViewDetails,
    hideSelect,
}: TableAllDefenseListProps) {
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        ids: number[];
        action: 'verified' | 'rejected' | null;
    }>({ open: false, ids: [], action: null });

    const [isLoading, setIsLoading] = useState(false);

    return (
        <div className="bg-background box-border w-full max-w-full overflow-x-auto rounded-md border border-zinc-200 transition-all duration-200">
            <div className="min-w-full">
                <Table className="w-full table-auto text-sm">
                    <TableHeader>
                        <TableRow>
                            {!hideSelect && (
                                <TableHead
                                    className="bg-background sticky left-0 z-20 w-[56px] py-2"
                                    style={{
                                        boxShadow: '2px 0 4px -2px rgba(0,0,0,0.04)',
                                        paddingLeft: '12px',
                                        paddingRight: '12px',
                                    }}
                                >
                                    <Checkbox checked={headerChecked} onCheckedChange={toggleSelectAll} />
                                </TableHead>
                            )}
                            {columns.title && <TableHead className="min-w-[180px] px-3">Thesis Title</TableHead>}
                            {columns.presenter && <TableHead className="min-w-[120px] px-2">Presenter</TableHead>}
                            {columns.adviser && <TableHead className="min-w-[120px] px-2">Adviser</TableHead>}
                            {columns.submitted_at && <TableHead className="min-w-[120px] px-2">Submitted At</TableHead>}
                            {columns.program && <TableHead className="min-w-[100px] px-2">Program</TableHead>}
                            {columns.coordinator && <TableHead className="min-w-[140px] px-2">Program Coordinator</TableHead>}
                            {columns.scheduled_date && <TableHead className="min-w-[120px] px-2">Scheduled Date</TableHead>}
                            {columns.expected_amount && <TableHead className="min-w-[120px] px-2">Expected Amount</TableHead>}
                            {columns.amount_paid && <TableHead className="min-w-[120px] px-2">Amount Paid</TableHead>}
                            {columns.reference_no && <TableHead className="min-w-[120px] px-2">Reference/OR No.</TableHead>}
                            {columns.priority && <TableHead className="min-w-[80px] px-2">Priority</TableHead>}
                            {columns.status && <TableHead className="min-w-[100px] px-2 text-center">AA Status</TableHead>}
                            {columns.actions && (
                                <TableHead
                                    className="bg-background sticky right-0 z-20 min-w-[80px] px-2 text-center"
                                    style={{ boxShadow: '-2px 0 4px -2px rgba(0,0,0,0.04)' }}
                                >
                                    Actions
                                </TableHead>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paged.map((r) => {
                            const isSelected = selected?.includes(r.id);
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
                                else router.visit(`/assistant/all-defense-list/${r.id}/details`);
                            };

                            return (
                                <TableRow key={r.id} className="hover:bg-muted/40 cursor-pointer" onClick={handleRowClick}>
                                    {!hideSelect && (
                                        <TableCell
                                            className="bg-background sticky left-0 z-10 px-3 py-2"
                                            style={{
                                                boxShadow: '2px 0 4px -2px rgba(0,0,0,0.04)',
                                                paddingLeft: '12px',
                                                paddingRight: '12px',
                                            }}
                                        >
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => toggleSelectOne(r.id)}
                                                className="action-btn"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </TableCell>
                                    )}
                                    {columns.title && (
                                        <TableCell
                                            className="flex items-center gap-2 truncate px-3 py-2 align-middle leading-tight font-medium"
                                            title={r.thesis_title}
                                        >
                                            <Badge variant="outline" className="shrink-0">
                                                {r.defense_type || '—'}
                                            </Badge>
                                            <span className="truncate">
                                                {r.thesis_title && r.thesis_title.length > 32 ? r.thesis_title.slice(0, 32) + '…' : r.thesis_title}
                                            </span>
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
                                    {columns.submitted_at && (
                                        <TableCell className="text-muted-foreground px-2 py-2 align-middle text-xs whitespace-nowrap">
                                            {r.submitted_at
                                                ? (() => {
                                                      try {
                                                          const d = new Date(r.submitted_at);
                                                          return d.toLocaleString('en-US', {
                                                              year: 'numeric',
                                                              month: 'short',
                                                              day: 'numeric',
                                                              hour: '2-digit',
                                                              minute: '2-digit',
                                                          });
                                                      } catch {
                                                          return r.submitted_at;
                                                      }
                                                  })()
                                                : '—'}
                                        </TableCell>
                                    )}
                                    {columns.program && (
                                        <TableCell
                                            className="text-muted-foreground px-2 py-2 align-middle text-xs whitespace-nowrap"
                                            title={r.program || '—'}
                                        >
                                            {getProgramAbbreviation(r.program || '—')}
                                        </TableCell>
                                    )}
                                    {columns.coordinator && (
                                        <TableCell className="text-muted-foreground px-2 py-2 align-middle text-xs whitespace-nowrap">
                                            {r.coordinator || '—'}
                                        </TableCell>
                                    )}
                                    {columns.scheduled_date && (
                                        <TableCell className="text-muted-foreground px-2 py-2 align-middle text-xs whitespace-nowrap">
                                            {r.scheduled_date
                                                ? new Date(r.scheduled_date).toLocaleDateString('en-US', {
                                                      year: 'numeric',
                                                      month: 'short',
                                                      day: 'numeric',
                                                  })
                                                : '—'}
                                        </TableCell>
                                    )}
                                    {columns.expected_amount && (
                                        <TableCell className="text-muted-foreground px-2 py-2 align-middle text-xs whitespace-nowrap">
                                            {r.expected_rate != null
                                                ? `₱${Number(r.expected_rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                                : '—'}
                                        </TableCell>
                                    )}
                                    {columns.amount_paid && (
                                        <TableCell className="text-muted-foreground px-2 py-2 align-middle text-xs whitespace-nowrap">
                                            {r.amount != null ? `₱${Number(r.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                                        </TableCell>
                                    )}
                                    {columns.reference_no && (
                                        <TableCell className="text-muted-foreground px-2 py-2 align-middle text-xs whitespace-nowrap">
                                            {r.reference_no || '—'}
                                        </TableCell>
                                    )}
                                    {columns.priority && (
                                        <TableCell className="text-muted-foreground px-2 py-2 align-middle text-xs whitespace-nowrap">
                                            {r.priority}
                                        </TableCell>
                                    )}
                                    {columns.status && (
                                        <TableCell className="px-2 py-2 text-center align-middle text-xs whitespace-nowrap">
                                            {getAaStatusBadge(r.aa_verification_status)}
                                        </TableCell>
                                    )}
                                    {columns.actions && (
                                        <TableCell
                                            className="bg-background sticky right-0 z-10 px-2 py-2 text-center align-middle text-xs"
                                            style={{ boxShadow: '-2px 0 4px -2px rgba(0,0,0,0.04)' }}
                                        >
                                            {/* Approve button with CircleCheck icon */}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="action-btn ml-1"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (r.aa_verification_id)
                                                        setConfirmDialog({ open: true, ids: [r.aa_verification_id], action: 'verified' });
                                                }}
                                                disabled={r.aa_verification_status === 'verified'}
                                            >
                                                <CircleCheck className="h-4 w-4 text-emerald-600" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="action-btn ml-1"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (r.aa_verification_id)
                                                        setConfirmDialog({ open: true, ids: [r.aa_verification_id], action: 'rejected' });
                                                }}
                                                disabled={r.aa_verification_status === 'rejected'}
                                            >
                                                <X className="h-4 w-4 text-red-600" />
                                            </Button>
                                        </TableCell>
                                    )}
                                </TableRow>
                            );
                        })}
                        {paged.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={Object.keys(columns).length + (hideSelect ? 0 : 1)}
                                    className="text-muted-foreground py-32 text-center text-sm"
                                >
                                    no results
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            {/* Centralized Confirm Dialog */}
            <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog((d) => ({ ...d, open }))}>
                <DialogContent>
                    <DialogTitle>Confirm Status Change</DialogTitle>
                    <DialogDescription>
                        {confirmDialog.ids.length > 1
                            ? `Are you sure you want to set ${confirmDialog.ids.length} requests to ${confirmDialog.action}?`
                            : `Are you sure you want to set this request to ${confirmDialog.action}?`}
                    </DialogDescription>
                    <div className="mt-4 flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setConfirmDialog({ open: false, ids: [], action: null })}>
                            Cancel
                        </Button>
                        <Button
                            disabled={isLoading}
                            onClick={async () => {
                                setIsLoading(true);
                                let res;
                                if (confirmDialog.ids.length === 1) {
                                    res = await fetch(`/aa/payment-verifications/${confirmDialog.ids[0]}/status`, {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                                        },
                                        body: JSON.stringify({ status: confirmDialog.action }),
                                    });
                                } else {
                                    res = await fetch(`/aa/payment-verifications/bulk-update`, {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                                        },
                                        body: JSON.stringify({
                                            verification_ids: confirmDialog.ids,
                                            status: confirmDialog.action,
                                        }),
                                    });
                                }
                                setIsLoading(false);
                                setConfirmDialog({ open: false, ids: [], action: null });
                                if (res.ok && setPaged) {
                                    setPaged((prev) =>
                                        prev.map((row) =>
                                            confirmDialog.ids.includes(row.aa_verification_id ?? -1)
                                                ? ({ ...row, aa_verification_status: confirmDialog.action } as DefenseRequestSummary)
                                                : row,
                                        ),
                                    );
                                } else {
                                    alert('Failed to update status. Please try again.');
                                }
                            }}
                        >
                            Confirm
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
