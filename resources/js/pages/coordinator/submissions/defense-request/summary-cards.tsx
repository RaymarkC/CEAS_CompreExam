import { Card, CardContent } from '@/components/ui/card';
import { CircleAlert } from 'lucide-react';

type SummaryCardsProps = {
    total: number;
    pending: number;
    inProgress: number;
    approved: number;
    rejected: number;
};

export function SummaryCards({ pending, approved, rejected }: SummaryCardsProps) {
    return (
        <Card className="h-auto w-full rounded-sm border-none p-0">
            <CardContent className="flex min-h-10 flex-row items-center justify-between px-4">
                <div className="flex items-center gap-2 rounded p-1">
                    <CircleAlert className="size-4 text-rose-500" />
                    <span className="text-muted-foreground text-xs font-medium">Pending Request:</span>
                    <span className="text-base font-bold text-rose-600">{pending}</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                        <span className="text-muted-foreground text-xs">Approved</span>
                        <span className="text-xs font-semibold text-green-600">{approved}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-muted-foreground text-xs">Rejected</span>
                        <span className="text-xs font-semibold text-red-500">{rejected}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
