'use client';

import { isAwaitingCorrections } from '@/components/defense-request-corrections';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getProgramAbbreviation } from '@/utils/program-abbreviations';
import { router } from '@inertiajs/react';
import axios from 'axios';
import dayjs from 'dayjs';
import { CheckCircle, CircleArrowLeft, CirclePlus, File, Paperclip, Printer, Search, Trash2, X, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type DefenseRequest = {
    id: number;
    first_name: string;
    middle_name?: string;
    last_name: string;
    thesis_title: string;
    defense_type: string;
    workflow_state: string;
    created_at?: string;
    program: string;
    school_id: string;
    defense_adviser: string;
    manuscript_proposal?: string;
    similarity_index?: string;
    rec_endorsement?: string;
    proof_of_payment?: string;
    advisers_endorsement?: string;
    reference_no?: string;
    priority?: string;
    adviser_status?: string;
    coordinator_status?: string;
};

function getDisplayName(req: DefenseRequest) {
    const middleInitial = req.middle_name ? `${req.middle_name[0].toUpperCase()}. ` : '';
    return `${req.first_name} ${middleInitial}${req.last_name}`;
}

function AttachmentLinks(req: DefenseRequest) {
    const files = [
        { key: 'manuscript_proposal', label: 'Manuscript' },
        { key: 'similarity_index', label: 'Similarity' },
        { key: 'rec_endorsement', label: 'REC Endorsement' },
        { key: 'proof_of_payment', label: 'Proof of Payment' },
        { key: 'advisers_endorsement', label: 'Adviser Endorsement' },
        { key: 'avisee_adviser_attachment', label: 'Avisee-Adviser File' },
    ];
    return (
        <TooltipProvider>
            <div className="flex gap-1">
                {files.map((f) =>
                    req[f.key as keyof DefenseRequest] ? (
                        <Tooltip key={f.key}>
                            <TooltipTrigger asChild>
                                <a
                                    href={`/storage/${req[f.key as keyof DefenseRequest]}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <span className="inline-flex h-7 w-7 items-center justify-center rounded bg-rose-500 transition-colors hover:bg-rose-600">
                                        <Paperclip className="h-4 w-4 text-white" />
                                    </span>
                                </a>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="border-none bg-black text-xs text-white shadow-lg">
                                {f.label}
                            </TooltipContent>
                        </Tooltip>
                    ) : null,
                )}
            </div>
        </TooltipProvider>
    );
}

type Coordinator = {
    name: string;
    email: string;
};

export default function ShowAllDefenseRequests({
    defenseRequests = [],
    coordinator,
    title = 'All Defense Requests',
    description = 'Review, approve, or reject defense requests from your advisees',
}: {
    defenseRequests: DefenseRequest[];
    coordinator?: Coordinator | null;
    title?: string;
    description?: string;
}) {
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<number[]>([]);
    const [, setBulkAction] = useState<null | 'approve' | 'reject' | 'retrieve'>(null);
    const [, setConfirmBulkDelete] = useState(false);
    const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
    const [typeFilter, setTypeFilter] = useState<string[]>([]);
    const [filtersOpen, setFiltersOpen] = useState<false | 'priority' | 'type'>(false);
    const [processing, setProcessing] = useState(false);
    const [confirmAction, setConfirmAction] = useState<null | 'approve' | 'reject'>(null);

    // Filtered requests by search and filters
    const filteredRequests = defenseRequests.filter((req) => {
        const name = getDisplayName(req).toLowerCase();
        const thesis = req.thesis_title?.toLowerCase() || '';
        const q = search.toLowerCase();
        let match = name.includes(q) || thesis.includes(q);
        if (priorityFilter.length) match = match && priorityFilter.includes(req.priority || '');
        if (typeFilter.length) match = match && typeFilter.includes(req.defense_type || '');
        return match;
    });

    // Bulk select helpers
    const headerChecked = selected.length === filteredRequests.length && filteredRequests.length > 0;
    const toggleSelectAll = () => setSelected(headerChecked ? [] : filteredRequests.map((r) => r.id));
    const toggleSelectOne = (id: number) => setSelected(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

    // Print handler
    function handleBulkPrint() {
        const rows = defenseRequests.filter((r) => selected.includes(r.id));
        const w = window.open('', '', 'height=900,width=1200');
        if (!w) return;
        w.document.write(`
          <html>
            <head>
              <title>Print Selected</title>
              <style>
                body{font-family:Arial;padding:32px}
                h1{font-size:18px;margin:0 0 16px}
                table{border-collapse:collapse;width:100%}
                th,td{border:1px solid #ccc;padding:6px 8px;font-size:12px;text-align:left}
              </style>
            </head>
            <body>
              <h1>Defense Requests</h1>
              <table>
                <thead><tr><th>ID</th><th>Title</th><th>Presenter</th><th>Type</th><th>Status</th></tr></thead>
                <tbody>
                  ${rows
                      .map(
                          (r) => `<tr>
                    <td>${r.id}</td>
                    <td>${r.thesis_title}</td>
                    <td>${r.first_name} ${r.last_name}</td>
                    <td>${r.defense_type}</td>
                    <td>${r.adviser_status === 'Approved' ? 'Endorsed' : r.adviser_status || '—'}</td>
                  </tr>`,
                      )
                      .join('')}
                </tbody>
              </table>
              <script>window.print()</script>
            </body>
          </html>
        `);
        w.document.close();
    }

    // Bulk approve/reject handler
    const handleBulkAction = async (action: 'approve' | 'reject' | 'retrieve') => {
        if (defenseRequests.some((request) => selected.includes(request.id) && isAwaitingCorrections(request.workflow_state))) {
            toast.error('A selected request is awaiting student corrections. Review it after the student resubmits.');
            return;
        }
        setProcessing(true);
        const toastId = toast.loading(
            action === 'approve' ? 'Approving selected...' : action === 'reject' ? 'Rejecting selected...' : 'Retrieving selected...',
        );
        try {
            let url = '';
            if (action === 'approve') url = '/defense-requests/bulk-approve';
            else if (action === 'reject') url = '/defense-requests/bulk-reject';
            else if (action === 'retrieve') url = '/defense-requests/bulk-retrieve';

            await axios.post(url, { ids: selected });
            toast.success(
                action === 'approve'
                    ? 'Requests approved and sent to your coordinator!'
                    : action === 'reject'
                      ? 'Requests rejected.'
                      : 'Requests retrieved for review.',
                { id: toastId },
            );
            setSelected([]);
            setConfirmAction(null);
            setBulkAction(null);
            window.location.reload();
        } catch (e: unknown) {
            toast.error((axios.isAxiosError(e) ? e.response?.data?.error : undefined) || `Bulk ${action} failed.`, { id: toastId });
        } finally {
            setProcessing(false);
        }
    };

    // Bulk delete handler (replace with your actual API logic)

    // Table columns config (like coordinator)

    return (
        <div className="relative flex min-h-[90vh] w-full flex-1 flex-col gap-2 overflow-x-hidden pr-3 pl-0">
            {/* Header Card */}
            <div className="border-border mb-2 w-full overflow-hidden rounded-lg border bg-white dark:bg-zinc-900">
                {/* Title & Description */}
                <div className="border-border flex w-full flex-row items-center justify-between border-b bg-white p-3 dark:bg-zinc-900">
                    <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-500 bg-blue-500/10 dark:border-blue-400 dark:bg-blue-900/30">
                            <File className="h-5 w-5 text-blue-400 dark:text-blue-300" />
                        </div>
                        <div>
                            <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</span>
                            <span className="text-muted-foreground block text-xs dark:text-zinc-400">{description}</span>
                        </div>
                    </div>
                </div>
                {/* Search and Filters Row */}
                <div className="border-border flex items-center justify-between gap-2 border-b bg-white px-4 py-3 dark:bg-zinc-900">
                    <div className="flex items-center gap-2">
                        <Input
                            type="text"
                            startIcon={Search}
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-8 max-w-xs text-sm"
                        />
                        {/* Priority filter */}
                        <Popover open={filtersOpen === 'priority'} onOpenChange={(o) => setFiltersOpen(o ? 'priority' : false)}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="flex h-8 items-center gap-1 rounded-md border-dashed px-3 text-xs">
                                    <CirclePlus className="mr-1 h-4 w-4" />
                                    Priority
                                    {priorityFilter.length > 0 && (
                                        <span className="bg-muted ml-1 rounded-full px-2 py-0.5 text-xs">
                                            {priorityFilter.length > 1 ? `${priorityFilter.length} selected` : priorityFilter[0]}
                                        </span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-44 p-1" side="bottom" align="start">
                                {['Low', 'Medium', 'High'].map((p) => (
                                    <div
                                        key={p}
                                        onClick={() => setPriorityFilter((fp) => (fp.includes(p) ? fp.filter((x) => x !== p) : [...fp, p]))}
                                        className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded p-2"
                                    >
                                        <Checkbox checked={priorityFilter.includes(p)} />
                                        <span className="text-sm">{p}</span>
                                    </div>
                                ))}
                                <Button size="sm" variant="ghost" className="mt-2 w-full" onClick={() => setPriorityFilter([])}>
                                    Clear
                                </Button>
                            </PopoverContent>
                        </Popover>
                        {/* Type filter */}
                        <Popover open={filtersOpen === 'type'} onOpenChange={(o) => setFiltersOpen(o ? 'type' : false)}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="flex h-8 items-center gap-1 rounded-md border-dashed px-3 text-xs">
                                    <CirclePlus className="mr-1 h-4 w-4" />
                                    Type
                                    {typeFilter.length > 0 && (
                                        <span className="bg-muted ml-1 rounded-full px-2 py-0.5 text-xs">
                                            {typeFilter.length > 1 ? `${typeFilter.length} selected` : typeFilter[0]}
                                        </span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-44 p-1" side="bottom" align="start">
                                {['Proposal', 'Prefinal', 'Final'].map((t) => (
                                    <div
                                        key={t}
                                        onClick={() => setTypeFilter((ft) => (ft.includes(t) ? ft.filter((x) => x !== t) : [...ft, t]))}
                                        className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded p-2"
                                    >
                                        <Checkbox checked={typeFilter.includes(t)} />
                                        <span className="text-sm">{t}</span>
                                    </div>
                                ))}
                                <Button size="sm" variant="ghost" className="mt-2 w-full" onClick={() => setTypeFilter([])}>
                                    Clear
                                </Button>
                            </PopoverContent>
                        </Popover>
                        {/* Reset button */}
                        {(priorityFilter.length > 0 || typeFilter.length > 0 || search.trim()) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="flex h-8 items-center gap-1 px-3"
                                onClick={() => {
                                    setPriorityFilter([]);
                                    setTypeFilter([]);
                                    setSearch('');
                                }}
                            >
                                <X size={14} /> Reset
                            </Button>
                        )}
                    </div>
                </div>
            </div>
            {/* Table content */}
            <div className="flex min-h-0 w-full flex-1 flex-col gap-4 overflow-x-hidden">
                <div className="flex min-h-0 w-full flex-col overflow-x-hidden">
                    <div className="relative w-full max-w-full">
                        <div className="w-full max-w-full">
                            <div className="border-border bg-background w-full overflow-x-auto rounded-md border">
                                <Table className="w-full min-w-[900px] table-auto text-sm">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[40px] px-3 py-2">
                                                <Checkbox checked={headerChecked} onCheckedChange={toggleSelectAll} aria-label="Select all" />
                                            </TableHead>
                                            <TableHead className="min-w-[220px] px-3 py-2 whitespace-nowrap">Thesis Title</TableHead>
                                            <TableHead className="min-w-[120px] px-3 py-2 whitespace-nowrap">Presenter</TableHead>
                                            <TableHead className="min-w-[100px] px-3 py-2 whitespace-nowrap">Program</TableHead>
                                            <TableHead className="min-w-[130px] px-3 py-2 text-center whitespace-nowrap">Submitted</TableHead>
                                            <TableHead className="min-w-[180px] px-3 py-2 whitespace-nowrap">Attachments</TableHead>
                                            <TableHead className="min-w-[120px] px-3 py-2 text-center whitespace-nowrap">Adviser Status</TableHead>
                                            <TableHead className="min-w-[120px] px-3 py-2 text-center whitespace-nowrap">
                                                Coordinator Status
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredRequests.map((req) => {
                                            const isSelected = selected.includes(req.id);
                                            return (
                                                <TableRow
                                                    key={req.id}
                                                    className="hover:bg-muted/40 cursor-pointer"
                                                    onClick={() => router.visit(`/adviser/defense-requirements/${req.id}/details`)}
                                                >
                                                    <TableCell className="px-3 py-2 align-middle">
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={() => toggleSelectOne(req.id)}
                                                            className="action-btn"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </TableCell>
                                                    {/* Type badge before thesis title */}
                                                    <TableCell
                                                        className="max-w-[260px] truncate px-3 py-2 align-middle leading-tight font-medium whitespace-nowrap"
                                                        title={req.thesis_title}
                                                    >
                                                        {req.defense_type && (
                                                            <Badge variant="outline" className="mr-2">
                                                                {req.defense_type}
                                                            </Badge>
                                                        )}
                                                        <span>{req.thesis_title}</span>
                                                    </TableCell>
                                                    <TableCell
                                                        className="text-muted-foreground max-w-[140px] truncate px-3 py-2 align-middle text-xs whitespace-nowrap"
                                                        title={getDisplayName(req)}
                                                    >
                                                        {getDisplayName(req)}
                                                    </TableCell>
                                                    <TableCell
                                                        className="text-muted-foreground max-w-[100px] truncate px-3 py-2 align-middle text-xs whitespace-nowrap"
                                                        title={getProgramAbbreviation(req.program)}
                                                    >
                                                        {getProgramAbbreviation(req.program) || '—'}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground max-w-[120px] truncate px-3 py-2 text-center align-middle text-xs whitespace-nowrap">
                                                        {req.created_at ? dayjs(req.created_at).format('YYYY-MM-DD hh:mm A') : '—'}
                                                    </TableCell>
                                                    <TableCell className="max-w-[180px] truncate px-3 py-2 align-middle">
                                                        <AttachmentLinks {...req} />
                                                    </TableCell>
                                                    <TableCell className="px-3 py-2 text-center align-middle text-xs whitespace-nowrap">
                                                        <Badge
                                                            className={
                                                                req.adviser_status === 'Endorsed'
                                                                    ? 'border-green-200 bg-green-100 text-green-700'
                                                                    : req.adviser_status === 'Rejected'
                                                                      ? 'border-red-200 bg-red-100 text-red-700'
                                                                      : req.adviser_status === 'Pending'
                                                                        ? 'border-yellow-200 bg-yellow-100 text-yellow-700'
                                                                        : 'border-gray-200 bg-gray-100 text-gray-700'
                                                            }
                                                        >
                                                            {req.workflow_state === 'adviser-corrections'
                                                                ? 'Awaiting corrections'
                                                                : req.adviser_status === 'Approved'
                                                                  ? 'Endorsed'
                                                                  : req.adviser_status || '—'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="px-3 py-2 text-center align-middle text-xs whitespace-nowrap">
                                                        <Badge
                                                            className={
                                                                req.coordinator_status === 'Approved'
                                                                    ? 'border-green-200 bg-green-100 text-green-700'
                                                                    : req.coordinator_status === 'Rejected'
                                                                      ? 'border-red-200 bg-red-100 text-red-700'
                                                                      : req.coordinator_status === 'Pending'
                                                                        ? 'border-yellow-200 bg-yellow-100 text-yellow-700'
                                                                        : 'border-gray-200 bg-gray-100 text-gray-700'
                                                            }
                                                        >
                                                            {req.workflow_state === 'coordinator-corrections'
                                                                ? 'Awaiting corrections'
                                                                : req.coordinator_status || '—'}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        {filteredRequests.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-muted-foreground py-10 text-center">
                                                    No defense requests found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* --- Floating Bulk Action Bar --- */}
            {selected.length > 0 && (
                <div className="border-border animate-in fade-in slide-in-from-bottom-2 dark:bg-muted dark:text-muted-foreground dark:border-border fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-lg border bg-white px-4 py-1 text-xs shadow-lg md:bottom-6">
                    <span className="min-w-[70px] text-center font-semibold">{selected.length} selected</span>
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="flex h-7 w-auto items-center gap-1 px-3 py-1 text-xs"
                            onClick={() => setConfirmAction('approve')}
                            aria-label="Approve"
                            disabled={processing}
                        >
                            <CheckCircle size={13} className="text-green-500" />
                            <span className="hidden sm:inline">Approve</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="flex h-7 w-auto items-center gap-1 px-3 py-1 text-xs"
                            onClick={() => setConfirmAction('reject')}
                            aria-label="Reject"
                            disabled={processing}
                        >
                            <XCircle size={13} className="text-red-500" />
                            <span className="hidden sm:inline">Reject</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="flex h-7 w-auto items-center gap-1 px-3 py-1 text-xs"
                            onClick={() => setBulkAction('retrieve')}
                            aria-label="Retrieve"
                        >
                            <CircleArrowLeft size={13} className="text-blue-500" />
                            <span className="hidden sm:inline">Retrieve</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="flex h-7 w-auto items-center gap-1 px-3 py-1 text-xs"
                            onClick={() => setConfirmBulkDelete(true)}
                            aria-label="Delete"
                        >
                            <Trash2 size={13} />
                            <span className="hidden sm:inline">Delete</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="flex h-7 w-auto items-center gap-1 px-3 py-1 text-xs"
                            onClick={handleBulkPrint}
                            aria-label="Print"
                        >
                            <Printer size={13} />
                            <span className="hidden sm:inline">Print</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="flex h-7 w-auto items-center px-1 py-1 text-xs"
                            onClick={() => setSelected([])}
                            aria-label="Clear selection"
                        >
                            <X size={14} />
                        </Button>
                    </div>
                </div>
            )}
            {/* --- Confirmation Dialog --- */}
            <Dialog open={!!confirmAction} onOpenChange={() => !processing && setConfirmAction(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{confirmAction === 'approve' ? 'Approve selected requests?' : 'Reject selected requests?'}</DialogTitle>
                        {confirmAction === 'approve' && coordinator && (
                            <div className="text-muted-foreground mt-2 text-xs">
                                These requests will be forwarded to your coordinator: <span className="font-semibold">{coordinator.name}</span>
                            </div>
                        )}
                    </DialogHeader>
                    <div className="mb-2 text-sm">
                        {confirmAction === 'approve'
                            ? 'Are you sure you want to approve and forward these requests to your coordinator?'
                            : 'Are you sure you want to reject these requests? This cannot be undone.'}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmAction(null)} disabled={processing}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => handleBulkAction(confirmAction!)}
                            disabled={processing}
                            className="bg-rose-500 text-white hover:bg-rose-600"
                        >
                            {processing
                                ? confirmAction === 'approve'
                                    ? 'Approving...'
                                    : 'Rejecting...'
                                : confirmAction === 'approve'
                                  ? 'Approve'
                                  : 'Reject'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* --- End Confirmation Dialog --- */}
        </div>
    );
}
