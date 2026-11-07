import Notifications from '@/components/notifications';
import AppLayout from '@/layouts/app-layout';
import type { Notification } from '@/types';
import { Head, usePage } from '@inertiajs/react';
export default function NotificationPage() {
    const { notifications } = usePage<{ notifications: Notification[] }>().props;
    return (
        <AppLayout breadcrumbs={[{ title: 'Notifications', href: '/notifications' }]}>
            <Head title="Notifications" />
            <div className="mx-auto w-full max-w-3xl p-6">
                <h1 className="mb-4 text-2xl font-semibold">Notifications</h1>
                <Notifications notifications={notifications} />
            </div>
        </AppLayout>
    );
}
