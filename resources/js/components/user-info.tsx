import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { User } from '@/types';

function getInitials(user: Partial<User>) {
    const first = user?.first_name?.[0] ?? '';
    const last = user?.last_name?.[0] ?? '';
    return (first + last).toUpperCase() || 'U';
}

export function UserInfo({ user, showEmail = false }: { user: Partial<User>; showEmail?: boolean }) {
    if (!user) return null;
    return (
        <div className="flex items-center gap-2">
            <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-zinc-200 text-lg font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                    {getInitials(user)}
                </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
                <span className="font-semibold">
                    {user.first_name} {user.last_name}
                </span>
                <span className="text-muted-foreground text-xs">{showEmail ? user.email : user.school_id ? user.school_id : user.role}</span>
            </div>
        </div>
    );
}
