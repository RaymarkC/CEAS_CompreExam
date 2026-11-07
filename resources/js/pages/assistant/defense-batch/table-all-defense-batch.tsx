import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Send } from 'lucide-react';
import { useState } from 'react';

export type DefenseBatchSummary = {
    id: number;
    name: string;
    created_by: string;
    created_at: string;
    status: string;
    count: number;
};

const STATUS_OPTIONS = [
    { value: 'ready', label: 'Ready for Finance', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { value: 'paid', label: 'Paid', color: 'bg-green-100 text-green-700 border-green-200' },
];

function getStatusBadge(status: string) {
    const opt = STATUS_OPTIONS.find((s) => s.value === status);
    if (!opt) return <Badge className="border-gray-200 bg-gray-100 text-gray-700">{status}</Badge>;
    return <Badge className={opt.color}>{opt.label}</Badge>;
}

export default function TableAllDefenseBatch({
    batches,
    onUpdateStatus,
    isLoading,
}: {
    batches: DefenseBatchSummary[];
    onUpdateStatus: (batchId: number, status: string) => void;
    isLoading: boolean;
}) {
    const [editId, setEditId] = useState<number | null>(null);

    return (
        <div className="bg-background box-border w-full max-w-full overflow-x-auto rounded-md border border-zinc-200 transition-all duration-200">
            <Table className="w-full table-auto text-sm">
                <TableHeader>
                    <TableRow>
                        <TableHead className="min-w-[180px] px-3">Batch Name</TableHead>
                        <TableHead className="min-w-[120px] px-2">Created By</TableHead>
                        <TableHead className="min-w-[120px] px-2">Created At</TableHead>
                        <TableHead className="min-w-[100px] px-2">Status</TableHead>
                        <TableHead className="min-w-[80px] px-2 text-center">Requests</TableHead>
                        <TableHead className="min-w-[120px] px-2 text-center">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {batches.map((b) => (
                        <TableRow key={b.id}>
                            <TableCell className="flex items-center gap-2 truncate px-3 py-2 align-middle leading-tight font-medium">
                                <Send className="h-4 w-4 text-blue-500" />
                                <span>{b.name}</span>
                            </TableCell>
                            <TableCell className="text-muted-foreground px-2 py-2 align-middle text-xs whitespace-nowrap">{b.created_by}</TableCell>
                            <TableCell className="text-muted-foreground px-2 py-2 align-middle text-xs whitespace-nowrap">
                                {new Date(b.created_at).toLocaleString()}
                            </TableCell>
                            <TableCell className="px-2 py-2 align-middle text-xs whitespace-nowrap">{getStatusBadge(b.status)}</TableCell>
                            <TableCell className="px-2 py-2 text-center align-middle text-xs">{b.count}</TableCell>
                            <TableCell className="px-2 py-2 text-center align-middle text-xs">
                                {editId === b.id ? (
                                    <div className="flex justify-center gap-1">
                                        {STATUS_OPTIONS.map((opt) => (
                                            <Button
                                                key={opt.value}
                                                size="sm"
                                                variant={b.status === opt.value ? 'default' : 'outline'}
                                                className="text-xs"
                                                onClick={() => {
                                                    onUpdateStatus(b.id, opt.value);
                                                    setEditId(null);
                                                }}
                                                disabled={isLoading}
                                            >
                                                {opt.label}
                                            </Button>
                                        ))}
                                    </div>
                                ) : (
                                    <Button size="sm" variant="outline" className="action-btn" onClick={() => setEditId(b.id)}>
                                        <Pencil className="h-4 w-4" /> Edit
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                    {batches.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-muted-foreground py-32 text-center text-sm">
                                No batches found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
