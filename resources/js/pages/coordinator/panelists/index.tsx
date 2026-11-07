// resources/js/Pages/coordinator/panelists/Index.tsx
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import AppLayout from '@/layouts/app-layout';
import type { Panelist, PaymentRate } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { CheckCircle, CircleX, PlusCircle, Search, Trash2, UserPlus, Users, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Toaster, toast } from 'sonner';
import PanelistFormModal from './panelists-form-modal';
import PanelistsListTable from './panelists-list-table';

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Panelists', href: '/panelists' },
];

export default function PanelistsPage() {
    const { panelists: initialPanelists = [], paymentRates: initialPaymentRates = [] } = usePage().props as {
        panelists?: Panelist[];
        paymentRates?: PaymentRate[];
    };

    const [panelists, setPanelists] = useState<Panelist[]>(initialPanelists);
    const [selected, setSelected] = useState<number[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Panelist | null>(null);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [formLoading, setFormLoading] = useState(false);

    const [paymentRates, setPaymentRates] = useState<PaymentRate[]>(initialPaymentRates);

    // Filters
    const [roleFilter, setRoleFilter] = useState<string[]>([]);
    const [statusFilter, setStatusFilter] = useState<string[]>([]);

    useEffect(() => {
        setPanelists(initialPanelists);
    }, [initialPanelists]);

    // Fetch Payment Rates only if not provided by server
    useEffect(() => {
        if (initialPaymentRates && initialPaymentRates.length > 0) return;
        let mounted = true;
        axios
            .get('/dean/payment-rates/data')
            .then((res) => {
                if (!mounted) return;
                const rates = Array.isArray(res.data?.rates) ? res.data.rates : [];
                setPaymentRates(rates);
            })
            .catch(() => setPaymentRates([]));
        return () => {
            mounted = false;
        };
    }, [initialPaymentRates]);

    // Filtering logic
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        let result = panelists;

        if (roleFilter.length > 0) {
            result = result.filter(
                (p) =>
                    (Array.isArray(p.assignments) && p.assignments.some((a) => a.role && roleFilter.includes(a.role))) ||
                    (!Array.isArray(p.assignments) && roleFilter.includes(p.role)),
            );
        }

        if (statusFilter.length > 0) {
            result = result.filter((p) => {
                const assigned = Array.isArray(p.assignments) && p.assignments.length > 0;
                return (statusFilter.includes('Assigned') && assigned) || (statusFilter.includes('Not Assigned') && !assigned);
            });
        }

        if (q) {
            result = result.filter(
                (p) => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || p.status.toLowerCase().includes(q),
            );
        }

        return result;
    }, [query, panelists, roleFilter, statusFilter]);

    // Ensure type fallback client-side (role -> type)
    const hydrated = useMemo<Panelist[]>(() => {
        return filtered.map((p) => ({
            ...p,
            assignments: (p.assignments || []).map((a) => ({
                ...a,
                type: a.type ?? a.role ?? p.role,
            })),
        }));
    }, [filtered]);

    function handleFormSubmit(data: Omit<Panelist, 'id' | 'created_at' | 'updated_at'>, id?: number, done?: () => void) {
        setFormLoading(true);
        const payload = { name: data.name, email: data.email, role: data.role, status: data.status };
        if (id) {
            router.put(`/panelists/${id}`, payload, {
                preserveScroll: true,
                onSuccess: (page) => {
                    toast.success('Panelist updated');
                    setModalOpen(false);
                    setEditing(null);
                    setPanelists(Array.isArray(page.props.panelists) ? page.props.panelists : []);
                    setFormLoading(false);
                    done?.();
                },
                onError: () => {
                    toast.error('Failed to update panelist');
                    setFormLoading(false);
                    done?.();
                },
            });
        } else {
            router.post('/panelists', payload, {
                preserveScroll: true,
                onSuccess: (page) => {
                    toast.success('Panelist added');
                    setModalOpen(false);
                    setEditing(null);
                    setPanelists(Array.isArray(page.props.panelists) ? page.props.panelists : []);
                    setFormLoading(false);
                    done?.();
                },
                onError: () => {
                    toast.error('Failed to add panelist');
                    setFormLoading(false);
                    done?.();
                },
            });
        }
    }

    function handleDelete(id: number) {
        setLoading(true);
        router.delete(`/panelists/${id}`, {
            preserveScroll: true,
            onSuccess: (page) => {
                toast.success('Panelist deleted');
                setSelected((s) => s.filter((x) => x !== id));
                setPanelists(Array.isArray(page.props.panelists) ? page.props.panelists : []);
                setLoading(false);
            },
            onError: () => {
                toast.error('Failed to delete panelist');
                setLoading(false);
            },
        });
    }

    function handleBulkDelete() {
        if (selected.length === 0) return;
        if (!window.confirm('Delete selected panelists?')) return;
        setLoading(true);
        router.post(
            '/panelists/bulk-delete',
            { ids: selected },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    toast.success('Panelists deleted');
                    setSelected([]);
                    setPanelists(Array.isArray(page.props.panelists) ? page.props.panelists : []);
                    setLoading(false);
                },
                onError: () => {
                    toast.error('Failed to bulk delete');
                    setLoading(false);
                },
            },
        );
    }

    function handleBulkStatus(status: Panelist['status']) {
        if (selected.length === 0) return;
        setLoading(true);
        router.post(
            '/panelists/bulk-status',
            { ids: selected, status },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    toast.success('Panelists status updated');
                    setSelected([]);
                    setPanelists(Array.isArray(page.props.panelists) ? page.props.panelists : []);
                    setLoading(false);
                },
                onError: () => {
                    toast.error('Failed to update status');
                    setLoading(false);
                },
            },
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Panelists" />
            <Toaster richColors position="bottom-right" />
            <div className="bg-background relative flex h-full flex-1 flex-col gap-4 overflow-auto rounded-xl pt-5 pr-7 pl-7">
                {/* Header */}
                <div className="border-border dark:border-border w-full overflow-hidden rounded-lg border bg-white dark:bg-zinc-900">
                    <div className="dark:border-border flex w-full flex-row items-center justify-between border-b bg-white p-3 dark:bg-zinc-900">
                        <div className="flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-rose-500 bg-rose-500/10 dark:bg-rose-900">
                                <Users className="h-5 w-5 text-rose-400" />
                            </div>
                            <div>
                                <span className="text-base font-semibold">Panelists</span>
                                <span className="text-muted-foreground dark:text-muted-foreground block text-xs">
                                    This section shows all defense panelists. Add, search, and manage panelists.
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => {
                                    setModalOpen(true);
                                    setEditing(null);
                                }}
                                disabled={formLoading || loading}
                            >
                                <UserPlus className="h-4 w-4" /> {formLoading ? 'Loading...' : 'Add Panel'}
                            </Button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="dark:border-border flex items-center justify-between gap-2 border-b bg-white px-4 py-3 dark:bg-zinc-900">
                        <div className="flex items-center gap-2">
                            <Input
                                type="text"
                                startIcon={Search}
                                placeholder="Search..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="h-8 max-w-xs text-sm"
                                disabled={loading}
                            />
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="flex h-8 items-center gap-1 rounded-md border-dashed px-3 text-xs">
                                        <PlusCircle className="mr-1 h-4 w-4" />
                                        Role
                                        {roleFilter.length > 0 && (
                                            <span className="bg-muted ml-1 rounded-full px-2 py-0.5 text-xs dark:bg-zinc-800">
                                                {roleFilter.length > 1 ? `${roleFilter.length} selected` : roleFilter[0]}
                                            </span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="dark:text-muted-foreground w-44 p-1 dark:bg-zinc-900" side="bottom" align="start">
                                    {['Chairperson', 'Panel Member'].map((role) => (
                                        <div
                                            key={role}
                                            onClick={() => setRoleFilter((rf) => (rf.includes(role) ? rf.filter((x) => x !== role) : [...rf, role]))}
                                            className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded p-2 dark:hover:bg-zinc-800"
                                        >
                                            <Checkbox checked={roleFilter.includes(role)} />
                                            <span className="text-sm">{role}</span>
                                        </div>
                                    ))}
                                    <Button size="sm" variant="ghost" className="mt-2 w-full" onClick={() => setRoleFilter([])}>
                                        Clear
                                    </Button>
                                </PopoverContent>
                            </Popover>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="flex h-8 items-center gap-1 rounded-md border-dashed px-3 text-xs">
                                        <PlusCircle className="mr-1 h-4 w-4" />
                                        Status
                                        {statusFilter.length > 0 && (
                                            <span className="bg-muted ml-1 rounded-full px-2 py-0.5 text-xs dark:bg-zinc-800">
                                                {statusFilter.length > 1 ? `${statusFilter.length} selected` : statusFilter[0]}
                                            </span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="dark:text-muted-foreground w-44 p-1 dark:bg-zinc-900" side="bottom" align="start">
                                    {['Assigned', 'Not Assigned'].map((status) => (
                                        <div
                                            key={status}
                                            onClick={() =>
                                                setStatusFilter((sf) => (sf.includes(status) ? sf.filter((x) => x !== status) : [...sf, status]))
                                            }
                                            className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded p-2 dark:hover:bg-zinc-800"
                                        >
                                            <Checkbox checked={statusFilter.includes(status)} />
                                            <span className="text-sm">{status}</span>
                                        </div>
                                    ))}
                                    <Button size="sm" variant="ghost" className="mt-2 w-full" onClick={() => setStatusFilter([])}>
                                        Clear
                                    </Button>
                                </PopoverContent>
                            </Popover>

                            {(roleFilter.length > 0 || statusFilter.length > 0 || query.trim()) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex h-8 items-center gap-1 px-3"
                                    onClick={() => {
                                        setRoleFilter([]);
                                        setStatusFilter([]);
                                        setQuery('');
                                    }}
                                >
                                    <X size={14} /> Reset
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <PanelistsListTable
                    panelists={hydrated}
                    paymentRates={paymentRates}
                    onEdit={(p) => {
                        setEditing(p as unknown as Panelist);
                        setModalOpen(true);
                    }}
                    onDelete={handleDelete}
                    selected={selected}
                    setSelected={setSelected}
                    loading={loading}
                />

                {/* Bulk actions */}
                {selected.length > 0 && (
                    <div className="dark:bg-muted dark:text-muted-foreground border-border dark:border-border fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-lg border bg-white px-4 py-1 text-xs shadow-lg md:bottom-6">
                        <span className="min-w-[70px] text-center font-semibold">{selected.length} selected</span>
                        <div className="flex gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="flex h-7 w-auto items-center gap-1 px-2 py-1 text-xs"
                                onClick={handleBulkDelete}
                                aria-label="Delete"
                                disabled={loading}
                            >
                                <Trash2 size={13} />
                                <span className="hidden sm:inline">{loading ? 'Deleting...' : 'Delete'}</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="flex h-7 w-auto items-center gap-1 px-2 py-1 text-xs"
                                onClick={() => handleBulkStatus('Assigned')}
                                aria-label="Set Assigned"
                                disabled={loading}
                            >
                                <CheckCircle size={13} className="text-green-500" />
                                <span className="hidden sm:inline">{loading ? 'Updating...' : 'Set Assigned'}</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="flex h-7 w-auto items-center gap-1 px-2 py-1 text-xs"
                                onClick={() => handleBulkStatus('Not Assigned')}
                                aria-label="Set Not Assigned"
                                disabled={loading}
                            >
                                <CircleX size={13} className="text-red-500" />
                                <span className="hidden sm:inline">{loading ? 'Updating...' : 'Set Not Assigned'}</span>
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

                {/* Modal */}
                <PanelistFormModal
                    open={modalOpen}
                    editing={editing}
                    onClose={() => {
                        setModalOpen(false);
                        setEditing(null);
                    }}
                    onSubmit={handleFormSubmit}
                    loading={formLoading}
                />
            </div>
        </AppLayout>
    );
}
