import React from 'react';

type DefenseRequest = {
    id: number;
    thesis_title: string;
    date_of_defense: string;
    status?: string;
};

type Props = {
    loading: boolean;
    todayEvents: DefenseRequest[];
    studentDefense?: DefenseRequest;
};

function isThisWeek(dateStr: string) {
    const now = new Date();
    const date = new Date(dateStr);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return date >= startOfWeek && date <= endOfWeek;
}

const UpcomingSchedulesWidget: React.FC<Props> = ({ loading, todayEvents, studentDefense }) => (
    <div className="border-sidebar-border/70 dark:border-sidebar-border flex aspect-video flex-col justify-between rounded-xl border bg-white p-5 dark:bg-zinc-900">
        <h3 className="mb-2 text-[13px] font-medium">Upcoming Schedules</h3>
        {loading ? (
            <span className="text-muted-foreground text-xs">Loading...</span>
        ) : (
            <>
                {/* Student's own approved defense for this week */}
                {studentDefense && studentDefense.status?.toLowerCase() === 'approved' && isThisWeek(studentDefense.date_of_defense) && (
                    <div className="mb-2 flex items-center gap-2 rounded bg-green-50 p-2 dark:bg-green-900/30">
                        <span className="text-xs font-semibold text-green-700 dark:text-green-300">Your defense: {studentDefense.thesis_title}</span>
                        <span className="ml-2 text-[11px] text-gray-500 dark:text-gray-400">
                            {new Date(studentDefense.date_of_defense).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                    </div>
                )}
                {todayEvents.length === 0 ? (
                    <span className="text-muted-foreground text-xs">No events scheduled for today or soon.</span>
                ) : (
                    <ul className="flex flex-col gap-1">
                        {todayEvents.map((ev) => (
                            <li key={ev.id} className="flex items-center justify-between text-xs">
                                <span className="max-w-[110px] truncate">{ev.thesis_title}</span>
                                <span className="ml-2 text-[11px] text-gray-500 dark:text-gray-400">
                                    {new Date(ev.date_of_defense).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </>
        )}
    </div>
);

export default UpcomingSchedulesWidget;
