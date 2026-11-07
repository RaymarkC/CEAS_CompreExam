import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Head } from '@inertiajs/react';
import { Eye, User } from 'lucide-react';
import { useState } from 'react';

interface Payment {
    id: number;
    school_year: string;
    payment_date: string;
    defense_status: string;
    amount: string;
}

interface StudentRecord {
    id: number;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    gender: string | null;
    school_year: string | null;
    student_id: string | null;
    course_section: string | null;
    birthdate: string | null;
    academic_status: string | null;
    payments?: Payment[];
}

interface IndividualRecordProps {
    record: StudentRecord;
}

interface PanelRow {
    chair: string;
    member: string;
}

const panelData: PanelRow[] = [
    { chair: 'Chair Person 1', member: 'Panelist 1' },
    { chair: 'Chair Person 2', member: 'Panelist 2' },
    { chair: 'Chair Person 3', member: 'Panelist 3' },
];

export default function IndividualRecord({ record }: IndividualRecordProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="px-6 py-2">
            <Head title="Individual Record" />

            <h1 className="mb-2 text-2xl font-bold">Honorarium Summary</h1>

            <div className="mx-auto mb-2 max-w-screen-lg rounded-lg bg-white p-2 shadow dark:bg-[#121212]">
                <div className="mb-6 flex items-start space-x-6">
                    <User className="mt-8 h-24 w-24 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="grid flex-1 grid-cols-1 gap-6 md:grid-cols-3">
                        <div>
                            <p className="text-gray-500">First Name</p>
                            <p className="text-black dark:text-white">{record.first_name}</p>
                            <p className="mt-2 text-gray-500">Middle Name</p>
                            <p className="text-black dark:text-white">{record.middle_name || '-'}</p>
                            <p className="mt-2 text-gray-500">Last Name</p>
                            <p className="text-black dark:text-white">{record.last_name}</p>
                        </div>

                        <div>
                            <p className="text-gray-500">Gender</p>
                            <p className="text-black dark:text-white">{record.gender || '-'}</p>
                            <p className="mt-2 text-gray-500">School Year</p>
                            <p className="text-black dark:text-white">{record.school_year || '-'}</p>
                            <p className="mt-2 text-gray-500">Student ID</p>
                            <p className="text-black dark:text-white">{record.student_id || '-'}</p>
                        </div>

                        <div>
                            <p className="text-gray-500">Course & Section</p>
                            <p className="text-black dark:text-white">{record.course_section || '-'}</p>
                            <p className="mt-2 text-gray-500">Birthdate</p>
                            <p className="text-black dark:text-white">{record.birthdate || '-'}</p>
                            <p className="mt-2 text-gray-500">Academic Status</p>
                            <p className="text-black dark:text-white">{record.academic_status || '-'}</p>
                        </div>
                    </div>
                </div>

                {/* Payments Table */}
                <div>
                    <h2 className="mb-4 text-lg font-semibold">Payments</h2>
                    <Table className="min-w-full text-sm">
                        <TableHeader>
                            <TableRow>
                                <TableHead>School Year</TableHead>
                                <TableHead>Payment Date</TableHead>
                                <TableHead>Defense Status</TableHead>
                                <TableHead>Payment Amount</TableHead>
                                <TableHead>View Panelist</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {record.payments && record.payments.length > 0 ? (
                                record.payments.map((payment) => (
                                    <TableRow key={payment.id}>
                                        <TableCell>{payment.school_year}</TableCell>
                                        <TableCell>{payment.payment_date}</TableCell>
                                        <TableCell>{payment.defense_status}</TableCell>
                                        <TableCell>{payment.amount}</TableCell>
                                        <TableCell>
                                            <Button variant="outline" size="icon" onClick={() => setIsModalOpen(true)}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-4 text-center">
                                        No payments found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="relative max-h-[60vh] min-h-[40vh] w-1/2 overflow-auto rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
                        {/* Header */}
                        <div className="mb-4 flex h-10 items-center justify-center rounded-t-lg bg-rose-500">
                            <h2 className="font-semibold text-white">Panelists</h2>
                        </div>

                        {/* Table */}
                        <table className="w-full border border-gray-200 text-sm text-gray-700">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border px-4 py-2 text-left">Chair Name</th>
                                    <th className="border px-4 py-2 text-left">Member Name</th>
                                </tr>
                            </thead>
                            <tbody>
                                {panelData.map((row, index) => (
                                    <tr key={index}>
                                        <td className="border px-4 py-2">{row.chair}</td>
                                        <td className="border px-4 py-2">{row.member}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="mt-4 text-right">
                            <Button onClick={() => setIsModalOpen(false)} className="rounded bg-rose-500 px-6 py-2 text-white hover:bg-rose-600">
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
