import { Head } from '@inertiajs/react';
import { Eye, X } from 'lucide-react';
import { useState } from 'react';
import ViewPanelist from './view-panelist';

const panelistInfo = {
    panelistName: 'Troy Wendell G. Peralta',
    role: 'Panelist',
    defenseType: 'Final Defense',
    recievedDate: '2025-05-12',
    amountRecieved: '₱450.00',
};

const paymentRecords = [
    {
        studentName: 'Troy Wendell G. Peralta',
        paymentDate: '2025-05-12',
        defenseStatus: 'Completed',
        paymentAmount: '₱450.00',
    },
    {
        studentName: 'Troy Wendell G. Peralta',
        paymentDate: '2025-05-12',
        defenseStatus: 'Completed',
        paymentAmount: '₱450.00',
    },
    {
        studentName: 'Troy Wendell G. Peralta',
        paymentDate: '2025-05-12',
        defenseStatus: 'Completed',
        paymentAmount: '₱450.00',
    },
    {
        studentName: 'Troy Wendell G. Peralta',
        paymentDate: '2025-05-12',
        defenseStatus: 'Completed',
        paymentAmount: '₱450.00',
    },
    {
        studentName: 'Troy Wendell G. Peralta',
        paymentDate: '2025-05-12',
        defenseStatus: 'Completed',
        paymentAmount: '₱450.00',
    },
];

export default function IndividualRecord() {
    const [showModal, setShowModal] = useState(false);

    return (
        <div className="px-6 py-10">
            <Head title="Individual Record" />

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="relative w-full max-w-4xl rounded-xl bg-white p-6 shadow-xl">
                        <ViewPanelist onClose={() => setShowModal(false)} />

                        <button className="absolute top-3 right-3 text-gray-500 hover:text-red-500" onClick={() => setShowModal(false)}>
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            )}

            <div className="mb-6 flex justify-between">
                <h1 className="text-2xl font-bold">Honorarium Summary</h1>
            </div>

            <div className="mx-auto max-w-screen-lg rounded-lg bg-white p-6 shadow">
                {/* Student Info */}
                <div className="mb-4 flex gap-6 border-b pb-6">
                    <div className="h-32 w-32 rounded-full bg-gray-300" />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <p>
                            <strong>First name:</strong> {panelistInfo.panelistName}
                        </p>
                        <p>
                            <strong>Role: </strong> {panelistInfo.role}
                        </p>
                        <p>
                            <strong>Defense type: </strong> {panelistInfo.defenseType}
                        </p>
                        <p>
                            <strong>Recieved date: </strong> {panelistInfo.recievedDate}
                        </p>
                        <p>
                            <strong>Amount recieved: </strong> {panelistInfo.amountRecieved}
                        </p>
                    </div>
                </div>

                {/* Payments Table */}
                <div className="overflow-x-auto">
                    <table className="w-full rounded-md border text-sm">
                        <thead className="bg-rose-500 text-white">
                            <tr>
                                <th className="p-2">School Year</th>
                                <th className="p-2">Course & Section</th>
                                <th className="p-2">Defense Type</th>
                                <th className="p-2">Payment Date</th>
                                <th className="p-2">Payment Amount</th>
                                <th className="p-2">Defense Status</th>
                                <th className="p-2">View Panelist</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paymentRecords.map((record, index) => (
                                <tr key={index} className="border-t text-center hover:bg-gray-100">
                                    <td className="p-2">2024-2025</td>
                                    <td className="p-2">BSCS 4A</td>
                                    <td className="p-2">{panelistInfo.defenseType}</td>
                                    <td className="p-2">{record.paymentDate}</td>
                                    <td className="p-2">{record.paymentAmount}</td>
                                    <td className="p-2">{record.defenseStatus}</td>
                                    <td className="p-2">
                                        <button onClick={() => setShowModal(true)} className="text-gray-600 hover:text-rose-500">
                                            <Eye className="mx-auto h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
