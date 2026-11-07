import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
type Student = {
    id: number;
    name: string;
    program: string | null;
    progress: {
        classification: string | null;
        missed_defenses: number;
        stage: string | null;
        completion: string | null;
        result: string | null;
        enrollment_year: number | null;
        semester: string | null;
    };
};
export default function AcademicProgress({ students }: { students: Student[] }) {
    const [search, setSearch] = useState('');
    const [classification, setClassification] = useState('');
    const rows = students.filter(
        (s) =>
            `${s.name} ${s.program}`.toLowerCase().includes(search.toLowerCase()) &&
            (!classification || (classification === 'missed' ? s.progress.missed_defenses > 0 : s.progress.classification === classification)),
    );
    return (
        <AppLayout breadcrumbs={[{ title: 'Academic Progress', href: '/academic-progress' }]}>
            <Head title="Academic Progress" />
            <main className="space-y-5 p-6">
                <h1 className="text-2xl font-semibold">Academic Progress</h1>
                <p className="text-muted-foreground">
                    Coordinators record school-verified information and defense outcomes. Advisers and the Dean can view.
                </p>
                <div className="flex flex-wrap gap-3">
                    <Input className="max-w-sm" placeholder="Search student or program" value={search} onChange={(e) => setSearch(e.target.value)} />
                    <select
                        aria-label="Student classification"
                        className="bg-background rounded border p-2"
                        value={classification}
                        onChange={(e) => setClassification(e.target.value)}
                    >
                        <option value="">All students</option>
                        <option value="new">New</option>
                        <option value="continuing">Continuing</option>
                        <option value="missed">Previously did not defend</option>
                    </select>
                </div>
                <p role="status">{rows.length} students</p>
                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b">
                                {[
                                    'Student',
                                    'Program',
                                    'Classification',
                                    'Defense stage',
                                    'Completion / result',
                                    'Enrollment',
                                    'Semester',
                                    'Progress',
                                ].map((h) => (
                                    <th className="p-3" key={h}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((s) => (
                                <tr className="border-b" key={s.id}>
                                    <td className="p-3">{s.name}</td>
                                    <td className="p-3">{s.program}</td>
                                    <td className="p-3">
                                        {s.progress.classification || 'Not recorded'}
                                        {s.progress.missed_defenses > 0 && (
                                            <p className="text-muted-foreground text-xs">
                                                Previously did not defend: {s.progress.missed_defenses} request(s)
                                            </p>
                                        )}
                                    </td>
                                    <td className="p-3">{s.progress.stage || 'Not started'}</td>
                                    <td className="p-3">
                                        {s.progress.completion || 'Not recorded'} / {s.progress.result || 'Not recorded'}
                                    </td>
                                    <td className="p-3">{s.progress.enrollment_year || 'Not available'}</td>
                                    <td className="p-3">{s.progress.semester || 'Not available'}</td>
                                    <td className="p-3">
                                        <Link className="underline" href={`/academic-progress/${s.id}`}>
                                            View Progress
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!rows.length && <p className="p-6 text-center">No matching students in your assigned records.</p>}
                </div>
            </main>
        </AppLayout>
    );
}
