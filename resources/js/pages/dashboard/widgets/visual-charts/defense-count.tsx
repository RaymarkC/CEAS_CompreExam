'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

const chartData = [
    { week: 'Week 1', defenses: 5 },
    { week: 'Week 2', defenses: 8 },
    { week: 'Week 3', defenses: 12 },
    { week: 'Week 4', defenses: 7 },
    { week: 'Week 5', defenses: 15 },
];

export default function DefenseCountLineChart() {
    return (
        <Card className="col-span-1 flex min-h-[220px] flex-col justify-between rounded-2xl border p-0 shadow-none">
            <div className="flex items-center justify-between px-6 pt-5">
                <div className="text-muted-foreground text-sm font-medium">Total Defenses Scheduled</div>
                <Button variant="ghost" size="sm" className="px-3 py-1 text-sm font-semibold" type="button">
                    View More
                </Button>
            </div>
            <div className="px-6">
                <div className="text-3xl leading-tight font-bold">+2,350</div>
                <div className="text-muted-foreground mt-1 mb-2 text-sm">+180.1% from last month</div>
            </div>
            <CardContent className="flex w-full flex-1 items-end p-0">
                <div className="h-[90px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="roseArea" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#e11d48" stopOpacity={0.16} />
                                    <stop offset="100%" stopColor="#e11d48" stopOpacity={0.06} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="defenses"
                                stroke="#e11d48"
                                fill="url(#roseArea)"
                                strokeWidth={3}
                                dot={false}
                                isAnimationActive={true}
                                animationDuration={900}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
