import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import { Breadcrumbs } from '@/components/breadcrumbs';
import Notifications from '@/components/notifications';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { Notification } from '@/types';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { usePage } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const bellBtnRef = useRef<HTMLButtonElement>(null);

    const page = usePage<{ notifications?: Notification[]; unreadCount?: number }>();
    const [unreadCount, setUnreadCount] = useState(page.props.unreadCount ?? 0);
    const [notifications, setNotifications] = useState<Notification[]>(page.props.notifications ?? []);
    useEffect(() => {
        setUnreadCount(page.props.unreadCount ?? 0);
        setNotifications(page.props.notifications ?? []);
    }, [page.props.notifications, page.props.unreadCount]);
    const refreshNotifications = useCallback(async () => {
        if (document.visibilityState !== 'visible') return;
        try {
            const response = await fetch('/notifications/feed', { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
            if (!response.ok) return;
            const data = await response.json();
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount);
        } catch {
            /* Keep the last successful feed if offline. */
        }
    }, []);
    useEffect(() => {
        const timer = window.setInterval(refreshNotifications, 30000);
        window.addEventListener('focus', refreshNotifications);
        window.addEventListener('notifications-updated', refreshNotifications);
        document.addEventListener('visibilitychange', refreshNotifications);
        return () => {
            window.clearInterval(timer);
            window.removeEventListener('focus', refreshNotifications);
            window.removeEventListener('notifications-updated', refreshNotifications);
            document.removeEventListener('visibilitychange', refreshNotifications);
        };
    }, [refreshNotifications]);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) return;
            if (bellBtnRef.current && bellBtnRef.current.contains(e.target as Node)) return;
            setOpen(false);
        }
        if (open) {
            document.addEventListener('mousedown', handleClick);
        }
        return () => {
            document.removeEventListener('mousedown', handleClick);
        };
    }, [open]);

    // Add theme switching logic

    return (
        <header className="border-sidebar-border/50 dark:bg-background dark:border-border relative flex h-16 shrink-0 items-center gap-2 border-b px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex flex-1 items-center justify-between">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="ml-1" />
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
                <div className="relative mr-5 flex items-center gap-2">
                    {/* Notifications Bell */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                ref={bellBtnRef}
                                variant="ghost"
                                className="hover:bg-accent dark:hover:bg-muted relative h-8 w-8 p-3 hover:cursor-pointer dark:text-white"
                                aria-label="Show notifications"
                            >
                                <Bell className="size-5 stroke-[1.5]" />
                                {unreadCount > 0 && (
                                    <span className="text-destructive-foreground absolute top-0 right-0 flex min-w-4 origin-center translate-x-1/5 translate-y-1/9 items-center justify-center bg-rose-500 px-1 text-[10px] text-white transition-all duration-150 dark:bg-rose-900 dark:text-rose-200">
                                        {unreadCount}
                                    </span>
                                )}
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="dark:bg-background dark:text-muted-foreground w-full sm:w-[380px]">
                            <SheetHeader>
                                <Bell />
                                <SheetTitle>Notifications</SheetTitle>
                            </SheetHeader>
                            <Notifications notifications={notifications} />
                        </SheetContent>
                    </Sheet>
                    {/* Theme Toggle Dropdown */}
                    <AppearanceToggleDropdown className="hover:cursor-pointer" />
                </div>
            </div>
        </header>
    );
}
