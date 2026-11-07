type RecentActivityWidgetProps = {
    activities: string[];
};

export default function RecentActivityWidget({ activities }: RecentActivityWidgetProps) {
    return (
        <div className="rounded-xl bg-white p-4 shadow dark:bg-gray-900">
            <h2 className="mb-2 text-lg font-semibold">Recent Activity</h2>
            <ul className="list-disc space-y-1 pl-5">
                {activities.length === 0 ? (
                    <li className="text-gray-500">No recent activity.</li>
                ) : (
                    activities.map((activity, idx) => (
                        <li key={idx} className="text-gray-700 dark:text-gray-200">
                            {activity}
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
}
