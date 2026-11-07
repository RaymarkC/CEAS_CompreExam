const RemindersWidget = () => (
    <div className="border-sidebar-border/70 dark:border-sidebar-border flex aspect-video flex-col justify-between rounded-xl border bg-white p-5 dark:bg-zinc-900">
        <h3 className="mb-2 text-[13px] font-medium">Reminders</h3>
        <ul className="list-disc pl-4 text-xs text-gray-700 dark:text-gray-300">
            <li>Review pending defense requests promptly.</li>
            <li>Confirm upcoming defense schedules.</li>
            <li>Update priorities for urgent requests.</li>
        </ul>
    </div>
);

export default RemindersWidget;
