import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { type DefenseRequestSummary } from './show-all-requests';

type HonorariumProps = {
    defenseRequests: DefenseRequestSummary[];
};

export default function ShowAllHonorarium({ defenseRequests }: HonorariumProps) {
    const [search, setSearch] = useState('');

    const approved = useMemo(
        () => (defenseRequests || []).filter((r) => r.status === 'Approved' && r.thesis_title.toLowerCase().includes(search.toLowerCase())),
        [defenseRequests, search],
    );

    const cardsToShow = approved.slice(0, 8);

    return (
        <div className="flex h-screen flex-col gap-4 p-4">
            <div className="flex flex-wrap items-center justify-between px-2 pt-2">
                <div className="flex flex-1 items-center gap-2">
                    <div className="relative">
                        <Input
                            placeholder="Search..."
                            startIcon={Search}
                            value={search}
                            onChange={(e) => setSearch(e.currentTarget.value)}
                            className="h-8 w-[300px] pl-8 text-sm"
                        />
                    </div>
                </div>
            </div>
            <Separator className="mt-2 mb-2" />
            <div className="grid grid-cols-1 gap-3 px-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {cardsToShow.length === 0 ? (
                    <div className="text-muted-foreground col-span-4 py-12 text-center">
                        <span className="text-lg font-medium">No approved honorarium requests found.</span>
                    </div>
                ) : (
                    cardsToShow.map((r) => (
                        <Card key={r.id} className="flex h-28 w-full flex-col items-start p-4 shadow-none">
                            <CardContent className="flex w-full flex-col p-0">
                                <span className="line-clamp-2 w-full text-start text-xs font-semibold" title={r.thesis_title}>
                                    {r.thesis_title.length > 20 ? r.thesis_title.slice(0, 57) + '...' : r.thesis_title}
                                </span>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
