import { Button } from '@/components/ui/button';
import type { Notification } from '@/types';
import { router } from '@inertiajs/react';
import { Bell, CheckCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Notifications({ notifications, onChanged }: { notifications: Notification[]; onChanged?: () => void }) {
    const [items, setItems] = useState(notifications);
    const [tab, setTab] = useState('unread');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => setItems(notifications), [notifications]);
    async function markRead(notification?: Notification) {
        setBusy(true);
        setError('');
        try {
            const token = decodeURIComponent(
                document.cookie
                    .split('; ')
                    .find((c) => c.startsWith('XSRF-TOKEN='))
                    ?.slice(11) ?? '',
            );
            const response = await fetch(notification ? `/notifications/${notification.id}/read` : '/notifications/read-all', {
                method: notification ? 'PATCH' : 'POST',
                headers: { Accept: 'application/json', 'X-XSRF-TOKEN': token, 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });
            if (!response.ok) throw new Error('Unable to update notifications. Please try again.');
            setItems((current) => current.map((n) => (!notification || n.id === notification.id ? { ...n, read: true } : n)));
            onChanged?.();
            window.dispatchEvent(new Event('notifications-updated'));
            if (notification?.link) router.visit(notification.link);
        } catch {
            setError('Unable to update notifications. Please try again.');
        } finally {
            setBusy(false);
        }
    }
    const shown = items.filter((n) => (tab === 'unread' ? !n.read : n.read));
    return (
        <div className="max-h-[80vh] space-y-3 overflow-y-auto p-3">
            <div className="flex gap-2">
                {['unread', 'read'].map((value) => (
                    <Button key={value} variant={tab === value ? 'secondary' : 'ghost'} onClick={() => setTab(value)}>
                        {value === 'unread' ? 'Unread' : 'Read'} ({items.filter((n) => (value === 'unread' ? !n.read : n.read)).length})
                    </Button>
                ))}
            </div>
            {items.some((n) => !n.read) && (
                <Button variant="ghost" size="sm" disabled={busy} onClick={() => markRead()}>
                    <CheckCheck className="mr-2 size-4" />
                    Mark all as read
                </Button>
            )}
            {error && (
                <p role="alert" className="text-destructive text-sm">
                    {error}
                </p>
            )}
            {!shown.length && <p className="text-muted-foreground py-8 text-center text-sm">No {tab} notifications</p>}
            {shown.map((n) => (
                <button
                    type="button"
                    key={n.id}
                    disabled={busy}
                    className="hover:bg-muted flex w-full gap-3 rounded-lg border p-3 text-left disabled:opacity-60"
                    onClick={() => (n.read ? n.link && router.visit(n.link) : markRead(n))}
                >
                    <Bell className="mt-1 size-4 shrink-0" />
                    <span>
                        <span className="block text-sm font-semibold">{n.title}</span>
                        <span className="text-muted-foreground block text-xs">{n.message}</span>
                        <time className="text-muted-foreground mt-1 block text-xs">{new Date(n.created_at).toLocaleString()}</time>
                    </span>
                </button>
            ))}
        </div>
    );
}
