import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageSquare, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Notification {
    id: number;
    conversation_id: number;
    conversation_title: string;
    sender_name: string;
    content: string;
    created_at: string;
}

export default function MessageNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Poll for new messages every 10 seconds
        const interval = setInterval(checkForNewMessages, 10000);
        return () => clearInterval(interval);
    }, []);

    const checkForNewMessages = async () => {
        try {
            // This would be replaced with actual API call
            // const response = await fetch('/messages/recent-notifications');
            // const data = await response.json();
            // if (data.notifications.length > 0) {
            //     setNotifications(data.notifications);
            //     setIsVisible(true);
            // }
        } catch (error) {
            console.error('Failed to check for new messages:', error);
        }
    };

    const dismissNotification = (id: number) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (notifications.length <= 1) {
            setIsVisible(false);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase();
    };

    if (!isVisible || notifications.length === 0) {
        return null;
    }

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {notifications.slice(0, 3).map((notification) => (
                <Card key={notification.id} className="animate-in slide-in-from-right w-80 border-l-4 border-l-blue-500 p-3 shadow-lg">
                    <div className="flex items-start space-x-3">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">{getInitials(notification.sender_name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                                <p className="truncate text-sm font-medium">{notification.sender_name}</p>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => dismissNotification(notification.id)}>
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                            <p className="mb-1 text-xs text-gray-500">{notification.conversation_title}</p>
                            <p className="truncate text-sm text-gray-700">{notification.content}</p>
                            <div className="mt-2 flex justify-end">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    onClick={() => {
                                        window.location.href = `/messages?conversation=${notification.conversation_id}`;
                                    }}
                                >
                                    <MessageSquare className="mr-1 h-3 w-3" />
                                    Reply
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            ))}
            {notifications.length > 3 && (
                <Card className="w-80 p-2 text-center">
                    <p className="text-xs text-gray-500">+{notifications.length - 3} more messages</p>
                </Card>
            )}
        </div>
    );
}
