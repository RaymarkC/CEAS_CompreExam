'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Label, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts';

type AdviserCountRadialProps = {
    count: number;
};

export default function AdviserCountRadial({ count }: AdviserCountRadialProps) {
    // We render a radial chart but center shows the actual adviser count.
    // Percent is mostly for visual dial; when count is zero show 0%.
    const percent = count > 0 ? 100 : 0;
    const chartData = [
        {
            name: 'Advisers',
            value: percent,
            fill: '#0ea5a4', // teal-ish
        },
    ];

    return (
        <Card className="col-span-1 flex min-h-[220px] flex-col justify-between rounded-2xl border p-0 shadow-none">
            <div className="flex items-center justify-between px-6 pt-5">
                <div className="text-muted-foreground text-sm font-medium">Advisers Linked</div>
            </div>
            <CardContent className="flex w-full flex-1 items-center justify-center p-0">
                <div className="flex h-[140px] w-full items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                            cx="50%"
                            cy="50%"
                            innerRadius="80%"
                            outerRadius="100%"
                            barSize={18}
                            data={chartData}
                            startAngle={90}
                            endAngle={-270}
                        >
                            <PolarGrid gridType="circle" radialLines={false} stroke="none" />
                            <RadialBar dataKey="value" cornerRadius={10} fill="#0ea5a4" background />
                            <PolarRadiusAxis type="number" domain={[0, 100]} tick={false} axisLine={false}>
                                <Label
                                    position="center"
                                    content={({ viewBox }) => {
                                        if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                                            return (
                                                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                                    <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-4xl font-bold">
                                                        {count}
                                                    </tspan>
                                                    <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 28} className="fill-muted-foreground text-base">
                                                        Adviser{count === 1 ? '' : 's'}
                                                    </tspan>
                                                </text>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                            </PolarRadiusAxis>
                        </RadialBarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
